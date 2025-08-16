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
