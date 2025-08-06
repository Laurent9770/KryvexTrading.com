import { supabase } from '@/integrations/supabase/client'

interface AdminUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  username?: string
  kycStatus: 'pending' | 'verified' | 'rejected'
  accountStatus: 'active' | 'suspended' | 'banned'
  walletBalance: number
  tradingBalance: number
  totalTrades: number
  winRate: number
  totalProfit: number
  lastLogin?: string
  createdAt: string
  isVerified: boolean
  forceMode?: 'win' | 'lose' | null
}

interface KYCSubmission {
  id: string
  userId: string
  level: number
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  rejectionReason?: string
  documents?: any
  personalInfo?: {
    fullName: string
    dateOfBirth: string
    nationalId: string
    address?: string
    city?: string
    country: string
  }
}

interface Deposit {
  id: string
  userId: string
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  processedAt?: string
  user: {
    fullName: string
    email: string
  }
}

interface Withdrawal {
  id: string
  userId: string
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  processedAt?: string
  user: {
    fullName: string
    email: string
  }
}

interface WalletBalance {
  userId: string
  asset: string
  balance: number
  user: {
    fullName: string
    email: string
  }
}

interface AdminFundAction {
  id: string
  adminId: string
  userId: string
  asset: string
  amount: number
  actionType: 'add' | 'remove'
  reason?: string
  createdAt: string
  admin: {
    fullName: string
    email: string
  }
  user: {
    fullName: string
    email: string
  }
}

interface AuditLog {
  id: string
  adminId: string
  actionType: string
  targetUserId?: string
  details: any
  ipAddress?: string
  createdAt: string
  admin: {
    fullName: string
    email: string
  }
  targetUser?: {
    fullName: string
    email: string
  }
}

interface SystemStats {
  totalUsers: number
  verifiedUsers: number
  pendingKyc: number
  pendingDeposits: number
  pendingWithdrawals: number
  pendingTrades: number
  totalUsdtBalance: number
  totalBtcBalance: number
  totalEthBalance: number
}

class SupabaseAdminService {
  private isAuthenticated: boolean = false
  private adminToken: string | null = null

  // Admin authentication
  async login(email: string, password: string): Promise<any> {
    try {
      // For now, use a simple admin check
      // In production, implement proper admin authentication
      if (email === 'admin@kryvex.com' && password === 'admin123') {
        this.isAuthenticated = true
        this.adminToken = 'admin-token-' + Date.now()
        return { success: true, token: this.adminToken }
      } else {
        throw new Error('Invalid admin credentials')
      }
    } catch (error) {
      console.error('Admin login error:', error)
      throw error
    }
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated && !!this.adminToken
  }

  logout(): void {
    this.isAuthenticated = false
    this.adminToken = null
  }

  // User management
  async getAllUsers(): Promise<AdminUser[]> {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role),
          trades (count),
          transactions (count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return users?.map(user => ({
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        kycStatus: user.kyc_status || 'pending',
        accountStatus: user.account_status || 'active',
        walletBalance: user.account_balance || 0,
        tradingBalance: user.trading_balance || 0,
        totalTrades: user.trades?.[0]?.count || 0,
        winRate: 0, // Calculate from trades
        totalProfit: 0, // Calculate from trades
        lastLogin: user.last_login,
        createdAt: user.created_at,
        isVerified: user.is_verified || false,
        forceMode: null
      })) || []
    } catch (error) {
      console.error('Get all users error:', error)
      throw error
    }
  }

  async getUserDetails(userId: string): Promise<AdminUser> {
    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role),
          trades (count),
          transactions (count)
        `)
        .eq('user_id', userId)
        .single()

      if (error) throw error

      return {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        kycStatus: user.kyc_status || 'pending',
        accountStatus: user.account_status || 'active',
        walletBalance: user.account_balance || 0,
        tradingBalance: user.trading_balance || 0,
        totalTrades: user.trades?.[0]?.count || 0,
        winRate: 0,
        totalProfit: 0,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        isVerified: user.is_verified || false,
        forceMode: null
      }
    } catch (error) {
      console.error('Get user details error:', error)
      throw error
    }
  }

  async addFundsToUser(userId: string, asset: string, amount: number, reason?: string): Promise<any> {
    try {
      // Get current balance
      const { data: profile, error: getError } = await supabase
        .from('profiles')
        .select('account_balance')
        .eq('user_id', userId)
        .single()

      if (getError) throw getError

      const newBalance = (profile.account_balance || 0) + amount

      // Update balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ account_balance: newBalance })
        .eq('user_id', userId)

      if (updateError) throw updateError

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'credit',
          amount: amount,
          status: 'completed',
          description: `Admin adjustment: ${reason || 'Fund addition'}`,
          created_at: new Date().toISOString()
        })

      if (transactionError) throw transactionError

      return { success: true, newBalance }
    } catch (error) {
      console.error('Add funds error:', error)
      throw error
    }
  }

  async removeFundsFromUser(userId: string, asset: string, amount: number, reason?: string): Promise<any> {
    try {
      // Get current balance
      const { data: profile, error: getError } = await supabase
        .from('profiles')
        .select('account_balance')
        .eq('user_id', userId)
        .single()

      if (getError) throw getError

      const newBalance = Math.max(0, (profile.account_balance || 0) - amount)

      // Update balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ account_balance: newBalance })
        .eq('user_id', userId)

      if (updateError) throw updateError

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'debit',
          amount: amount,
          status: 'completed',
          description: `Admin adjustment: ${reason || 'Fund removal'}`,
          created_at: new Date().toISOString()
        })

      if (transactionError) throw transactionError

      return { success: true, newBalance }
    } catch (error) {
      console.error('Remove funds error:', error)
      throw error
    }
  }

  // KYC management
  async getAllKYCSubmissions(): Promise<KYCSubmission[]> {
    try {
      const { data: documents, error } = await supabase
        .from('kyc_documents')
        .select(`
          *,
          profiles (email, full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return documents?.map(doc => ({
        id: doc.id,
        userId: doc.user_id,
        level: 1, // Default level
        status: doc.status,
        submittedAt: doc.created_at,
        reviewedAt: doc.reviewed_at,
        rejectionReason: doc.admin_notes,
        documents: doc.documents,
        personalInfo: doc.personal_info
      })) || []
    } catch (error) {
      console.error('Get KYC submissions error:', error)
      throw error
    }
  }

  async approveKYC(submissionId: string, reason?: string): Promise<any> {
    try {
      const { data: document, error: getError } = await supabase
        .from('kyc_documents')
        .select('user_id')
        .eq('id', submissionId)
        .single()

      if (getError) throw getError

      // Update KYC document status
      const { error: updateError } = await supabase
        .from('kyc_documents')
        .update({
          status: 'approved',
          admin_notes: reason,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (updateError) throw updateError

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          kyc_status: 'approved',
          is_verified: true
        })
        .eq('user_id', document.user_id)

      if (profileError) throw profileError

      return { success: true }
    } catch (error) {
      console.error('Approve KYC error:', error)
      throw error
    }
  }

  async rejectKYC(submissionId: string, reason: string): Promise<any> {
    try {
      const { data: document, error: getError } = await supabase
        .from('kyc_documents')
        .select('user_id')
        .eq('id', submissionId)
        .single()

      if (getError) throw getError

      // Update KYC document status
      const { error: updateError } = await supabase
        .from('kyc_documents')
        .update({
          status: 'rejected',
          admin_notes: reason,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (updateError) throw updateError

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          kyc_status: 'rejected',
          is_verified: false
        })
        .eq('user_id', document.user_id)

      if (profileError) throw profileError

      return { success: true }
    } catch (error) {
      console.error('Reject KYC error:', error)
      throw error
    }
  }

  // Deposit management
  async getAllDeposits(): Promise<Deposit[]> {
    try {
      const { data: deposits, error } = await supabase
        .from('deposits')
        .select(`
          *,
          profiles (email, full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return deposits?.map(deposit => ({
        id: deposit.id,
        userId: deposit.user_id,
        amount: deposit.amount,
        currency: deposit.currency,
        status: deposit.status,
        createdAt: deposit.created_at,
        processedAt: deposit.processed_at,
        user: {
          fullName: deposit.profiles?.full_name || '',
          email: deposit.profiles?.email || ''
        }
      })) || []
    } catch (error) {
      console.error('Get deposits error:', error)
      throw error
    }
  }

  async approveDeposit(depositId: string): Promise<any> {
    try {
      const { data: deposit, error: getError } = await supabase
        .from('deposits')
        .select('user_id, amount')
        .eq('id', depositId)
        .single()

      if (getError) throw getError

      // Update deposit status
      const { error: updateError } = await supabase
        .from('deposits')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString()
        })
        .eq('id', depositId)

      if (updateError) throw updateError

      // Add funds to user
      await this.addFundsToUser(deposit.user_id, 'USDT', deposit.amount, 'Deposit approved')

      return { success: true }
    } catch (error) {
      console.error('Approve deposit error:', error)
      throw error
    }
  }

  async rejectDeposit(depositId: string, reason?: string): Promise<any> {
    try {
      const { error } = await supabase
        .from('deposits')
        .update({
          status: 'rejected',
          admin_notes: reason,
          processed_at: new Date().toISOString()
        })
        .eq('id', depositId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Reject deposit error:', error)
      throw error
    }
  }

  // Withdrawal management
  async getAllWithdrawals(): Promise<Withdrawal[]> {
    try {
      const { data: withdrawals, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          profiles (email, full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return withdrawals?.map(withdrawal => ({
        id: withdrawal.id,
        userId: withdrawal.user_id,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        status: withdrawal.status,
        createdAt: withdrawal.created_at,
        processedAt: withdrawal.processed_at,
        user: {
          fullName: withdrawal.profiles?.full_name || '',
          email: withdrawal.profiles?.email || ''
        }
      })) || []
    } catch (error) {
      console.error('Get withdrawals error:', error)
      throw error
    }
  }

  async approveWithdrawal(withdrawalId: string): Promise<any> {
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Approve withdrawal error:', error)
      throw error
    }
  }

  async rejectWithdrawal(withdrawalId: string, reason?: string): Promise<any> {
    try {
      const { data: withdrawal, error: getError } = await supabase
        .from('withdrawals')
        .select('user_id, amount')
        .eq('id', withdrawalId)
        .single()

      if (getError) throw getError

      // Update withdrawal status
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          admin_notes: reason,
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId)

      if (updateError) throw updateError

      // Refund the user
      await this.addFundsToUser(withdrawal.user_id, 'USDT', withdrawal.amount, 'Withdrawal rejected - refund')

      return { success: true }
    } catch (error) {
      console.error('Reject withdrawal error:', error)
      throw error
    }
  }

  // Wallet management
  async getAllWallets(): Promise<WalletBalance[]> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, account_balance, email, full_name')
        .order('account_balance', { ascending: false })

      if (error) throw error

      return profiles?.map(profile => ({
        userId: profile.user_id,
        asset: 'USDT',
        balance: profile.account_balance || 0,
        user: {
          fullName: profile.full_name || '',
          email: profile.email || ''
        }
      })) || []
    } catch (error) {
      console.error('Get wallets error:', error)
      throw error
    }
  }

  async getAdminFundActions(): Promise<AdminFundAction[]> {
    try {
      const { data: actions, error } = await supabase
        .from('admin_actions')
        .select('*')
        .eq('action_type', 'ADJUST_BALANCE')
        .order('created_at', { ascending: false })

      if (error) throw error

      return actions?.map(action => ({
        id: action.id,
        adminId: 'admin',
        userId: action.details?.user_id || '',
        asset: 'USDT',
        amount: action.details?.amount || 0,
        actionType: action.details?.amount > 0 ? 'add' : 'remove',
        reason: action.details?.reason,
        createdAt: action.created_at,
        admin: {
          fullName: 'Admin',
          email: 'admin@kryvex.com'
        },
        user: {
          fullName: '', // Would need to join with profiles
          email: ''
        }
      })) || []
    } catch (error) {
      console.error('Get admin fund actions error:', error)
      throw error
    }
  }

  // Trading control
  async setTradeOverride(userId: string, mode: 'win' | 'lose' | null): Promise<any> {
    try {
      // This would need to be implemented based on your trading system
      console.log(`Setting trade override for user ${userId} to ${mode}`)
      return { success: true }
    } catch (error) {
      console.error('Set trade override error:', error)
      throw error
    }
  }

  async getTrades(): Promise<any[]> {
    try {
      const { data: trades, error } = await supabase
        .from('trades')
        .select(`
          *,
          profiles (email, full_name),
          trading_pairs (symbol)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return trades || []
    } catch (error) {
      console.error('Get trades error:', error)
      throw error
    }
  }

  async getTradeStats(): Promise<any> {
    try {
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')

      if (error) throw error

      const totalTrades = trades?.length || 0
      const completedTrades = trades?.filter(t => t.status === 'completed').length || 0
      const winTrades = trades?.filter(t => t.result === 'win').length || 0

      return {
        totalTrades,
        completedTrades,
        winRate: totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0,
        totalVolume: trades?.reduce((sum, t) => sum + (t.total_value || 0), 0) || 0
      }
    } catch (error) {
      console.error('Get trade stats error:', error)
      throw error
    }
  }

  // Notifications
  async sendNotification(userId: string, title: string, message: string, type: string = 'admin'): Promise<any> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Send notification error:', error)
      throw error
    }
  }

  async broadcastNotification(title: string, message: string, type: string = 'admin'): Promise<any> {
    try {
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('user_id')

      if (usersError) throw usersError

      // Create notifications for all users
      const notifications = users?.map(user => ({
        user_id: user.user_id,
        title,
        message,
        type,
        created_at: new Date().toISOString()
      })) || []

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Broadcast notification error:', error)
      throw error
    }
  }

  // Audit logs
  async getAuditLogs(limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
    try {
      const { data: logs, error } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return logs?.map(log => ({
        id: log.id,
        adminId: 'admin',
        actionType: log.action_type,
        targetUserId: log.details?.user_id,
        details: log.details,
        ipAddress: '',
        createdAt: log.created_at,
        admin: {
          fullName: 'Admin',
          email: 'admin@kryvex.com'
        },
        targetUser: {
          fullName: '',
          email: ''
        }
      })) || []
    } catch (error) {
      console.error('Get audit logs error:', error)
      throw error
    }
  }

  // System stats
  async getSystemStats(): Promise<SystemStats> {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get verified users
      const { count: verifiedUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true)

      // Get pending KYC
      const { count: pendingKyc } = await supabase
        .from('kyc_documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get pending deposits
      const { count: pendingDeposits } = await supabase
        .from('deposits')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get pending withdrawals
      const { count: pendingWithdrawals } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get pending trades
      const { count: pendingTrades } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get total balances
      const { data: profiles } = await supabase
        .from('profiles')
        .select('account_balance')

      const totalUsdtBalance = profiles?.reduce((sum, p) => sum + (p.account_balance || 0), 0) || 0

      return {
        totalUsers: totalUsers || 0,
        verifiedUsers: verifiedUsers || 0,
        pendingKyc: pendingKyc || 0,
        pendingDeposits: pendingDeposits || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        pendingTrades: pendingTrades || 0,
        totalUsdtBalance,
        totalBtcBalance: 0, // Would need to calculate from trading balances
        totalEthBalance: 0
      }
    } catch (error) {
      console.error('Get system stats error:', error)
      throw error
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)

      return !error
    } catch (error) {
      console.error('Health check error:', error)
      return false
    }
  }

  private handleError(error: any, operation: string): never {
    console.error(`${operation} failed:`, error)
    throw new Error(`${operation} failed: ${error.message}`)
  }
}

// Create singleton instance
const supabaseAdminService = new SupabaseAdminService()
export default supabaseAdminService 