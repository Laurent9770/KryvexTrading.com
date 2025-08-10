import { supabase } from '@/integrations/supabase/client';

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

class SupabaseWalletService {
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  // Withdrawal Requests
  async getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching withdrawal requests:', error);
        return [];
      }

      return data.map(request => ({
        id: request.id,
        userId: request.user_id,
        username: request.username,
        userEmail: request.user_email,
        amount: request.amount,
        asset: request.asset,
        blockchain: request.blockchain,
        walletAddress: request.wallet_address,
        status: request.status,
        requestDate: request.created_at,
        processedDate: request.processed_at,
        processedBy: request.processed_by,
        txHash: request.tx_hash,
        remarks: request.remarks
      }));
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      return [];
    }
  }

  async getWithdrawalRequestsByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<WithdrawalRequest[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching withdrawal requests by status:', error);
        return [];
      }

      return data.map(request => ({
        id: request.id,
        userId: request.user_id,
        username: request.username,
        userEmail: request.user_email,
        amount: request.amount,
        asset: request.asset,
        blockchain: request.blockchain,
        walletAddress: request.wallet_address,
        status: request.status,
        requestDate: request.created_at,
        processedDate: request.processed_at,
        processedBy: request.processed_by,
        txHash: request.tx_hash,
        remarks: request.remarks
      }));
    } catch (error) {
      console.error('Error fetching withdrawal requests by status:', error);
      return [];
    }
  }

  async createWithdrawalRequest(
    userId: string,
    username: string,
    userEmail: string,
    amount: number,
    asset: string,
    blockchain: string,
    walletAddress: string,
    remarks?: string
  ): Promise<WithdrawalRequest> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: userId,
          username: username,
          user_email: userEmail,
          amount: amount,
          asset: asset,
          blockchain: blockchain,
          wallet_address: walletAddress,
          status: 'pending',
          remarks: remarks
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        username: data.username,
        userEmail: data.user_email,
        amount: data.amount,
        asset: data.asset,
        blockchain: data.blockchain,
        walletAddress: data.wallet_address,
        status: data.status,
        requestDate: data.created_at,
        processedDate: data.processed_at,
        processedBy: data.processed_by,
        txHash: data.tx_hash,
        remarks: data.remarks
      };
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      throw error;
    }
  }

  async approveWithdrawal(requestId: string, adminId: string, txHash?: string): Promise<WithdrawalRequest | null> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: adminId,
          tx_hash: txHash
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        username: data.username,
        userEmail: data.user_email,
        amount: data.amount,
        asset: data.asset,
        blockchain: data.blockchain,
        walletAddress: data.wallet_address,
        status: data.status,
        requestDate: data.created_at,
        processedDate: data.processed_at,
        processedBy: data.processed_by,
        txHash: data.tx_hash,
        remarks: data.remarks
      };
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      return null;
    }
  }

  async rejectWithdrawal(requestId: string, adminId: string, remarks?: string): Promise<WithdrawalRequest | null> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: adminId,
          remarks: remarks
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        username: data.username,
        userEmail: data.user_email,
        amount: data.amount,
        asset: data.asset,
        blockchain: data.blockchain,
        walletAddress: data.wallet_address,
        status: data.status,
        requestDate: data.created_at,
        processedDate: data.processed_at,
        processedBy: data.processed_by,
        txHash: data.tx_hash,
        remarks: data.remarks
      };
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      return null;
    }
  }

  // Wallet Transactions
  async getWalletTransactions(): Promise<WalletTransaction[]> {
    try {
      console.log('Fetching wallet transactions...');
      
      // First, verify the table exists and is accessible
      const { data: tableCheck, error: tableError } = await supabase
        .from('transactions')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('Table access error:', tableError);
        console.error('Error details:', tableError.details);
        console.error('Error hint:', tableError.hint);
        return [];
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching wallet transactions:', error);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        return [];
      }

      if (!data) {
        console.warn('No data returned from wallet transactions query');
        return [];
      }

      console.log(`Successfully fetched ${data.length} wallet transactions`);

      return data.map(transaction => ({
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

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching user wallet transactions:', error);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        return [];
      }

      if (!data) {
        console.warn(`No data returned for user ${userId}`);
        return [];
      }

      console.log(`Successfully fetched ${data.length} transactions for user ${userId}`);

      return data.map(transaction => ({
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

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user wallet:', error);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        return null;
      }

      if (!data) {
        console.warn(`No profile data found for user ${userId}`);
        return null;
      }

      console.log(`Successfully fetched wallet for user ${userId}`);

      return {
        userId: data.id,
        username: data.username || data.full_name || '',
        email: data.email,
        fundingWallet: data.funding_wallet || {},
        tradingWallet: data.trading_wallet || {},
        lastUpdated: data.updated_at
      };
    } catch (error) {
      console.error('Exception in getUserWallet:', error);
      return null;
    }
  }

  async getAllUserWallets(): Promise<UserWallet[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all user wallets:', error);
        return [];
      }

      return data.map(profile => ({
        userId: profile.id,
        username: profile.username || '',
        email: profile.email,
        fundingWallet: profile.funding_wallet || {},
        tradingWallet: profile.trading_wallet || {},
        lastUpdated: profile.updated_at
      }));
    } catch (error) {
      console.error('Error fetching all user wallets:', error);
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
      // Get current wallet
      const userWallet = await this.getUserWallet(userId);
      if (!userWallet) {
        throw new Error('User wallet not found');
      }

      // Update wallet balance
      const walletKey = walletType === 'funding' ? 'funding_wallet' : 'trading_wallet';
      const currentBalance = userWallet[walletType === 'funding' ? 'fundingWallet' : 'tradingWallet'][asset] || 0;
      const newBalance = currentBalance + amount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          [walletKey]: {
            ...userWallet[walletType === 'funding' ? 'fundingWallet' : 'tradingWallet'],
            [asset]: newBalance
          }
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Log transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          username: username,
          action: 'admin_fund',
          wallet_type: walletType,
          amount: amount,
          asset: asset,
          performed_by: adminEmail,
          remarks: remarks,
          status: 'completed',
          balance: newBalance,
          admin_email: adminEmail
        });

      if (transactionError) {
        console.error('Error logging transaction:', transactionError);
      }

      return true;
    } catch (error) {
      console.error('Error funding user wallet:', error);
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
      // Get current wallet
      const userWallet = await this.getUserWallet(userId);
      if (!userWallet) {
        throw new Error('User wallet not found');
      }

      // Check if sufficient balance
      const currentBalance = userWallet[walletType === 'funding' ? 'fundingWallet' : 'tradingWallet'][asset] || 0;
      if (currentBalance < amount) {
        throw new Error('Insufficient balance');
      }

      const newBalance = currentBalance - amount;

      // Update wallet balance
      const walletKey = walletType === 'funding' ? 'funding_wallet' : 'trading_wallet';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          [walletKey]: {
            ...userWallet[walletType === 'funding' ? 'fundingWallet' : 'tradingWallet'],
            [asset]: newBalance
          }
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Log transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          username: username,
          action: 'admin_deduct',
          wallet_type: walletType,
          amount: amount,
          asset: asset,
          performed_by: adminEmail,
          remarks: remarks,
          status: 'completed',
          balance: newBalance,
          admin_email: adminEmail
        });

      if (transactionError) {
        console.error('Error logging transaction:', transactionError);
      }

      return true;
    } catch (error) {
      console.error('Error deducting from user wallet:', error);
      return false;
    }
  }

  // Statistics
  async getDepositStats(userId?: string) {
    try {
      // This would need to be implemented based on your deposit tracking system
      // For now, return mock data
      return {
        totalDeposits24h: 0,
        pendingDeposits: 0,
        averageTime: '0 minutes'
      };
    } catch (error) {
      console.error('Error calculating deposit stats:', error);
      return {
        totalDeposits24h: 0,
        pendingDeposits: 0,
        averageTime: '0 minutes'
      };
    }
  }

  async getRecentDeposits(userId?: string) {
    try {
      // This would need to be implemented based on your deposit tracking system
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching recent deposits:', error);
      return [];
    }
  }

  async getWithdrawalStats() {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('status, amount, created_at');

      if (error) {
        console.error('Error fetching withdrawal stats:', error);
        return {
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          rejectedRequests: 0,
          totalAmount: 0
        };
      }

      const stats = {
        totalRequests: data.length,
        pendingRequests: data.filter(r => r.status === 'pending').length,
        approvedRequests: data.filter(r => r.status === 'approved').length,
        rejectedRequests: data.filter(r => r.status === 'rejected').length,
        totalAmount: data.reduce((sum, r) => sum + (r.amount || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('Error calculating withdrawal stats:', error);
      return {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        totalAmount: 0
      };
    }
  }

  // Real-time subscriptions
  subscribeToWithdrawalRequests(callback: (request: any) => void) {
    const subscription = supabase
      .channel('withdrawal_requests')
      .on('postgres_changes', 
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

    return subscription;
  }

  subscribeToTransactions(callback: (transaction: any) => void) {
    const subscription = supabase
      .channel('transactions')
      .on('postgres_changes', 
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

    return subscription;
  }

  // Cleanup
  cleanup() {
    supabase.removeAllChannels();
  }
}

const supabaseWalletService = new SupabaseWalletService();
export default supabaseWalletService; 