const express = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const { authenticate, authRateLimiter } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('country').optional().trim().isLength({ min: 2 }).withMessage('Valid country is required'),
  body('agreeToTerms').isBoolean().custom(value => {
    if (!value) throw new Error('You must agree to the terms and conditions');
    return true;
  })
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must be at least 8 characters with uppercase, lowercase, number, and special character')
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

// Register new user
router.post('/register', authRateLimiter, validateRegistration, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, country } = req.body;

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      phone,
      country
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message === 'User already exists') {
      return res.status(409).json({
        error: 'Registration failed',
        message: 'User with this email already exists'
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      message: 'An unexpected error occurred during registration'
    });
  }
});

// Login user
router.post('/login', authRateLimiter, validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const result = await authService.login(email, password);

    // Set token storage based on remember me preference
    const storageType = rememberMe ? 'localStorage' : 'sessionStorage';

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        ...result,
        storageType
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    if (error.message === 'Account is deactivated') {
      return res.status(401).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    res.status(500).json({
      error: 'Login failed',
      message: 'An unexpected error occurred during login'
    });
  }
});

// Logout user
router.post('/logout', authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      await authService.logout(token);
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An unexpected error occurred during logout'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
        message: 'Refresh token is required'
      });
    }

    const result = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.message === 'Invalid refresh token') {
      return res.status(401).json({
        error: 'Token refresh failed',
        message: 'Invalid refresh token'
      });
    }

    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An unexpected error occurred during token refresh'
    });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        country: user.country,
        isAdmin: user.is_admin,
        isVerified: user.is_verified,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'An unexpected error occurred'
    });
  }
});

// Update user profile
router.put('/profile', authenticate, [
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('country').optional().trim().isLength({ min: 2 }).withMessage('Valid country is required')
], handleValidationErrors, async (req, res) => {
  try {
    const profileData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      country: req.body.country
    };

    const updatedUser = await authService.updateProfile(req.user.id, profileData);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        phone: updatedUser.phone,
        country: updatedUser.country,
        isAdmin: updatedUser.is_admin,
        isVerified: updatedUser.is_verified
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.status(500).json({
      error: 'Profile update failed',
      message: 'An unexpected error occurred while updating profile'
    });
  }
});

// Change password
router.put('/change-password', authenticate, validatePasswordChange, handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({
        error: 'Password change failed',
        message: 'Current password is incorrect'
      });
    }

    res.status(500).json({
      error: 'Password change failed',
      message: 'An unexpected error occurred while changing password'
    });
  }
});

// Verify token (for frontend to check if token is still valid)
router.get('/verify', authenticate, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      error: 'Token verification failed',
      message: 'Invalid or expired token'
    });
  }
});

module.exports = router; 