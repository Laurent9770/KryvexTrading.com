import { supabase } from '@/integrations/supabase/client';

export interface TradeRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  postOnly?: boolean;
  reduceOnly?: boolean;
  leverage?: number;
  marginType?: 'isolated' | 'cross';
}

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price: number;
  stopPrice?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  filledQuantity: number;
  averagePrice: number;
  commission: number;
  commissionAsset: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: number;
  executedQty: number;
  cummulativeQuoteQty: number;
  origQty: number;
  timeInForce: string;
  type_: string;
  side_: string;
}

export interface SpotTrade {
  id: string;
  userId: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  duration: number;
  status: 'active' | 'completed' | 'cancelled';
  startTime: number;
  endTime?: number;
  profit?: number;
  result?: 'win' | 'loss' | 'pending';
}

export interface FuturesTrade {
  id: string;
  userId: string;
  symbol: string;
  side: 'long' | 'short';
  amount: number;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  marginType: 'isolated' | 'cross';
  status: 'open' | 'closed';
  openTime: number;
  closeTime?: number;
  realizedPnl?: number;
}

class SupabaseTradingPageService {
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  // Spot Trading Methods
  async placeSpotTrade(tradeRequest: TradeRequest): Promise<Trade> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    try {
      const { data, error } = await supabase
        .from('trades')
        .insert({
          user_id: this.userId,
          trading_pair_id: tradeRequest.symbol,
          trade_type: tradeRequest.side,
          amount: tradeRequest.quantity,
          price: tradeRequest.price || 0,
          status: 'pending',
          result: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapTradeData(data);
    } catch (error) {
      console.error('Error placing spot trade:', error);
      throw error;
    }
  }

  async getSpotTrades(): Promise<SpotTrade[]> {
    if (!this.userId) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching spot trades:', error);
        return [];
      }

      return data.map(trade => ({
        id: trade.id,
        userId: trade.user_id,
        symbol: trade.trading_pair_id,
        side: trade.trade_type,
        amount: trade.amount,
        price: trade.price,
        duration: 0, // Not stored in database
        status: trade.status === 'completed' ? 'completed' : 
                trade.status === 'cancelled' ? 'cancelled' : 'active',
        startTime: new Date(trade.created_at).getTime(),
        endTime: trade.completed_at ? new Date(trade.completed_at).getTime() : undefined,
        profit: trade.profit_loss,
        result: trade.result
      }));
    } catch (error) {
      console.error('Error fetching spot trades:', error);
      return [];
    }
  }

  // Futures Trading Methods
  async placeFuturesTrade(tradeRequest: TradeRequest): Promise<FuturesTrade> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    try {
      const { data, error } = await supabase
        .from('trades')
        .insert({
          user_id: this.userId,
          trading_pair_id: tradeRequest.symbol,
          trade_type: tradeRequest.side,
          amount: tradeRequest.quantity,
          price: tradeRequest.price || 0,
          status: 'pending',
          result: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapFuturesTradeData(data);
    } catch (error) {
      console.error('Error placing futures trade:', error);
      throw error;
    }
  }

  async getFuturesTrades(): Promise<FuturesTrade[]> {
    if (!this.userId) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching futures trades:', error);
        return [];
      }

      return data.map(trade => ({
        id: trade.id,
        userId: trade.user_id,
        symbol: trade.trading_pair_id,
        side: trade.trade_type as 'long' | 'short',
        amount: trade.amount,
        leverage: 10, // Default leverage
        entryPrice: trade.price,
        markPrice: trade.price, // Use entry price as mark price for now
        unrealizedPnl: trade.profit_loss || 0,
        marginType: 'cross' as const,
        status: trade.status === 'completed' ? 'closed' : 'open',
        openTime: new Date(trade.created_at).getTime(),
        closeTime: trade.completed_at ? new Date(trade.completed_at).getTime() : undefined,
        realizedPnl: trade.profit_loss
      }));
    } catch (error) {
      console.error('Error fetching futures trades:', error);
      return [];
    }
  }

  // Trading Pairs
  async getTradingPairs(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('trading_pairs')
        .select('*')
        .order('symbol');

      if (error) {
        console.error('Error fetching trading pairs:', error);
        return [];
      }

      return data.map(pair => ({
        symbol: pair.symbol,
        baseAsset: pair.base_asset,
        quoteAsset: pair.quote_asset,
        status: pair.status,
        price: 0, // Will be updated by price service
        change: 0,
        volume: 0
      }));
    } catch (error) {
      console.error('Error fetching trading pairs:', error);
      return [];
    }
  }

  // Real-time subscriptions
  subscribeToTrades(callback: (trade: any) => void) {
    if (!this.userId) return null;

    const subscription = supabase
      .channel(`trades:${this.userId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'trades',
          filter: `user_id=eq.${this.userId}`
        }, 
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  }

  subscribeToTradeUpdates(callback: (trade: any) => void) {
    if (!this.userId) return null;

    const subscription = supabase
      .channel(`trade_updates:${this.userId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'trades',
          filter: `user_id=eq.${this.userId}`
        }, 
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  }

  // Helper methods
  private mapTradeData(data: any): Trade {
    return {
      id: data.id,
      userId: data.user_id,
      symbol: data.trading_pair_id,
      side: data.trade_type,
      type: 'market',
      quantity: data.amount,
      price: data.price,
      status: data.status,
      filledQuantity: data.amount,
      averagePrice: data.price,
      commission: 0,
      commissionAsset: 'USDT',
      time: new Date(data.created_at).getTime(),
      updateTime: new Date(data.updated_at || data.created_at).getTime(),
      isWorking: data.status === 'pending',
      origQuoteOrderQty: data.amount * data.price,
      executedQty: data.amount,
      cummulativeQuoteQty: data.amount * data.price,
      origQty: data.amount,
      timeInForce: 'GTC',
      type_: 'MARKET',
      side_: data.trade_type.toUpperCase()
    };
  }

  private mapFuturesTradeData(data: any): FuturesTrade {
    return {
      id: data.id,
      userId: data.user_id,
      symbol: data.trading_pair_id,
      side: data.trade_type as 'long' | 'short',
      amount: data.amount,
      leverage: 10,
      entryPrice: data.price,
      markPrice: data.price,
      unrealizedPnl: data.profit_loss || 0,
      marginType: 'cross',
      status: data.status === 'completed' ? 'closed' : 'open',
      openTime: new Date(data.created_at).getTime(),
      closeTime: data.completed_at ? new Date(data.completed_at).getTime() : undefined,
      realizedPnl: data.profit_loss
    };
  }

  // Cleanup
  cleanup() {
    // Unsubscribe from all channels
    supabase.removeAllChannels();
  }
}

const supabaseTradingPageService = new SupabaseTradingPageService();
export default supabaseTradingPageService; 