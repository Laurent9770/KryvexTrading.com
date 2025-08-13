import supabase from '@/lib/supabaseClient';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycLevel: number;
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  lastLogin: string;
  tradingBalance: number;
  totalTrades: number;
  totalVolume: number;
}

export interface AdminTradeSummary {
  userId: string;
  userEmail: string;
  username: string;
  email: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalVolume: number;
  totalProfit: number;
  averageTradeSize: number;
  lastTradeDate: string;
  activeTrades: number;
  totalActive: number;
  lastActivity: string;
}

export interface AdminWalletData {
  userId: string;
  userEmail: string;
  username: string;
  fundingWallet: number;
  tradingWallet: number;
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  lastTransaction: string;
}

export interface AdminWithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  username: string;
  amount: number;
  asset: string;
  blockchain: string;
  walletAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  processedAt?: string;
  remarks?: string;
  txHash?: string;
}

export interface AdminDepositRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  proofFile?: string;
  requestedAt: string;
  processedAt?: string;
  remarks?: string;
  network?: string;
  transactionHash?: string;
  notes?: string;
  createdAt?: string;
  processedBy?: string;
  proofPreview?: string;
}

export interface AdminKYCUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  kycLevel: number;
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  documentsSubmitted: boolean;
  lastUpdated: string;
  submissionCount: number;
}

class SupabaseAdminDataService {
  // Get all users with admin data
  async getAllUsers(): Promise<AdminUser[]> {
    try {
      console.log('🔄 Fetching all users from profiles...');
      
      // Get all profiles data which includes user information
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          email,
          full_name,
          kyc_status,
          account_balance,
          is_verified,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('📊 Raw profiles data:', profiles);
      console.log('📊 Number of profiles found:', profiles?.length || 0);

      // Map the data to AdminUser interface
      const users: AdminUser[] = (profiles || []).map((profile: any) => {
        const [firstName, ...lastNameParts] = (profile.full_name || profile.email || '').split(' ');
        const lastName = lastNameParts.join(' ') || '';
        
        return {
          id: profile.user_id,
          email: profile.email,
          firstName: firstName || '',
          lastName: lastName,
          username: profile.email?.split('@')[0] || '',
          kycStatus: profile.kyc_status || 'pending',
          kycLevel: profile.kyc_status === 'verified' ? 3 : profile.kyc_status === 'pending' ? 1 : 0,
          status: profile.is_verified ? 'active' : 'suspended',
          createdAt: profile.created_at,
          lastLogin: profile.updated_at || profile.created_at,
          tradingBalance: profile.account_balance || 0,
          totalTrades: 0, // Will be calculated separately
          totalVolume: 0  // Will be calculated separately
        };
      });

      console.log('✅ Users loaded successfully:', users.length);
      console.log('📋 First few users:', users.slice(0, 3));
      return users;
    } catch (error) {
      console.error('❌ Error in getAllUsers:', error);
      throw error;
    }
  }

  // Get trade summaries for all users
  async getTradeSummaries(): Promise<AdminTradeSummary[]> {
    try {
      console.log('🔄 Fetching trade summaries...');
      
      const { data, error } = await supabase
        .from('trades')
        .select(`
          user_id,
          status,
          result,
          amount,
          profit_loss,
          created_at,
          profiles!inner(
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching trades:', error);
        throw error;
      }

      // Group trades by user and calculate summaries
      const userTradeMap = new Map<string, AdminTradeSummary>();

      (data || []).forEach((trade: any) => {
        const userId = trade.user_id;
        const userEmail = trade.profiles?.email || '';
        const username = trade.profiles?.full_name || userEmail.split('@')[0];

        if (!userTradeMap.has(userId)) {
          userTradeMap.set(userId, {
            userId,
            userEmail,
            username,
            email: userEmail,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalVolume: 0,
            totalProfit: 0,
            averageTradeSize: 0,
            lastTradeDate: '',
            activeTrades: 0,
            totalActive: 0,
            lastActivity: ''
          });
        }

        const summary = userTradeMap.get(userId)!;
        summary.totalTrades++;
        summary.totalVolume += trade.amount || 0;
        summary.totalProfit += trade.profit_loss || 0;

        if (trade.status === 'completed') {
          if (trade.result === 'win') {
            summary.winningTrades++;
          } else if (trade.result === 'loss') {
            summary.losingTrades++;
          }
        } else if (trade.status === 'pending') {
          summary.activeTrades++;
        }

        if (trade.created_at > summary.lastTradeDate) {
          summary.lastTradeDate = trade.created_at;
          summary.lastActivity = trade.created_at;
        }
      });

      // Calculate averages
      userTradeMap.forEach(summary => {
        summary.averageTradeSize = summary.totalTrades > 0 ? summary.totalVolume / summary.totalTrades : 0;
        summary.totalActive = summary.activeTrades;
      });

      const summaries = Array.from(userTradeMap.values());
      console.log('✅ Trade summaries loaded:', summaries.length);
      return summaries;
    } catch (error) {
      console.error('❌ Error in getTradeSummaries:', error);
      throw error;
    }
  }

  // Get wallet data for all users
  async getWalletData(): Promise<AdminWalletData[]> {
    try {
      console.log('🔄 Fetching wallet data...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          email,
          full_name,
          account_balance
        `);

      if (error) {
        console.error('❌ Error fetching wallet data:', error);
        throw error;
      }

      // Map to AdminWalletData interface
      const walletData: AdminWalletData[] = (data || []).map((profile: any) => ({
        userId: profile.user_id,
        userEmail: profile.email,
        username: profile.full_name || profile.email.split('@')[0],
        fundingWallet: 0, // Not implemented yet
        tradingWallet: profile.account_balance || 0,
        balance: profile.account_balance || 0,
        totalDeposits: 0, // Will be calculated from deposits table
        totalWithdrawals: 0, // Will be calculated from withdrawal_requests table
        pendingWithdrawals: 0, // Will be calculated from withdrawal_requests table
        lastTransaction: profile.updated_at || profile.created_at
      }));

      console.log('✅ Wallet data loaded:', walletData.length);
      return walletData;
    } catch (error) {
      console.error('❌ Error in getWalletData:', error);
      throw error;
    }
  }

  // Get KYC users for verification
  async getKYCUsers(): Promise<AdminKYCUser[]> {
    try {
      console.log('🔄 Fetching KYC users...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          email,
          full_name,
          kyc_status,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching KYC users:', error);
        throw error;
      }

      // Map to AdminKYCUser interface
      const kycUsers: AdminKYCUser[] = (data || []).map((profile: any) => {
        const [firstName, ...lastNameParts] = (profile.full_name || '').split(' ');
        const lastName = lastNameParts.join(' ') || '';
        
        return {
          id: profile.user_id,
          email: profile.email,
          firstName: firstName || '',
          lastName: lastName,
          kycLevel: profile.kyc_status === 'verified' ? 3 : profile.kyc_status === 'pending' ? 1 : 0,
          kycStatus: profile.kyc_status || 'unverified',
          documentsSubmitted: profile.kyc_status !== 'unverified',
          lastUpdated: profile.updated_at || profile.created_at,
          submissionCount: profile.kyc_status === 'pending' ? 1 : 0
        };
      });

      console.log('✅ KYC users loaded:', kycUsers.length);
      return kycUsers;
    } catch (error) {
      console.error('❌ Error in getKYCUsers:', error);
      throw error;
    }
  }

  // Update user KYC status
  async updateKYCStatus(userId: string, status: 'pending' | 'verified' | 'rejected'): Promise<boolean> {
    try {
      console.log(`🔄 Updating KYC status for user ${userId} to ${status}`);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: status,
          is_verified: status === 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error updating KYC status:', error);
        throw error;
      }

      console.log('✅ KYC status updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in updateKYCStatus:', error);
      throw error;
    }
  }

  // Get deposit requests
  async getDepositRequests(): Promise<AdminDepositRequest[]> {
    try {
      console.log('🔄 Fetching deposit requests...');
      
      const { data, error } = await supabase
        .from('deposit_requests')
        .select(`
          id,
          user_id,
          amount,
          currency,
          status,
          proof_file,
          requested_at,
          processed_at,
          remarks
        `)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching deposit requests:', error);
        throw error;
      }

      // Get user emails for the deposits
      const userIds = [...new Set((data || []).map((deposit: any) => deposit.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('⚠️ Error fetching user profiles for deposits:', profilesError);
      }

      const profilesMap = new Map((profiles || []).map((p: any) => [p.user_id, p.email]));

      // Map to AdminDepositRequest interface
      const depositRequests: AdminDepositRequest[] = (data || []).map((deposit: any) => ({
        id: deposit.id,
        userId: deposit.user_id,
        userEmail: profilesMap.get(deposit.user_id) || 'Unknown User',
        amount: deposit.amount,
        currency: deposit.currency || 'USDT',
        status: deposit.status || 'pending',
        proofFile: deposit.proof_file,
        requestedAt: deposit.requested_at,
        processedAt: deposit.processed_at,
        remarks: deposit.remarks,
        network: 'TRC20', // Default network
        transactionHash: deposit.proof_file, // Use proof_file as transaction hash for now
        notes: deposit.remarks,
        createdAt: deposit.requested_at,
        processedBy: deposit.processed_by || undefined,
        proofPreview: deposit.proof_file ? `https://example.com/proof/${deposit.proof_file}` : undefined
      }));

      console.log('✅ Deposit requests loaded:', depositRequests.length);
      return depositRequests;
    } catch (error) {
      console.error('❌ Error in getDepositRequests:', error);
      throw error;
    }
  }

  // Get withdrawal requests
  async getWithdrawalRequests(): Promise<AdminWithdrawalRequest[]> {
    try {
      console.log('🔄 Fetching withdrawal requests...');
      
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          id,
          user_id,
          amount,
          currency,
          status,
          requested_at,
          processed_at,
          remarks
        `)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching withdrawal requests:', error);
        throw error;
      }

      // Get user emails for the withdrawals
      const userIds = [...new Set((data || []).map((withdrawal: any) => withdrawal.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('⚠️ Error fetching user profiles for withdrawals:', profilesError);
      }

      const profilesMap = new Map((profiles || []).map((p: any) => [p.user_id, { email: p.email, full_name: p.full_name }]));

      // Map to AdminWithdrawalRequest interface
      const withdrawalRequests: AdminWithdrawalRequest[] = (data || []).map((withdrawal: any) => {
        const profile = profilesMap.get(withdrawal.user_id) as { email: string; full_name: string } | undefined;
        const username = profile?.full_name || profile?.email?.split('@')[0] || 'Unknown User';
        
        return {
          id: withdrawal.id,
          userId: withdrawal.user_id,
          userEmail: profile?.email || 'Unknown User',
          username: username,
          amount: withdrawal.amount,
          asset: withdrawal.currency || 'USDT',
          blockchain: 'TRC20', // Default blockchain
          walletAddress: 'N/A', // Default wallet address
          status: withdrawal.status || 'pending',
          requestDate: withdrawal.requested_at,
          processedAt: withdrawal.processed_at,
          remarks: withdrawal.remarks,
          txHash: undefined // No tx_hash column in table
        };
      });

      console.log('✅ Withdrawal requests loaded:', withdrawalRequests.length);
      return withdrawalRequests;
    } catch (error) {
      console.error('❌ Error in getWithdrawalRequests:', error);
      throw error;
    }
  }

  // Log admin action
  async logAdminAction(actionType: string, targetTable: string, targetId: string, description: string, oldValues?: any, newValues?: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_actions')
        .insert({
          admin_email: 'admin@kryvex.com', // TODO: Get from auth context
          action_type: actionType,
          target_table: targetTable,
          target_id: targetId,
          description,
          old_values: oldValues,
          new_values: newValues
        });

      if (error) {
        console.error('❌ Error logging admin action:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error in logAdminAction:', error);
      return false;
    }
  }
}

const supabaseAdminDataService = new SupabaseAdminDataService();
export default supabaseAdminDataService; 