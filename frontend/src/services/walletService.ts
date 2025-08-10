import { createClient } from '@supabase/supabase-js';

// Get the environment variables or use default values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Ensure we have the required values
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
export interface UserProfile {
    id: string;
    user_id: string;
    email: string;
    full_name?: string;
    account_balance: number;
    is_verified: boolean;
    kyc_status: 'pending' | 'approved' | 'rejected';
    account_status: 'active' | 'suspended' | 'banned';
    avatar_url?: string;
    username?: string;
    funding_wallet?: Record<string, any>;
    trading_wallet?: Record<string, any>;
}

export interface WalletTransaction {
    id: string;
    user_id: string;
    action: 'fund' | 'withdraw' | 'deduct' | 'admin_fund' | 'admin_deduct';
    wallet_type: 'funding' | 'trading';
    amount: number;
    asset: string;
    status: 'completed' | 'pending' | 'failed';
    created_at: string;
}

export interface Withdrawal {
    id: string;
    user_id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    wallet_address?: string;
    blockchain?: string;
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

export interface UserRole {
    role: 'user' | 'admin' | 'manager';
}

// Utility function to check if user is an admin
async function isAdmin(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        
        const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .single();
        
        if (error) return false;
        return !!data;
    } catch (err) {
        console.error('Error checking admin status:', err);
        return false;
    }
}

// Wallet Transactions
export async function getWalletTransactions(options: { limit?: number, offset?: number } = {}): Promise<WalletTransaction[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const isAdminUser = await isAdmin();
        
        let query = supabase
            .from('wallet_transactions')
            .select('*')
            .order('created_at', { ascending: false });
        
        // If not admin, only fetch user's own transactions
        if (!isAdminUser) {
            query = query.eq('user_id', user.id);
        }
        
        // Apply optional limit and offset
        if (options.limit) query = query.limit(options.limit);
        if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        
        const { data, error } = await query;
        if (error) throw error;
        
        return data || [];
    } catch (err) {
        console.error('Error fetching wallet transactions:', err);
        return [];
    }
}

// User Profile
export async function getUserProfile(): Promise<UserProfile | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error fetching user profile:', err);
        return null;
    }
}

// Withdrawals
export async function getWithdrawals(options: { limit?: number, offset?: number } = {}): Promise<Withdrawal[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const isAdminUser = await isAdmin();
        
        let query = supabase
            .from('withdrawals')
            .select('*')
            .order('created_at', { ascending: false });
        
        // If not admin, only fetch user's own withdrawals
        if (!isAdminUser) {
            query = query.eq('user_id', user.id);
        }
        
        // Apply optional limit and offset
        if (options.limit) query = query.limit(options.limit);
        if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        
        const { data, error } = await query;
        if (error) throw error;
        
        return data || [];
    } catch (err) {
        console.error('Error fetching withdrawals:', err);
        return [];
    }
}

// User Role
export async function getUserRole(): Promise<UserRole | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();
        
        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error fetching user role:', err);
        return null;
    }
}

// Trading Pairs
export async function getTradingPairs(): Promise<TradingPair[]> {
    try {
        const { data, error } = await supabase
            .from('trading_pairs')
            .select('*')
            .eq('is_active', true)
            .order('volume_24h', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching trading pairs:', err);
        return [];
    }
}

// Withdrawal Statistics
export async function getWithdrawalStats() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const isAdminUser = await isAdmin();
        
        let query = supabase
            .from('withdrawals')
            .select('*', { count: 'exact' });
        
        // If not admin, only fetch user's own withdrawals
        if (!isAdminUser) {
            query = query.eq('user_id', user.id);
        }
        
        const { count, data, error } = await query;
        if (error) throw error;
        
        // Group by status
        const pendingCount = data?.filter(w => w.status === 'pending').length || 0;
        const approvedCount = data?.filter(w => w.status === 'approved').length || 0;
        const rejectedCount = data?.filter(w => w.status === 'rejected').length || 0;
        const completedCount = data?.filter(w => w.status === 'completed').length || 0;
        
        return {
            totalWithdrawals: count || 0,
            pendingCount,
            approvedCount,
            rejectedCount,
            completedCount
        };
    } catch (err) {
        console.error('Error fetching withdrawal stats:', err);
        return {
            totalWithdrawals: 0,
            pendingCount: 0,
            approvedCount: 0,
            rejectedCount: 0,
            completedCount: 0
        };
    }
}

// Wallet Balance Summary
export async function getWalletBalanceSummary() {
    try {
        const profile = await getUserProfile();
        if (!profile) throw new Error('User profile not found');
        
        return {
            fundingWallet: profile.funding_wallet || {},
            tradingWallet: profile.trading_wallet || {},
            totalBalance: profile.account_balance || 0,
        };
    } catch (err) {
        console.error('Error fetching wallet balance summary:', err);
        return {
            fundingWallet: {},
            tradingWallet: {},
            totalBalance: 0,
        };
    }
}

// Admin Functions
export async function getAllUsers(options: { limit?: number, offset?: number } = {}): Promise<UserProfile[]> {
    try {
        const isAdminUser = await isAdmin();
        if (!isAdminUser) throw new Error('Unauthorized: Admin access required');
        
        let query = supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        // Apply optional limit and offset
        if (options.limit) query = query.limit(options.limit);
        if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        
        const { data, error } = await query;
        if (error) throw error;
        
        return data || [];
    } catch (err) {
        console.error('Error fetching all users:', err);
        return [];
    }
}

// Get All Transactions (Admin)
export async function getAllTransactions(options: { limit?: number, offset?: number } = {}): Promise<any[]> {
    try {
        const isAdminUser = await isAdmin();
        if (!isAdminUser) throw new Error('Unauthorized: Admin access required');
        
        let query = supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false });
        
        // Apply optional limit and offset
        if (options.limit) query = query.limit(options.limit);
        if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        
        const { data, error } = await query;
        if (error) throw error;
        
        return data || [];
    } catch (err) {
        console.error('Error fetching all transactions:', err);
        return [];
    }
}
