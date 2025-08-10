import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!, 
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

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

// Wallet Transactions - Fixed authentication and table name
export async function getWalletTransactions() {
  try {
    // Get current user safely
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return [];
    }

    const { data, error } = await supabase
      .from('transactions') // Using 'transactions' table instead of 'wallet_transactions'
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

// All User Wallets - Fixed table name and authentication
export async function getAllUserWallets() {
  try {
    // Get current user safely
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return [];
    }

    const { data, error } = await supabase
      .from('profiles') // Using 'profiles' table instead of 'wallet_balances'
      .select('user_id, email, full_name, username, account_balance, funding_wallet, trading_wallet')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user wallets:', error);
      return [];
    }

    // Ensure we always return an array
    return data || [];
  } catch (err) {
    console.error('Unexpected error in getAllUserWallets:', err);
    return [];
  }
}

// Withdrawal Stats - Fixed authentication
export async function getWithdrawalStats() {
  try {
    // Get current user safely
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return { totalWithdrawals: 0, totalAmount: 0 };
    }

    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching withdrawals:', error);
      return { totalWithdrawals: 0, totalAmount: 0 };
    }

    const withdrawals = data || [];

    return {
      totalWithdrawals: withdrawals.length,
      totalAmount: withdrawals.reduce((sum, w) => sum + parseFloat(w.amount || '0'), 0),
    };
  } catch (err) {
    console.error('Unexpected error in getWithdrawalStats:', err);
    return { totalWithdrawals: 0, totalAmount: 0 };
  }
}

// Get All Users (Admin-only) - Fixed authentication
export async function getAllUsers() {
  try {
    // Get current user safely
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return [];
    }

    // Verify user role or admin status before fetching
    const userRole = await getUserRole(user.id);
    if (userRole !== 'admin') {
      console.error('Unauthorized access - user is not admin');
      return [];
    }

    const { data, error } = await supabase
      .from('profiles') // Using 'profiles' table instead of 'users'
      .select('user_id, email, full_name, username');

    if (error) {
      console.error('Error getting all users:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error in getAllUsers:', err);
    return [];
  }
}

// Get User Roles - Fixed authentication
export async function getUserRole(userId: string) {
  try {
    if (!userId) {
      console.error('No userId provided to getUserRole');
      return null;
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user roles:', error);
      return null;
    }

    return data?.role || null;
  } catch (err) {
    console.error('Unexpected error in getUserRole:', err);
    return null;
  }
}

// Get User Profile - New function for getting current user profile
export async function getUserProfile() {
  try {
    // Get current user safely
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
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

// Get Trading Pairs - Public data, no authentication needed
export async function getTradingPairs() {
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

// Get All Transactions (Admin-only)
export async function getAllTransactions() {
  try {
    // Get current user safely
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return [];
    }

    // Verify user role or admin status before fetching
    const userRole = await getUserRole(user.id);
    if (userRole !== 'admin') {
      console.error('Unauthorized access - user is not admin');
      return [];
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error getting all transactions:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error in getAllTransactions:', err);
    return [];
  }
} 