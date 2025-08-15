import supabase from '../lib/supabaseClient';

export interface AdminWalletTransactionParams {
  target_user_email: string;
  amount: number;
  currency?: string;
  wallet_type?: 'funding' | 'trading';
  description?: string;
  admin_notes?: string;
}

export interface WalletTransactionResult {
  success: boolean;
  transaction_id: string;
  admin_action_id: string;
  target_user_email: string;
  target_user_id: string;
  amount: number;
  currency: string;
  wallet_type: string;
  previous_balance: number;
  new_balance: number;
  description: string;
  processed_at: string;
}

export interface UserWalletBalance {
  user_id: string;
  email: string;
  full_name: string;
  account_balance: number;
  wallets: Array<{
    wallet_type: string;
    asset: string;
    balance: number;
    updated_at: string;
  }>;
  total_balance_usd: number;
  last_updated: string;
}

export interface UserTransactionHistory {
  user_id: string;
  transactions: Array<{
    id: string;
    transaction_type: string;
    amount: number;
    currency: string;
    status: string;
    wallet_type: string;
    description: string;
    processed_at: string;
    created_at: string;
  }>;
  total_count: number;
}

class AdminWalletService {
  /**
   * Send money from admin to user
   */
  async sendMoneyToUser(params: AdminWalletTransactionParams): Promise<WalletTransactionResult> {
    try {
      const { data, error } = await supabase.rpc('admin_send_money_to_user', {
        target_user_email: params.target_user_email,
        amount: params.amount,
        currency: params.currency || 'USD',
        wallet_type: params.wallet_type || 'funding',
        description: params.description || 'Admin funding',
        admin_notes: params.admin_notes || null
      });

      if (error) {
        throw new Error(`Failed to send money: ${error.message}`);
      }

      if (!data || !data.success) {
        throw new Error('Transaction failed');
      }

      return data as WalletTransactionResult;
    } catch (error) {
      console.error('Error sending money to user:', error);
      throw error;
    }
  }

  /**
   * Get user wallet balance
   */
  async getUserWalletBalance(
    target_user_email?: string,
    wallet_type?: string,
    currency?: string
  ): Promise<UserWalletBalance> {
    try {
      const { data, error } = await supabase.rpc('get_user_wallet_balance', {
        target_user_email: target_user_email || null,
        wallet_type: wallet_type || null,
        currency: currency || null
      });

      if (error) {
        throw new Error(`Failed to get wallet balance: ${error.message}`);
      }

      return data as UserWalletBalance;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  /**
   * Get user transaction history
   */
  async getUserTransactionHistory(
    target_user_email?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<UserTransactionHistory> {
    try {
      const { data, error } = await supabase.rpc('get_user_transaction_history', {
        target_user_email: target_user_email || null,
        limit_count: limit,
        offset_count: offset
      });

      if (error) {
        throw new Error(`Failed to get transaction history: ${error.message}`);
      }

      return data as UserTransactionHistory;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Get current user's wallet balance
   */
  async getMyWalletBalance(): Promise<UserWalletBalance> {
    return this.getUserWalletBalance();
  }

  /**
   * Get current user's transaction history
   */
  async getMyTransactionHistory(limit: number = 50, offset: number = 0): Promise<UserTransactionHistory> {
    return this.getUserTransactionHistory(undefined, limit, offset);
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return formatter.format(amount);
  }

  /**
   * Get total balance across all wallets
   */
  getTotalBalance(wallets: UserWalletBalance['wallets']): number {
    return wallets.reduce((total, wallet) => total + wallet.balance, 0);
  }

  /**
   * Get balance for specific wallet type and currency
   */
  getWalletBalance(
    wallets: UserWalletBalance['wallets'],
    wallet_type: string,
    currency: string
  ): number {
    const wallet = wallets.find(w => w.wallet_type === wallet_type && w.asset === currency);
    return wallet ? wallet.balance : 0;
  }
}

export const adminWalletService = new AdminWalletService();
export default adminWalletService;
