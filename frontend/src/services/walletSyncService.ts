import supabase from '@/lib/supabaseClient';

export interface WalletData {
  wallet_type: string;
  asset: string;
  balance: number;
  updated_at: string;
}

export interface WalletSummary {
  success: boolean;
  user_id: string;
  trading_account: { [key: string]: { balance: string; usdValue: string; available: string } };
  funding_account: { USDT: { balance: string; usdValue: string; available: string } };
  total_balance: number;
  last_updated: string;
}

class WalletSyncService {
  /**
   * Sync user wallet data from database
   */
  async syncWalletFromDatabase(userId: string): Promise<WalletData[]> {
    try {
      const { data, error } = await supabase
        .rpc('sync_user_wallet_from_database', {
          user_id_param: userId
        });

      if (error) {
        console.error('Error syncing wallet from database:', error);
        throw error;
      }

      return data?.wallets || [];
    } catch (error) {
      console.error('Failed to sync wallet from database:', error);
      throw error;
    }
  }

  /**
   * Get user wallet summary from database
   */
  async getWalletSummary(userId: string): Promise<WalletSummary> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_wallet_summary', {
          user_id_param: userId
        });

      if (error) {
        console.error('Error getting wallet summary:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get wallet summary:', error);
      throw error;
    }
  }

  /**
   * Convert database wallet data to frontend format
   */
  convertWalletDataToFrontendFormat(walletData: WalletData[]) {
    const tradingAccount: { [key: string]: { balance: string; usdValue: string; available: string } } = {};
    const fundingAccount: { USDT: { balance: string; usdValue: string; available: string } } = {
      USDT: { balance: '0.00', usdValue: '$0.00', available: '0.00' }
    };

    walletData.forEach(wallet => {
      const balanceStr = wallet.balance.toFixed(8);
      const usdValue = `$${wallet.balance.toFixed(2)}`;

      if (wallet.wallet_type === 'trading') {
        tradingAccount[wallet.asset] = {
          balance: balanceStr,
          usdValue,
          available: balanceStr
        };
      } else if (wallet.wallet_type === 'funding' && wallet.asset === 'USDT') {
        fundingAccount.USDT = {
          balance: wallet.balance.toFixed(2),
          usdValue,
          available: wallet.balance.toFixed(2)
        };
      }
    });

    return { tradingAccount, fundingAccount };
  }

  /**
   * Sync user wallet and update frontend state
   */
  async syncAndUpdateWallet(userId: string) {
    try {
      console.log('🔄 Syncing wallet from database for user:', userId);
      
      // Get wallet summary from database
      const walletSummary = await this.getWalletSummary(userId);
      
      if (walletSummary.success) {
        console.log('✅ Wallet synced successfully:', walletSummary);
        return {
          tradingAccount: walletSummary.trading_account || {},
          fundingAccount: walletSummary.funding_account || { USDT: { balance: '0.00', usdValue: '$0.00', available: '0.00' } }
        };
      } else {
        throw new Error('Failed to sync wallet');
      }
    } catch (error) {
      console.error('❌ Failed to sync wallet:', error);
      throw error;
    }
  }

  /**
   * Force refresh wallet data
   */
  async forceRefreshWallet(userId: string) {
    try {
      console.log('🔄 Force refreshing wallet for user:', userId);
      
      // Clear any cached data and fetch fresh from database
      const walletData = await this.syncWalletFromDatabase(userId);
      const { tradingAccount, fundingAccount } = this.convertWalletDataToFrontendFormat(walletData);
      
      console.log('✅ Wallet refreshed successfully');
      return { tradingAccount, fundingAccount };
    } catch (error) {
      console.error('❌ Failed to refresh wallet:', error);
      throw error;
    }
  }
}

const walletSyncService = new WalletSyncService();
export default walletSyncService;
