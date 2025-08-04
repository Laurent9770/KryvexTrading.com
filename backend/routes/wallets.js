const express = require('express');
const { body, validationResult } = require('express-validator');
const walletService = require('../services/walletService');
const { authenticate, authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateDeposit = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('asset').isIn(['USDT', 'BTC', 'ETH', 'SOL']).withMessage('Valid asset is required'),
  body('network').notEmpty().withMessage('Network is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('txHash').optional().notEmpty().withMessage('Transaction hash is required if provided')
];

const validateWithdrawal = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('asset').isIn(['USDT', 'BTC', 'ETH', 'SOL']).withMessage('Valid asset is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('network').notEmpty().withMessage('Network is required')
];

const validateWalletAdjustment = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
  body('asset').isIn(['USDT', 'BTC', 'ETH', 'SOL']).withMessage('Valid asset is required'),
  body('amount').isFloat().withMessage('Amount is required'),
  body('reason').notEmpty().withMessage('Reason is required')
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

// Get user wallets
router.get('/', authenticate, async (req, res) => {
  try {
    const wallets = await walletService.getUserWallets(req.user.id);

    res.status(200).json({
      success: true,
      data: wallets
    });

  } catch (error) {
    console.error('Get wallets error:', error);
    res.status(500).json({
      error: 'Failed to get wallets',
      message: 'An unexpected error occurred'
    });
  }
});

// Get specific wallet balance
router.get('/:asset', authenticate, async (req, res) => {
  try {
    const { asset } = req.params;
    const wallet = await walletService.getWalletBalance(req.user.id, asset);

    if (!wallet) {
      return res.status(404).json({
        error: 'Wallet not found',
        message: `Wallet for ${asset} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: wallet
    });

  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      error: 'Failed to get wallet balance',
      message: 'An unexpected error occurred'
    });
  }
});

// Get user transactions
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const transactions = await walletService.getUserTransactions(req.user.id, parseInt(limit), parseInt(offset));

    res.status(200).json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Failed to get transactions',
      message: 'An unexpected error occurred'
    });
  }
});

// Create deposit request
router.post('/deposits', authenticate, validateDeposit, handleValidationErrors, async (req, res) => {
  try {
    const { amount, asset, network, address, txHash } = req.body;

    const deposit = await walletService.createDeposit(req.user.id, amount, asset, network, address, txHash);

    res.status(201).json({
      success: true,
      message: 'Deposit request created successfully',
      data: deposit
    });

  } catch (error) {
    console.error('Create deposit error:', error);
    res.status(500).json({
      error: 'Failed to create deposit',
      message: 'An unexpected error occurred'
    });
  }
});

// Get user deposits
router.get('/deposits', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const deposits = await walletService.getUserDeposits(req.user.id, parseInt(limit), parseInt(offset));

    res.status(200).json({
      success: true,
      data: deposits
    });

  } catch (error) {
    console.error('Get deposits error:', error);
    res.status(500).json({
      error: 'Failed to get deposits',
      message: 'An unexpected error occurred'
    });
  }
});

// Create withdrawal request
router.post('/withdrawals', authenticate, validateWithdrawal, handleValidationErrors, async (req, res) => {
  try {
    const { amount, asset, address, network } = req.body;

    const withdrawal = await walletService.createWithdrawal(req.user.id, amount, asset, address, network);

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: withdrawal
    });

  } catch (error) {
    console.error('Create withdrawal error:', error);
    
    if (error.message === 'Insufficient balance') {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: 'You do not have sufficient balance for this withdrawal'
      });
    }

    if (error.message === 'Wallet not found') {
      return res.status(404).json({
        error: 'Wallet not found',
        message: 'Wallet for this asset not found'
      });
    }

    res.status(500).json({
      error: 'Failed to create withdrawal',
      message: 'An unexpected error occurred'
    });
  }
});

// Get user withdrawals
router.get('/withdrawals', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const withdrawals = await walletService.getUserWithdrawals(req.user.id, parseInt(limit), parseInt(offset));

    res.status(200).json({
      success: true,
      data: withdrawals
    });

  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      error: 'Failed to get withdrawals',
      message: 'An unexpected error occurred'
    });
  }
});

// ===== ADMIN ROUTES =====

// Admin: Get all deposits
router.get('/admin/deposits', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    const deposits = await walletService.getAllDeposits(parseInt(limit), parseInt(offset), status);

    res.status(200).json({
      success: true,
      data: deposits
    });

  } catch (error) {
    console.error('Get all deposits error:', error);
    res.status(500).json({
      error: 'Failed to get deposits',
      message: 'An unexpected error occurred'
    });
  }
});

// Admin: Update deposit status
router.put('/admin/deposits/:id/status', authenticateAdmin, [
  body('status').isIn(['approved', 'rejected']).withMessage('Valid status is required'),
  body('adminNotes').optional().notEmpty().withMessage('Admin notes cannot be empty if provided')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const deposit = await walletService.updateDepositStatus(id, status, adminNotes);

    res.status(200).json({
      success: true,
      message: `Deposit ${status} successfully`,
      data: deposit
    });

  } catch (error) {
    console.error('Update deposit status error:', error);
    
    if (error.message === 'Deposit not found') {
      return res.status(404).json({
        error: 'Deposit not found',
        message: 'Deposit with this ID not found'
      });
    }

    res.status(500).json({
      error: 'Failed to update deposit status',
      message: 'An unexpected error occurred'
    });
  }
});

// Admin: Get all withdrawals
router.get('/admin/withdrawals', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    const withdrawals = await walletService.getAllWithdrawals(parseInt(limit), parseInt(offset), status);

    res.status(200).json({
      success: true,
      data: withdrawals
    });

  } catch (error) {
    console.error('Get all withdrawals error:', error);
    res.status(500).json({
      error: 'Failed to get withdrawals',
      message: 'An unexpected error occurred'
    });
  }
});

// Admin: Update withdrawal status
router.put('/admin/withdrawals/:id/status', authenticateAdmin, [
  body('status').isIn(['approved', 'rejected', 'processing']).withMessage('Valid status is required'),
  body('adminNotes').optional().notEmpty().withMessage('Admin notes cannot be empty if provided')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const withdrawal = await walletService.updateWithdrawalStatus(id, status, adminNotes);

    res.status(200).json({
      success: true,
      message: `Withdrawal ${status} successfully`,
      data: withdrawal
    });

  } catch (error) {
    console.error('Update withdrawal status error:', error);
    
    if (error.message === 'Withdrawal not found') {
      return res.status(404).json({
        error: 'Withdrawal not found',
        message: 'Withdrawal with this ID not found'
      });
    }

    res.status(500).json({
      error: 'Failed to update withdrawal status',
      message: 'An unexpected error occurred'
    });
  }
});

// Admin: Get wallet statistics
router.get('/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await walletService.getWalletStats();

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get wallet stats error:', error);
    res.status(500).json({
      error: 'Failed to get wallet statistics',
      message: 'An unexpected error occurred'
    });
  }
});

// Admin: Adjust user wallet balance
router.post('/admin/adjust', authenticateAdmin, validateWalletAdjustment, handleValidationErrors, async (req, res) => {
  try {
    const { userId, asset, amount, reason } = req.body;

    const wallet = await walletService.adjustWalletBalance(userId, asset, amount, reason, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Wallet balance adjusted successfully',
      data: wallet
    });

  } catch (error) {
    console.error('Adjust wallet balance error:', error);
    
    if (error.message === 'Wallet not found') {
      return res.status(404).json({
        error: 'Wallet not found',
        message: 'User wallet not found'
      });
    }

    res.status(500).json({
      error: 'Failed to adjust wallet balance',
      message: 'An unexpected error occurred'
    });
  }
});

module.exports = router; 