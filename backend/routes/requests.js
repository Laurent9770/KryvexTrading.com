const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, authenticateAdmin } = require('../middleware/auth');
const requestService = require('../services/requestService');
const router = express.Router();

// Validation middleware
const validateRequest = [
  body('requestType').isIn(['registration', 'wallet_change', 'account_modification', 'kyc_approval', 'deposit_approval', 'withdrawal_approval']).withMessage('Invalid request type'),
  body('title').isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('requestData').optional().isObject().withMessage('Request data must be an object')
];

// Create a new admin request (authenticated users only)
router.post('/create', authenticate, validateRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { requestType, title, description, requestData } = req.body;
    const userId = req.user.id;

    const request = await requestService.createRequest(
      userId,
      requestType,
      title,
      description,
      requestData
    );

    res.json({
      success: true,
      message: 'Request submitted successfully',
      data: request
    });

  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create request'
    });
  }
});

// Get user's own requests
router.get('/my-requests', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await requestService.getUserRequests(userId);

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests'
    });
  }
});

// Admin: Get all pending requests
router.get('/admin/requests', authenticateAdmin, async (req, res) => {
  try {
    const requests = await requestService.getPendingRequests();

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Error fetching admin requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests'
    });
  }
});

// Admin: Process a request (approve/reject)
router.post('/admin/process/:requestId', authenticateAdmin, [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('response').optional().isLength({ max: 500 }).withMessage('Response must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { requestId } = req.params;
    const { status, response } = req.body;
    const adminId = req.user.id;

    const processedRequest = await requestService.processRequest(
      requestId,
      adminId,
      status,
      response
    );

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      data: processedRequest
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process request'
    });
  }
});

// Admin: Get request statistics
router.get('/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await requestService.getRequestStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching request stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Admin: Cleanup old requests
router.post('/admin/cleanup', authenticateAdmin, async (req, res) => {
  try {
    const { daysOld = 30 } = req.body;
    const deletedCount = await requestService.cleanupOldRequests(daysOld);

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old requests`,
      data: { deletedCount }
    });

  } catch (error) {
    console.error('Error cleaning up requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup requests'
    });
  }
});

module.exports = router; 