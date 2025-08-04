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

  // Get deposit requests (mock data for now, but using real users)
  getDepositRequests(): AdminDepositRequest[] {
    const allUsers = this.getAllUsers();
    // Create mock deposit requests for users with wallet balances
    return allUsers
      .filter(user => user.walletBalance > 0)
      .map((user, index) => ({
        id: `deposit-${user.id}-${index}`,
        userId: user.id,
        userEmail: user.email,
        amount: (user.walletBalance * 0.1).toFixed(2), // 10% of wallet balance
        network: 'TRC20',
        transactionHash: `tx_${user.id}_${Date.now()}`,
        notes: `Deposit request for ${user.firstName} ${user.lastName}`,
        status: 'pending' as const,
        createdAt: new Date(Date.now() - index * 86400000).toISOString(), // Spread over days
        processedAt: undefined,
        processedBy: undefined
      }));
  }

  // Get withdrawal requests (mock data for now, but using real users)
  getWithdrawalRequests(): AdminWithdrawalRequest[] {
    const allUsers = this.getAllUsers();
    // Create mock withdrawal requests for users with wallet balances
    return allUsers
      .filter(user => user.walletBalance > 0)
      .map((user, index) => ({
        id: `withdrawal-${user.id}-${index}`,
        userId: user.id,
        username: user.username || user.email,
        userEmail: user.email,
        amount: user.walletBalance * 0.05, // 5% of wallet balance
        asset: 'USDT',
        blockchain: 'TRC20',
        walletAddress: `T${user.id}${Date.now()}`,
        status: 'pending' as const,
        requestDate: new Date(Date.now() - index * 86400000).toISOString(),
        remarks: `Withdrawal request for ${user.firstName} ${user.lastName}`
      }));
  }

  // Get wallet data (mock data for now, but using real users)
  getWalletData(): AdminWalletData[] {
    const allUsers = this.getAllUsers();
    return allUsers.map(user => ({
      userId: user.id,
      username: user.username || user.email,
      email: user.email,
      fundingWallet: {
        USDT: user.walletBalance,
        BTC: user.walletBalance * 0.001,
        ETH: user.walletBalance * 0.01
      },
      tradingWallet: {
        USDT: user.tradingBalance || user.walletBalance * 0.8,
        BTC: (user.tradingBalance || user.walletBalance * 0.8) * 0.001,
        ETH: (user.tradingBalance || user.walletBalance * 0.8) * 0.01
      },
      lastUpdated: new Date().toISOString()
    }));
  }

  // Get trade summaries (mock data for now, but using real users)
  getTradeSummaries(): AdminTradeSummary[] {
    const allUsers = this.getAllUsers();
    return allUsers.map(user => ({
      userId: user.id,
      username: user.username || user.email,
      email: user.email,
      activeTrades: {
        spot: Math.floor(Math.random() * 5),
        futures: Math.floor(Math.random() * 3),
        options: Math.floor(Math.random() * 2),
        binary: Math.floor(Math.random() * 4),
        quant: Math.floor(Math.random() * 2),
        bots: Math.floor(Math.random() * 3),
        staking: Math.floor(Math.random() * 2)
      },
      totalActive: Math.floor(Math.random() * 10) + 1,
      lastActivity: new Date(Date.now() - Math.random() * 86400000).toISOString()
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