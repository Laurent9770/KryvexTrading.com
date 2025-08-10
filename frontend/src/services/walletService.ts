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
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount: withdrawalData.amount,
        currency: withdrawalData.currency,
        wallet_address: withdrawalData.wallet_address,
        blockchain: withdrawalData.blockchain || 'ETH',
        status: 'pending',
        remarks: withdrawalData.remarks || '',
        created_at: new Date().toISOString()
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
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
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
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });
    
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
      .channel('withdrawals')
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
      .from('withdrawals')
      .update({
        status: 'approved',
        processed_by: user.id,
        processed_date: new Date().toISOString(),
        admin_notes: adminNotes || 'Approved by admin'
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
      .from('withdrawals')
      .update({
        status: 'rejected',
        processed_by: user.id,
        processed_date: new Date().toISOString(),
        admin_notes: adminNotes || 'Rejected by admin'
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
      .from('withdrawals')
      .update({
        status: 'completed',
        processed_by: user.id,
        processed_date: new Date().toISOString(),
        tx_hash: txHash,
        admin_notes: adminNotes || 'Completed by admin'
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
export async function fundUserWallet(userId: string, amount: number, currency: string, remarks?: string) {
  try {
    const isAdmin = await checkIfAdmin();
    if (!isAdmin) throw new Error('Unauthorized: Admin access required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get current user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    // Update funding wallet balance
    const currentFundingWallet = profile.funding_wallet || {};
    const currentBalance = currentFundingWallet[currency] || 0;
    const newBalance = currentBalance + amount;

    const updatedFundingWallet = {
      ...currentFundingWallet,
      [currency]: newBalance
    };

    // Update profile with new balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        funding_wallet: updatedFundingWallet,
        account_balance: profile.account_balance + amount
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Create wallet transaction record
    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        action: 'admin_fund',
        wallet_type: 'funding',
        amount: amount,
        asset: currency,
        status: 'completed',
        remarks: remarks || 'Funded by admin',
        admin_email: user.email,
        balance: newBalance,
        created_at: new Date().toISOString()
      });

    if (transactionError) throw transactionError;

    return {
      success: true,
      newBalance: newBalance,
      message: `Successfully funded ${amount} ${currency} to user wallet`
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
export async function deductFromWallet(userId: string, amount: number, currency: string, remarks?: string) {
  try {
    const isAdmin = await checkIfAdmin();
    if (!isAdmin) throw new Error('Unauthorized: Admin access required');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get current user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    // Check if user has sufficient balance
    const currentFundingWallet = profile.funding_wallet || {};
    const currentBalance = currentFundingWallet[currency] || 0;

    if (currentBalance < amount) {
      throw new Error(`Insufficient balance. Current: ${currentBalance} ${currency}, Required: ${amount} ${currency}`);
    }

    const newBalance = currentBalance - amount;

    const updatedFundingWallet = {
      ...currentFundingWallet,
      [currency]: newBalance
    };

    // Update profile with new balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        funding_wallet: updatedFundingWallet,
        account_balance: profile.account_balance - amount
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Create wallet transaction record
    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        action: 'admin_deduct',
        wallet_type: 'funding',
        amount: amount,
        asset: currency,
        status: 'completed',
        remarks: remarks || 'Deducted by admin',
        admin_email: user.email,
        balance: newBalance,
        created_at: new Date().toISOString()
      });

    if (transactionError) throw transactionError;

    return {
      success: true,
      newBalance: newBalance,
      message: `Successfully deducted ${amount} ${currency} from user wallet`
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
