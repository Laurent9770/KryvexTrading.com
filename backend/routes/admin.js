const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/supabaseAdminAuth');
const supabaseAdminService = require('../services/supabaseAdminService');

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

    // For now, use a simple admin check
    // In production, you should implement proper admin authentication
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = 'admin-token-' + Date.now(); // Simple token for demo
      
      res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          token,
          user: {
            id: 'admin',
            email: email,
            isAdmin: true
          }
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
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
    const result = await supabaseAdminService.getAllUsers(
      parseInt(limit), 
      parseInt(offset), 
      search
    );
    
    res.json({
      success: true,
      data: result
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
    const user = await supabaseAdminService.getUserById(userId);
    
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

// Update user role
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Valid role (user/admin) is required'
      });
    }

    await supabaseAdminService.updateUserRole(userId, role);
    
    res.json({
      success: true,
      message: `User role updated to ${role}`
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update user status
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'suspended', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status (active/suspended/blocked) is required'
      });
    }

    await supabaseAdminService.updateUserStatus(userId, status);
    
    res.json({
      success: true,
      message: `User status updated to ${status}`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== TRADES TAB ====================

// Get all trades
router.get('/trades', async (req, res) => {
  try {
    const { limit = 50, offset = 0, userId } = req.query;
    const result = await supabaseAdminService.getAllTrades(
      parseInt(limit), 
      parseInt(offset), 
      userId
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Force trade outcome
router.put('/trades/:tradeId/force-outcome', async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { outcome } = req.body;
    
    if (!outcome || !['win', 'loss'].includes(outcome)) {
      return res.status(400).json({
        success: false,
        error: 'Valid outcome (win/loss) is required'
      });
    }

    await supabaseAdminService.forceTradeOutcome(tradeId, outcome);
    
    res.json({
      success: true,
      message: `Trade outcome forced to ${outcome}`
    });
  } catch (error) {
    console.error('Force trade outcome error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel trade
router.put('/trades/:tradeId/cancel', async (req, res) => {
  try {
    const { tradeId } = req.params;
    
    await supabaseAdminService.cancelTrade(tradeId);
    
    res.json({
      success: true,
      message: 'Trade cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel trade error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== WALLET TAB ====================

// Adjust user balance
router.put('/users/:userId/balance', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;
    
    if (typeof amount !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required'
      });
    }

    const result = await supabaseAdminService.adjustUserBalance(userId, amount, reason);
    
    res.json({
      success: true,
      message: `Balance adjusted by ${amount}`,
      data: result
    });
  } catch (error) {
    console.error('Adjust balance error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user transactions
router.get('/users/:userId/transactions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await supabaseAdminService.getUserTransactions(
      userId,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== KYC TAB ====================

// Get all KYC documents
router.get('/kyc', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    const result = await supabaseAdminService.getAllKYCDocuments(
      parseInt(limit),
      parseInt(offset),
      status
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get KYC documents error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update KYC status
router.put('/kyc/:documentId/status', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status, adminNotes } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status (approved/rejected) is required'
      });
    }

    await supabaseAdminService.updateKYCStatus(documentId, status, adminNotes);
    
    res.json({
      success: true,
      message: `KYC status updated to ${status}`
    });
  } catch (error) {
    console.error('Update KYC status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== STATISTICS ====================

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await supabaseAdminService.getPlatformStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== AUDIT LOGS ====================

// Get admin action logs
router.get('/logs', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await supabaseAdminService.getAdminActionLogs(
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 