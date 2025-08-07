const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    // For now, use a simple admin check
    // In production, you should verify the JWT token properly
    if (token === process.env.JWT_SECRET || token === 'admin-token') {
      req.adminId = 'admin-user-id';
      next();
    } else {
      res.status(403).json({ 
        success: false, 
        error: 'Invalid admin token' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// 👤 Users Tab
router.get('/users', async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    
    let query = supabase
      .from('profiles')
      .select('*')
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data.map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.full_name?.split(' ')[0] || '',
        last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
        is_verified: user.is_verified,
        is_active: user.account_status === 'active',
        force_mode: user.force_mode,
        created_at: user.created_at,
        updated_at: user.updated_at,
        usdt_balance: user.account_balance || '0.00',
        btc_balance: '0.00',
        eth_balance: '0.00',
        kyc_status: user.kyc_status
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        id: data.id,
        email: data.email,
        first_name: data.full_name?.split(' ')[0] || '',
        last_name: data.full_name?.split(' ').slice(1).join(' ') || '',
        is_verified: data.is_verified,
        is_active: data.account_status === 'active',
        force_mode: data.force_mode,
        created_at: data.created_at,
        updated_at: data.updated_at,
        usdt_balance: data.account_balance || '0.00',
        btc_balance: '0.00',
        eth_balance: '0.00',
        kyc_status: data.kyc_status,
        kyc_level: 1
      }
    });
  } catch (error) {
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

    // Get current balance
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('account_balance')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const currentBalance = parseFloat(user.account_balance || 0);
    const newBalance = currentBalance + parseFloat(amount);

    // Update user balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ account_balance: newBalance.toString() })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Log admin action
    const { error: logError } = await supabase
      .from('admin_fund_actions')
      .insert({
        admin_id: req.adminId,
        user_id: userId,
        asset,
        amount: parseFloat(amount),
        action_type: 'add',
        reason
      });

    if (logError) console.error('Failed to log admin action:', logError);

    res.json({
      success: true,
      message: `Added ${amount} ${asset} to user`
    });
  } catch (error) {
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

    // Get current balance
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('account_balance')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const currentBalance = parseFloat(user.account_balance || 0);
    const newBalance = Math.max(0, currentBalance - parseFloat(amount));

    // Update user balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ account_balance: newBalance.toString() })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Log admin action
    const { error: logError } = await supabase
      .from('admin_fund_actions')
      .insert({
        admin_id: req.adminId,
        user_id: userId,
        asset,
        amount: parseFloat(amount),
        action_type: 'remove',
        reason
      });

    if (logError) console.error('Failed to log admin action:', logError);

    res.json({
      success: true,
      message: `Removed ${amount} ${asset} from user`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📄 KYC Tab
router.get('/kyc', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    
    let query = supabase
      .from('kyc_submissions')
      .select(`
        *,
        profiles!inner(email, full_name)
      `)
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data.map(submission => ({
        id: submission.id,
        level: submission.level,
        status: submission.status,
        admin_notes: submission.admin_notes,
        created_at: submission.created_at,
        updated_at: submission.updated_at,
        user_id: submission.user_id,
        email: submission.profiles?.email,
        first_name: submission.profiles?.full_name?.split(' ')[0] || '',
        last_name: submission.profiles?.full_name?.split(' ').slice(1).join(' ') || '',
        type: 'passport',
        file_url: submission.document_url
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Approve KYC
router.post('/kyc/:submissionId/approve', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { notes } = req.body;

    const { error } = await supabase
      .from('kyc_submissions')
      .update({ 
        status: 'approved',
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'KYC approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reject KYC
router.post('/kyc/:submissionId/reject', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { reason, notes } = req.body;

    const { error } = await supabase
      .from('kyc_submissions')
      .update({ 
        status: 'rejected',
        admin_notes: `${reason}: ${notes}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'KYC rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 💰 Deposits Tab
router.get('/deposits', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    
    let query = supabase
      .from('deposits')
      .select(`
        *,
        profiles!inner(email, full_name)
      `)
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data.map(deposit => ({
        id: deposit.id,
        user_id: deposit.user_id,
        amount: deposit.amount,
        asset: deposit.currency,
        status: deposit.status,
        tx_hash: deposit.transaction_hash,
        network: deposit.network,
        address: deposit.address,
        admin_notes: deposit.admin_notes,
        created_at: deposit.created_at,
        updated_at: deposit.updated_at,
        email: deposit.profiles?.email,
        first_name: deposit.profiles?.full_name?.split(' ')[0] || '',
        last_name: deposit.profiles?.full_name?.split(' ').slice(1).join(' ') || ''
      }))
    });
  } catch (error) {
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

    const { error } = await supabase
      .from('deposits')
      .update({ 
        status: 'approved',
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', depositId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Deposit approved successfully'
    });
  } catch (error) {
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

    const { error } = await supabase
      .from('deposits')
      .update({ 
        status: 'rejected',
        admin_notes: `${reason}: ${notes}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', depositId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Deposit rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📉 Withdrawals Tab
router.get('/withdrawals', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    
    let query = supabase
      .from('withdrawal_requests')
      .select(`
        *,
        profiles!inner(email, full_name)
      `)
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data.map(withdrawal => ({
        id: withdrawal.id,
        user_id: withdrawal.user_id,
        amount: withdrawal.amount,
        asset: withdrawal.currency,
        address: withdrawal.address,
        network: withdrawal.network,
        status: withdrawal.status,
        admin_notes: withdrawal.admin_notes,
        created_at: withdrawal.created_at,
        updated_at: withdrawal.updated_at,
        email: withdrawal.profiles?.email,
        first_name: withdrawal.profiles?.full_name?.split(' ')[0] || '',
        last_name: withdrawal.profiles?.full_name?.split(' ').slice(1).join(' ') || ''
      }))
    });
  } catch (error) {
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

    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ 
        status: 'approved',
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawalId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Withdrawal approved successfully'
    });
  } catch (error) {
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

    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ 
        status: 'rejected',
        admin_notes: `${reason}: ${notes}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawalId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Withdrawal rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 👛 Wallets Tab
router.get('/wallets', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, account_balance')
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data.map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.full_name?.split(' ')[0] || '',
        last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
        usdt_balance: user.account_balance || '0.00',
        btc_balance: '0.00',
        eth_balance: '0.00'
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get fund actions history
router.get('/wallets/fund-actions', async (req, res) => {
  try {
    const { limit = 50, offset = 0, userId } = req.query;
    
    let query = supabase
      .from('admin_fund_actions')
      .select(`
        *,
        admin:profiles!admin_id(email, full_name),
        user:profiles!user_id(email, full_name)
      `)
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data.map(action => ({
        id: action.id,
        admin_id: action.admin_id,
        user_id: action.user_id,
        asset: action.asset,
        amount: action.amount,
        action_type: action.action_type,
        reason: action.reason,
        created_at: action.created_at,
        admin_email: action.admin?.email,
        admin_first_name: action.admin?.full_name?.split(' ')[0] || '',
        admin_last_name: action.admin?.full_name?.split(' ').slice(1).join(' ') || '',
        user_email: action.user?.email,
        user_first_name: action.user?.full_name?.split(' ')[0] || '',
        user_last_name: action.user?.full_name?.split(' ').slice(1).join(' ') || ''
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ⚙️ Trading Control Tab
router.post('/trade-override', async (req, res) => {
  try {
    const { userId, mode } = req.body;

    const { error } = await supabase
      .from('profiles')
      .update({ force_mode: mode })
      .eq('id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: `Trade mode set to ${mode} for user`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all trades
router.get('/trades', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, userId } = req.query;
    
    let query = supabase
      .from('trades')
      .select(`
        *,
        profiles!inner(email, full_name)
      `)
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data.map(trade => ({
        id: trade.id,
        symbol: 'BTC/USDT',
        side: trade.trade_type,
        type: 'spot',
        amount: trade.amount,
        price: trade.price,
        status: trade.status,
        result: trade.result,
        profit_loss: trade.profit_loss,
        entry_time: trade.created_at,
        exit_time: trade.completed_at,
        created_at: trade.created_at,
        updated_at: trade.updated_at,
        email: trade.profiles?.email,
        first_name: trade.profiles?.full_name?.split(' ')[0] || '',
        last_name: trade.profiles?.full_name?.split(' ').slice(1).join(' ') || ''
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get trading statistics
router.get('/trades/stats', async (req, res) => {
  try {
    const { data: trades, error } = await supabase
      .from('trades')
      .select('*');

    if (error) throw error;

    const totalTrades = trades.length;
    const completedTrades = trades.filter(t => t.status === 'completed').length;
    const pendingTrades = trades.filter(t => t.status === 'pending').length;
    const winningTrades = trades.filter(t => t.result === 'win').length;
    const losingTrades = trades.filter(t => t.result === 'loss').length;
    const totalProfit = trades
      .filter(t => t.profit_loss > 0)
      .reduce((sum, t) => sum + parseFloat(t.profit_loss || 0), 0);
    const totalLoss = trades
      .filter(t => t.profit_loss < 0)
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.profit_loss || 0)), 0);
    const avgTradeValue = totalTrades > 0 ? (totalProfit + totalLoss) / totalTrades : 0;
    const winRate = completedTrades > 0 ? (winningTrades / completedTrades * 100).toFixed(2) : '0.00';

    res.json({
      success: true,
      data: {
        totalTrades,
        completedTrades,
        pendingTrades,
        winningTrades,
        losingTrades,
        totalProfit: totalProfit.toFixed(2),
        totalLoss: totalLoss.toFixed(2),
        avgTradeValue: avgTradeValue.toFixed(2),
        activeTraders: 150, // Mock value
        winRate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📢 Notifications
router.post('/notifications/send', async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type: type || 'admin',
        created_by: req.adminId
      });

    if (error) throw error;

    res.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/notifications/broadcast', async (req, res) => {
  try {
    const { title, message, type } = req.body;

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');

    if (usersError) throw usersError;

    // Create notifications for all users
    const notifications = users.map(user => ({
      user_id: user.id,
      title,
      message,
      type: type || 'admin',
      created_by: req.adminId
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;

    res.json({
      success: true,
      message: `Notification broadcasted to ${users.length} users`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🧾 Audit Logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { limit = 50, offset = 0, actionType, adminId, targetUserId } = req.query;
    
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        admin:profiles!admin_id(email, full_name),
        target:profiles!target_user_id(email, full_name)
      `)
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    if (targetUserId) {
      query = query.eq('target_user_id', targetUserId);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data.map(log => ({
        id: log.id,
        admin_id: log.admin_id,
        action_type: log.action_type,
        target_user_id: log.target_user_id,
        details: log.details,
        ip_address: log.ip_address,
        created_at: log.created_at,
        admin_email: log.admin?.email,
        admin_first_name: log.admin?.full_name?.split(' ')[0] || '',
        admin_last_name: log.admin?.full_name?.split(' ').slice(1).join(' ') || '',
        target_email: log.target?.email,
        target_first_name: log.target?.full_name?.split(' ')[0] || '',
        target_last_name: log.target?.full_name?.split(' ').slice(1).join(' ') || ''
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📊 System Statistics
router.get('/stats', async (req, res) => {
  try {
    // Get user statistics
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*');

    if (usersError) throw usersError;

    // Get KYC statistics
    const { data: kycSubmissions, error: kycError } = await supabase
      .from('kyc_submissions')
      .select('status');

    if (kycError) throw kycError;

    // Get deposit statistics
    const { data: deposits, error: depositsError } = await supabase
      .from('deposits')
      .select('status');

    if (depositsError) throw depositsError;

    // Get withdrawal statistics
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('withdrawal_requests')
      .select('status');

    if (withdrawalsError) throw withdrawalsError;

    // Get trade statistics
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('status');

    if (tradesError) throw tradesError;

    // Calculate balances
    const totalUsdtBalance = users
      .reduce((sum, user) => sum + parseFloat(user.account_balance || 0), 0);

    res.json({
      success: true,
      data: {
        total_users: users.length,
        verified_users: users.filter(u => u.is_verified).length,
        pending_kyc: kycSubmissions.filter(k => k.status === 'pending').length,
        pending_deposits: deposits.filter(d => d.status === 'pending').length,
        pending_withdrawals: withdrawals.filter(w => w.status === 'pending').length,
        pending_trades: trades.filter(t => t.status === 'pending').length,
        total_usdt_balance: totalUsdtBalance.toFixed(2),
        total_btc_balance: '2.5',
        total_eth_balance: '25.0'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 