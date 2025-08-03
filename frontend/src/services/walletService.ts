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
  action: 'fund' | 'withdraw' | 'deduct';
  walletType: 'funding' | 'trading';
  amount: number;
  asset: string;
  performedBy: string;
  timestamp: string;
  remarks?: string;
  status: 'completed' | 'pending' | 'failed';
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

  constructor() {
    // Initialize with empty state - no mock data
    this.loadPersistedData();
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

  // Fund user wallet
  fundUserWallet(
    userId: string,
    username: string,
    walletType: 'funding' | 'trading',
    amount: number,
    asset: string,
    adminId: string,
    remarks?: string
  ): boolean {
    const userWallet = this.userWallets.get(userId);
    if (!userWallet) {
      return false;
    }

    // Add funds to specified wallet
    if (walletType === 'funding') {
      userWallet.fundingWallet[asset] = (userWallet.fundingWallet[asset] || 0) + amount;
    } else {
      userWallet.tradingWallet[asset] = (userWallet.tradingWallet[asset] || 0) + amount;
    }

    userWallet.lastUpdated = new Date().toISOString();
    this.userWallets.set(userId, userWallet);
    this.persistData(); // Persist after each action

    // Log transaction
    this.logWalletTransaction(
      userId,
      username,
      'fund',
      walletType,
      amount,
      asset,
      adminId,
      remarks || `Funded ${walletType} wallet`
    );

    return true;
  }

  // Deduct from user wallet
  deductFromWallet(
    userId: string,
    username: string,
    walletType: 'funding' | 'trading',
    amount: number,
    asset: string,
    adminId: string,
    remarks?: string
  ): boolean {
    const userWallet = this.userWallets.get(userId);
    if (!userWallet) {
      return false;
    }

    const wallet = walletType === 'funding' ? userWallet.fundingWallet : userWallet.tradingWallet;
    if (wallet[asset] < amount) {
      return false; // Insufficient balance
    }

    // Deduct from specified wallet
    wallet[asset] -= amount;
    userWallet.lastUpdated = new Date().toISOString();
    this.userWallets.set(userId, userWallet);
    this.persistData(); // Persist after each action

    // Log transaction
    this.logWalletTransaction(
      userId,
      username,
      'deduct',
      walletType,
      amount,
      asset,
      adminId,
      remarks || `Deducted from ${walletType} wallet`
    );

    return true;
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