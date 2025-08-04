const { query, transaction } = require('../database/connection');

class WalletService {
  // Get user wallet balances
  async getUserWallets(userId) {
    try {
      const result = await query(
        `SELECT asset, balance, locked_balance, created_at, updated_at
         FROM wallets 
         WHERE user_id = $1
         ORDER BY asset`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('Get user wallets error:', error);
      throw new Error('Failed to get user wallets');
    }
  }

  // Get specific wallet balance
  async getWalletBalance(userId, asset) {
    try {
      const result = await query(
        `SELECT asset, balance, locked_balance, created_at, updated_at
         FROM wallets 
         WHERE user_id = $1 AND asset = $2`,
        [userId, asset]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Get wallet balance error:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  // Update wallet balance
  async updateWalletBalance(userId, asset, amount, operation = 'add') {
    try {
      const balanceChange = operation === 'add' ? amount : -amount;
      
      const result = await query(
        `UPDATE wallets 
         SET balance = balance + $3, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND asset = $2
         RETURNING asset, balance, locked_balance`,
        [userId, asset, balanceChange]
      );

      if (result.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Update wallet balance error:', error);
      throw new Error('Failed to update wallet balance');
    }
  }

  // Create transaction record
  async createTransaction(userId, type, asset, amount, status = 'pending', referenceId = null, description = null) {
    try {
      const result = await query(
        `INSERT INTO transactions (user_id, type, asset, amount, status, reference_id, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, user_id, type, asset, amount, status, reference_id, description, created_at`,
        [userId, type, asset, amount, status, referenceId, description]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Create transaction error:', error);
      throw new Error('Failed to create transaction');
    }
  }

  // Get user transactions
  async getUserTransactions(userId, limit = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT id, type, asset, amount, status, reference_id, description, created_at, updated_at
         FROM transactions 
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      console.error('Get user transactions error:', error);
      throw new Error('Failed to get user transactions');
    }
  }

  // Create deposit request
  async createDeposit(userId, amount, asset, network, address, txHash = null) {
    try {
      const result = await transaction(async (client) => {
        // Create deposit record
        const depositResult = await client.query(
          `INSERT INTO deposits (user_id, amount, asset, status, network, address, tx_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, user_id, amount, asset, status, network, address, tx_hash, created_at`,
          [userId, amount, asset, 'pending', network, address, txHash]
        );

        // Create transaction record
        await client.query(
          `INSERT INTO transactions (user_id, type, asset, amount, status, reference_id, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, 'deposit', asset, amount, 'pending', depositResult.rows[0].id, `Deposit ${amount} ${asset}`]
        );

        return depositResult.rows[0];
      });

      return result;
    } catch (error) {
      console.error('Create deposit error:', error);
      throw new Error('Failed to create deposit');
    }
  }

  // Update deposit status
  async updateDepositStatus(depositId, status, adminNotes = null) {
    try {
      const result = await transaction(async (client) => {
        // Update deposit status
        const depositResult = await client.query(
          `UPDATE deposits 
           SET status = $2, admin_notes = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING id, user_id, amount, asset, status, network, address, tx_hash`,
          [depositId, status, adminNotes]
        );

        if (depositResult.rows.length === 0) {
          throw new Error('Deposit not found');
        }

        const deposit = depositResult.rows[0];

        // If approved, update wallet balance
        if (status === 'approved') {
          await client.query(
            `UPDATE wallets 
             SET balance = balance + $2, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND asset = $3`,
            [deposit.user_id, deposit.amount, deposit.asset]
          );

          // Update transaction status
          await client.query(
            `UPDATE transactions 
             SET status = 'completed', updated_at = CURRENT_TIMESTAMP
             WHERE reference_id = $1 AND type = 'deposit'`,
            [depositId]
          );
        } else if (status === 'rejected') {
          // Update transaction status to failed
          await client.query(
            `UPDATE transactions 
             SET status = 'failed', updated_at = CURRENT_TIMESTAMP
             WHERE reference_id = $1 AND type = 'deposit'`,
            [depositId]
          );
        }

        return deposit;
      });

      return result;
    } catch (error) {
      console.error('Update deposit status error:', error);
      throw new Error('Failed to update deposit status');
    }
  }

  // Get user deposits
  async getUserDeposits(userId, limit = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT id, amount, asset, status, network, address, tx_hash, admin_notes, created_at, updated_at
         FROM deposits 
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      console.error('Get user deposits error:', error);
      throw new Error('Failed to get user deposits');
    }
  }

  // Create withdrawal request
  async createWithdrawal(userId, amount, asset, address, network) {
    try {
      const result = await transaction(async (client) => {
        // Check if user has sufficient balance
        const walletResult = await client.query(
          `SELECT balance FROM wallets WHERE user_id = $1 AND asset = $2`,
          [userId, asset]
        );

        if (walletResult.rows.length === 0) {
          throw new Error('Wallet not found');
        }

        const wallet = walletResult.rows[0];
        if (wallet.balance < amount) {
          throw new Error('Insufficient balance');
        }

        // Create withdrawal record
        const withdrawalResult = await client.query(
          `INSERT INTO withdrawals (user_id, amount, asset, address, network, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, user_id, amount, asset, address, network, status, created_at`,
          [userId, amount, asset, address, network, 'pending']
        );

        // Create transaction record
        await client.query(
          `INSERT INTO transactions (user_id, type, asset, amount, status, reference_id, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, 'withdrawal', asset, amount, 'pending', withdrawalResult.rows[0].id, `Withdrawal ${amount} ${asset}`]
        );

        return withdrawalResult.rows[0];
      });

      return result;
    } catch (error) {
      console.error('Create withdrawal error:', error);
      throw new Error(error.message || 'Failed to create withdrawal');
    }
  }

  // Update withdrawal status
  async updateWithdrawalStatus(withdrawalId, status, adminNotes = null) {
    try {
      const result = await transaction(async (client) => {
        // Update withdrawal status
        const withdrawalResult = await client.query(
          `UPDATE withdrawals 
           SET status = $2, admin_notes = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING id, user_id, amount, asset, address, network, status`,
          [withdrawalId, status, adminNotes]
        );

        if (withdrawalResult.rows.length === 0) {
          throw new Error('Withdrawal not found');
        }

        const withdrawal = withdrawalResult.rows[0];

        // If approved, deduct from wallet balance
        if (status === 'approved') {
          await client.query(
            `UPDATE wallets 
             SET balance = balance - $2, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND asset = $3`,
            [withdrawal.user_id, withdrawal.amount, withdrawal.asset]
          );

          // Update transaction status
          await client.query(
            `UPDATE transactions 
             SET status = 'completed', updated_at = CURRENT_TIMESTAMP
             WHERE reference_id = $1 AND type = 'withdrawal'`,
            [withdrawalId]
          );
        } else if (status === 'rejected') {
          // Update transaction status to failed
          await client.query(
            `UPDATE transactions 
             SET status = 'failed', updated_at = CURRENT_TIMESTAMP
             WHERE reference_id = $1 AND type = 'withdrawal'`,
            [withdrawalId]
          );
        }

        return withdrawal;
      });

      return result;
    } catch (error) {
      console.error('Update withdrawal status error:', error);
      throw new Error('Failed to update withdrawal status');
    }
  }

  // Get user withdrawals
  async getUserWithdrawals(userId, limit = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT id, amount, asset, address, network, status, admin_notes, created_at, updated_at
         FROM withdrawals 
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      console.error('Get user withdrawals error:', error);
      throw new Error('Failed to get user withdrawals');
    }
  }

  // Admin: Get all deposits
  async getAllDeposits(limit = 50, offset = 0, status = null) {
    try {
      let queryText = `
        SELECT d.id, d.amount, d.asset, d.status, d.network, d.address, d.tx_hash, d.admin_notes, d.created_at, d.updated_at,
               u.email, u.first_name, u.last_name
        FROM deposits d
        JOIN users u ON d.user_id = u.id
      `;

      const params = [];
      let paramCount = 0;

      if (status) {
        queryText += ` WHERE d.status = $${++paramCount}`;
        params.push(status);
      }

      queryText += ` ORDER BY d.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Get all deposits error:', error);
      throw new Error('Failed to get all deposits');
    }
  }

  // Admin: Get all withdrawals
  async getAllWithdrawals(limit = 50, offset = 0, status = null) {
    try {
      let queryText = `
        SELECT w.id, w.amount, w.asset, w.address, w.network, w.status, w.admin_notes, w.created_at, w.updated_at,
               u.email, u.first_name, u.last_name
        FROM withdrawals w
        JOIN users u ON w.user_id = u.id
      `;

      const params = [];
      let paramCount = 0;

      if (status) {
        queryText += ` WHERE w.status = $${++paramCount}`;
        params.push(status);
      }

      queryText += ` ORDER BY w.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Get all withdrawals error:', error);
      throw new Error('Failed to get all withdrawals');
    }
  }

  // Admin: Get wallet statistics
  async getWalletStats() {
    try {
      const result = await query(`
        SELECT 
          COUNT(DISTINCT user_id) as total_users,
          COUNT(*) as total_wallets,
          SUM(balance) as total_balance,
          asset
        FROM wallets 
        GROUP BY asset
        ORDER BY asset
      `);

      return result.rows;
    } catch (error) {
      console.error('Get wallet stats error:', error);
      throw new Error('Failed to get wallet statistics');
    }
  }

  // Admin: Adjust user wallet balance
  async adjustWalletBalance(userId, asset, amount, reason, adminId) {
    try {
      const result = await transaction(async (client) => {
        // Update wallet balance
        const walletResult = await client.query(
          `UPDATE wallets 
           SET balance = balance + $3, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND asset = $2
           RETURNING asset, balance, locked_balance`,
          [userId, asset, amount]
        );

        if (walletResult.rows.length === 0) {
          throw new Error('Wallet not found');
        }

        // Create transaction record
        const transactionType = amount > 0 ? 'adjustment' : 'deduction';
        const transactionAmount = Math.abs(amount);
        
        await client.query(
          `INSERT INTO transactions (user_id, type, asset, amount, status, description)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, transactionType, asset, transactionAmount, 'completed', `Admin adjustment: ${reason}`]
        );

        // Log admin action
        await client.query(
          `INSERT INTO admin_actions (admin_id, action_type, target_user_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [adminId, 'wallet_adjustment', userId, JSON.stringify({
            asset,
            amount,
            reason,
            newBalance: walletResult.rows[0].balance
          }), null]
        );

        return walletResult.rows[0];
      });

      return result;
    } catch (error) {
      console.error('Adjust wallet balance error:', error);
      throw new Error('Failed to adjust wallet balance');
    }
  }
}

module.exports = new WalletService(); 