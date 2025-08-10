import { supabase } from '@/integrations/supabase/client';

export interface Trade {
  id: string;
  userId: string;
  tradingPairId: string;
  tradingPairSymbol: string;
  tradeType: 'buy' | 'sell';
  amount: number;
  price: number;
  totalValue: number;
  fee: number;
  profitLoss: number;
  result: 'pending' | 'win' | 'loss' | 'draw';
  status: 'open' | 'closed' | 'cancelled';
  createdAt: string;
  closedAt?: string;
}

export interface TradingPair {
  id: string;
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  isActive: boolean;
  minOrderSize: number;
  maxOrderSize: number;
  pricePrecision: number;
  quantityPrecision: number;
  createdAt: string;
}

export interface WalletBalance {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  updatedAt: string;
}

export interface CreateTradeData {
  tradingPairId: string;
  tradeType: 'buy' | 'sell';
  amount: number;
  price: number;
}

export interface UpdateTradeData {
  result?: 'win' | 'loss' | 'draw';
  status?: 'open' | 'closed' | 'cancelled';
  profitLoss?: number;
}

class SupabaseTradingService {
  private subscriptions: any[] = [];

  constructor() {
    console.log('📊 Initializing Supabase Trading Service...');
  }

  // =============================================
  // TRADING PAIRS
  // =============================================

  async getTradingPairs(): Promise<{ success: boolean; data?: TradingPair[]; error?: string }> {
    try {
      console.log('📊 Fetching trading pairs...');
      
      // Check if supabase is properly initialized
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('❌ Supabase client not properly initialized');
        return { success: false, error: 'Supabase client not initialized' };
      }
      
      let query = supabase
        .from('trading_pairs')
        .select('*')
        .order('symbol');

      // Only add the eq filter if the query supports it
      if (typeof query.eq === 'function') {
        query = query.eq('is_active', true);
      } else {
        console.warn('⚠️ Query does not support .eq method, skipping active filter');
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching trading pairs:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Trading pairs fetched successfully:', data?.length);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Unexpected error fetching trading pairs:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getTradingPair(symbol: string): Promise<{ success: boolean; data?: TradingPair; error?: string }> {
    try {
      console.log('📊 Fetching trading pair:', symbol);
      
      let query = supabase
        .from('trading_pairs')
        .select('*');

      // Add filters only if the query supports them
      if (typeof query.eq === 'function') {
        query = query.eq('symbol', symbol);
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error('❌ Error fetching trading pair:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Trading pair fetched successfully');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Unexpected error fetching trading pair:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // =============================================
  // TRADES
  // =============================================

  async createTrade(tradeData: CreateTradeData): Promise<{ success: boolean; data?: Trade; error?: string }> {
    try {
      console.log('📊 Creating trade:', tradeData);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Calculate total value
      const totalValue = tradeData.amount * tradeData.price;
      const fee = totalValue * 0.001; // 0.1% fee

      // Create trade
      const { data, error } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          trading_pair_id: tradeData.tradingPairId,
          trade_type: tradeData.tradeType,
          amount: tradeData.amount,
          price: tradeData.price,
          total_value: totalValue,
          fee: fee,
          status: 'open'
        })
        .select(`
          *,
          trading_pairs!inner(symbol)
        `)
        .single();

      if (error) {
        console.error('❌ Error creating trade:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Trade created successfully');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Unexpected error creating trade:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getTrades(userId?: string): Promise<{ success: boolean; data?: Trade[]; error?: string }> {
    try {
      console.log('📊 Fetching trades for user:', userId);
      
      // Check if supabase is properly initialized
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('❌ Supabase client not properly initialized');
        return { success: false, error: 'Supabase client not initialized' };
      }
      
      let query = supabase
        .from('trades')
        .select(`
          *,
          trading_pairs!inner(symbol)
        `)
        .order('created_at', { ascending: false });

      // Only add the eq filter if userId is provided and the query supports it
      if (userId && typeof query.eq === 'function') {
        query = query.eq('user_id', userId);
      } else if (userId) {
        console.warn('⚠️ Query does not support .eq method, skipping user filter');
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching trades:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Trades fetched successfully:', data?.length);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Unexpected error fetching trades:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getTrade(tradeId: string): Promise<{ success: boolean; data?: Trade; error?: string }> {
    try {
      console.log('📊 Fetching trade:', tradeId);
      
      const { data, error } = await supabase
        .from('trades')
        .select(`
          *,
          trading_pairs!inner(symbol)
        `)
        .eq('id', tradeId)
        .single();

      if (error) {
        console.error('❌ Error fetching trade:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Trade fetched successfully');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Unexpected error fetching trade:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async updateTrade(tradeId: string, updates: UpdateTradeData): Promise<{ success: boolean; data?: Trade; error?: string }> {
    try {
      console.log('📊 Updating trade:', tradeId, updates);
      
      const updateData: any = {};
      if (updates.result) updateData.result = updates.result;
      if (updates.status) updateData.status = updates.status;
      if (updates.profitLoss !== undefined) updateData.profit_loss = updates.profitLoss;
      
      if (updates.status === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('trades')
        .update(updateData)
        .eq('id', tradeId)
        .select(`
          *,
          trading_pairs!inner(symbol)
        `)
        .single();

      if (error) {
        console.error('❌ Error updating trade:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Trade updated successfully');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Unexpected error updating trade:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async closeTrade(tradeId: string, result: 'win' | 'loss' | 'draw', profitLoss: number): Promise<{ success: boolean; data?: Trade; error?: string }> {
    try {
      console.log('📊 Closing trade:', tradeId, result, profitLoss);
      
      const { data, error } = await supabase
        .from('trades')
        .update({
          status: 'closed',
          result: result,
          profit_loss: profitLoss,
          closed_at: new Date().toISOString()
        })
        .eq('id', tradeId)
        .select(`
          *,
          trading_pairs!inner(symbol)
        `)
        .single();

      if (error) {
        console.error('❌ Error closing trade:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Trade closed successfully');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Unexpected error closing trade:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // =============================================
  // WALLET BALANCES
  // =============================================

  async getWalletBalances(userId?: string): Promise<{ success: boolean; data?: WalletBalance[]; error?: string }> {
    try {
      console.log('💰 Fetching wallet balances for user:', userId);
      
      let query = supabase
        .from('wallet_balances')
        .select('*')
        .order('currency');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching wallet balances:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Wallet balances fetched successfully:', data?.length);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Unexpected error fetching wallet balances:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async updateWalletBalance(userId: string, currency: string, amount: number, operation: 'add' | 'subtract'): Promise<{ success: boolean; data?: WalletBalance; error?: string }> {
    try {
      console.log('💰 Updating wallet balance:', { userId, currency, amount, operation });
      
      // Get current balance
      const { data: currentBalance, error: fetchError } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('currency', currency)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Error fetching current balance:', fetchError);
        return { success: false, error: fetchError.message };
      }

      let newBalance = 0;
      let newAvailableBalance = 0;

      if (currentBalance) {
        newBalance = operation === 'add' ? currentBalance.balance + amount : currentBalance.balance - amount;
        newAvailableBalance = operation === 'add' ? currentBalance.available_balance + amount : currentBalance.available_balance - amount;
      } else {
        newBalance = operation === 'add' ? amount : -amount;
        newAvailableBalance = operation === 'add' ? amount : -amount;
      }

      // Ensure balances don't go negative
      if (newBalance < 0) {
        return { success: false, error: 'Insufficient balance' };
      }

      if (newAvailableBalance < 0) {
        return { success: false, error: 'Insufficient available balance' };
      }

      const { data, error } = await supabase
        .from('wallet_balances')
        .upsert({
          user_id: userId,
          currency: currency,
          balance: newBalance,
          available_balance: newAvailableBalance,
          locked_balance: currentBalance?.locked_balance || 0,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating wallet balance:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Wallet balance updated successfully');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Unexpected error updating wallet balance:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // =============================================
  // REAL-TIME SUBSCRIPTIONS
  // =============================================

  subscribeToTrades(userId: string, callback: (trade: Trade) => void): () => void {
    try {
      console.log('📊 Subscribing to trades for user:', userId);
      
      const subscription = supabase
        .channel('user_trades')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trades',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('📊 Trade update received:', payload);
            callback(payload.new as Trade);
          }
        )
        .subscribe();

      this.subscriptions.push(subscription);
      
      return () => {
        try {
          subscription.unsubscribe();
          this.subscriptions = this.subscriptions.filter(sub => sub !== subscription);
        } catch (error) {
          console.warn('⚠️ Error unsubscribing from trades:', error);
        }
      };
    } catch (error) {
      console.error('❌ Error setting up trade subscription:', error);
      return () => {};
    }
  }

  subscribeToWalletBalances(userId: string, callback: (balance: WalletBalance) => void): () => void {
    try {
      console.log('💰 Subscribing to wallet balances for user:', userId);
      
      const subscription = supabase
        .channel('user_wallet_balances')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallet_balances',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('💰 Wallet balance update received:', payload);
            callback(payload.new as WalletBalance);
          }
        )
        .subscribe();

      this.subscriptions.push(subscription);
      
      return () => {
        try {
          subscription.unsubscribe();
          this.subscriptions = this.subscriptions.filter(sub => sub !== subscription);
        } catch (error) {
          console.warn('⚠️ Error unsubscribing from wallet balances:', error);
        }
      };
    } catch (error) {
      console.error('❌ Error setting up wallet balance subscription:', error);
      return () => {};
    }
  }

  subscribeToPriceUpdates(callback: (priceData: any) => void): () => void {
    try {
      console.log('📈 Subscribing to price updates...');
      
      const subscription = supabase
        .channel('price_updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'price_history'
          },
          (payload) => {
            console.log('📈 Price update received:', payload);
            callback(payload.new);
          }
        )
        .subscribe();

      this.subscriptions.push(subscription);
      
      return () => {
        try {
          subscription.unsubscribe();
          this.subscriptions = this.subscriptions.filter(sub => sub !== subscription);
        } catch (error) {
          console.warn('⚠️ Error unsubscribing from price updates:', error);
        }
      };
    } catch (error) {
      console.error('❌ Error setting up price subscription:', error);
      return () => {};
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  async getLatestPrices(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      console.log('📈 Fetching latest prices...');
      
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Error fetching latest prices:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Latest prices fetched successfully');
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Unexpected error fetching latest prices:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getTradeStatistics(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('📊 Fetching trade statistics for user:', userId);
      
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error fetching trade statistics:', error);
        return { success: false, error: error.message };
      }

      // Calculate statistics
      const totalTrades = data?.length || 0;
      const winningTrades = data?.filter(trade => trade.result === 'win').length || 0;
      const losingTrades = data?.filter(trade => trade.result === 'loss').length || 0;
      const totalProfitLoss = data?.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0) || 0;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      const statistics = {
        totalTrades,
        winningTrades,
        losingTrades,
        totalProfitLoss,
        winRate: Math.round(winRate * 100) / 100
      };

      console.log('✅ Trade statistics calculated successfully');
      return { success: true, data: statistics };
    } catch (error) {
      console.error('❌ Unexpected error calculating trade statistics:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Alias for getTradeStatistics to match the expected method name
  async getTradingStats(userId?: string): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      console.log('📊 Fetching trading stats for user:', userId);
      
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      const result = await this.getTradeStatistics(userId);
      
      if (result.success) {
        return { success: true, stats: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error in getTradingStats:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Get recent trades for a user
  async getRecentTrades(userId: string, limit: number = 10): Promise<{ success: boolean; trades?: Trade[]; error?: string }> {
    try {
      console.log('📊 Fetching recent trades for user:', userId);
      
      const result = await this.getTrades(userId);
      
      if (result.success && result.data) {
        const recentTrades = result.data
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
        
        return { success: true, trades: recentTrades };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error in getRecentTrades:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Get portfolio data for a user
  async getPortfolioData(userId: string): Promise<{ success: boolean; portfolio?: any; error?: string }> {
    try {
      console.log('📊 Fetching portfolio data for user:', userId);
      
      // Get wallet balances
      const balanceResult = await this.getWalletBalances(userId);
      const tradesResult = await this.getTrades(userId);
      
      if (!balanceResult.success) {
        return { success: false, error: balanceResult.error };
      }

      const portfolio = {
        balances: balanceResult.data || [],
        totalValue: 0,
        totalProfit: 0,
        activeTrades: 0
      };

      // Calculate total value from balances
      portfolio.totalValue = (balanceResult.data || []).reduce((sum, balance) => sum + balance.balance, 0);
      
      // Calculate profit from trades
      if (tradesResult.success && tradesResult.data) {
        portfolio.totalProfit = tradesResult.data.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
        portfolio.activeTrades = tradesResult.data.filter(trade => trade.status === 'open').length;
      }

      return { success: true, portfolio };
    } catch (error) {
      console.error('❌ Error in getPortfolioData:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Get trade history with pagination
  async getTradeHistory(userId: string, page: number = 1, limit: number = 100): Promise<{ success: boolean; data?: Trade[]; error?: string }> {
    try {
      console.log('📊 Fetching trade history for user:', userId);
      
      const result = await this.getTrades(userId);
      
      if (result.success && result.data) {
        const offset = (page - 1) * limit;
        const paginatedTrades = result.data
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(offset, offset + limit);
        
        return { success: true, data: paginatedTrades };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error in getTradeHistory:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // =============================================
  // CLEANUP
  // =============================================

  cleanup() {
    console.log('🧹 Cleaning up trading service...');
    this.subscriptions.forEach(subscription => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.warn('⚠️ Error unsubscribing:', error);
      }
    });
    this.subscriptions = [];
  }
}

// Create singleton instance
const supabaseTradingService = new SupabaseTradingService();

export default supabaseTradingService; 