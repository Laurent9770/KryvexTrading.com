const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

class SupabaseAdminService {
  // ==================== USER MANAGEMENT ====================

  // Get all users with pagination and search
  async getAllUsers(limit = 50, offset = 0, search = '') {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      const { data: users, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        users: users || [],
        total: count || 0,
        limit,
        offset
      };
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role),
          trades (count),
          transactions (count)
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return user;
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  // Update user role (promote/demote admin)
  async updateUserRole(userId, role) {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role
        });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Update user role error:', error);
      throw error;
    }
  }

  // Update user account status
  async updateUserStatus(userId, status) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: status })
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Update user status error:', error);
      throw error;
    }
  }

  // ==================== TRADE MANAGEMENT ====================

  // Get all trades with pagination
  async getAllTrades(limit = 50, offset = 0, userId = null) {
    try {
      let query = supabase
        .from('trades')
        .select(`
          *,
          profiles (email, full_name),
          trading_pairs (symbol)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: trades, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        trades: trades || [],
        total: count || 0,
        limit,
        offset
      };
    } catch (error) {
      console.error('Get all trades error:', error);
      throw error;
    }
  }

  // Force trade outcome
  async forceTradeOutcome(tradeId, outcome) {
    try {
      const { error } = await supabase
        .from('trades')
        .update({
          result: outcome,
          forced_outcome: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) {
        throw new Error(error.message);
      }

      // Log the admin action
      await this.logAdminAction('FORCE_TRADE_OUTCOME', {
        trade_id: tradeId,
        outcome: outcome
      });

      return { success: true };
    } catch (error) {
      console.error('Force trade outcome error:', error);
      throw error;
    }
  }

  // Cancel trade
  async cancelTrade(tradeId) {
    try {
      const { error } = await supabase
        .from('trades')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) {
        throw new Error(error.message);
      }

      await this.logAdminAction('CANCEL_TRADE', {
        trade_id: tradeId
      });

      return { success: true };
    } catch (error) {
      console.error('Cancel trade error:', error);
      throw error;
    }
  }

  // ==================== WALLET MANAGEMENT ====================

  // Adjust user balance
  async adjustUserBalance(userId, amount, reason) {
    try {
      // Get current balance
      const { data: profile, error: getError } = await supabase
        .from('profiles')
        .select('account_balance')
        .eq('user_id', userId)
        .single();

      if (getError) {
        throw new Error(getError.message);
      }

      const newBalance = profile.account_balance + amount;

      // Update balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ account_balance: newBalance })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: amount > 0 ? 'credit' : 'debit',
          amount: Math.abs(amount),
          status: 'completed',
          description: `Admin adjustment: ${reason}`,
          created_at: new Date().toISOString()
        });

      if (transactionError) {
        throw new Error(transactionError.message);
      }

      await this.logAdminAction('ADJUST_BALANCE', {
        user_id: userId,
        amount: amount,
        reason: reason
      });

      return { success: true, newBalance };
    } catch (error) {
      console.error('Adjust user balance error:', error);
      throw error;
    }
  }

  // Get user transactions
  async getUserTransactions(userId, limit = 50, offset = 0) {
    try {
      const { data: transactions, error, count } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(error.message);
      }

      return {
        transactions: transactions || [],
        total: count || 0,
        limit,
        offset
      };
    } catch (error) {
      console.error('Get user transactions error:', error);
      throw error;
    }
  }

  // ==================== KYC MANAGEMENT ====================

  // Get all KYC documents
  async getAllKYCDocuments(limit = 50, offset = 0, status = null) {
    try {
      let query = supabase
        .from('kyc_documents')
        .select(`
          *,
          profiles (email, full_name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: documents, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        documents: documents || [],
        total: count || 0,
        limit,
        offset
      };
    } catch (error) {
      console.error('Get all KYC documents error:', error);
      throw error;
    }
  }

  // Approve/reject KYC
  async updateKYCStatus(documentId, status, adminNotes = '') {
    try {
      const { data: document, error: getError } = await supabase
        .from('kyc_documents')
        .select('user_id')
        .eq('id', documentId)
        .single();

      if (getError) {
        throw new Error(getError.message);
      }

      // Update KYC document status
      const { error: updateError } = await supabase
        .from('kyc_documents')
        .update({
          status: status,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update user profile KYC status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          kyc_status: status === 'approved' ? 'approved' : 'rejected',
          is_verified: status === 'approved'
        })
        .eq('user_id', document.user_id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      await this.logAdminAction('UPDATE_KYC_STATUS', {
        document_id: documentId,
        user_id: document.user_id,
        status: status,
        notes: adminNotes
      });

      return { success: true };
    } catch (error) {
      console.error('Update KYC status error:', error);
      throw error;
    }
  }

  // ==================== STATISTICS ====================

  // Get platform statistics
  async getPlatformStats() {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total trades
      const { count: totalTrades } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true });

      // Get total volume
      const { data: volumeData } = await supabase
        .from('trades')
        .select('total_value')
        .eq('status', 'completed');

      const totalVolume = volumeData?.reduce((sum, trade) => sum + (trade.total_value || 0), 0) || 0;

      // Get pending KYC documents
      const { count: pendingKYC } = await supabase
        .from('kyc_documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      return {
        totalUsers: totalUsers || 0,
        totalTrades: totalTrades || 0,
        totalVolume: totalVolume,
        pendingKYC: pendingKYC || 0
      };
    } catch (error) {
      console.error('Get platform stats error:', error);
      throw error;
    }
  }

  // ==================== AUDIT LOGGING ====================

  // Log admin actions
  async logAdminAction(actionType, details = {}) {
    try {
      const { error } = await supabase
        .from('admin_actions')
        .insert({
          action_type: actionType,
          details: details,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Log admin action error:', error);
      }
    } catch (error) {
      console.error('Log admin action error:', error);
    }
  }

  // Get admin action logs
  async getAdminActionLogs(limit = 50, offset = 0) {
    try {
      const { data: logs, error, count } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(error.message);
      }

      return {
        logs: logs || [],
        total: count || 0,
        limit,
        offset
      };
    } catch (error) {
      console.error('Get admin action logs error:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseAdminService(); 