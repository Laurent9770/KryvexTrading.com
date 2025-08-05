const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const adminService = require('../services/adminService');
const tradingService = require('../services/tradingService');
const authService = require('../services/authService');

// Admin login endpoint (no authentication required)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Check if user exists and is admin
    const user = await authService.getUserByEmail(email);
    
    if (!user || !user.is_admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials or insufficient privileges'
      });
    }

    // Verify password
    const isValidPassword = await authService.verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = authService.generateToken({
      id: user.id,
      email: user.email,
      admin: true
    });

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isAdmin: true
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply admin authentication to all other routes
router.use(authenticateAdmin);

// ==================== USERS TAB ====================

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    const users = await adminService.getAllUsers(
      parseInt(limit), 
      parseInt(offset), 
      search
    );
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user details
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await adminService.getUserDetails(userId);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add funds to user
router.post('/users/:userId/fund/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { asset, amount, reason } = req.body;
    const adminId = req.user.id;

    if (!asset || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Asset and amount are required'
      });
    }

    const result = await adminService.addFundsToUser(adminId, userId, asset, amount, reason);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Add funds error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove funds from user
router.post('/users/:userId/fund/remove', async (req, res) => {
  try {
    const { userId } = req.params;
    const { asset, amount, reason } = req.body;
    const adminId = req.user.id;

    if (!asset || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Asset and amount are required'
      });
    }

    const result = await adminService.removeFundsFromUser(adminId, userId, asset, amount, reason);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Remove funds error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== KYC TAB ====================

// Get all KYC submissions
router.get('/kyc', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    const submissions = await adminService.getAllKYCSubmissions(
      parseInt(limit), 
      parseInt(offset), 
      status
    );
    
    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Get KYC submissions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Approve KYC submission
router.post('/kyc/:submissionId/approve', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    const result = await adminService.approveKYC(adminId, submissionId, notes);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Approve KYC error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reject KYC submission
router.post('/kyc/:submissionId/reject', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { reason, notes } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required for rejection'
      });
    }

    const result = await adminService.rejectKYC(adminId, submissionId, reason, notes);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Reject KYC error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== DEPOSITS TAB ====================

// Get all deposits
router.get('/deposits', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    const deposits = await adminService.getAllDeposits(
      parseInt(limit), 
      parseInt(offset), 
      status
    );
    
    res.json({
      success: true,
      data: deposits
    });
  } catch (error) {
    console.error('Get deposits error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Approve deposit
router.post('/deposits/:depositId/approve', async (req, res) => {
  try {
    const { depositId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    const result = await adminService.approveDeposit(adminId, depositId, notes);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reject deposit
router.post('/deposits/:depositId/reject', async (req, res) => {
  try {
    const { depositId } = req.params;
    const { reason, notes } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required for rejection'
      });
    }

    const result = await adminService.rejectDeposit(adminId, depositId, reason, notes);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== WITHDRAWALS TAB ====================

// Get all withdrawals
router.get('/withdrawals', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    const withdrawals = await adminService.getAllWithdrawals(
      parseInt(limit), 
      parseInt(offset), 
      status
    );
    
    res.json({
      success: true,
      data: withdrawals
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Approve withdrawal
router.post('/withdrawals/:withdrawalId/approve', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    const result = await adminService.approveWithdrawal(adminId, withdrawalId, notes);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reject withdrawal
router.post('/withdrawals/:withdrawalId/reject', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { reason, notes } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required for rejection'
      });
    }

    const result = await adminService.rejectWithdrawal(adminId, withdrawalId, reason, notes);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== WALLETS TAB ====================

// Get all wallets (user balances)
router.get('/wallets', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const users = await adminService.getAllUsers(
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get wallets error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get admin fund actions history
router.get('/wallets/fund-actions', async (req, res) => {
  try {
    const { limit = 50, offset = 0, userId } = req.query;
    const actions = await adminService.getAdminFundActions(
      parseInt(limit), 
      parseInt(offset), 
      userId
    );
    
    res.json({
      success: true,
      data: actions
    });
  } catch (error) {
    console.error('Get fund actions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== TRADING CONTROL TAB ====================

// Set trade override mode
router.post('/trade-override', async (req, res) => {
  try {
    const { userId, mode } = req.body;
    const adminId = req.user.id;

    if (!userId || !mode) {
      return res.status(400).json({
        success: false,
        error: 'User ID and mode are required'
      });
    }

    if (!['win', 'lose', null].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'Mode must be "win", "lose", or null'
      });
    }

    const result = await adminService.setTradeOverride(adminId, userId, mode);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Set trade override error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all trades (admin view)
router.get('/trades', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, userId } = req.query;
    const trades = await tradingService.getAllTrades(
      parseInt(limit), 
      parseInt(offset), 
      status, 
      userId
    );
    
    res.json({
      success: true,
      data: trades
    });
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get trading statistics
router.get('/trades/stats', async (req, res) => {
  try {
    const stats = await tradingService.getAdminTradingStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get trading stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== ROOMS TAB ====================

// Send notification to specific user
router.post('/notifications/send', async (req, res) => {
  try {
    const { userId, title, message, type = 'admin' } = req.body;
    const adminId = req.user.id;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'User ID, title, and message are required'
      });
    }

    const result = await adminService.sendNotification(adminId, userId, title, message, type);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Broadcast notification to all users
router.post('/notifications/broadcast', async (req, res) => {
  try {
    const { title, message, type = 'admin' } = req.body;
    const adminId = req.user.id;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required'
      });
    }

    const result = await adminService.broadcastNotification(adminId, title, message, type);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== AUDIT TAB ====================

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { limit = 50, offset = 0, actionType, adminId, targetUserId } = req.query;
    const logs = await adminService.getAuditLogs(
      parseInt(limit), 
      parseInt(offset), 
      actionType, 
      adminId, 
      targetUserId
    );
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== SYSTEM STATISTICS ====================

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await adminService.getSystemStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 