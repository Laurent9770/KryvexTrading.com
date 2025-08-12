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
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  remarks?: string;
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
      console.log('🔄 Fetching all users from profiles table...');
      
      const { data, error } = await supabase
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

      if (error) {
        console.error('❌ Error fetching users:', error);
        return [];
      }

      console.log('✅ Successfully fetched users:', data?.length || 0);

      return data.map(user => {
        // Determine KYC status based on available columns
        let kycStatus = 'pending';
        if (user.kyc_status === 'approved') {
          kycStatus = 'verified';
        } else if (user.kyc_status === 'rejected') {
          kycStatus = 'rejected';
        }
        
        // Split full_name into first and last name
        const nameParts = (user.full_name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
          id: user.user_id,
          email: user.email || 'No email',
          firstName: firstName,
          lastName: lastName,
          username: user.email?.split('@')[0] || 'unknown',
          kycStatus: kycStatus as 'pending' | 'verified' | 'rejected',
          kycLevel: user.kyc_status === 'approved' ? 2 : user.kyc_status === 'pending' ? 1 : 0,
          status: 'active' as 'active' | 'suspended' | 'banned',
          createdAt: user.created_at,
          lastLogin: user.updated_at || user.created_at,
          tradingBalance: user.account_balance || 0,
          totalTrades: 0, // Will be calculated separately
          totalVolume: 0  // Will be calculated separately
        };
      });
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      return [];
    }
  }

  // Get trade summaries for all users
  async getTradeSummaries(): Promise<AdminTradeSummary[]> {
    try {
      console.log('🔄 Fetching trade summaries...');
      
      // First get all users to map user IDs to emails
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .not('user_id', 'is', null);

      if (usersError) {
        console.error('❌ Error fetching users for trade mapping:', usersError);
        return [];
      }

      // Create a map of user_id to email
      const userEmailMap = new Map<string, string>();
      users.forEach(user => {
        userEmailMap.set(user.user_id, user.email || 'unknown@email.com');
      });

      // Get trades from trades table (which exists)
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select(`
          user_id,
          status,
          result,
          amount,
          profit_loss,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (tradesError) {
        console.error('❌ Error fetching trades:', tradesError);
        return [];
      }

      console.log('✅ Successfully fetched trades:', trades?.length || 0);

      // Group trades by user and calculate summaries
      const userTradeMap = new Map<string, AdminTradeSummary>();
      
      trades.forEach(trade => {
        const userId = trade.user_id;
        const userEmail = userEmailMap.get(userId) || 'unknown@email.com';
        
        if (!userTradeMap.has(userId)) {
          userTradeMap.set(userId, {
            userId,
            userEmail,
            username: userEmail.split('@')[0],
            email: userEmail,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalVolume: 0,
            totalProfit: 0,
            averageTradeSize: 0,
            lastTradeDate: trade.created_at,
            activeTrades: 0,
            totalActive: 0,
            lastActivity: trade.created_at
          });
        }

        const summary = userTradeMap.get(userId)!;
        summary.totalTrades++;
        summary.totalVolume += trade.amount || 0;
        summary.totalProfit += trade.profit_loss || 0;
        summary.lastTradeDate = trade.created_at;

        if (trade.result === 'win') {
          summary.winningTrades++;
        } else if (trade.result === 'loss') {
          summary.losingTrades++;
        }

        if (trade.status === 'pending') {
          summary.activeTrades++;
        }
      });

      // Calculate averages
      userTradeMap.forEach(summary => {
        summary.averageTradeSize = summary.totalTrades > 0 ? summary.totalVolume / summary.totalTrades : 0;
        summary.totalActive = summary.totalTrades;
      });

      return Array.from(userTradeMap.values());
    } catch (error) {
      console.error('❌ Error getting trade summaries:', error);
      return [];
    }
  }

  // Get wallet data for all users
  async getWalletData(): Promise<AdminWalletData[]> {
    try {
      console.log('🔄 Fetching wallet data...');
      
      // Since we don't have a user_wallets table, we'll use the profiles table for wallet data
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          account_balance,
          created_at,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching wallet data:', error);
        return [];
      }

      console.log('✅ Successfully fetched wallet data:', data?.length || 0);

      // Get user emails for mapping
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .not('user_id', 'is', null);

      if (usersError) {
        console.error('❌ Error fetching users for wallet mapping:', usersError);
        return [];
      }

      const userEmailMap = new Map<string, string>();
      users.forEach(user => {
        userEmailMap.set(user.user_id, user.email || 'unknown@email.com');
      });

      return data.map(profile => {
        const userEmail = userEmailMap.get(profile.user_id) || 'unknown@email.com';
        
        // Use account_balance from profiles table
        const balance = parseFloat(profile.account_balance) || 0;

        return {
          userId: profile.user_id,
          userEmail,
          username: userEmail.split('@')[0],
          fundingWallet: balance,
          tradingWallet: 0, // Not available in current schema
          balance: balance,
          totalDeposits: 0, // Will be calculated from activity feed
          totalWithdrawals: 0, // Will be calculated from activity feed
          pendingWithdrawals: 0, // Will be calculated from withdrawal requests
          lastTransaction: profile.updated_at || profile.created_at
        };
      });
    } catch (error) {
      console.error('❌ Error getting wallet data:', error);
      return [];
    }
  }

  // Get withdrawal requests
  async getWithdrawalRequests(): Promise<AdminWithdrawalRequest[]> {
    try {
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
          remarks,
          profiles!inner(email)
        `)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching withdrawal requests:', error);
        return [];
      }

      return data.map(request => ({
        id: request.id,
        userId: request.user_id,
        userEmail: request.profiles?.[0]?.email || 'unknown@email.com',
        amount: request.amount,
        currency: request.currency,
        status: request.status,
        requestedAt: request.requested_at,
        processedAt: request.processed_at,
        remarks: request.remarks
      }));
    } catch (error) {
      console.error('Error getting withdrawal requests:', error);
      return [];
    }
  }

  // Get deposit requests
  async getDepositRequests(): Promise<AdminDepositRequest[]> {
    try {
      const { data, error } = await supabase
        .from('deposits')
        .select(`
          id,
          user_id,
          amount,
          currency,
          status,
          proof_file,
          created_at,
          processed_at,
          remarks,
          profiles!inner(email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deposit requests:', error);
        return [];
      }

      return data.map(deposit => ({
        id: deposit.id,
        userId: deposit.user_id,
        userEmail: deposit.profiles?.[0]?.email || 'unknown@email.com',
        amount: deposit.amount,
        currency: deposit.currency,
        status: deposit.status,
        proofFile: deposit.proof_file,
        requestedAt: deposit.created_at,
        processedAt: deposit.processed_at,
        remarks: deposit.remarks
      }));
    } catch (error) {
      console.error('Error getting deposit requests:', error);
      return [];
    }
  }

  // Get KYC users
  async getKYCUsers(): Promise<AdminKYCUser[]> {
    try {
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
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching KYC users:', error);
        return [];
      }

      // Get submission counts from kyc_documents table
      const { data: submissions, error: submissionError } = await supabase
        .from('kyc_documents')
        .select('user_id')
        .eq('status', 'pending');

      const submissionCounts = new Map<string, number>();
      if (!submissionError && submissions) {
        submissions.forEach(submission => {
          const count = submissionCounts.get(submission.user_id) || 0;
          submissionCounts.set(submission.user_id, count + 1);
        });
      }

      return data.map(user => {
        // Split full_name into first and last name
        const nameParts = (user.full_name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Determine KYC level based on status
        const kycLevel = user.kyc_status === 'approved' ? 2 : 
                        user.kyc_status === 'pending' ? 1 : 0;
        
        return {
          id: user.user_id,
          email: user.email,
          firstName,
          lastName,
          kycLevel,
          kycStatus: user.kyc_status || 'unverified',
          documentsSubmitted: submissionCounts.get(user.user_id) > 0,
          lastUpdated: user.updated_at,
          submissionCount: submissionCounts.get(user.user_id) || 0
        };
      });
    } catch (error) {
      console.error('Error getting KYC users:', error);
      return [];
    }
  }

  // Export user data to CSV
  exportUserData(): string {
    // This would be implemented to export user data to CSV format
    // For now, return a placeholder
    return 'User data export functionality to be implemented';
  }
}

const supabaseAdminDataService = new SupabaseAdminDataService();
export default supabaseAdminDataService; 