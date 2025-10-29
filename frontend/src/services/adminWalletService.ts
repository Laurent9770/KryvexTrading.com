import { supabase } from '@/lib/supabaseClient';

// =============================================
// ADMIN WALLET SERVICE - SIMULATION MONEY
// =============================================

export interface AdminBalanceAdjustment {
  userId: string;
  wallet: 'funding' | 'trading';
  asset: string;
  delta: number;
  reason?: string;
}

export interface AdminBalanceResult {
  user_id: string;
  wallet: string;
  asset: string;
  new_balance: number;
  simulation: boolean;
}

/**
 * Admin service to adjust user wallet balances (simulation money only)
 * Uses the single RPC admin_adjust_balance for all operations
 */
export async function adminAdjustBalance(
  userId: string, 
  wallet: 'funding' | 'trading', 
  asset: string, 
  delta: number, 
  reason = 'simulation adjustment'
): Promise<AdminBalanceResult> {
  const { data, error } = await supabase.rpc('admin_adjust_balance', {
    target_user: userId,
    wallet,
    asset_code: asset,
    delta,
    reason
  });

  if (error) {
    console.error('❌ Admin balance adjustment failed:', error);
    throw new Error(`Failed to adjust balance: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from admin balance adjustment');
  }

  console.log('✅ Admin balance adjustment successful:', data);
  return data;
}

/**
 * Credit user wallet (add simulation money)
 */
export async function adminCreditBalance(
  userId: string,
  wallet: 'funding' | 'trading',
  asset: string,
  amount: number,
  reason = 'simulation credit'
): Promise<AdminBalanceResult> {
  return adminAdjustBalance(userId, wallet, asset, amount, reason);
}

/**
 * Debit user wallet (remove simulation money)
 */
export async function adminDebitBalance(
  userId: string,
  wallet: 'funding' | 'trading',
  asset: string,
  amount: number,
  reason = 'simulation debit'
): Promise<AdminBalanceResult> {
  return adminAdjustBalance(userId, wallet, asset, -amount, reason);
}

/**
 * Get user wallet summary for admin view
 */
export async function getUserWalletSummary(userId: string) {
  const { data: wallets, error: walletError } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', userId);

  if (walletError) {
    console.error('❌ Failed to fetch user wallets:', walletError);
    throw new Error(`Failed to fetch user wallets: ${walletError.message}`);
  }

  const { data: transactions, error: txError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (txError) {
    console.error('❌ Failed to fetch user transactions:', txError);
    throw new Error(`Failed to fetch user transactions: ${txError.message}`);
  }

  return {
    wallets: wallets || [],
    transactions: transactions || []
  };
}

/**
 * Subscribe to real-time wallet updates
 */
export function subscribeToWalletUpdates(userId: string, onUpdate: () => void) {
  const channel = supabase
    .channel(`wallet_updates_${userId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'user_wallets', 
        filter: `user_id=eq.${userId}` 
      }, 
      () => {
        console.log('💰 Wallet balance updated, refreshing...');
        onUpdate();
      }
    )
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'wallet_transactions', 
        filter: `user_id=eq.${userId}` 
      }, 
      () => {
        console.log('💰 New transaction detected, refreshing...');
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get admin actions audit log
 */
export async function getAdminActions(limit = 100) {
  const { data, error } = await supabase
    .from('admin_actions')
    .select(`
      *,
      admin:admin_id(email),
      target_user:target_user(email)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ Failed to fetch admin actions:', error);
    throw new Error(`Failed to fetch admin actions: ${error.message}`);
  }

  return data || [];
}

// =============================================
// Backwards-compat adminWalletService API (used by UI components)
// Provides a simple default-exported facade that the UI expects.
// Where possible, these methods can be wired to real RPCs later.
// =============================================

// Types expected by components
export interface AdminWalletTransactionParams {
  target_user_email: string;
  amount: number;
  currency: string;
  wallet_type: 'funding' | 'trading';
  description?: string;
  admin_notes?: string;
}

export interface UserWalletBalance {
  email: string;
  full_name?: string | null;
  account_balance: number;
  total_balance_usd: number;
  last_updated: string;
  wallets: Array<{
    wallet_type: 'funding' | 'trading';
    asset: string;
    balance: number;
  }>;
}

export interface UserTransactionHistory {
  transactions: Array<{
    id: string;
    description: string;
    transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'adjustment';
    amount: number;
    currency: string;
    created_at: string;
  }>;
}

// Minimal facade implementation with safe defaults so builds do not fail.
// These can be replaced with real implementations as needed.
const adminWalletService = {
  async getSystemStats(): Promise<{ totalUsers: number; totalBalance: number; recentTransactions: any[]; lastUpdated: string; }> {
    return {
      totalUsers: 0,
      totalBalance: 0,
      recentTransactions: [],
      lastUpdated: new Date().toISOString(),
    };
  },

  async sendMoneyToUser(params: AdminWalletTransactionParams): Promise<{ target_user_email: string; amount: number; currency: string; }> {
    // Placeholder: integrate with RPC or service layer when available
    console.log('Admin sendMoneyToUser (simulation):', params);
    return {
      target_user_email: params.target_user_email,
      amount: params.amount,
      currency: params.currency,
    };
  },

  async deductMoneyFromUser(params: AdminWalletTransactionParams): Promise<{ target_user_email: string; amount: number; currency: string; }> {
    console.log('Admin deductMoneyFromUser (simulation):', params);
    return {
      target_user_email: params.target_user_email,
      amount: params.amount,
      currency: params.currency,
    };
  },

  async getUserWalletBalance(email: string): Promise<UserWalletBalance> {
    return {
      email,
      full_name: null,
      account_balance: 0,
      total_balance_usd: 0,
      last_updated: new Date().toISOString(),
      wallets: [],
    };
  },

  async getUserTransactionHistory(email: string, limit = 10, offset = 0): Promise<UserTransactionHistory> {
    void email; void limit; void offset;
    return {
      transactions: [],
    };
  },
};

export default adminWalletService;