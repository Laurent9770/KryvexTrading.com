const { query, transaction } = require('../database/connection');
const walletService = require('./walletService');
const websocketService = require('./websocketService');

class AdminService {
  // Get all users with their balances and KYC status
  async getAllUsers(limit = 50, offset = 0, search = null) {
    try {
      let queryText = `
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.is_verified, u.is_active, u.force_mode,
          u.created_at, u.updated_at,
          COALESCE(SUM(CASE WHEN w.asset = 'USDT' THEN w.balance ELSE 0 END), 0) as usdt_balance,
          COALESCE(SUM(CASE WHEN w.asset = 'BTC' THEN w.balance ELSE 0 END), 0) as btc_balance,
          COALESCE(SUM(CASE WHEN w.asset = 'ETH' THEN w.balance ELSE 0 END), 0) as eth_balance,
          k.status as kyc_status
        FROM users u
        LEFT JOIN wallets w ON u.id = w.user_id
        LEFT JOIN kyc_submissions k ON u.id = k.user_id AND k.level = 1
        WHERE u.is_admin = false
      `;

      const params = [];
      let paramCount = 0;

      if (search) {
        queryText += ` AND (u.email ILIKE $${++paramCount} OR u.first_name ILIKE $${++paramCount} OR u.last_name ILIKE $${++paramCount})`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      queryText += ` GROUP BY u.id, k.status ORDER BY u.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Get all users error:', error);
      throw new Error('Failed to get users');
    }
  }

  // Get user details
  async getUserDetails(userId) {
    try {
      const result = await query(`
        SELECT 
          u.*,
          COALESCE(SUM(CASE WHEN w.asset = 'USDT' THEN w.balance ELSE 0 END), 0) as usdt_balance,
          COALESCE(SUM(CASE WHEN w.asset = 'BTC' THEN w.balance ELSE 0 END), 0) as btc_balance,
          COALESCE(SUM(CASE WHEN w.asset = 'ETH' THEN w.balance ELSE 0 END), 0) as eth_balance,
          k.status as kyc_status,
          k.level as kyc_level
        FROM users u
        LEFT JOIN wallets w ON u.id = w.user_id
        LEFT JOIN kyc_submissions k ON u.id = k.user_id AND k.level = 1
        WHERE u.id = $1 AND u.is_admin = false
        GROUP BY u.id, k.status, k.level
      `, [userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Get user details error:', error);
      throw new Error(error.message || 'Failed to get user details');
    }
  }

  // Add funds to user
  async addFundsToUser(adminId, userId, asset, amount, reason = null) {
    try {
      const result = await transaction(async (client) => {
        // Verify user exists
        const userResult = await client.query(
          'SELECT id, email FROM users WHERE id = $1 AND is_admin = false',
          [userId]
        );

        if (userResult.rows.length === 0) {
          throw new Error('User not found');
        }

        // Update wallet balance
        await client.query(
          `UPDATE wallets 
           SET balance = balance + $2, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND asset = $3`,
          [userId, amount, asset]
        );

        // Create transaction record
        await client.query(
          `INSERT INTO transactions (user_id, type, asset, amount, status, description)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, 'adjustment', asset, amount, 'completed', `Admin added ${amount} ${asset}`]
        );

        // Log admin fund action
        await client.query(
          `INSERT INTO admin_fund_actions (admin_id, user_id, asset, amount, action_type, reason)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [adminId, userId, asset, amount, 'add', reason]
        );

        // Log audit
        await client.query(
          `INSERT INTO audit_logs (admin_id, action_type, target_user_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [adminId, 'fund_add', userId, JSON.stringify({
            asset,
            amount,
            reason,
            userEmail: userResult.rows[0].email
          }), null]
        );

        return { success: true, message: `Added ${amount} ${asset} to user` };
      });

      // Send real-time wallet update via WebSocket
      websocketService.sendWalletUpdate(userId, {
        asset,
        balance: amount,
        type: 'admin_add',
        reason
      });

      return result;
    } catch (error) {
      console.error('Add funds error:', error);
      throw new Error(error.message || 'Failed to add funds');
    }
  }

  // Remove funds from user
  async removeFundsFromUser(adminId, userId, asset, amount, reason = null) {
    try {
      const result = await transaction(async (client) => {
        // Verify user exists
        const userResult = await client.query(
          'SELECT id, email FROM users WHERE id = $1 AND is_admin = false',
          [userId]
        );

        if (userResult.rows.length === 0) {
          throw new Error('User not found');
        }

        // Check current balance
        const walletResult = await client.query(
          'SELECT balance FROM wallets WHERE user_id = $1 AND asset = $2',
          [userId, asset]
        );

        if (walletResult.rows.length === 0 || walletResult.rows[0].balance < amount) {
          throw new Error(`Insufficient ${asset} balance`);
        }

        // Update wallet balance
        await client.query(
          `UPDATE wallets 
           SET balance = balance - $2, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND asset = $3`,
          [userId, amount, asset]
        );

        // Create transaction record
        await client.query(
          `INSERT INTO transactions (user_id, type, asset, amount, status, description)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, 'adjustment', asset, amount, 'completed', `Admin removed ${amount} ${asset}`]
        );

        // Log admin fund action
        await client.query(
          `INSERT INTO admin_fund_actions (admin_id, user_id, asset, amount, action_type, reason)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [adminId, userId, asset, amount, 'remove', reason]
        );

        // Log audit
        await client.query(
          `INSERT INTO audit_logs (admin_id, action_type, target_user_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [adminId, 'fund_remove', userId, JSON.stringify({
            asset,
            amount,
            reason,
            userEmail: userResult.rows[0].email
          }), null]
        );

        return { success: true, message: `Removed ${amount} ${asset} from user` };
      });

      // Send real-time wallet update via WebSocket
      websocketService.sendWalletUpdate(userId, {
        asset,
        balance: -amount,
        type: 'admin_remove',
        reason
      });

      return result;
    } catch (error) {
      console.error('Remove funds error:', error);
      throw new Error(error.message || 'Failed to remove funds');
    }
  }

  // Get all KYC submissions
  async getAllKYCSubmissions(limit = 50, offset = 0, status = null) {
    try {
      let queryText = `
        SELECT 
          k.id, k.level, k.status, k.admin_notes, k.created_at, k.updated_at,
          u.id as user_id, u.email, u.first_name, u.last_name,
          kd.type, kd.file_url
        FROM kyc_submissions k
        JOIN users u ON k.user_id = u.id
        LEFT JOIN kyc_documents kd ON k.id = kd.submission_id
        WHERE u.is_admin = false
      `;

      const params = [];
      let paramCount = 0;

      if (status) {
        queryText += ` AND k.status = $${++paramCount}`;
        params.push(status);
      }

      queryText += ` ORDER BY k.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Get KYC submissions error:', error);
      throw new Error('Failed to get KYC submissions');
    }
  }

  // Approve KYC submission
  async approveKYC(adminId, submissionId, notes = null) {
    try {
      const result = await transaction(async (client) => {
        // Get submission details
        const submissionResult = await client.query(
          `SELECT k.*, u.id as user_id, u.email, u.first_name, u.last_name
           FROM kyc_submissions k
           JOIN users u ON k.user_id = u.id
           WHERE k.id = $1`,
          [submissionId]
        );

        if (submissionResult.rows.length === 0) {
          throw new Error('KYC submission not found');
        }

        const submission = submissionResult.rows[0];

        // Update KYC status
        await client.query(
          `UPDATE kyc_submissions 
           SET status = 'approved', admin_notes = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [submissionId, notes]
        );

        // Update user verification status
        await client.query(
          `UPDATE users 
           SET is_verified = true, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [submission.user_id]
        );

        // Log audit
        await client.query(
          `INSERT INTO audit_logs (admin_id, action_type, target_user_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [adminId, 'kyc_approve', submission.user_id, JSON.stringify({
            submissionId,
            level: submission.level,
            notes,
            userEmail: submission.email
          }), null]
        );

        return { success: true, message: 'KYC approved successfully' };
      });

      // Send real-time KYC update via WebSocket
      websocketService.sendKYCUpdate(submission.user_id, {
        status: 'approved',
        level: submission.level,
        notes
      });

      return result;
    } catch (error) {
      console.error('Approve KYC error:', error);
      throw new Error(error.message || 'Failed to approve KYC');
    }
  }

  // Reject KYC submission
  async rejectKYC(adminId, submissionId, reason, notes = null) {
    try {
      const result = await transaction(async (client) => {
        // Get submission details
        const submissionResult = await client.query(
          `SELECT k.*, u.id as user_id, u.email, u.first_name, u.last_name
           FROM kyc_submissions k
           JOIN users u ON k.user_id = u.id
           WHERE k.id = $1`,
          [submissionId]
        );

        if (submissionResult.rows.length === 0) {
          throw new Error('KYC submission not found');
        }

        const submission = submissionResult.rows[0];

        // Update KYC status
        await client.query(
          `UPDATE kyc_submissions 
           SET status = 'rejected', admin_notes = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [submissionId, notes]
        );

        // Log audit
        await client.query(
          `INSERT INTO audit_logs (admin_id, action_type, target_user_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [adminId, 'kyc_reject', submission.user_id, JSON.stringify({
            submissionId,
            level: submission.level,
            reason,
            notes,
            userEmail: submission.email
          }), null]
        );

        return { success: true, message: 'KYC rejected successfully' };
      });

      // Send real-time KYC update via WebSocket
      websocketService.sendKYCUpdate(submission.user_id, {
        status: 'rejected',
        level: submission.level,
        reason,
        notes
      });

      return result;
    } catch (error) {
      console.error('Reject KYC error:', error);
      throw new Error(error.message || 'Failed to reject KYC');
    }
  }

  // Get all deposits
  async getAllDeposits(limit = 50, offset = 0, status = null) {
    try {
      let queryText = `
        SELECT 
          d.*, u.email, u.first_name, u.last_name
        FROM deposits d
        JOIN users u ON d.user_id = u.id
        WHERE u.is_admin = false
      `;

      const params = [];
      let paramCount = 0;

      if (status) {
        queryText += ` AND d.status = $${++paramCount}`;
        params.push(status);
      }

      queryText += ` ORDER BY d.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Get deposits error:', error);
      throw new Error('Failed to get deposits');
    }
  }

  // Approve deposit
  async approveDeposit(adminId, depositId, notes = null) {
    try {
      const result = await transaction(async (client) => {
        // Get deposit details
        const depositResult = await client.query(
          `SELECT d.*, u.id as user_id, u.email, u.first_name, u.last_name
           FROM deposits d
           JOIN users u ON d.user_id = u.id
           WHERE d.id = $1`,
          [depositId]
        );

        if (depositResult.rows.length === 0) {
          throw new Error('Deposit not found');
        }

        const deposit = depositResult.rows[0];

        if (deposit.status !== 'pending') {
          throw new Error('Deposit is not in pending status');
        }

        // Update deposit status
        await client.query(
          `UPDATE deposits 
           SET status = 'approved', admin_notes = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [depositId, notes]
        );

        // Add funds to user wallet
        await client.query(
          `UPDATE wallets 
           SET balance = balance + $2, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND asset = $3`,
          [deposit.user_id, deposit.amount, deposit.asset]
        );

        // Create transaction record
        await client.query(
          `INSERT INTO transactions (user_id, type, asset, amount, status, reference_id, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [deposit.user_id, 'deposit', deposit.asset, deposit.amount, 'completed', depositId, 'Deposit approved by admin']
        );

        // Log audit
        await client.query(
          `INSERT INTO audit_logs (admin_id, action_type, target_user_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [adminId, 'deposit_approve', deposit.user_id, JSON.stringify({
            depositId,
            amount: deposit.amount,
            asset: deposit.asset,
            notes,
            userEmail: deposit.email
          }), null]
        );

        return { success: true, message: 'Deposit approved successfully' };
      });

      // Send real-time transaction update via WebSocket
      websocketService.sendTransactionUpdate(deposit.user_id, {
        type: 'deposit',
        status: 'approved',
        amount: deposit.amount,
        asset: deposit.asset,
        notes
      });

      return result;
    } catch (error) {
      console.error('Approve deposit error:', error);
      throw new Error(error.message || 'Failed to approve deposit');
    }
  }

  // Reject deposit
  async rejectDeposit(adminId, depositId, reason, notes = null) {
    try {
      const result = await transaction(async (client) => {
        // Get deposit details
        const depositResult = await client.query(
          `SELECT d.*, u.id as user_id, u.email, u.first_name, u.last_name
           FROM deposits d
           JOIN users u ON d.user_id = u.id
           WHERE d.id = $1`,
          [depositId]
        );

        if (depositResult.rows.length === 0) {
          throw new Error('Deposit not found');
        }

        const deposit = depositResult.rows[0];

        if (deposit.status !== 'pending') {
          throw new Error('Deposit is not in pending status');
        }

        // Update deposit status
        await client.query(
          `UPDATE deposits 
           SET status = 'rejected', admin_notes = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [depositId, notes]
        );

        // Log audit
        await client.query(
          `INSERT INTO audit_logs (admin_id, action_type, target_user_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [adminId, 'deposit_reject', deposit.user_id, JSON.stringify({
            depositId,
            amount: deposit.amount,
            asset: deposit.asset,
            reason,
            notes,
            userEmail: deposit.email
          }), null]
        );

        return { success: true, message: 'Deposit rejected successfully' };
      });

      return result;
    } catch (error) {
      console.error('Reject deposit error:', error);
      throw new Error(error.message || 'Failed to reject deposit');
    }
  }

  // Get all withdrawals
  async getAllWithdrawals(limit = 50, offset = 0, status = null) {
    try {
      let queryText = `
        SELECT 
          w.*, u.email, u.first_name, u.last_name
        FROM withdrawals w
        JOIN users u ON w.user_id = u.id
        WHERE u.is_admin = false
      `;

      const params = [];
      let paramCount = 0;

      if (status) {
        queryText += ` AND w.status = $${++paramCount}`;
        params.push(status);
      }

      queryText += ` ORDER BY w.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Get withdrawals error:', error);
      throw new Error('Failed to get withdrawals');
    }
  }

  // Approve withdrawal
  async approveWithdrawal(adminId, withdrawalId, notes = null) {
    try {
      const result = await transaction(async (client) => {
        // Get withdrawal details
        const withdrawalResult = await client.query(
          `SELECT w.*, u.id as user_id, u.email, u.first_name, u.last_name
           FROM withdrawals w
           JOIN users u ON w.user_id = u.id
           WHERE w.id = $1`,
          [withdrawalId]
        );

        if (withdrawalResult.rows.length === 0) {
          throw new Error('Withdrawal not found');
        }

        const withdrawal = withdrawalResult.rows[0];

        if (withdrawal.status !== 'pending') {
          throw new Error('Withdrawal is not in pending status');
        }

        // Check user balance
        const walletResult = await client.query(
          'SELECT balance FROM wallets WHERE user_id = $1 AND asset = $2',
          [withdrawal.user_id, withdrawal.asset]
        );

        if (walletResult.rows.length === 0 || walletResult.rows[0].balance < withdrawal.amount) {
          throw new Error(`Insufficient ${withdrawal.asset} balance`);
        }

        // Update withdrawal status
        await client.query(
          `UPDATE withdrawals 
           SET status = 'approved', admin_notes = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [withdrawalId, notes]
        );

        // Deduct funds from user wallet
        await client.query(
          `UPDATE wallets 
           SET balance = balance - $2, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND asset = $3`,
          [withdrawal.user_id, withdrawal.amount, withdrawal.asset]
        );

        // Create transaction record
        await client.query(
          `INSERT INTO transactions (user_id, type, asset, amount, status, reference_id, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [withdrawal.user_id, 'withdrawal', withdrawal.asset, withdrawal.amount, 'completed', withdrawalId, 'Withdrawal approved by admin']
        );

        // Log audit
        await client.query(
          `INSERT INTO audit_logs (admin_id, action_type, target_user_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [adminId, 'withdrawal_approve', withdrawal.user_id, JSON.stringify({
            withdrawalId,
            amount: withdrawal.amount,
            asset: withdrawal.asset,
            address: withdrawal.address,
            notes,
            userEmail: withdrawal.email
          }), null]
        );

        return { success: true, message: 'Withdrawal approved successfully' };
      });

      // Send real-time transaction update via WebSocket
      websocketService.sendTransactionUpdate(withdrawal.user_id, {
        type: 'withdrawal',
        status: 'approved',
        amount: withdrawal.amount,
        asset: withdrawal.asset,
        address: withdrawal.address,
        notes
      });

      return result;
    } catch (error) {
      console.error('Approve withdrawal error:', error);
      throw new Error(error.message || 'Failed to approve withdrawal');
    }
  }

  // Reject withdrawal
  async rejectWithdrawal(adminId, withdrawalId, reason, notes = null) {
    try {
      const result = await transaction(async (client) => {
        // Get withdrawal details
        const withdrawalResult = await client.query(
          `SELECT w.*, u.id as user_id, u.email, u.first_name, u.last_name
           FROM withdrawals w
           JOIN users u ON w.user_id = u.id
           WHERE w.id = $1`,
          [withdrawalId]
        );

        if (withdrawalResult.rows.length === 0) {
          throw new Error('Withdrawal not found');
        }

        const withdrawal = withdrawalResult.rows[0];

        if (withdrawal.status !== 'pending') {
          throw new Error('Withdrawal is not in pending status');
        }

        // Update withdrawal status
        await client.query(
          `UPDATE withdrawals 
           SET status = 'rejected', admin_notes = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [withdrawalId, notes]
        );

        // Log audit
        await client.query(
          `INSERT INTO audit_logs (admin_id, action_type, target_user_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [adminId, 'withdrawal_reject', withdrawal.user_id, JSON.stringify({
            withdrawalId,
            amount: withdrawal.amount,
            asset: withdrawal.asset,
            address: withdrawal.address,
            reason,
            notes,
            userEmail: withdrawal.email
          }), null]
        );

        return { success: true, message: 'Withdrawal rejected successfully' };
      });

      return result;
    } catch (error) {
      console.error('Reject withdrawal error:', error);
      throw new Error(error.message || 'Failed to reject withdrawal');
    }
  }

  // Set trade override mode for user
  async setTradeOverride(adminId, userId, mode) {
    try {
      const result = await transaction(async (client) => {
        // Verify user exists
        const userResult = await client.query(
          'SELECT id, email, first_name, last_name FROM users WHERE id = $1 AND is_admin = false',
          [userId]
        );

        if (userResult.rows.length === 0) {
          throw new Error('User not found');
        }

        const user = userResult.rows[0];

        // Validate mode
        if (!['win', 'lose', null].includes(mode)) {
          throw new Error('Invalid mode. Must be "win", "lose", or null');
        }

        // Update user force mode
        await client.query(
          `UPDATE users 
           SET force_mode = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [userId, mode]
        );

        // Log audit
        await client.query(
          `INSERT INTO audit_logs (admin_id, action_type, target_user_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [adminId, 'trade_override', userId, JSON.stringify({
            mode,
            userEmail: user.email,
            userName: `${user.first_name} ${user.last_name}`
          }), null]
        );

        const modeText = mode === null ? 'normal' : mode;
        return { success: true, message: `Trade mode set to ${modeText} for user` };
      });

      return result;
    } catch (error) {
      console.error('Set trade override error:', error);
      throw new Error(error.message || 'Failed to set trade override');
    }
  }

  // Send notification to user
  async sendNotification(adminId, userId, title, message, type = 'admin') {
    try {
      const result = await transaction(async (client) => {
        // Verify user exists
        const userResult = await client.query(
          'SELECT id, email, first_name, last_name FROM users WHERE id = $1 AND is_admin = false',
          [userId]
        );

        if (userResult.rows.length === 0) {
          throw new Error('User not found');
        }

        const user = userResult.rows[0];

        // Create notification
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, data)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, type, title, message, JSON.stringify({ from: 'admin' })]
        );

        // Log audit
        await client.query(
          `INSERT INTO audit_logs (admin_id, action_type, target_user_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [adminId, 'notification_send', userId, JSON.stringify({
            title,
            message,
            type,
            userEmail: user.email
          }), null]
        );

        return { success: true, message: 'Notification sent successfully' };
      });

      // Send real-time notification via WebSocket
      websocketService.sendNotification(userId, {
        title,
        message,
        type,
        from: 'admin'
      });

      return result;
    } catch (error) {
      console.error('Send notification error:', error);
      throw new Error(error.message || 'Failed to send notification');
    }
  }

  // Broadcast notification to all users
  async broadcastNotification(adminId, title, message, type = 'admin') {
    try {
      const result = await transaction(async (client) => {
        // Get all non-admin users
        const usersResult = await client.query(
          'SELECT id FROM users WHERE is_admin = false AND is_active = true'
        );

        const userIds = usersResult.rows.map(row => row.id);

        // Create notifications for all users
        for (const userId of userIds) {
          await client.query(
            `INSERT INTO notifications (user_id, type, title, message, data)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, type, title, message, JSON.stringify({ from: 'admin', broadcast: true })]
          );
        }

        // Log audit
        await client.query(
          `INSERT INTO audit_logs (admin_id, action_type, details, ip_address)
           VALUES ($1, $2, $3, $4)`,
          [adminId, 'notification_broadcast', JSON.stringify({
            title,
            message,
            type,
            recipientCount: userIds.length
          }), null]
        );

        return { success: true, message: `Notification broadcasted to ${userIds.length} users` };
      });

      // Send real-time broadcast notification via WebSocket
      websocketService.broadcastNotification({
        title,
        message,
        type,
        from: 'admin',
        broadcast: true
      });

      return result;
    } catch (error) {
      console.error('Broadcast notification error:', error);
      throw new Error(error.message || 'Failed to broadcast notification');
    }
  }

  // Get audit logs
  async getAuditLogs(limit = 50, offset = 0, actionType = null, adminId = null, targetUserId = null) {
    try {
      let queryText = `
        SELECT 
          al.*,
          admin.email as admin_email,
          admin.first_name as admin_first_name,
          admin.last_name as admin_last_name,
          target.email as target_email,
          target.first_name as target_first_name,
          target.last_name as target_last_name
        FROM audit_logs al
        LEFT JOIN users admin ON al.admin_id = admin.id
        LEFT JOIN users target ON al.target_user_id = target.id
      `;

      const params = [];
      let paramCount = 0;
      const conditions = [];

      if (actionType) {
        conditions.push(`al.action_type = $${++paramCount}`);
        params.push(actionType);
      }

      if (adminId) {
        conditions.push(`al.admin_id = $${++paramCount}`);
        params.push(adminId);
      }

      if (targetUserId) {
        conditions.push(`al.target_user_id = $${++paramCount}`);
        params.push(targetUserId);
      }

      if (conditions.length > 0) {
        queryText += ` WHERE ${conditions.join(' AND ')}`;
      }

      queryText += ` ORDER BY al.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Get audit logs error:', error);
      throw new Error('Failed to get audit logs');
    }
  }

  // Get admin fund actions history
  async getAdminFundActions(limit = 50, offset = 0, userId = null) {
    try {
      let queryText = `
        SELECT 
          afa.*,
          admin.email as admin_email,
          admin.first_name as admin_first_name,
          admin.last_name as admin_last_name,
          user.email as user_email,
          user.first_name as user_first_name,
          user.last_name as user_last_name
        FROM admin_fund_actions afa
        LEFT JOIN users admin ON afa.admin_id = admin.id
        LEFT JOIN users user ON afa.user_id = user.id
      `;

      const params = [];
      let paramCount = 0;

      if (userId) {
        queryText += ` WHERE afa.user_id = $${++paramCount}`;
        params.push(userId);
      }

      queryText += ` ORDER BY afa.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Get admin fund actions error:', error);
      throw new Error('Failed to get admin fund actions');
    }
  }

  // Get system statistics
  async getSystemStats() {
    try {
      const result = await query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE is_admin = false) as total_users,
          (SELECT COUNT(*) FROM users WHERE is_admin = false AND is_verified = true) as verified_users,
          (SELECT COUNT(*) FROM kyc_submissions WHERE status = 'pending') as pending_kyc,
          (SELECT COUNT(*) FROM deposits WHERE status = 'pending') as pending_deposits,
          (SELECT COUNT(*) FROM withdrawals WHERE status = 'pending') as pending_withdrawals,
          (SELECT COUNT(*) FROM trades WHERE status = 'pending') as pending_trades,
          (SELECT COALESCE(SUM(balance), 0) FROM wallets WHERE asset = 'USDT') as total_usdt_balance,
          (SELECT COALESCE(SUM(balance), 0) FROM wallets WHERE asset = 'BTC') as total_btc_balance,
          (SELECT COALESCE(SUM(balance), 0) FROM wallets WHERE asset = 'ETH') as total_eth_balance
      `);

      return result.rows[0];
    } catch (error) {
      console.error('Get system stats error:', error);
      throw new Error('Failed to get system statistics');
    }
  }
}

module.exports = new AdminService(); 