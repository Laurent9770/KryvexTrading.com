import supabaseQueryHelper, { QueryResult } from './supabaseQueryHelper';

// Ensure proper Supabase client initialization
const supabase = supabaseQueryHelper;

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  amount: number;
  asset: string;
  blockchain: string;
  walletAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  processedDate?: string;
  processedBy?: string;
  txHash?: string;
  remarks?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  username: string;
  action: 'fund' | 'withdraw' | 'deduct' | 'admin_fund' | 'admin_deduct';
  walletType: 'funding' | 'trading';
  amount: number;
  asset: string;
  performedBy: string;
  timestamp: string;
  remarks?: string;
  status: 'completed' | 'pending' | 'failed';
  balance?: number;
  adminEmail?: string;
}

export interface UserWallet {
  userId: string;
  username: string;
  email: string;
  fundingWallet: { [key: string]: number };
  tradingWallet: { [key: string]: number };
  lastUpdated: string;
}

class SupabaseWalletServiceUpdated {
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  // Withdrawal Requests
  async getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    try {
      console.log('Fetching withdrawal requests...');
      
      const { data, error, success } = await supabase.getWithdrawals();
      
      if (!success || error) {
        console.error('Error fetching withdrawal requests:', error);
        return [];
      }

      // Handle potential undefined results
      const withdrawalRequests = data || [];
      
      console.log(`Successfully fetched ${withdrawalRequests.length} withdrawal requests`);

      return withdrawalRequests.map(request => ({
        id: request.id,
        userId: request.user_id,
        username: request.username || '',
        userEmail: request.user_email || '',
        amount: request.amount,
        asset: request.currency || 'USDT',
        blockchain: request.blockchain || '',
        walletAddress: request.wallet_address || '',
        status: request.status,
        requestDate: request.created_at,
        processedDate: request.processed_date,
        processedBy: request.processed_by,
        txHash: request.tx_hash,
        remarks: request.remarks || request.admin_notes
      }));
    } catch (error) {
      console.error('Exception in getWithdrawalRequests:', error);
      return [];
    }
  }

  async getWithdrawalRequestsByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<WithdrawalRequest[]> {
    try {
      console.log(`Fetching withdrawal requests with status: ${status}`);
      
      const { data, error, success } = await supabase.safeQuery('withdrawals', '*', { status });
      
      if (!success || error) {
        console.error('Error fetching withdrawal requests by status:', error);
        return [];
      }

      // Handle potential undefined results
      const withdrawalRequests = data || [];
      
      console.log(`Successfully fetched ${withdrawalRequests.length} withdrawal requests with status ${status}`);

      return withdrawalRequests.map(request => ({
        id: request.id,
        userId: request.user_id,
        username: request.username || '',
        userEmail: request.user_email || '',
        amount: request.amount,
        asset: request.currency || 'USDT',
        blockchain: request.blockchain || '',
        walletAddress: request.wallet_address || '',
        status: request.status,
        requestDate: request.created_at,
        processedDate: request.processed_date,
        processedBy: request.processed_by,
        txHash: request.tx_hash,
        remarks: request.remarks || request.admin_notes
      }));
    } catch (error) {
      console.error('Exception in getWithdrawalRequestsByStatus:', error);
      return [];
    }
  }

  // Wallet Transactions
  async getWalletTransactions(): Promise<WalletTransaction[]> {
    try {
      console.log('Fetching wallet transactions...');
      
      const { data, error, success } = await supabase.getWalletTransactions();
      
      if (!success || error) {
        console.error('Error fetching wallet transactions:', error);
        return [];
      }

      // Handle potential undefined results
      const transactions = data || [];
      
      console.log(`Successfully fetched ${transactions.length} wallet transactions`);

      return transactions.map(transaction => ({
        id: transaction.id,
        userId: transaction.user_id,
        username: transaction.username || '',
        action: transaction.action || transaction.type,
        walletType: transaction.wallet_type || 'funding',
        amount: transaction.amount,
        asset: transaction.asset || transaction.currency || 'USDT',
        performedBy: transaction.performed_by,
        timestamp: transaction.created_at,
        remarks: transaction.remarks || transaction.description,
        status: transaction.status,
        balance: transaction.balance,
        adminEmail: transaction.admin_email
      }));
    } catch (error) {
      console.error('Exception in getWalletTransactions:', error);
      return [];
    }
  }

  async getWalletTransactionsByUser(userId: string): Promise<WalletTransaction[]> {
    try {
      console.log(`Fetching wallet transactions for user: ${userId}`);
      
      if (!userId) {
        console.error('No userId provided to getWalletTransactionsByUser');
        return [];
      }

      const { data, error, success } = await supabase.getWalletTransactions(userId);
      
      if (!success || error) {
        console.error('Error fetching user wallet transactions:', error);
        return [];
      }

      // Handle potential undefined results
      const transactions = data || [];
      
      console.log(`Successfully fetched ${transactions.length} transactions for user ${userId}`);

      return transactions.map(transaction => ({
        id: transaction.id,
        userId: transaction.user_id,
        username: transaction.username || '',
        action: transaction.action || transaction.type,
        walletType: transaction.wallet_type || 'funding',
        amount: transaction.amount,
        asset: transaction.asset || transaction.currency || 'USDT',
        performedBy: transaction.performed_by,
        timestamp: transaction.created_at,
        remarks: transaction.remarks || transaction.description,
        status: transaction.status,
        balance: transaction.balance,
        adminEmail: transaction.admin_email
      }));
    } catch (error) {
      console.error('Exception in getWalletTransactionsByUser:', error);
      return [];
    }
  }

  // User Wallets
  async getUserWallet(userId: string): Promise<UserWallet | null> {
    try {
      console.log(`Fetching user wallet for: ${userId}`);
      
      if (!userId) {
        console.error('No userId provided to getUserWallet');
        return null;
      }

      const { data, error, success } = await supabase.getProfiles(userId);
      
      if (!success || error) {
        console.error('Error fetching user wallet:', error);
        return null;
      }

      // Handle potential undefined results
      const profiles = data || [];
      const profile = profiles[0]; // Get first profile since we're querying by user_id
      
      if (!profile) {
        console.warn(`No profile data found for user ${userId}`);
        return null;
      }

      console.log(`Successfully fetched wallet for user ${userId}`);

      return {
        userId: profile.id,
        username: profile.username || profile.full_name || '',
        email: profile.email,
        fundingWallet: profile.funding_wallet || {},
        tradingWallet: profile.trading_wallet || {},
        lastUpdated: profile.updated_at
      };
    } catch (error) {
      console.error('Exception in getUserWallet:', error);
      return null;
    }
  }

  async getAllUserWallets(): Promise<UserWallet[]> {
    try {
      console.log('Fetching all user wallets...');
      
      const { data, error, success } = await supabase.getProfiles();
      
      if (!success || error) {
        console.error('Error fetching all user wallets:', error);
        return [];
      }

      // Handle potential undefined results
      const profiles = data || [];
      
      console.log(`Successfully fetched ${profiles.length} user wallets`);

      return profiles.map(profile => ({
        userId: profile.id,
        username: profile.username || profile.full_name || '',
        email: profile.email,
        fundingWallet: profile.funding_wallet || {},
        tradingWallet: profile.trading_wallet || {},
        lastUpdated: profile.updated_at
      }));
    } catch (error) {
      console.error('Exception in getAllUserWallets:', error);
      return [];
    }
  }

  // Admin Functions
  async fundUserWallet(
    userId: string, 
    username: string, 
    walletType: 'funding' | 'trading', 
    amount: number, 
    asset: string, 
    adminEmail: string, 
    remarks: string
  ): Promise<boolean> {
    try {
      console.log(`Funding user wallet: ${userId}, amount: ${amount} ${asset}`);
      
      // Create transaction record
      const transactionData = {
        user_id: userId,
        type: 'fund',
        amount: amount,
        currency: asset,
        status: 'completed',
        action: 'admin_fund',
        wallet_type: walletType,
        performed_by: this.userId,
        remarks: remarks,
        admin_email: adminEmail,
        username: username,
        asset: asset
      };

      const { success: transactionSuccess } = await supabase.safeInsert('transactions', transactionData);
      
      if (!transactionSuccess) {
        console.error('Failed to create transaction record');
        return false;
      }

      // Update user's wallet balance
      const profileData = {
        [`${walletType}_wallet`]: supabase.client.sql`jsonb_set(
          COALESCE(${walletType}_walallet, '{}'::jsonb), 
          '{${asset}}', 
          COALESCE((${walletType}_wallet->>'${asset}')::numeric, 0) + ${amount}
        )`
      };

      const { success: profileSuccess } = await supabase.safeUpdate('profiles', profileData, { user_id: userId });
      
      if (!profileSuccess) {
        console.error('Failed to update user wallet balance');
        return false;
      }

      console.log(`Successfully funded user wallet: ${userId}`);
      return true;
    } catch (error) {
      console.error('Exception in fundUserWallet:', error);
      return false;
    }
  }

  async deductFromWallet(
    userId: string, 
    username: string, 
    walletType: 'funding' | 'trading', 
    amount: number, 
    asset: string, 
    adminEmail: string, 
    remarks: string
  ): Promise<boolean> {
    try {
      console.log(`Deducting from user wallet: ${userId}, amount: ${amount} ${asset}`);
      
      // Create transaction record
      const transactionData = {
        user_id: userId,
        type: 'deduct',
        amount: amount,
        currency: asset,
        status: 'completed',
        action: 'admin_deduct',
        wallet_type: walletType,
        performed_by: this.userId,
        remarks: remarks,
        admin_email: adminEmail,
        username: username,
        asset: asset
      };

      const { success: transactionSuccess } = await supabase.safeInsert('transactions', transactionData);
      
      if (!transactionSuccess) {
        console.error('Failed to create transaction record');
        return false;
      }

      // Update user's wallet balance
      const profileData = {
        [`${walletType}_wallet`]: supabase.client.sql`jsonb_set(
          COALESCE(${walletType}_wallet, '{}'::jsonb), 
          '{${asset}}', 
          GREATEST(COALESCE((${walletType}_wallet->>'${asset}')::numeric, 0) - ${amount}, 0)
        )`
      };

      const { success: profileSuccess } = await supabase.safeUpdate('profiles', profileData, { user_id: userId });
      
      if (!profileSuccess) {
        console.error('Failed to update user wallet balance');
        return false;
      }

      console.log(`Successfully deducted from user wallet: ${userId}`);
      return true;
    } catch (error) {
      console.error('Exception in deductFromWallet:', error);
      return false;
    }
  }

  // Statistics
  async getDepositStats(userId?: string) {
    try {
      const filters = userId ? { user_id: userId, type: 'deposit' } : { type: 'deposit' };
      const { data, error, success } = await supabase.safeQuery('transactions', 'SUM(amount) as total_deposits, COUNT(*) as deposit_count', filters);
      
      if (!success || error) {
        console.error('Error fetching deposit stats:', error);
        return { totalDeposits: 0, depositCount: 0 };
      }

      const stats = data?.[0] || { total_deposits: 0, deposit_count: 0 };
      return {
        totalDeposits: parseFloat(stats.total_deposits) || 0,
        depositCount: parseInt(stats.deposit_count) || 0
      };
    } catch (error) {
      console.error('Exception in getDepositStats:', error);
      return { totalDeposits: 0, depositCount: 0 };
    }
  }

  async getWithdrawalStats() {
    try {
      const { data, error, success } = await supabase.safeQuery('withdrawals', 'SUM(amount) as total_withdrawals, COUNT(*) as withdrawal_count, COUNT(*) FILTER (WHERE status = \'pending\') as pending_count');
      
      if (!success || error) {
        console.error('Error fetching withdrawal stats:', error);
        return { totalWithdrawals: 0, withdrawalCount: 0, pendingCount: 0 };
      }

      const stats = data?.[0] || { total_withdrawals: 0, withdrawal_count: 0, pending_count: 0 };
      return {
        totalWithdrawals: parseFloat(stats.total_withdrawals) || 0,
        withdrawalCount: parseInt(stats.withdrawal_count) || 0,
        pendingCount: parseInt(stats.pending_count) || 0
      };
    } catch (error) {
      console.error('Exception in getWithdrawalStats:', error);
      return { totalWithdrawals: 0, withdrawalCount: 0, pendingCount: 0 };
    }
  }
}

const supabaseWalletServiceUpdated = new SupabaseWalletServiceUpdated();
export default supabaseWalletServiceUpdated;
