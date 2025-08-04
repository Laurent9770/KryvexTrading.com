const express = require('express');
const { body, validationResult } = require('express-validator');
const tradingService = require('../services/tradingService');
const { authenticate, authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateCreateTrade = [
  body('symbol').notEmpty().withMessage('Symbol is required'),
  body('side').isIn(['buy', 'sell']).withMessage('Valid side (buy/sell) is required'),
  body('type').isIn(['spot', 'futures', 'options', 'binary']).withMessage('Valid trade type is required'),
  body('amount').isFloat({ min: 0.0001 }).withMessage('Valid amount is required'),
  body('price').isFloat({ min: 0.0001 }).withMessage('Valid price is required')
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

// Get available trading pairs
router.get('/pairs', async (req, res) => {
  try {
    const pairs = await tradingService.getTradingPairs();
    
    res.status(200).json({
      success: true,
      data: pairs
    });
  } catch (error) {
    console.error('Get trading pairs error:', error);
    res.status(500).json({
      error: 'Failed to get trading pairs',
      message: 'An unexpected error occurred'
    });
  }
});

// Create a new trade
router.post('/trades', authenticate, validateCreateTrade, handleValidationErrors, async (req, res) => {
  try {
    const { symbol, side, type, amount, price } = req.body;

    const trade = await tradingService.createTrade(req.user.id, symbol, side, type, amount, price);

    res.status(201).json({
      success: true,
      message: 'Trade created successfully',
      data: trade
    });
  } catch (error) {
    console.error('Create trade error:', error);
    
    if (error.message.includes('Trading pair not found')) {
      return res.status(404).json({
        error: 'Trading pair not found',
        message: error.message
      });
    }

    if (error.message.includes('Insufficient') || error.message.includes('Minimum trade amount')) {
      return res.status(400).json({
        error: 'Trade validation failed',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to create trade',
      message: 'An unexpected error occurred'
    });
  }
});

// Get user trades
router.get('/trades', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    const trades = await tradingService.getUserTrades(
      req.user.id, 
      parseInt(limit), 
      parseInt(offset), 
      status
    );

    res.status(200).json({
      success: true,
      data: trades
    });
  } catch (error) {
    console.error('Get user trades error:', error);
    res.status(500).json({
      error: 'Failed to get trades',
      message: 'An unexpected error occurred'
    });
  }
});

// Get specific trade
router.get('/trades/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const trade = await tradingService.getTrade(id);

    if (!trade) {
      return res.status(404).json({
        error: 'Trade not found',
        message: 'Trade with this ID not found'
      });
    }

    // Check if user owns this trade
    if (trade.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own trades'
      });
    }

    res.status(200).json({
      success: true,
      data: trade
    });
  } catch (error) {
    console.error('Get trade error:', error);
    res.status(500).json({
      error: 'Failed to get trade',
      message: 'An unexpected error occurred'
    });
  }
});

// Cancel trade
router.put('/trades/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await tradingService.cancelTrade(id, req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Cancel trade error:', error);
    
    if (error.message.includes('Trade not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({
        error: 'Trade not found',
        message: 'Trade not found or you are not authorized to cancel it'
      });
    }

    if (error.message.includes('Only pending trades can be cancelled')) {
      return res.status(400).json({
        error: 'Invalid trade status',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to cancel trade',
      message: 'An unexpected error occurred'
    });
  }
});

// Get user trading statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await tradingService.getTradingStats(req.user.id);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get trading stats error:', error);
    res.status(500).json({
      error: 'Failed to get trading statistics',
      message: 'An unexpected error occurred'
    });
  }
});

// ===== ADMIN ROUTES =====

// Admin: Get all trades
router.get('/admin/trades', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, userId } = req.query;
    const trades = await tradingService.getAllTrades(
      parseInt(limit), 
      parseInt(offset), 
      status, 
      userId
    );

    res.status(200).json({
      success: true,
      data: trades
    });
  } catch (error) {
    console.error('Get all trades error:', error);
    res.status(500).json({
      error: 'Failed to get trades',
      message: 'An unexpected error occurred'
    });
  }
});

// Admin: Execute trade
router.put('/admin/trades/:id/execute', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const trade = await tradingService.executeTrade(id);

    res.status(200).json({
      success: true,
      message: 'Trade executed successfully',
      data: trade
    });
  } catch (error) {
    console.error('Execute trade error:', error);
    
    if (error.message.includes('Trade not found')) {
      return res.status(404).json({
        error: 'Trade not found',
        message: 'Trade with this ID not found'
      });
    }

    if (error.message.includes('not in pending status')) {
      return res.status(400).json({
        error: 'Invalid trade status',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to execute trade',
      message: 'An unexpected error occurred'
    });
  }
});

// Admin: Get trading statistics
router.get('/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await tradingService.getAdminTradingStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get admin trading stats error:', error);
    res.status(500).json({
      error: 'Failed to get trading statistics',
      message: 'An unexpected error occurred'
    });
  }
});

module.exports = router; 