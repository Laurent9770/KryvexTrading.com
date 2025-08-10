import { createClient } from '@supabase/supabase-js';

// Supabase client initialization
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!, // Fixed: Use VITE_ prefix for Vite
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Wallet Transactions Types
interface WalletTransaction {
  id: string;
  user_id: string;
  action: 'fund' | 'withdraw' | 'deduct' | 'admin_fund' | 'admin_deduct';
  wallet_type: 'funding' | 'trading';
  amount: number;
  asset: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

// User Profile Types (using profiles table instead of wallet_balances)
interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  username: string;
  account_balance: number;
  funding_wallet: { [key: string]: number };
  trading_wallet: { [key: string]: number };
  created_at: string;
  updated_at: string;
}

// Withdrawals Types
interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

// User Roles Types
interface UserRole {
  user_id: string;
  role: 'user' | 'admin';
}

// Wallet Transactions Service
export class WalletService {
  // Get current authenticated user safely
  private static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Authentication error:', error);
        return null;
      }

      if (!user) {
        console.warn('No authenticated user found');
        return null;
      }

      return user;
    } catch (err) {
      console.error('Exception in getCurrentUser:', err);
      return null;
    }
  }

  // Fetch user's wallet transactions
  static async getWalletTransactions(): Promise<WalletTransaction[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for getWalletTransactions');
        return [];
      }

      const { data, error } = await supabase
        .from('transactions') // Fixed: Use 'transactions' table
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching wallet transactions:', error);
        return [];
      }

      // Ensure we always return an array
      return data || [];
    } catch (err) {
      console.error('Unexpected error in getWalletTransactions:', err);
      return [];
    }
  }

  // Fetch user's profile (wallet balance info)
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for getUserProfile');
        return null;
      }

      const { data, error } = await supabase
        .from('profiles') // Fixed: Use 'profiles' table
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error in getUserProfile:', err);
      return null;
    }
  }

  // Fetch user's withdrawals
  static async getWithdrawals(): Promise<Withdrawal[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for getWithdrawals');
        return [];
      }

      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching withdrawals:', error);
        return [];
      }

      // Ensure we always return an array
      return data || [];
    } catch (err) {
      console.error('Unexpected error in getWithdrawals:', err);
      return [];
    }
  }

  // Fetch user's role
  static async getUserRole(): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for getUserRole');
        return null;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role || null;
    } catch (err) {
      console.error('Unexpected error in getUserRole:', err);
      return null;
    }
  }

  // Get trading pairs (public data, no authentication needed)
  static async getTradingPairs() {
    try {
      const { data, error } = await supabase
        .from('trading_pairs')
        .select('*')
        .order('symbol', { ascending: true });

      if (error) {
        console.error('Error fetching trading pairs:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error in getTradingPairs:', err);
      return [];
    }
  }

  // Withdrawal Statistics
  static async getWithdrawalStats() {
    try {
      const withdrawals = await this.getWithdrawals();
      const safeWithdrawals = withdrawals || []; // Ensure array

      return {
        totalWithdrawals: safeWithdrawals.length,
        totalAmount: safeWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0),
        pendingWithdrawals: safeWithdrawals.filter(w => w.status === 'pending').length,
        completedWithdrawals: safeWithdrawals.filter(w => w.status === 'completed').length,
      };
    } catch (err) {
      console.error('Error calculating withdrawal stats:', err);
      return {
        totalWithdrawals: 0,
        totalAmount: 0,
        pendingWithdrawals: 0,
        completedWithdrawals: 0,
      };
    }
  }

  // Get wallet balance summary from user profile
  static async getWalletBalanceSummary() {
    try {
      const profile = await this.getUserProfile();
      
      if (!profile) {
        return {
          accountBalance: 0,
          fundingWallet: {},
          tradingWallet: {},
        };
      }

      return {
        accountBalance: profile.account_balance || 0,
        fundingWallet: profile.funding_wallet || {},
        tradingWallet: profile.trading_wallet || {},
      };
    } catch (err) {
      console.error('Error getting wallet balance summary:', err);
      return {
        accountBalance: 0,
        fundingWallet: {},
        tradingWallet: {},
      };
    }
  }

  // Get deposit statistics
  static async getDepositStats(userId?: string) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for getDepositStats');
        return {
          totalDeposits24h: 0,
          pendingDeposits: 0,
          averageTime: "~15 minutes"
        };
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId || user.id)
        .eq('type', 'deposit');

      if (error) {
        console.error('Error fetching deposit stats:', error);
        return {
          totalDeposits24h: 0,
          pendingDeposits: 0,
          averageTime: "~15 minutes"
        };
      }

      const transactions = data || [];
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const deposits24h = transactions.filter(tx => 
        new Date(tx.created_at) > yesterday
      );

      const pendingDeposits = transactions.filter(tx => 
        tx.status === 'pending'
      );

      return {
        totalDeposits24h: deposits24h.length,
        pendingDeposits: pendingDeposits.length,
        averageTime: "~15 minutes"
      };
    } catch (err) {
      console.error('Unexpected error in getDepositStats:', err);
      return {
        totalDeposits24h: 0,
        pendingDeposits: 0,
        averageTime: "~15 minutes"
      };
    }
  }

  // Get recent deposits
  static async getRecentDeposits(userId?: string) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for getRecentDeposits');
        return [];
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId || user.id)
        .eq('type', 'deposit')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recent deposits:', error);
        return [];
      }

      return (data || []).map(tx => ({
        amount: tx.amount.toString(),
        symbol: tx.currency,
        time: new Date(tx.created_at).toLocaleString(),
        status: tx.status
      }));
    } catch (err) {
      console.error('Unexpected error in getRecentDeposits:', err);
      return [];
    }
  }

  // Subscribe to transactions (placeholder for real-time updates)
  static subscribeToTransactions(callback: (data: any) => void) {
    // This is a placeholder - implement real-time subscription if needed
    console.log('Transaction subscription not implemented yet');
    return () => console.log('Unsubscribed from transactions');
  }

  // Subscribe to withdrawal requests (placeholder for real-time updates)
  static subscribeToWithdrawalRequests(callback: (data: any) => void) {
    // This is a placeholder - implement real-time subscription if needed
    console.log('Withdrawal request subscription not implemented yet');
    return () => console.log('Unsubscribed from withdrawal requests');
  }

  // Get withdrawal requests
  static async getWithdrawalRequests() {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for getWithdrawalRequests');
        return [];
      }

      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching withdrawal requests:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error in getWithdrawalRequests:', err);
      return [];
    }
  }

  // Create withdrawal request
  static async createWithdrawalRequest(withdrawalData: {
    amount: number;
    currency: string;
    walletAddress: string;
    blockchain: string;
    notes?: string;
  }) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for createWithdrawalRequest');
        return null;
      }

      const { data, error } = await supabase
        .from('withdrawals')
        .insert({
          ...withdrawalData,
          user_id: user.id,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating withdrawal request:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error in createWithdrawalRequest:', err);
      return null;
    }
  }

  // Approve withdrawal (admin function)
  static async approveWithdrawal(withdrawalId: string, adminEmail: string, txHash?: string) {
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'completed',
          processed_by: adminEmail,
          tx_hash: txHash,
          processed_date: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (error) {
        console.error('Error approving withdrawal:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error in approveWithdrawal:', err);
      return false;
    }
  }

  // Reject withdrawal (admin function)
  static async rejectWithdrawal(withdrawalId: string, adminEmail: string, reason?: string) {
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'failed',
          processed_by: adminEmail,
          admin_notes: reason,
          processed_date: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (error) {
        console.error('Error rejecting withdrawal:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error in rejectWithdrawal:', err);
      return false;
    }
  }

  // Fund user wallet (admin function)
  static async fundUserWallet(
    userId: string,
    username: string,
    walletType: 'funding' | 'trading',
    amount: number,
    asset: string,
    adminEmail: string,
    remarks: string
  ) {
    try {
      // First, get the current profile to update the wallet
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select(`${walletType}_wallet`)
        .eq('user_id', userId)
        .single();

      if (profileFetchError) {
        console.error('Error fetching user profile for funding:', profileFetchError);
        return false;
      }

      // Update the wallet balance
      const currentWallet = profile?.[`${walletType}_wallet`] || {};
      const currentBalance = currentWallet[asset] || 0;
      const newBalance = currentBalance + amount;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          [`${walletType}_wallet`]: {
            ...currentWallet,
            [asset]: newBalance
          }
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error funding user wallet:', profileError);
        return false;
      }

      // Then, create a transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount: amount,
          currency: asset,
          status: 'completed',
          description: `Admin funding: ${remarks}`,
          metadata: {
            admin_email: adminEmail,
            wallet_type: walletType,
            username: username
          },
          created_at: new Date().toISOString()
        });

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error in fundUserWallet:', err);
      return false;
    }
  }

  // Deduct from user wallet (admin function)
  static async deductFromWallet(
    userId: string,
    username: string,
    walletType: 'funding' | 'trading',
    amount: number,
    asset: string,
    adminEmail: string,
    remarks: string
  ) {
    try {
      // First, get the current profile to update the wallet
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select(`${walletType}_wallet`)
        .eq('user_id', userId)
        .single();

      if (profileFetchError) {
        console.error('Error fetching user profile for deduction:', profileFetchError);
        return false;
      }

      // Update the wallet balance
      const currentWallet = profile?.[`${walletType}_wallet`] || {};
      const currentBalance = currentWallet[asset] || 0;
      const newBalance = Math.max(currentBalance - amount, 0); // Prevent negative balance

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          [`${walletType}_wallet`]: {
            ...currentWallet,
            [asset]: newBalance
          }
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error deducting from user wallet:', profileError);
        return false;
      }

      // Then, create a transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'withdrawal',
          amount: amount,
          currency: asset,
          status: 'completed',
          description: `Admin deduction: ${remarks}`,
          metadata: {
            admin_email: adminEmail,
            wallet_type: walletType,
            username: username
          },
          created_at: new Date().toISOString()
        });

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error in deductFromWallet:', err);
      return false;
    }
  }
}

// Admin-only function (requires additional backend role check)
export class AdminService {
  // Fetch all users (admin-only)
  static async getAllUsers() {
    try {
      // First, verify if the current user is an admin
      const userRole = await WalletService.getUserRole();
      if (userRole !== 'admin') {
        console.error('Unauthorized: Admin access required');
        return [];
      }

      const { data, error } = await supabase
        .from('profiles') // Fixed: Use 'profiles' table instead of 'users'
        .select('user_id, email, full_name, username');

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error in getAllUsers:', err);
      return [];
    }
  }

  // Get all transactions (admin-only)
  static async getAllTransactions() {
    try {
      // First, verify if the current user is an admin
      const userRole = await WalletService.getUserRole();
      if (userRole !== 'admin') {
        console.error('Unauthorized: Admin access required');
        return [];
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching all transactions:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error in getAllTransactions:', err);
      return [];
    }
  }
}

// Example Usage
export async function exampleUsage() {
  try {
    // Get wallet transactions
    const transactions = await WalletService.getWalletTransactions();
    console.log('Wallet Transactions:', transactions);

    // Get user profile
    const profile = await WalletService.getUserProfile();
    console.log('User Profile:', profile);

    // Get wallet balance summary
    const balanceSummary = await WalletService.getWalletBalanceSummary();
    console.log('Wallet Balance Summary:', balanceSummary);

    // Get withdrawal stats
    const withdrawalStats = await WalletService.getWithdrawalStats();
    console.log('Withdrawal Stats:', withdrawalStats);

    // Get user role
    const userRole = await WalletService.getUserRole();
    console.log('User Role:', userRole);

    // Get trading pairs (public data)
    const tradingPairs = await WalletService.getTradingPairs();
    console.log('Trading Pairs:', tradingPairs);

    // Admin-only: Get all users
    if (userRole === 'admin') {
      const allUsers = await AdminService.getAllUsers();
      console.log('All Users:', allUsers);

      const allTransactions = await AdminService.getAllTransactions();
      console.log('All Transactions:', allTransactions);
    }
  } catch (error) {
    console.error('Error in example usage:', error);
  }
}

// Export individual functions for easier imports
export const {
  getWalletTransactions,
  getUserProfile,
  getWithdrawals,
  getUserRole,
  getTradingPairs,
  getWithdrawalStats,
  getWalletBalanceSummary,
  getDepositStats,
  getRecentDeposits,
  subscribeToTransactions,
  subscribeToWithdrawalRequests,
  getWithdrawalRequests,
  createWithdrawalRequest,
  approveWithdrawal,
  rejectWithdrawal,
  fundUserWallet,
  deductFromWallet
} = WalletService;

export const {
  getAllUsers,
  getAllTransactions
} = AdminService;
