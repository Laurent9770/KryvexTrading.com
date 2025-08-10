import supabase from '../lib/supabaseClient';

// Type definitions
export interface WalletTransaction {
  id: string;
  user_id: string;
  action: string;
  wallet_type: string;
  amount: number;
  asset: string;
  status: string;
  balance?: number;
  admin_email?: string;
  remarks?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  phone?: string;
  country?: string;
  account_balance: number;
  is_verified: boolean;
  kyc_status: string;
  account_status: string;
  avatar_url?: string;
  username?: string;
  funding_wallet: Record<string, any>;
  trading_wallet: Record<string, any>;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  wallet_address?: string;
  blockchain?: string;
  status: string;
  admin_notes?: string;
  tx_hash?: string;
  processed_date?: string;
  remarks?: string;
  created_at: string;
}

export interface TradingPair {
  id: string;
  symbol: string;
  base_currency: string;
  quote_currency: string;
  current_price: number;
  price_change_24h: number;
  volume_24h: number;
  is_active: boolean;
}

// Wallet Transactions
export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    return [];
  }
}

// User Profile
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Withdrawals
export async function getWithdrawals(): Promise<Withdrawal[]> {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return [];
  }
}

// Get User Role
export async function getUserRole(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    return data?.role || null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

// Trading Pairs
export async function getTradingPairs(): Promise<TradingPair[]> {
  try {
    const { data, error } = await supabase
      .from('trading_pairs')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching trading pairs:', error);
    return [];
  }
}

// Withdrawal Stats
export async function getWithdrawalStats() {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*');
    
    if (error) throw error;
    
    const pending = data.filter(item => item.status === 'pending').length;
    const approved = data.filter(item => item.status === 'approved').length;
    const rejected = data.filter(item => item.status === 'rejected').length;
    const completed = data.filter(item => item.status === 'completed').length;
    
    return {
      pending,
      approved,
      rejected,
      completed,
      total: data.length
    };
  } catch (error) {
    console.error('Error fetching withdrawal stats:', error);
    return {
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      total: 0
    };
  }
}

// Deposit Stats
export async function getDepositStats() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { totalDeposits24h: 0, pendingDeposits: 0, averageTime: "~15 minutes" };

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'deposit');

    if (error) throw error;

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
  } catch (error) {
    console.error('Error fetching deposit stats:', error);
    return {
      totalDeposits24h: 0,
      pendingDeposits: 0,
      averageTime: "~15 minutes"
    };
  }
}

// Recent Deposits
export async function getRecentDeposits() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'deposit')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return (data || []).map(tx => ({
      amount: tx.amount.toString(),
      symbol: tx.currency,
      time: new Date(tx.created_at).toLocaleString(),
      status: tx.status
    }));
  } catch (error) {
    console.error('Error fetching recent deposits:', error);
    return [];
  }
}

// Wallet Balance Summary
export async function getWalletBalanceSummary() {
  try {
    const profile = await getUserProfile();
    if (!profile) return { funding: {}, trading: {}, total: 0 };
    
    return {
      funding: profile.funding_wallet || {},
      trading: profile.trading_wallet || {},
      total: profile.account_balance || 0
    };
  } catch (error) {
    console.error('Error fetching wallet balance summary:', error);
    return {
      funding: {},
      trading: {},
      total: 0
    };
  }
}

// Admin Functions - Get All Users
export async function getAllUsers() {
  try {
    const isAdmin = await checkIfAdmin();
    if (!isAdmin) throw new Error('Unauthorized');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

// Admin Functions - Get All Transactions
export async function getAllTransactions() {
  try {
    const isAdmin = await checkIfAdmin();
    if (!isAdmin) throw new Error('Unauthorized');
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    return [];
  }
}

// Helper - Check if user is admin
async function checkIfAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin';
}
