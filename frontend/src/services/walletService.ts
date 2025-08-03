import { ActivityItem } from './activityService';

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
    
    // Create sample withdrawal requests if none exist
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Only create sample data if no withdrawal requests exist
    if (this.withdrawalRequests.size === 0) {
      const sampleRequests = [
        {
          id: 'withdrawal-1',
          userId: 'user-1',
          username: 'john_doe',
          userEmail: 'john@example.com',
          amount: 500,
          asset: 'USDT',
          blockchain: 'TRC20',
          walletAddress: 'TQn9Y2khDD95J42FQtQTdwVVRKzN8kqKq',
          status: 'pending' as const,
          requestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          remarks: 'Need funds for trading'
        },
        {
          id: 'withdrawal-2',
          userId: 'user-2',
          username: 'jane_smith',
          userEmail: 'jane@example.com',
          amount: 250,
          asset: 'BTC',
          blockchain: 'Bitcoin',
          walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          status: 'approved' as const,
          requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          processedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          processedBy: 'admin@kryvex.com',
          txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          remarks: 'Approved for withdrawal'
        },
        {
          id: 'withdrawal-3',
          userId: 'user-3',
          username: 'mike_wilson',
          userEmail: 'mike@example.com',
          amount: 1000,
          asset: 'ETH',
          blockchain: 'Ethereum',
          walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          status: 'rejected' as const,
          requestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          processedDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          processedBy: 'admin@kryvex.com',
          remarks: 'Insufficient KYC verification level'
        },
        {
          id: 'withdrawal-4',
          userId: 'user-4',
          username: 'sarah_jones',
          userEmail: 'sarah@example.com',
          amount: 750,
          asset: 'SOL',
          blockchain: 'Solana',
          walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          status: 'pending' as const,
          requestDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          remarks: 'Trading profits withdrawal'
        }
      ];

      sampleRequests.forEach(request => {
        this.withdrawalRequests.set(request.id, request);
      });

      // Create sample user wallets
      const sampleWallets = [
        {
          userId: 'user-1',
          username: 'john_doe',
          email: 'john@example.com',
          fundingWallet: { USDT: 2500, BTC: 0.05, ETH: 2.5 },
          tradingWallet: { USDT: 1500, BTC: 0.02, ETH: 1.2 },
          lastUpdated: new Date().toISOString()
        },
        {
          userId: 'user-2',
          username: 'jane_smith',
          email: 'jane@example.com',
          fundingWallet: { USDT: 1800, BTC: 0.03, ETH: 1.8 },
          tradingWallet: { USDT: 900, BTC: 0.01, ETH: 0.8 },
          lastUpdated: new Date().toISOString()
        },
        {
          userId: 'user-3',
          username: 'mike_wilson',
          email: 'mike@example.com',
          fundingWallet: { USDT: 3200, BTC: 0.08, ETH: 4.0 },
          tradingWallet: { USDT: 2100, BTC: 0.05, ETH: 2.5 },
          lastUpdated: new Date().toISOString()
        },
        {
          userId: 'user-4',
          username: 'sarah_jones',
          email: 'sarah@example.com',
          fundingWallet: { USDT: 1200, BTC: 0.02, ETH: 1.0 },
          tradingWallet: { USDT: 600, BTC: 0.01, ETH: 0.5 },
          lastUpdated: new Date().toISOString()
        }
      ];

      sampleWallets.forEach(wallet => {
        this.userWallets.set(wallet.userId, wallet);
      });

      this.persistData();
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
}

const walletService = new WalletService();
export default walletService;