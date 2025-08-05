import userPersistenceService from './userPersistenceService';

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  username?: string;
  kycLevel: number;
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
  loginAttempts?: number;
  suspensionReason?: string;
  suspendedUntil?: string;
  profilePicture?: string;
  country?: string;
  timezone?: string;
  language?: string;
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export interface AdminKYCUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  kycLevel: {
    level: number;
    status: string;
    verifiedAt?: string;
  };
  submissions: any[];
  restrictions?: {
    canTrade: boolean;
    canDeposit: boolean;
    canWithdraw: boolean;
    canAccessFullPlatform: boolean;
    tradeLimit?: number;
  };
}

export interface AdminDepositRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: string;
  network: string;
  transactionHash?: string;
  notes?: string;
  proofFile?: File;
  proofPreview?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface AdminWithdrawalRequest {
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
  remarks?: string;
  txHash?: string;
}

export interface AdminWalletData {
  userId: string;
  username: string;
  email: string;
  fundingWallet: { [key: string]: number };
  tradingWallet: { [key: string]: number };
  lastUpdated: string;
}

export interface AdminTradeSummary {
  userId: string;
  username: string;
  email: string;
  activeTrades: {
    spot: number;
    futures: number;
    options: number;
    binary: number;
    quant: number;
    bots: number;
    staking: number;
  };
  totalActive: number;
  lastActivity: string;
}

class AdminDataService {
  private static instance: AdminDataService;

  private constructor() {}

  static getInstance(): AdminDataService {
    if (!AdminDataService.instance) {
      AdminDataService.instance = new AdminDataService();
    }
    return AdminDataService.instance;
  }

  // Get all users (same logic as AdminUserManagement)
  getAllUsers(): AdminUser[] {
    try {
      console.log('=== AdminDataService: Loading all users ===');
      
      // Load from user persistence service (existing admin users)
      let adminUsers: any[] = [];
      try {
        if (userPersistenceService && typeof userPersistenceService.getAllUsers === 'function') {
          adminUsers = userPersistenceService.getAllUsers();
          console.log('AdminDataService: Admin users loaded:', adminUsers.length);
        } else {
          console.warn('AdminDataService: userPersistenceService.getAllUsers not available');
        }
      } catch (error) {
        console.warn('AdminDataService: Error loading admin users:', error);
      }
      
      // Load registered users from localStorage (new registrations)
      let registeredUsers: any[] = [];
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const registeredUsersData = localStorage.getItem('registeredUsers');
          console.log('AdminDataService: registeredUsers localStorage data:', registeredUsersData);
          if (registeredUsersData) {
            registeredUsers = JSON.parse(registeredUsersData);
            console.log('AdminDataService: Parsed registered users:', registeredUsers);
          }
        }
      } catch (error) {
        console.warn('AdminDataService: Error loading registered users:', error);
      }
      
      // Convert registered users to AdminUser format
      const convertedRegisteredUsers: AdminUser[] = registeredUsers.map((userData: any) => ({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        username: userData.username || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        kycLevel: 0,
        kycStatus: 'pending',
        accountStatus: 'active',
        walletBalance: userData.walletBalance || 0,
        tradingBalance: 0,
        totalTrades: 0,
        winRate: 0,
        totalProfit: 0,
        lastLogin: '',
        createdAt: userData.createdAt || new Date().toISOString(),
        isVerified: false,
        loginAttempts: 0,
        profilePicture: '',
        country: userData.country || '',
        timezone: '',
        language: 'en',
        twoFactorEnabled: false,
        emailVerified: false,
        phoneVerified: false
      }));
      
      // Merge admin users with registered users
      const userMap = new Map();
      
      // Add existing users
      adminUsers.forEach(user => {
        userMap.set(user.id, user);
      });

      // Add new users
      convertedRegisteredUsers.forEach(user => {
        if (!userMap.has(user.id)) {
          userMap.set(user.id, user);
        }
      });

      const allUsers = Array.from(userMap.values());
      console.log('AdminDataService: Final merged users:', allUsers.length);
      
      return allUsers;
    } catch (error) {
      console.error('AdminDataService: Error loading users:', error);
      return [];
    }
  }

  // Get KYC users
  getKYCUsers(): AdminKYCUser[] {
    const allUsers = this.getAllUsers();
    return allUsers.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      kycLevel: {
        level: user.kycLevel,
        status: user.kycStatus,
        verifiedAt: user.kycStatus === 'verified' ? user.lastLogin : undefined
      },
      submissions: [], // TODO: Load from KYC service
      restrictions: {
        canTrade: user.kycStatus === 'verified',
        canDeposit: user.kycStatus === 'verified',
        canWithdraw: user.kycStatus === 'verified',
        canAccessFullPlatform: user.kycStatus === 'verified',
        tradeLimit: user.kycStatus === 'verified' ? 10000 : 0
      }
    }));
  }

  // Get deposit requests (real data only - no mock generation)
  getDepositRequests(): AdminDepositRequest[] {
    // Return empty array - no mock data generation
    // Real deposit requests should come from backend API
    return [];
  }

  // Get withdrawal requests (real data only - no mock generation)
  getWithdrawalRequests(): AdminWithdrawalRequest[] {
    // Return empty array - no mock data generation
    // Real withdrawal requests should come from backend API
    return [];
  }

  // Get wallet data (real data only - no mock generation)
  getWalletData(): AdminWalletData[] {
    const allUsers = this.getAllUsers();
    // Only return real wallet data for users who actually have wallets
    return allUsers
      .filter(user => user.walletBalance > 0 || user.tradingBalance > 0)
      .map(user => ({
        userId: user.id,
        username: user.username || user.email,
        email: user.email,
        fundingWallet: {
          USDT: user.walletBalance || 0,
          BTC: 0, // Only show if user actually has BTC
          ETH: 0  // Only show if user actually has ETH
        },
        tradingWallet: {
          USDT: user.tradingBalance || 0,
          BTC: 0, // Only show if user actually has BTC
          ETH: 0  // Only show if user actually has ETH
        },
        lastUpdated: new Date().toISOString()
      }));
  }

  // Get trade summaries (real data only - no mock generation)
  getTradeSummaries(): AdminTradeSummary[] {
    const allUsers = this.getAllUsers();
    // Only return trade summaries for users who actually have trades
    return allUsers
      .filter(user => user.totalTrades > 0)
      .map(user => ({
        userId: user.id,
        username: user.username || user.email,
        email: user.email,
        activeTrades: {
          spot: 0, // Only show real active trades
          futures: 0,
          options: 0,
          binary: 0,
          quant: 0,
          bots: 0,
          staking: 0
        },
        totalActive: 0, // Only show real active trades
        lastActivity: user.lastLogin || user.createdAt
      }));
  }

  // Get user by ID
  getUserById(userId: string): AdminUser | null {
    const allUsers = this.getAllUsers();
    return allUsers.find(user => user.id === userId) || null;
  }

  // Get users by status
  getUsersByStatus(status: string): AdminUser[] {
    const allUsers = this.getAllUsers();
    return allUsers.filter(user => user.accountStatus === status);
  }

  // Get users by KYC status
  getUsersByKYCStatus(status: string): AdminUser[] {
    const allUsers = this.getAllUsers();
    return allUsers.filter(user => user.kycStatus === status);
  }
}

const adminDataService = AdminDataService.getInstance();
export default adminDataService; 