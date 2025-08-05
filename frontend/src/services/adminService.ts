import apiService from './apiService';
import { API_CONFIG } from '@/config/api';

interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  accountStatus: 'active' | 'suspended' | 'banned';
  walletBalance: number;
  tradingBalance: number;
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  lastLogin?: string;
  createdAt: string;
  isVerified: boolean;
  forceMode?: 'win' | 'lose' | null;
}

interface KYCSubmission {
  id: string;
  userId: string;
  level: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  documents?: any;
  personalInfo?: {
    fullName: string;
    dateOfBirth: string;
    nationalId: string;
    address?: string;
    city?: string;
    country: string;
  };
}

interface Deposit {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  user: {
    fullName: string;
    email: string;
  };
}

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  user: {
    fullName: string;
    email: string;
  };
}

interface WalletBalance {
  userId: string;
  asset: string;
  balance: number;
  user: {
    fullName: string;
    email: string;
  };
}

interface AdminFundAction {
  id: string;
  adminId: string;
  userId: string;
  asset: string;
  amount: number;
  actionType: 'add' | 'remove';
  reason?: string;
  createdAt: string;
  admin: {
    fullName: string;
    email: string;
  };
  user: {
    fullName: string;
    email: string;
  };
}

interface AuditLog {
  id: string;
  adminId: string;
  actionType: string;
  targetUserId?: string;
  details: any;
  ipAddress?: string;
  createdAt: string;
  admin: {
    fullName: string;
    email: string;
  };
  targetUser?: {
    fullName: string;
    email: string;
  };
}

interface SystemStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingKyc: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingTrades: number;
  totalUsdtBalance: number;
  totalBtcBalance: number;
  totalEthBalance: number;
}

class AdminService {
  // Users Management
  async getAllUsers(): Promise<AdminUser[]> {
    try {
      const response = await apiService.get('/api/admin/users');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserDetails(userId: string): Promise<AdminUser> {
    try {
      const response = await apiService.get(`/api/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  }

  async addFundsToUser(userId: string, asset: string, amount: number, reason?: string): Promise<any> {
    try {
      const response = await apiService.post(`/api/admin/users/${userId}/fund/add`, {
        asset,
        amount,
        reason
      });
      return response;
    } catch (error) {
      console.error('Error adding funds:', error);
      throw error;
    }
  }

  async removeFundsFromUser(userId: string, asset: string, amount: number, reason?: string): Promise<any> {
    try {
      const response = await apiService.post(`/api/admin/users/${userId}/fund/remove`, {
        asset,
        amount,
        reason
      });
      return response;
    } catch (error) {
      console.error('Error removing funds:', error);
      throw error;
    }
  }

  // KYC Management
  async getAllKYCSubmissions(): Promise<KYCSubmission[]> {
    try {
      const response = await apiService.get('/api/admin/kyc');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching KYC submissions:', error);
      throw error;
    }
  }

  async approveKYC(submissionId: string, reason?: string): Promise<any> {
    try {
      const response = await apiService.post(`/api/admin/kyc/${submissionId}/approve`, {
        reason
      });
      return response;
    } catch (error) {
      console.error('Error approving KYC:', error);
      throw error;
    }
  }

  async rejectKYC(submissionId: string, reason: string): Promise<any> {
    try {
      const response = await apiService.post(`/api/admin/kyc/${submissionId}/reject`, {
        reason
      });
      return response;
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      throw error;
    }
  }

  // Deposits Management
  async getAllDeposits(): Promise<Deposit[]> {
    try {
      const response = await apiService.get('/api/admin/deposits');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching deposits:', error);
      throw error;
    }
  }

  async approveDeposit(depositId: string): Promise<any> {
    try {
      const response = await apiService.post(`/api/admin/deposits/${depositId}/approve`);
      return response;
    } catch (error) {
      console.error('Error approving deposit:', error);
      throw error;
    }
  }

  async rejectDeposit(depositId: string, reason?: string): Promise<any> {
    try {
      const response = await apiService.post(`/api/admin/deposits/${depositId}/reject`, {
        reason
      });
      return response;
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      throw error;
    }
  }

  // Withdrawals Management
  async getAllWithdrawals(): Promise<Withdrawal[]> {
    try {
      const response = await apiService.get('/api/admin/withdrawals');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      throw error;
    }
  }

  async approveWithdrawal(withdrawalId: string): Promise<any> {
    try {
      const response = await apiService.post(`/api/admin/withdrawals/${withdrawalId}/approve`);
      return response;
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      throw error;
    }
  }

  async rejectWithdrawal(withdrawalId: string, reason?: string): Promise<any> {
    try {
      const response = await apiService.post(`/api/admin/withdrawals/${withdrawalId}/reject`, {
        reason
      });
      return response;
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      throw error;
    }
  }

  // Wallets Management
  async getAllWallets(): Promise<WalletBalance[]> {
    try {
      const response = await apiService.get('/api/admin/wallets');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw error;
    }
  }

  async getAdminFundActions(): Promise<AdminFundAction[]> {
    try {
      const response = await apiService.get('/api/admin/wallets/fund-actions');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching fund actions:', error);
      throw error;
    }
  }

  // Trading Control
  async setTradeOverride(userId: string, mode: 'win' | 'lose' | null): Promise<any> {
    try {
      const response = await apiService.post('/api/admin/trade-override', {
        userId,
        mode
      });
      return response;
    } catch (error) {
      console.error('Error setting trade override:', error);
      throw error;
    }
  }

  async getTrades(): Promise<any[]> {
    try {
      const response = await apiService.get('/api/admin/trades');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw error;
    }
  }

  async getTradeStats(): Promise<any> {
    try {
      const response = await apiService.get('/api/admin/trades/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching trade stats:', error);
      throw error;
    }
  }

  // Notifications
  async sendNotification(userId: string, title: string, message: string, type: string = 'admin'): Promise<any> {
    try {
      const response = await apiService.post('/api/admin/notifications/send', {
        userId,
        title,
        message,
        type
      });
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async broadcastNotification(title: string, message: string, type: string = 'admin'): Promise<any> {
    try {
      const response = await apiService.post('/api/admin/notifications/broadcast', {
        title,
        message,
        type
      });
      return response;
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      throw error;
    }
  }

  // Audit Logs
  async getAuditLogs(limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
    try {
      const response = await apiService.get(`/api/admin/audit-logs?limit=${limit}&offset=${offset}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  // System Stats
  async getSystemStats(): Promise<SystemStats> {
    try {
      const response = await apiService.get('/api/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  }

  // Health check for admin endpoints
  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiService.get('/api/admin/stats');
      return response.success !== false;
    } catch (error) {
      console.error('Admin health check failed:', error);
      return false;
    }
  }

  // Error handling wrapper
  private handleError(error: any, operation: string): never {
    console.error(`Admin service error in ${operation}:`, error);
    
    // Extract meaningful error message
    let errorMessage = 'An unexpected error occurred';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(`${operation} failed: ${errorMessage}`);
  }
}

export default new AdminService(); 