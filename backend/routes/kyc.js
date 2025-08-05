const express = require('express');
const { body, validationResult } = require('express-validator');
const kycService = require('../services/kycService');
const { authenticate, authenticateAdmin } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Validation middleware
const validateKYCSubmission = [
  body('level').isInt({ min: 1, max: 3 }).withMessage('Valid KYC level (1-3) is required'),
  body('documents').optional().isArray().withMessage('Documents must be an array')
];

const validateKYCStatusUpdate = [
  body('status').isIn(['approved', 'rejected']).withMessage('Valid status is required'),
  body('adminNotes').optional().notEmpty().withMessage('Admin notes cannot be empty if provided')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input',
      details: errors.array()
    });
  }
  next();
};

// Configure multer for file uploads
const upload = kycService.configureMulter();

// Get KYC requirements
router.get('/requirements', (req, res) => {
  try {
    const requirements = kycService.getKYCRequirements();
    
    res.status(200).json({
      success: true,
      data: requirements
    });
  } catch (error) {
    console.error('Get KYC requirements error:', error);
    res.status(500).json({
      error: 'Failed to get KYC requirements',
      message: 'An unexpected error occurred'
    });
  }
});

// Get KYC status for user
router.get('/status/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const status = await kycService.getUserVerificationStatus(userId);
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({
      error: 'Failed to get KYC status',
      message: 'An unexpected error occurred'
    });
  }
});

// Send verification email
router.post('/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Generate verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Store verification code (in production, this should be in database)
    // For now, we'll use a simple in-memory store
    if (!global.verificationCodes) {
      global.verificationCodes = new Map();
    }
    global.verificationCodes.set(email, {
      code: verificationCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    console.log(`Verification code for ${email}: ${verificationCode}`);
    
    // TODO: Send actual email in production
    // For now, just return success
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
});

// Verify email code
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    const storedData = global.verificationCodes?.get(email);
    
    if (!storedData || storedData.code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    if (new Date() > storedData.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired'
      });
    }

    // Remove the used code
    global.verificationCodes.delete(email);
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email'
    });
  }
});

// Submit KYC documents
router.post('/submit', authenticate, upload.fields([
  { name: 'frontFile', maxCount: 1 },
  { name: 'backFile', maxCount: 1 },
  { name: 'selfieFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { level, documents } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!level || !documents) {
      return res.status(400).json({
        success: false,
        message: 'Level and documents are required'
      });
    }

    // Process uploaded files
    const uploadedFiles = {};
    if (req.files) {
      Object.keys(req.files).forEach(fieldName => {
        const file = req.files[fieldName][0];
        uploadedFiles[fieldName] = {
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype
        };
      });
    }

    // Create KYC submission
    const submission = await kycService.createKYCSubmission(userId, level, {
      ...documents,
      files: uploadedFiles
    });

    res.status(201).json({
      success: true,
      message: 'KYC submission created successfully',
      data: submission
    });
  } catch (error) {
    console.error('Submit KYC error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit KYC'
    });
  }
});

// Get user's KYC submissions
router.get('/submissions', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const submissions = await kycService.getUserKYCSubmissions(userId);
    
    res.status(200).json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Get KYC submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC submissions'
    });
  }
});

// Admin: Get all KYC submissions
router.get('/admin/submissions', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, level } = req.query;
    const submissions = await kycService.getAllKYCSubmissions(
      parseInt(limit),
      parseInt(offset),
      status,
      level
    );
    
    res.status(200).json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Get all KYC submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC submissions'
    });
  }
});

// Admin: Update KYC status
router.put('/admin/submissions/:submissionId', authenticateAdmin, validateKYCStatusUpdate, handleValidationErrors, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.user.id;
    
    const updatedSubmission = await kycService.updateKYCStatus(
      submissionId,
      status,
      adminNotes,
      adminId
    );
    
    res.status(200).json({
      success: true,
      message: `KYC submission ${status} successfully`,
      data: updatedSubmission
    });
  } catch (error) {
    console.error('Update KYC status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update KYC status'
    });
  }
});

// Admin: Get KYC statistics
router.get('/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await kycService.getKYCStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get KYC stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC statistics'
    });
  }
});

module.exports = router; 