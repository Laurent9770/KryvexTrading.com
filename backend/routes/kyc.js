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

// Get user's KYC submissions
router.get('/submissions', authenticate, async (req, res) => {
  try {
    const submissions = await kycService.getUserKYCSubmissions(req.user.id);
    
    res.status(200).json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Get KYC submissions error:', error);
    res.status(500).json({
      error: 'Failed to get KYC submissions',
      message: 'An unexpected error occurred'
    });
  }
});

// Get user verification status
router.get('/status', authenticate, async (req, res) => {
  try {
    const status = await kycService.getUserVerificationStatus(req.user.id);
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      error: 'Failed to get verification status',
      message: 'An unexpected error occurred'
    });
  }
});

// Create KYC submission
router.post('/submissions', authenticate, validateKYCSubmission, handleValidationErrors, async (req, res) => {
  try {
    const { level, documents = [] } = req.body;

    // Validate submission
    kycService.validateKYCSubmission(level, documents);

    const submission = await kycService.createKYCSubmission(req.user.id, level, documents);

    res.status(201).json({
      success: true,
      message: 'KYC submission created successfully',
      data: submission
    });
  } catch (error) {
    console.error('Create KYC submission error:', error);
    
    if (error.message.includes('Missing required document')) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to create KYC submission',
      message: 'An unexpected error occurred'
    });
  }
});

// Upload KYC documents
router.post('/upload', authenticate, upload.array('documents', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please upload at least one document'
      });
    }

    const { submissionId, documentType } = req.body;

    if (!submissionId || !documentType) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Submission ID and document type are required'
      });
    }

    const uploadedDocuments = [];

    for (const file of req.files) {
      const fileUrl = `/uploads/kyc/${file.filename}`;
      const document = await kycService.addDocument(submissionId, documentType, fileUrl);
      uploadedDocuments.push(document);
    }

    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      data: uploadedDocuments
    });
  } catch (error) {
    console.error('Upload KYC documents error:', error);
    res.status(500).json({
      error: 'Failed to upload documents',
      message: 'An unexpected error occurred'
    });
  }
});

// Get documents for a KYC submission
router.get('/submissions/:id/documents', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const documents = await kycService.getKYCDocuments(id);

    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Get KYC documents error:', error);
    res.status(500).json({
      error: 'Failed to get KYC documents',
      message: 'An unexpected error occurred'
    });
  }
});

// ===== ADMIN ROUTES =====

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
      error: 'Failed to get KYC submissions',
      message: 'An unexpected error occurred'
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
      error: 'Failed to get KYC statistics',
      message: 'An unexpected error occurred'
    });
  }
});

// Admin: Get specific KYC submission
router.get('/admin/submissions/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await kycService.getKYCSubmission(id);

    if (!submission) {
      return res.status(404).json({
        error: 'KYC submission not found',
        message: 'Submission with this ID not found'
      });
    }

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Get KYC submission error:', error);
    res.status(500).json({
      error: 'Failed to get KYC submission',
      message: 'An unexpected error occurred'
    });
  }
});

// Admin: Update KYC submission status
router.put('/admin/submissions/:id/status', authenticateAdmin, validateKYCStatusUpdate, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const submission = await kycService.updateKYCStatus(id, status, adminNotes, req.user.id);

    res.status(200).json({
      success: true,
      message: `KYC submission ${status} successfully`,
      data: submission
    });
  } catch (error) {
    console.error('Update KYC status error:', error);
    
    if (error.message === 'KYC submission not found') {
      return res.status(404).json({
        error: 'KYC submission not found',
        message: 'Submission with this ID not found'
      });
    }

    res.status(500).json({
      error: 'Failed to update KYC status',
      message: 'An unexpected error occurred'
    });
  }
});

// Admin: Verify document
router.put('/admin/documents/:id/verify', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const document = await kycService.verifyDocument(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Document verified successfully',
      data: document
    });
  } catch (error) {
    console.error('Verify document error:', error);
    
    if (error.message === 'Document not found') {
      return res.status(404).json({
        error: 'Document not found',
        message: 'Document with this ID not found'
      });
    }

    res.status(500).json({
      error: 'Failed to verify document',
      message: 'An unexpected error occurred'
    });
  }
});

// Admin: Delete KYC submission
router.delete('/admin/submissions/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await kycService.deleteKYCSubmission(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'KYC submission deleted successfully'
    });
  } catch (error) {
    console.error('Delete KYC submission error:', error);
    
    if (error.message === 'KYC submission not found') {
      return res.status(404).json({
        error: 'KYC submission not found',
        message: 'Submission with this ID not found'
      });
    }

    res.status(500).json({
      error: 'Failed to delete KYC submission',
      message: 'An unexpected error occurred'
    });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/kyc', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({
        error: 'File not found',
        message: 'Requested file does not exist'
      });
    }
  } catch (error) {
    console.error('Serve file error:', error);
    res.status(500).json({
      error: 'Failed to serve file',
      message: 'An unexpected error occurred'
    });
  }
});

module.exports = router; 