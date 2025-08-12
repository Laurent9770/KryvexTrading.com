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
      .from('withdrawal_requests')
      .select('*')
      .order('requested_at', { ascending: false });
    
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
      .from('withdrawal_requests')
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

// Helper - Log admin actions for audit trail
async function logAdminAction(actionData: {
  admin_id: string;
  action_type: string;
  target_user_id?: string;
  target_table?: string;
  target_id?: string;
  old_values?: any;
  new_values?: any;
  description: string;
  ip_address?: string;
}) {
  try {
    const { error } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: actionData.admin_id,
        action_type: actionData.action_type,
        target_user_id: actionData.target_user_id,
        target_table: actionData.target_table,
        target_id: actionData.target_id,
        old_values: actionData.old_values,
        new_values: actionData.new_values,
        description: actionData.description,
        ip_address: actionData.ip_address || 'admin-panel',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging admin action:', error);
    }
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

// Create Withdrawal Request
export async function createWithdrawalRequest(withdrawalData: {
  amount: number;
  currency: string;
  wallet_address: string;
  blockchain?: string;
  remarks?: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount: withdrawalData.amount,
        currency: withdrawalData.currency,
        status: 'pending',
        remarks: withdrawalData.remarks || '',
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      withdrawal: data,
      message: 'Withdrawal request created successfully'
    };
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return {
      success: false,
      withdrawal: null,
      message: error instanceof Error ? error.message : 'Failed to create withdrawal request'
    };
  }
}

// Get Withdrawal Requests (for current user)
export async function getWithdrawalRequests() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return [];
  }
}

// Get All Withdrawal Requests (admin function)
export async function getAllWithdrawalRequests() {
  try {
    const isAdmin = await checkIfAdmin();
    if (!isAdmin) throw new Error('Unauthorized');
    
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('requested_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all withdrawal requests:', error);
    return [];
  }
}

// Subscribe to Transactions (real-time updates)
export function subscribeToTransactions(callback: (payload: any) => void) {
  try {
    const subscription = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Error subscribing to transactions:', error);
    return () => {};
  }
}

// Subscribe to Withdrawals (real-time updates)
export function subscribeToWithdrawals(callback: (payload: any) => void) {
  try {
    const subscription = supabase
      .channel('withdrawal_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Error subscribing to withdrawals:', error);
    return () => {};
  }
}

// Subscribe to Wallet Transactions (real-time updates)
export function subscribeToWalletTransactions(callback: (payload: any) => void) {
  try {
    const subscription = supabase
      .channel('wallet_transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Error subscribing to wallet transactions:', error);
    return () => {};
  }
}

// Approve Withdrawal (admin function)
export async function approveWithdrawal(withdrawalId: string, adminNotes?: string) {
  try {
    const isAdmin = await checkIfAdmin();
    if (!isAdmin) throw new Error('Unauthorized: Admin access required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Update withdrawal status to approved
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
        remarks: adminNotes || 'Approved by admin'
      })
      .eq('id', withdrawalId)
      .select()
      .single();

    if (error) throw error;

    // Create a wallet transaction record for the approved withdrawal
    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: data.user_id,
        action: 'withdraw',
        wallet_type: 'funding',
        amount: data.amount,
        asset: data.currency,
        status: 'completed',
        remarks: `Withdrawal approved - ${adminNotes || 'No notes'}`,
        admin_email: user.email,
        created_at: new Date().toISOString()
      });

    return {
      success: true,
      withdrawal: data,
      message: 'Withdrawal approved successfully'
    };
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    return {
      success: false,
      withdrawal: null,
      message: error instanceof Error ? error.message : 'Failed to approve withdrawal'
    };
  }
}

// Reject Withdrawal (admin function)
export async function rejectWithdrawal(withdrawalId: string, adminNotes?: string) {
  try {
    const isAdmin = await checkIfAdmin();
    if (!isAdmin) throw new Error('Unauthorized: Admin access required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Update withdrawal status to rejected
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
        remarks: adminNotes || 'Rejected by admin'
      })
      .eq('id', withdrawalId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      withdrawal: data,
      message: 'Withdrawal rejected successfully'
    };
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    return {
      success: false,
      withdrawal: null,
      message: error instanceof Error ? error.message : 'Failed to reject withdrawal'
    };
  }
}

// Complete Withdrawal (admin function)
export async function completeWithdrawal(withdrawalId: string, txHash: string, adminNotes?: string) {
  try {
    const isAdmin = await checkIfAdmin();
    if (!isAdmin) throw new Error('Unauthorized: Admin access required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Update withdrawal status to completed
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        remarks: adminNotes || 'Completed by admin'
      })
      .eq('id', withdrawalId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      withdrawal: data,
      message: 'Withdrawal completed successfully'
    };
  } catch (error) {
    console.error('Error completing withdrawal:', error);
    return {
      success: false,
      withdrawal: null,
      message: error instanceof Error ? error.message : 'Failed to complete withdrawal'
    };
  }
}

// Fund User Wallet (admin function)
export async function fundUserWallet(
  userId: string, 
  username: string, 
  walletType: 'funding' | 'trading', 
  amount: number, 
  currency: string, 
  adminEmail: string, 
  remarks?: string
) {
  try {
    const isAdmin = await checkIfAdmin();
    if (!isAdmin) throw new Error('Unauthorized: Admin access required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Ensure amount is a number
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Invalid amount provided');
    }

    // Check if user wallet exists, if not create it
    const { data: existingWallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('wallet_type', walletType)
      .eq('asset', currency)
      .single();

    let newBalance = numericAmount;
    
    if (existingWallet) {
      // Update existing wallet
      newBalance = existingWallet.balance + numericAmount;
      
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingWallet.id);

      if (updateError) throw updateError;
    } else {
      // Create new wallet entry
      const { error: insertError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          wallet_type: walletType,
          asset: currency,
          balance: numericAmount
        });

      if (insertError) throw insertError;
    }

    // Update user profile account balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_balance')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ 
        account_balance: (profile.account_balance || 0) + numericAmount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (profileUpdateError) throw profileUpdateError;

    // Log admin action for audit trail
    const { error: actionError } = await supabase
      .from('admin_actions')
      .insert({
        admin_email: adminEmail,
        action_type: 'wallet_fund',
        target_user_id: userId,
        details: {
          wallet_type: walletType,
          amount: numericAmount,
          currency: currency,
          new_balance: newBalance,
          remarks: remarks || `Funded by admin (${walletType} wallet)`,
          username: username
        }
      });

    if (actionError) {
      console.warn('Failed to log admin action:', actionError);
      // Don't throw error here as the main operation succeeded
    }

    return {
      success: true,
      newBalance: newBalance,
      message: `Successfully funded ${numericAmount} ${currency} to user's ${walletType} wallet`
    };
  } catch (error) {
    console.error('Error funding user wallet:', error);
    return {
      success: false,
      newBalance: 0,
      message: error instanceof Error ? error.message : 'Failed to fund user wallet'
    };
  }
}

// Deduct From User Wallet (admin function)
export async function deductFromWallet(
  userId: string, 
  username: string, 
  walletType: 'funding' | 'trading', 
  amount: number, 
  currency: string, 
  adminEmail: string, 
  remarks?: string
) {
  try {
    const isAdmin = await checkIfAdmin();
    if (!isAdmin) throw new Error('Unauthorized: Admin access required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Ensure amount is a number
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Invalid amount provided');
    }

    // Check if user wallet exists and has sufficient balance
    const { data: existingWallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('wallet_type', walletType)
      .eq('asset', currency)
      .single();

    if (walletError || !existingWallet) {
      throw new Error(`No ${walletType} wallet found for ${currency}`);
    }

    if (existingWallet.balance < numericAmount) {
      throw new Error(`Insufficient balance in ${walletType} wallet. Current: ${existingWallet.balance} ${currency}, Required: ${numericAmount} ${currency}`);
    }

    const newBalance = existingWallet.balance - numericAmount;
    
    // Update wallet balance
    const { error: updateError } = await supabase
      .from('user_wallets')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingWallet.id);

    if (updateError) throw updateError;

    // Update user profile account balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_balance')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ 
        account_balance: Math.max(0, (profile.account_balance || 0) - numericAmount),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (profileUpdateError) throw profileUpdateError;

    // Log admin action for audit trail
    const { error: actionError } = await supabase
      .from('admin_actions')
      .insert({
        admin_email: adminEmail,
        action_type: 'wallet_deduct',
        target_user_id: userId,
        details: {
          wallet_type: walletType,
          amount: numericAmount,
          currency: currency,
          new_balance: newBalance,
          remarks: remarks || `Deducted by admin (${walletType} wallet)`,
          username: username
        }
      });

    if (actionError) {
      console.warn('Failed to log admin action:', actionError);
      // Don't throw error here as the main operation succeeded
    }

    return {
      success: true,
      newBalance: newBalance,
      message: `Successfully deducted ${numericAmount} ${currency} from user's ${walletType} wallet`
    };
  } catch (error) {
    console.error('Error deducting from user wallet:', error);
    return {
      success: false,
      newBalance: 0,
      message: error instanceof Error ? error.message : 'Failed to deduct from user wallet'
    };
  }
}

// Subscribe to Withdrawal Requests (real-time updates)
export function subscribeToWithdrawalRequests(callback: (payload: any) => void) {
  try {
    const subscription = supabase
      .channel('withdrawal_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Error subscribing to withdrawal requests:', error);
    return () => {};
  }
}

// Subscribe to User Profiles (real-time updates)
export function subscribeToUserProfiles(callback: (payload: any) => void) {
  try {
    const subscription = supabase
      .channel('user_profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Error subscribing to user profiles:', error);
    return () => {};
  }
}
