import { createClient } from '@supabase/supabase-js';

// Supabase client initialization
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!, // Fixed: Use REACT_APP_ prefix for React
  process.env.REACT_APP_SUPABASE_ANON_KEY!
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
  getWalletBalanceSummary
} = WalletService;

export const {
  getAllUsers,
  getAllTransactions
} = AdminService;
