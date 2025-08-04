import { ActivityItem } from './activityService';
import websocketService from './websocketService';

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
  balance?: number; // Added for admin transactions
  adminEmail?: string; // Added for admin transactions
}

export interface UserWallet {
  userId: string;
  username: string;
  email: string;
  fundingWallet: { [key: string]: number };
  tradingWallet: { [key: string]: number };
  lastUpdated: string;
}

export class WalletService {
  private withdrawalRequests: Map<string, WithdrawalRequest> = new Map();
  private userWallets: Map<string, UserWallet> = new Map();
  private listeners: Map<string, Function[]> = new Map();
  private walletTransactions: Map<string, WalletTransaction> = new Map(); // Added for admin transactions

  constructor() {
    // Initialize with empty state - no mock data
    this.loadPersistedData();
    
    // Clear any existing mock data
    this.clearMockData();
    
    // Create sample withdrawal requests if none exist
    this.initializeSampleData();
  }

  // Clear all mock data from localStorage
  private clearMockData() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear withdrawal requests that contain mock data
        const savedRequests = localStorage.getItem('withdrawalRequests');
        if (savedRequests) {
          const requests = JSON.parse(savedRequests);
          const mockUserIds = ['user-1', 'user-2', 'user-3', 'user-4'];
          const mockEmails = ['john@example.com', 'jane@example.com', 'mike@example.com', 'sarah@example.com'];
          
          // Remove requests with mock data
          Object.keys(requests).forEach(key => {
            const request = requests[key];
            if (mockUserIds.includes(request.userId) || mockEmails.includes(request.userEmail)) {
              delete requests[key];
            }
          });
          
          // Update localStorage with cleaned data
          localStorage.setItem('withdrawalRequests', JSON.stringify(requests));
          this.withdrawalRequests = new Map(Object.entries(requests));
        }
        
        // Clear user wallets that contain mock data
        const savedWallets = localStorage.getItem('userWallets');
        if (savedWallets) {
          const wallets = JSON.parse(savedWallets);
          const mockUserIds = ['user-1', 'user-2', 'user-3', 'user-4'];
          
          // Remove wallets with mock data
          Object.keys(wallets).forEach(key => {
            const wallet = wallets[key];
            if (mockUserIds.includes(wallet.userId)) {
              delete wallets[key];
            }
          });
          
          // Update localStorage with cleaned data
          localStorage.setItem('userWallets', JSON.stringify(wallets));
          this.userWallets = new Map(Object.entries(wallets));
        }
        
        console.log('Mock data cleared from localStorage');
      }
    } catch (error) {
      console.warn('Error clearing mock data:', error);
    }
  }

  private initializeSampleData() {
    // Initialize with empty state - no mock data
    // Only create sample data if explicitly needed for testing
    if (this.withdrawalRequests.size === 0) {
      // Don't create any sample data - start with clean state
      console.log('Wallet service initialized with clean state - no mock data');
    }
  }

  private loadPersistedData() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedRequests = localStorage.getItem('withdrawalRequests');
        const savedWallets = localStorage.getItem('userWallets');
        
        if (savedRequests) {
          const requests = JSON.parse(savedRequests);
          this.withdrawalRequests = new Map(Object.entries(requests));
        }
        
        if (savedWallets) {
          const wallets = JSON.parse(savedWallets);
          this.userWallets = new Map(Object.entries(wallets));
        }
      }
    } catch (error) {
      console.warn('Error loading persisted wallet data:', error);
    }
  }

  private persistData() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const requestsObj = Object.fromEntries(this.withdrawalRequests);
        const walletsObj = Object.fromEntries(this.userWallets);
        
        localStorage.setItem('withdrawalRequests', JSON.stringify(requestsObj));
        localStorage.setItem('userWallets', JSON.stringify(walletsObj));
      }
    } catch (error) {
      console.warn('Error persisting wallet data:', error);
    }
  }

  // Clear all mock data (public method for admin use)
  clearAllMockData() {
    this.clearMockData();
    console.log('All mock data cleared by admin');
  }

  // Get all withdrawal requests
  getWithdrawalRequests(): WithdrawalRequest[] {
    return Array.from(this.withdrawalRequests.values()).sort((a, b) => 
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );
  }

  // Get withdrawal requests by status
  getWithdrawalRequestsByStatus(status: 'pending' | 'approved' | 'rejected'): WithdrawalRequest[] {
    return this.getWithdrawalRequests().filter(request => request.status === status);
  }

  // Get withdrawal request by ID
  getWithdrawalRequest(id: string): WithdrawalRequest | undefined {
    return this.withdrawalRequests.get(id);
  }

  // Create new withdrawal request
  createWithdrawalRequest(
    userId: string,
    username: string,
    userEmail: string,
    amount: number,
    asset: string,
    blockchain: string,
    walletAddress: string,
    remarks?: string
  ): WithdrawalRequest {
    const request: WithdrawalRequest = {
      id: `withdraw-${Date.now()}`,
      userId,
      username,
      userEmail,
      amount,
      asset,
      blockchain,
      walletAddress,
      status: 'pending',
      requestDate: new Date().toISOString(),
      remarks
    };

    this.withdrawalRequests.set(request.id, request);
    this.persistData(); // Persist after each action
    return request;
  }

  // Approve withdrawal request
  approveWithdrawal(requestId: string, adminId: string, txHash?: string): WithdrawalRequest | null {
    const request = this.withdrawalRequests.get(requestId);
    if (!request || request.status !== 'pending') {
      return null;
    }

    // Check if user has sufficient balance
    const userWallet = this.userWallets.get(request.userId);
    if (!userWallet || userWallet.fundingWallet[request.asset] < request.amount) {
      return null;
    }

    // Deduct from funding wallet
    userWallet.fundingWallet[request.asset] -= request.amount;
    userWallet.lastUpdated = new Date().toISOString();

    // Update request status
    request.status = 'approved';
    request.processedDate = new Date().toISOString();
    request.processedBy = adminId;
    request.txHash = txHash;

    this.withdrawalRequests.set(requestId, request);
    this.persistData(); // Persist after each action

    // Log transaction
    this.logWalletTransaction(
      request.userId,
      request.username,
      'withdraw',
      'funding',
      request.amount,
      request.asset,
      adminId,
      `Withdrawal approved - ${request.asset}`
    );

    return request;
  }

  // Reject withdrawal request
  rejectWithdrawal(requestId: string, adminId: string, remarks?: string): WithdrawalRequest | null {
    const request = this.withdrawalRequests.get(requestId);
    if (!request || request.status !== 'pending') {
      return null;
    }

    request.status = 'rejected';
    request.processedDate = new Date().toISOString();
    request.processedBy = adminId;
    request.remarks = remarks;

    this.withdrawalRequests.set(requestId, request);
    this.persistData(); // Persist after each action

    // Log transaction
    this.logWalletTransaction(
      request.userId,
      request.username,
      'withdraw',
      'funding',
      request.amount,
      request.asset,
      adminId,
      `Withdrawal rejected - ${request.asset}`
    );

    return request;
  }

  // Admin functions for wallet management
  fundUserWallet(userId: string, username: string, walletType: 'funding' | 'trading', amount: number, asset: string, adminEmail: string, remarks: string): boolean {
    try {
      let userWallet = this.userWallets.get(userId);
      
      if (!userWallet) {
        // Create new wallet for user if it doesn't exist
        userWallet = {
          userId,
          username,
          email: '', // Will be filled from user data
          fundingWallet: { USDT: 0 },
          tradingWallet: { USDT: 0 },
          lastUpdated: new Date().toISOString()
        };
      }
      
      // Add funds to the specified wallet
      if (walletType === 'funding') {
        userWallet.fundingWallet[asset] = (userWallet.fundingWallet[asset] || 0) + amount;
      } else {
        userWallet.tradingWallet[asset] = (userWallet.tradingWallet[asset] || 0) + amount;
      }
      
      userWallet.lastUpdated = new Date().toISOString();
      this.userWallets.set(userId, userWallet);
      this.persistData();
      
      // Log the transaction
      const transaction: WalletTransaction = {
        id: `tx-${Date.now()}`,
        userId,
        username,
        action: 'admin_fund',
        amount,
        asset,
        walletType,
        balance: walletType === 'funding' ? userWallet.fundingWallet[asset] : userWallet.tradingWallet[asset],
        timestamp: new Date().toISOString(),
        adminEmail,
        remarks,
        performedBy: adminEmail,
        status: 'completed'
      };
      
      this.walletTransactions.set(transaction.id, transaction);
      this.persistData();
      
      // Notify clients about the wallet update
      websocketService.updateWallet(userId, asset, amount, 'add');
      
      return true;
    } catch (error) {
      console.error('Error funding user wallet:', error);
      return false;
    }
  }

  deductFromWallet(userId: string, username: string, walletType: 'funding' | 'trading', amount: number, asset: string, adminEmail: string, remarks: string): boolean {
    try {
      const userWallet = this.userWallets.get(userId);
      
      if (!userWallet) {
        return false;
      }
      
      const currentBalance = walletType === 'funding' 
        ? (userWallet.fundingWallet[asset] || 0)
        : (userWallet.tradingWallet[asset] || 0);
      
      if (currentBalance < amount) {
        return false; // Insufficient balance
      }
      
      // Deduct funds from the specified wallet
      if (walletType === 'funding') {
        userWallet.fundingWallet[asset] = currentBalance - amount;
      } else {
        userWallet.tradingWallet[asset] = currentBalance - amount;
      }
      
      userWallet.lastUpdated = new Date().toISOString();
      this.userWallets.set(userId, userWallet);
      this.persistData();
      
      // Log the transaction
      const transaction: WalletTransaction = {
        id: `tx-${Date.now()}`,
        userId,
        username,
        action: 'admin_deduct',
        amount: -amount,
        asset,
        walletType,
        balance: walletType === 'funding' ? userWallet.fundingWallet[asset] : userWallet.tradingWallet[asset],
        timestamp: new Date().toISOString(),
        adminEmail,
        remarks,
        performedBy: adminEmail,
        status: 'completed'
      };
      
      this.walletTransactions.set(transaction.id, transaction);
      this.persistData();
      
      // Notify clients about the wallet update
      websocketService.updateWallet(userId, asset, amount, 'subtract');
      
      return true;
    } catch (error) {
      console.error('Error deducting from user wallet:', error);
      return false;
    }
  }

  // Get user wallet
  getUserWallet(userId: string): UserWallet | undefined {
    return this.userWallets.get(userId);
  }

  // Get all user wallets
  getAllUserWallets(): UserWallet[] {
    return Array.from(this.userWallets.values());
  }

  // Get wallet transactions
  getWalletTransactions(): WalletTransaction[] {
    return Array.from(this.walletTransactions.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Get wallet transactions by user
  getWalletTransactionsByUser(userId: string): WalletTransaction[] {
    return this.getWalletTransactions().filter(transaction => transaction.userId === userId);
  }

  // Log wallet transaction
  private logWalletTransaction(
    userId: string,
    username: string,
    action: 'fund' | 'withdraw' | 'deduct',
    walletType: 'funding' | 'trading',
    amount: number,
    asset: string,
    performedBy: string,
    remarks?: string
  ): void {
    const transaction: WalletTransaction = {
      id: `tx-${Date.now()}`,
      userId,
      username,
      action,
      walletType,
      amount,
      asset,
      performedBy,
      timestamp: new Date().toISOString(),
      remarks,
      status: 'completed'
    };

    this.walletTransactions.set(transaction.id, transaction);
  }

  // Get withdrawal statistics
  getWithdrawalStats() {
    const requests = this.getWithdrawalRequests();
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    const totalAmount = requests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      pending,
      approved,
      rejected,
      totalAmount,
      totalRequests: requests.length
    };
  }

  // Get deposit statistics for a user
  async getDepositStats(userId?: string): Promise<{
    totalDeposits24h: number;
    pendingDeposits: number;
    averageTime: string;
  }> {
    try {
      const transactions = this.getWalletTransactions();
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Filter deposit transactions (admin_fund and fund actions)
      const depositTransactions = transactions.filter(tx => 
        (tx.action === 'admin_fund' || tx.action === 'fund') &&
        (!userId || tx.userId === userId)
      );
      
      // Calculate 24h deposits
      const deposits24h = depositTransactions.filter(tx => 
        new Date(tx.timestamp) >= twentyFourHoursAgo
      );
      
      const totalDeposits24h = deposits24h.reduce((sum, tx) => sum + tx.amount, 0);
      
      // Calculate pending deposits (transactions with pending status)
      const pendingDeposits = depositTransactions
        .filter(tx => tx.status === 'pending')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      // Calculate average processing time (simplified)
      const completedDeposits = depositTransactions.filter(tx => tx.status === 'completed');
      const averageTime = completedDeposits.length > 0 ? "~15 minutes" : "~20 minutes";
      
      return {
        totalDeposits24h,
        pendingDeposits,
        averageTime
      };
    } catch (error) {
      console.error('Error getting deposit stats:', error);
      return {
        totalDeposits24h: 0,
        pendingDeposits: 0,
        averageTime: "~15 minutes"
      };
    }
  }

  // Get recent deposits for a user
  async getRecentDeposits(userId?: string): Promise<Array<{
    amount: string;
    symbol: string;
    time: string;
    status: string;
  }>> {
    try {
      const transactions = this.getWalletTransactions();
      
      // Filter deposit transactions and convert to recent deposits format
      const depositTransactions = transactions
        .filter(tx => 
          (tx.action === 'admin_fund' || tx.action === 'fund') &&
          (!userId || tx.userId === userId)
        )
        .slice(0, 5) // Get last 5 deposits
        .map(tx => ({
          amount: tx.amount.toString(),
          symbol: tx.asset,
          time: this.formatTimeAgo(new Date(tx.timestamp)),
          status: tx.status === 'completed' ? 'Completed' : 'Pending'
        }));
      
      return depositTransactions;
    } catch (error) {
      console.error('Error getting recent deposits:', error);
      return [];
    }
  }

  // Helper method to format time ago
  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }
}

const walletService = new WalletService();
export default walletService;