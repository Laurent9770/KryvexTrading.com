const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  // Hash password
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Generate JWT token
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      isVerified: user.is_verified
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    });
  }

  // Generate refresh token
  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtRefreshExpiresIn
    });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Register new user
  async register(userData) {
    const { email, password, firstName, lastName, phone, country } = userData;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, country)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, is_admin, is_verified, created_at`,
      [email, passwordHash, firstName, lastName, phone, country]
    );

    const user = result.rows[0];

    // Create user profile
    await query(
      'INSERT INTO user_profiles (user_id) VALUES ($1)',
      [user.id]
    );

    // Create default wallets
    const defaultAssets = ['USDT', 'BTC', 'ETH'];
    for (const asset of defaultAssets) {
      await query(
        'INSERT INTO wallets (user_id, asset, balance) VALUES ($1, $2, $3)',
        [user.id, asset, 0]
      );
    }

    // Generate tokens
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isAdmin: user.is_admin,
        isVerified: user.is_verified
      },
      token,
      refreshToken
    };
  }

  // Login user
  async login(email, password) {
    // Find user
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, is_admin, is_verified, is_active
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Create session
    await this.createSession(user.id, token);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isAdmin: user.is_admin,
        isVerified: user.is_verified
      },
      token,
      refreshToken
    };
  }

  // Create user session
  async createSession(userId, token, ipAddress = null, userAgent = null) {
    await query(
      `INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [userId, token, ipAddress, userAgent]
    );
  }

  // Validate session
  async validateSession(token) {
    const result = await query(
      `SELECT us.*, u.id, u.email, u.first_name, u.last_name, u.is_admin, u.is_verified
       FROM user_sessions us
       JOIN users u ON us.user_id = u.id
       WHERE us.session_token = $1 AND us.is_active = true`,
      [token]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const session = result.rows[0];

    // Update last activity
    await query(
      'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = $1',
      [session.id]
    );

    return {
      id: session.user_id,
      email: session.email,
      firstName: session.first_name,
      lastName: session.last_name,
      isAdmin: session.is_admin,
      isVerified: session.is_verified
    };
  }

  // Logout user
  async logout(token) {
    await query(
      'UPDATE user_sessions SET is_active = false, logout_at = CURRENT_TIMESTAMP WHERE session_token = $1',
      [token]
    );
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      // Get user data
      const result = await query(
        `SELECT id, email, first_name, last_name, is_admin, is_verified
         FROM users WHERE id = $1 AND is_active = true`,
        [decoded.id]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];

      // Generate new tokens
      const newToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    // Get current password hash
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    // Verify current password
    const isValidPassword = await this.comparePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    return { message: 'Password updated successfully' };
  }

  // Get user by ID
  async getUserById(userId) {
    const result = await query(
      `SELECT id, email, first_name, last_name, phone, country, is_admin, is_verified, is_active, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Get user by email
  async getUserByEmail(email) {
    const result = await query(
      `SELECT id, email, first_name, last_name, phone, country, is_admin, is_verified, is_active, created_at
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // Update user profile
  async updateProfile(userId, profileData) {
    const { firstName, lastName, phone, country } = profileData;

    const result = await query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, phone = $3, country = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, country, is_admin, is_verified`,
      [firstName, lastName, phone, country, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  // Admin: Get all users
  async getAllUsers(limit = 50, offset = 0) {
    const result = await query(
      `SELECT id, email, first_name, last_name, phone, country, is_admin, is_verified, is_active, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  }

  // Admin: Update user status
  async updateUserStatus(userId, status) {
    const result = await query(
      `UPDATE users 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, first_name, last_name, is_active`,
      [status, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }
}

module.exports = new AuthService(); 