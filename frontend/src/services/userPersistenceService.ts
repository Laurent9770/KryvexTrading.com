interface User {
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

class UserPersistenceService {
  private readonly STORAGE_KEY = 'admin_users';

  storeUsers(users: User[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.warn('Failed to store users in localStorage:', error);
    }
  }

  getUsers(): User[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load users from localStorage:', error);
      return [];
    }
  }

  getUserById(userId: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.id === userId) || null;
  }

  updateUser(userId: string, updates: Partial<User>): void {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      this.storeUsers(users);
    }
  }

  deleteUser(userId: string): void {
    const users = this.getUsers();
    const filteredUsers = users.filter(user => user.id !== userId);
    this.storeUsers(filteredUsers);
  }

  exportUserData(): string {
    try {
      const users = this.getUsers();
      const headers = [
        'ID',
        'Email',
        'First Name',
        'Last Name',
        'Phone',
        'Username',
        'KYC Level',
        'KYC Status',
        'Account Status',
        'Wallet Balance',
        'Trading Balance',
        'Total Trades',
        'Win Rate',
        'Total Profit',
        'Last Login',
        'Created At',
        'Is Verified',
        'Country',
        'Email Verified',
        'Phone Verified'
      ];

      const csvContent = [
        headers.join(','),
        ...users.map(user => [
          user.id,
          user.email,
          user.firstName || '',
          user.lastName || '',
          user.phone || '',
          user.username || '',
          user.kycLevel,
          user.kycStatus,
          user.accountStatus,
          user.walletBalance,
          user.tradingBalance,
          user.totalTrades,
          user.winRate,
          user.totalProfit,
          user.lastLogin || '',
          user.createdAt,
          user.isVerified,
          user.country || '',
          user.emailVerified || false,
          user.phoneVerified || false
        ].join(','))
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting user data:', error);
      return '';
    }
  }

  clearAllData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear user data from localStorage:', error);
    }
  }
}

const userPersistenceService = new UserPersistenceService();
export default userPersistenceService;
