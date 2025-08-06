const express = require('express');
const { authenticate, authenticateAdmin } = require('../middleware/auth');
const authService = require('../services/authService');

const router = express.Router();

// Get all users (Admin only)
router.get('/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, search } = req.query;
    
    const users = await authService.getAllUsers(
      parseInt(limit),
      parseInt(offset),
      status,
      search
    );

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

// Get user by ID (Admin only)
router.get('/admin/users/:userId', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await authService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
});

// Update user status (Admin only)
router.put('/admin/users/:userId/status', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;
    
    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, suspended, or banned'
      });
    }

    const updatedUser = await authService.updateUserStatus(userId, status, reason);
    
    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// Get user statistics (Admin only)
router.get('/admin/users/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await authService.getUserStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
});

module.exports = router; 