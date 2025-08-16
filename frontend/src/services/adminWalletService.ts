import supabase from '../lib/supabaseClient';

export interface AdminWalletTransactionParams {
  target_user_email: string;
  amount: number;
  currency?: string;
  wallet_type?: 'funding' | 'trading';
  description?: string;
  admin_notes?: string;
}

export interface WalletTransactionResult {
  success: boolean;
  transaction_id: string;
  admin_action_id: string;
  target_user_email: string;
  target_user_id: string;
  amount: number;
  currency: string;
  wallet_type: string;
  previous_balance: number;
  new_balance: number;
  description: string;
  processed_at: string;
}

export interface UserWalletBalance {
  user_id: string;
  email: string;
  full_name: string;
  account_balance: number;
  wallets: Array<{
    wallet_type: string;
    asset: string;
    balance: number;
    updated_at: string;
  }>;
  total_balance_usd: number;
  last_updated: string;
}

export interface UserTransactionHistory {
  user_id: string;
  transactions: Array<{
    id: string;
    transaction_type: string;
    amount: number;
    currency: string;
    status: string;
    wallet_type: string;
    description: string;
    processed_at: string;
    created_at: string;
  }>;
  total_count: number;
}

class AdminWalletService {
  /**
   * Send money from admin to user (FUND)
   */
  async sendMoneyToUser(params: AdminWalletTransactionParams): Promise<WalletTransactionResult> {
    try {
      console.log('🔄 Admin sending money to user:', params);
      
      const { data, error } = await supabase.rpc('admin_send_money_to_user', {
        target_user_email_param: params.target_user_email,
        amount_param: params.amount,
        currency_param: params.currency || 'USDT',
        wallet_type_param: params.wallet_type || 'funding',
        description_param: params.description || 'Admin funding',
        admin_notes_param: params.admin_notes || null
      });

      if (error) {
        console.error('❌ Error sending money:', error);
        throw new Error(`Failed to send money: ${error.message}`);
      }

      if (!data || !data.success) {
        console.error('❌ Transaction failed:', data);
        throw new Error('Transaction failed');
      }

      console.log('✅ Money sent successfully:', data);
      return data as WalletTransactionResult;
    } catch (error) {
      console.error('❌ Error sending money to user:', error);
      throw error;
    }
  }

  /**
   * Deduct money from user (REMOVE FUNDS)
   */
  async deductMoneyFromUser(params: AdminWalletTransactionParams): Promise<WalletTransactionResult> {
    try {
      console.log('🔄 Admin deducting money from user:', params);
      
      const { data, error } = await supabase.rpc('admin_deduct_money_from_user', {
        target_user_email_param: params.target_user_email,
        amount_param: params.amount,
        currency_param: params.currency || 'USDT',
        wallet_type_param: params.wallet_type || 'funding',
        description_param: params.description || 'Admin deduction',
        admin_notes_param: params.admin_notes || null
      });

      if (error) {
        console.error('❌ Error deducting money:', error);
        throw new Error(`Failed to deduct money: ${error.message}`);
      }

      if (!data || !data.success) {
        console.error('❌ Transaction failed:', data);
        throw new Error('Transaction failed');
      }

      console.log('✅ Money deducted successfully:', data);
      return data as WalletTransactionResult;
    } catch (error) {
      console.error('❌ Error deducting money from user:', error);
      throw error;
    }
  }

  /**
   * Get user wallet balance
   */
  async getUserWalletBalance(
    target_user_email?: string,
    wallet_type?: string,
    currency?: string
  ): Promise<UserWalletBalance> {
    try {
      const { data, error } = await supabase.rpc('get_user_wallet_balance', {
        target_user_email: target_user_email || null,
        wallet_type_param: wallet_type || null,
        currency_param: currency || null
      });

      if (error) {
        throw new Error(`Failed to get wallet balance: ${error.message}`);
      }

      return data as UserWalletBalance;
    } catch (error) {
      console.error('Error getting user wallet balance:', error);
      throw error;
    }
  }

  /**
   * Get user transaction history
   */
  async getUserTransactionHistory(
    target_user_email?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<UserTransactionHistory> {
    try {
      const { data, error } = await supabase.rpc('get_user_transaction_history', {
        target_user_email: target_user_email || null,
        limit_param: limit,
        offset_param: offset
      });

      if (error) {
        throw new Error(`Failed to get transaction history: ${error.message}`);
      }

      return data as UserTransactionHistory;
    } catch (error) {
      console.error('Error getting user transaction history:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time wallet updates
   */
  subscribeToWalletUpdates(callback: (payload: any) => void) {
    try {
      const subscription = supabase
        .channel('wallet_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_wallets'
          },
          (payload) => {
            console.log('🔄 Wallet update received:', payload);
            callback(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallet_transactions'
          },
          (payload) => {
            console.log('🔄 Transaction update received:', payload);
            callback(payload);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error subscribing to wallet updates:', error);
      return () => {};
    }
  }

  /**
   * Subscribe to admin actions
   */
  subscribeToAdminActions(callback: (payload: any) => void) {
    try {
      const subscription = supabase
        .channel('admin_actions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'admin_actions'
          },
          (payload) => {
            console.log('🔄 Admin action received:', payload);
            callback(payload);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error subscribing to admin actions:', error);
      return () => {};
    }
  }

  /**
   * Get all users with wallet balances (admin only)
   */
  async getAllUsersWithWallets(): Promise<UserWalletBalance[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, account_balance');

      if (usersError) throw usersError;

      // Get wallet data for all users
      const { data: wallets, error: walletsError } = await supabase
        .from('user_wallets')
        .select('*');

      if (walletsError) throw walletsError;

      // Combine user and wallet data
      const result: UserWalletBalance[] = users?.map(userProfile => {
        const userWallets = wallets?.filter(w => w.user_id === userProfile.user_id) || [];
        const totalBalance = userWallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);

        return {
          user_id: userProfile.user_id,
          email: userProfile.email,
          full_name: userProfile.full_name || '',
          account_balance: userProfile.account_balance || 0,
          wallets: userWallets.map(wallet => ({
            wallet_type: wallet.wallet_type,
            asset: wallet.asset,
            balance: wallet.balance || 0,
            updated_at: wallet.updated_at
          })),
          total_balance_usd: totalBalance,
          last_updated: new Date().toISOString()
        };
      }) || [];

      return result;
    } catch (error) {
      console.error('Error getting all users with wallets:', error);
      throw error;
    }
  }

  /**
   * Get system statistics (admin only)
   */
  async getSystemStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total wallet balance
      const { data: wallets } = await supabase
        .from('user_wallets')
        .select('balance');

      const totalBalance = wallets?.reduce((sum, wallet) => sum + (wallet.balance || 0), 0) || 0;

      // Get recent transactions
      const { data: recentTransactions } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get admin actions
      const { data: recentAdminActions } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        totalUsers: totalUsers || 0,
        totalBalance,
        recentTransactions: recentTransactions || [],
        recentAdminActions: recentAdminActions || [],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      throw error;
    }
  }

  /**
   * Force refresh user wallet (admin only)
   */
  async forceRefreshUserWallet(targetUserEmail: string) {
    try {
      // Get user ID from email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', targetUserEmail)
        .single();

      if (userError || !userData) {
        throw new Error(`User not found: ${targetUserEmail}`);
      }

      // Call the sync function
      const { data, error } = await supabase.rpc('sync_user_wallet_from_database', {
        user_id_param: userData.user_id
      });

      if (error) {
        throw new Error(`Failed to refresh wallet: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error forcing wallet refresh:', error);
      throw error;
    }
  }
}

const adminWalletService = new AdminWalletService();
export default adminWalletService;
