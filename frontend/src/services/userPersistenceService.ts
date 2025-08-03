interface UserData {
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
  private static instance: UserPersistenceService;
  private readonly STORAGE_KEY = 'admin_users_persistent';
  private readonly ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

  private constructor() {
    this.cleanupOldData();
  }

  static getInstance(): UserPersistenceService {
    if (!UserPersistenceService.instance) {
      UserPersistenceService.instance = new UserPersistenceService();
    }
    return UserPersistenceService.instance;
  }

  // Store user data with timestamp
  storeUser(user: UserData): void {
    try {
      const existingData = this.getAllUsers();
      const userWithTimestamp = {
        ...user,
        storedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.ONE_YEAR_MS).toISOString()
      };

      // Update or add user
      const updatedData = existingData.filter(u => u.id !== user.id);
      updatedData.push(userWithTimestamp);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedData));
      console.log(`User ${user.email} stored with 1-year retention`);
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }

  // Store multiple users
  storeUsers(users: UserData[]): void {
    try {
      const existingData = this.getAllUsers();
      const usersWithTimestamps = users.map(user => ({
        ...user,
        storedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.ONE_YEAR_MS).toISOString()
      }));

      // Merge with existing data, avoiding duplicates
      const userMap = new Map();
      
      // Add existing users
      existingData.forEach(user => {
        userMap.set(user.id, user);
      });

      // Add new users
      usersWithTimestamps.forEach(user => {
        userMap.set(user.id, user);
      });

      const mergedData = Array.from(userMap.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mergedData));
      console.log(`Stored ${users.length} users with 1-year retention`);
    } catch (error) {
      console.error('Error storing users data:', error);
    }
  }

  // Get all users (excluding expired ones)
  getAllUsers(): UserData[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];

      const users = JSON.parse(data);
      const now = new Date();
      
      // Filter out expired users
      const validUsers = users.filter((user: any) => {
        if (!user.expiresAt) return true; // Keep users without expiration
        return new Date(user.expiresAt) > now;
      });

      // If we filtered out expired users, update storage
      if (validUsers.length !== users.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validUsers));
        console.log(`Cleaned up ${users.length - validUsers.length} expired user records`);
      }

      return validUsers;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return [];
    }
  }

  // Get user by ID
  getUserById(id: string): UserData | null {
    const users = this.getAllUsers();
    return users.find(user => user.id === id) || null;
  }

  // Update user data
  updateUser(userId: string, updates: Partial<UserData>): void {
    try {
      const users = this.getAllUsers();
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      );
      
      this.storeUsers(updatedUsers);
      console.log(`Updated user ${userId}`);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  }

  // Delete user
  deleteUser(userId: string): void {
    try {
      const users = this.getAllUsers();
      const filteredUsers = users.filter(user => user.id !== userId);
      this.storeUsers(filteredUsers);
      console.log(`Deleted user ${userId}`);
    } catch (error) {
      console.error('Error deleting user data:', error);
    }
  }

  // Clean up old data (called automatically)
  private cleanupOldData(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return;

      const users = JSON.parse(data);
      const now = new Date();
      
      // Filter out expired users
      const validUsers = users.filter((user: any) => {
        if (!user.expiresAt) return true;
        return new Date(user.expiresAt) > now;
      });

      // Update storage if we removed expired users
      if (validUsers.length !== users.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validUsers));
        console.log(`Automatic cleanup: Removed ${users.length - validUsers.length} expired user records`);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Get storage statistics
  getStorageStats(): {
    totalUsers: number;
    expiredUsers: number;
    storageSize: number;
    oldestRecord: string | null;
    newestRecord: string | null;
  } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return {
          totalUsers: 0,
          expiredUsers: 0,
          storageSize: 0,
          oldestRecord: null,
          newestRecord: null
        };
      }

      const users = JSON.parse(data);
      const now = new Date();
      
      const validUsers = users.filter((user: any) => {
        if (!user.expiresAt) return true;
        return new Date(user.expiresAt) > now;
      });

      const expiredUsers = users.length - validUsers.length;
      
      const timestamps = users
        .map((user: any) => user.storedAt)
        .filter(Boolean)
        .sort();

      return {
        totalUsers: users.length,
        expiredUsers,
        storageSize: new Blob([data]).size,
        oldestRecord: timestamps[0] || null,
        newestRecord: timestamps[timestamps.length - 1] || null
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalUsers: 0,
        expiredUsers: 0,
        storageSize: 0,
        oldestRecord: null,
        newestRecord: null
      };
    }
  }

  // Export all user data
  exportUserData(): string {
    try {
      const users = this.getAllUsers();
      const csvContent = [
        ['ID', 'Email', 'Name', 'Phone', 'KYC Level', 'KYC Status', 'Account Status', 'Wallet Balance', 'Trading Balance', 'Total Trades', 'Win Rate', 'Total Profit', 'Created At', 'Last Login', 'Stored At', 'Expires At'],
        ...users.map(user => [
          user.id,
          user.email,
          `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          user.phone || '',
          user.kycLevel.toString(),
          user.kycStatus,
          user.accountStatus,
          user.walletBalance.toString(),
          user.tradingBalance.toString(),
          user.totalTrades.toString(),
          user.winRate.toString(),
          user.totalProfit.toString(),
          user.createdAt,
          user.lastLogin || '',
          (user as any).storedAt || '',
          (user as any).expiresAt || ''
        ])
      ].map(row => row.join(',')).join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting user data:', error);
      return '';
    }
  }

  // Clear all data (for testing or reset)
  clearAllData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('All user data cleared');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }
}

const userPersistenceService = UserPersistenceService.getInstance();
export default userPersistenceService;
export type { UserData }; 