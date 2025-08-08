import { supabase } from '@/integrations/supabase/client'
import { Trade, TradeInsert, TradeUpdate, TradingPair, Transaction, TransactionInsert } from '@/integrations/supabase/types'

export interface TradingStats {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalProfit: number
  totalLoss: number
  netProfit: number
  averageWin: number
  averageLoss: number
  largestWin: number
  largestLoss: number
}

export interface PortfolioData {
  totalBalance: number
  totalValue: number
  totalPnL: number
  pnlPercentage: number
  assets: {
    symbol: string
    balance: number
    value: number
    price: number
    change24h: number
  }[]
}

export interface RealTimePrice {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  timestamp: string
}

class SupabaseTradingService {
  private priceSubscriptions: Map<string, any> = new Map()
  private tradeSubscriptions: Map<string, any> = new Map()
  private portfolioSubscriptions: Map<string, any> = new Map()

  // Trading operations
  async createTrade(tradeData: Omit<TradeInsert, 'id' | 'created_at'>): Promise<{ success: boolean; trade?: Trade; error?: string }> {
    try {
      const { data: trade, error } = await supabase
        .from('trades')
        .insert({
          ...tradeData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Create trade error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, trade }
    } catch (error) {
      console.error('Create trade error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async getTrades(userId: string, limit = 50, offset = 0): Promise<{ success: boolean; trades?: Trade[]; error?: string }> {
    try {
      const { data: trades, error } = await supabase
        .from('trades')
        .select(`
          *,
          trading_pairs (
            symbol,
            base_currency,
            quote_currency
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Get trades error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, trades: trades || [] }
    } catch (error) {
      console.error('Get trades error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async getTradeById(tradeId: string): Promise<{ success: boolean; trade?: Trade; error?: string }> {
    try {
      const { data: trade, error } = await supabase
        .from('trades')
        .select(`
          *,
          trading_pairs (
            symbol,
            base_currency,
            quote_currency
          )
        `)
        .eq('id', tradeId)
        .single()

      if (error) {
        console.error('Get trade error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, trade }
    } catch (error) {
      console.error('Get trade error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async updateTrade(tradeId: string, updates: Partial<TradeUpdate>): Promise<{ success: boolean; trade?: Trade; error?: string }> {
    try {
      const { data: trade, error } = await supabase
        .from('trades')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId)
        .select()
        .single()

      if (error) {
        console.error('Update trade error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, trade }
    } catch (error) {
      console.error('Update trade error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Trading pairs
  async getTradingPairs(): Promise<{ success: boolean; pairs?: TradingPair[]; error?: string }> {
    try {
      const { data: pairs, error } = await supabase
        .from('trading_pairs')
        .select('*')
        .eq('is_active', true)
        .order('symbol')

      if (error) {
        console.error('Get trading pairs error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, pairs: pairs || [] }
    } catch (error) {
      console.error('Get trading pairs error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async getTradingPairBySymbol(symbol: string): Promise<{ success: boolean; pair?: TradingPair; error?: string }> {
    try {
      const { data: pair, error } = await supabase
        .from('trading_pairs')
        .select('*')
        .eq('symbol', symbol)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Get trading pair error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, pair }
    } catch (error) {
      console.error('Get trading pair error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Transactions
  async createTransaction(transactionData: Omit<TransactionInsert, 'id' | 'created_at'>): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          ...transactionData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Create transaction error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, transaction }
    } catch (error) {
      console.error('Create transaction error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async getTransactions(userId: string, limit = 50, offset = 0): Promise<{ success: boolean; transactions?: Transaction[]; error?: string }> {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Get transactions error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, transactions: transactions || [] }
    } catch (error) {
      console.error('Get transactions error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Trading statistics
  async getTradingStats(userId: string): Promise<{ success: boolean; stats?: TradingStats; error?: string }> {
    try {
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')

      if (error) {
        console.error('Get trading stats error:', error)
        return { success: false, error: error.message }
      }

      const completedTrades = trades || []
      const totalTrades = completedTrades.length
      const winningTrades = completedTrades.filter(t => t.result === 'win')
      const losingTrades = completedTrades.filter(t => t.result === 'loss')
      
      const totalProfit = winningTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0)
      const totalLoss = losingTrades.reduce((sum, t) => sum + Math.abs(t.profit_loss || 0), 0)
      const netProfit = totalProfit - totalLoss
      
      const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0
      const averageWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0
      const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0
      
      const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profit_loss || 0)) : 0
      const largestLoss = losingTrades.length > 0 ? Math.max(...losingTrades.map(t => Math.abs(t.profit_loss || 0))) : 0

      const stats: TradingStats = {
        totalTrades,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate,
        totalProfit,
        totalLoss,
        netProfit,
        averageWin,
        averageLoss,
        largestWin,
        largestLoss
      }

      return { success: true, stats }
    } catch (error) {
      console.error('Get trading stats error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Portfolio data
  async getPortfolioData(userId: string): Promise<{ success: boolean; portfolio?: PortfolioData; error?: string }> {
    try {
      // Get user profile for account balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('account_balance')
        .eq('user_id', userId)
        .single()

      if (profileError) {
        console.error('Get profile error:', profileError)
        return { success: false, error: profileError.message }
      }

      // Get trading pairs for current prices
      const { data: pairs, error: pairsError } = await supabase
        .from('trading_pairs')
        .select('*')
        .eq('is_active', true)

      if (pairsError) {
        console.error('Get trading pairs error:', pairsError)
        return { success: false, error: pairsError.message }
      }

      // Calculate portfolio data
      const totalBalance = profile.account_balance || 0
      const assets = pairs?.map(pair => ({
        symbol: pair.symbol,
        balance: 0, // This would come from a separate wallet/balance table
        value: 0,
        price: pair.current_price,
        change24h: pair.price_change_24h
      })) || []

      const totalValue = totalBalance + assets.reduce((sum, asset) => sum + asset.value, 0)
      const totalPnL = 0 // This would be calculated from trade history
      const pnlPercentage = totalValue > 0 ? (totalPnL / totalValue) * 100 : 0

      const portfolio: PortfolioData = {
        totalBalance,
        totalValue,
        totalPnL,
        pnlPercentage,
        assets
      }

      return { success: true, portfolio }
    } catch (error) {
      console.error('Get portfolio data error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Real-time subscriptions
  subscribeToPriceUpdates(symbols: string[], callback: (price: RealTimePrice) => void): () => void {
    const channelId = `price-updates-${Date.now()}`
    
    const subscription = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trading_pairs',
          filter: `symbol=in.(${symbols.join(',')})`
        },
        (payload) => {
          const pair = payload.new as TradingPair
          const price: RealTimePrice = {
            symbol: pair.symbol,
            price: pair.current_price,
            change24h: pair.price_change_24h,
            volume24h: pair.volume_24h,
            timestamp: new Date().toISOString()
          }
          callback(price)
        }
      )
      .subscribe()

    this.priceSubscriptions.set(channelId, subscription)

    return () => {
      subscription.unsubscribe()
      this.priceSubscriptions.delete(channelId)
    }
  }

  subscribeToUserTrades(userId: string, callback: (trade: Trade) => void): () => void {
    const channelId = `user-trades-${userId}-${Date.now()}`
    
    const subscription = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const trade = payload.new as Trade
          callback(trade)
        }
      )
      .subscribe()

    this.tradeSubscriptions.set(channelId, subscription)

    return () => {
      subscription.unsubscribe()
      this.tradeSubscriptions.delete(channelId)
    }
  }

  subscribeToUserTransactions(userId: string, callback: (transaction: Transaction) => void): () => void {
    const channelId = `user-transactions-${userId}-${Date.now()}`
    
    const subscription = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const transaction = payload.new as Transaction
          callback(transaction)
        }
      )
      .subscribe()

    this.tradeSubscriptions.set(channelId, subscription)

    return () => {
      subscription.unsubscribe()
      this.tradeSubscriptions.delete(channelId)
    }
  }

  // Cleanup
  cleanup() {
    this.priceSubscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        try {
          sub.unsubscribe()
        } catch (error) {
          console.warn('Error unsubscribing from price subscription:', error)
        }
      }
    })
    this.tradeSubscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        try {
          sub.unsubscribe()
        } catch (error) {
          console.warn('Error unsubscribing from trade subscription:', error)
        }
      }
    })
    this.portfolioSubscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        try {
          sub.unsubscribe()
        } catch (error) {
          console.warn('Error unsubscribing from portfolio subscription:', error)
        }
      }
    })
    
    this.priceSubscriptions.clear()
    this.tradeSubscriptions.clear()
    this.portfolioSubscriptions.clear()
  }

  // Utility methods
  async simulateTrade(userId: string, symbol: string, amount: number, tradeType: 'buy' | 'sell'): Promise<{ success: boolean; trade?: Trade; error?: string }> {
    try {
      // Get trading pair
      const { data: pair, error: pairError } = await supabase
        .from('trading_pairs')
        .select('*')
        .eq('symbol', symbol)
        .single()

      if (pairError) {
        return { success: false, error: 'Trading pair not found' }
      }

      // Simulate trade result (50/50 win/loss for demo)
      const isWin = Math.random() > 0.5
      const result = isWin ? 'win' : 'loss'
      const profitLoss = isWin ? amount * 0.1 : -amount * 0.05 // 10% profit or 5% loss

      const tradeData: Omit<TradeInsert, 'id' | 'created_at'> = {
        user_id: userId,
        trading_pair_id: pair.id,
        trade_type: tradeType,
        amount,
        price: pair.current_price,
        total_value: amount * pair.current_price,
        status: 'completed',
        result,
        profit_loss: profitLoss,
        completed_at: new Date().toISOString(),
        forced_outcome: false
      }

      return await this.createTrade(tradeData)
    } catch (error) {
      console.error('Simulate trade error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async getRecentTrades(userId: string, limit = 10): Promise<{ success: boolean; trades?: Trade[]; error?: string }> {
    return this.getTrades(userId, limit, 0)
  }

  async getTradeHistory(userId: string, page = 1, pageSize = 20): Promise<{ success: boolean; trades?: Trade[]; total?: number; error?: string }> {
    try {
      const offset = (page - 1) * pageSize
      
      // Get total count
      const { count, error: countError } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (countError) {
        console.error('Get trade count error:', countError)
        return { success: false, error: countError.message }
      }

      // Get trades
      const { success, trades, error } = await this.getTrades(userId, pageSize, offset)
      
      if (!success) {
        return { success: false, error }
      }

      return { success: true, trades, total: count || 0 }
    } catch (error) {
      console.error('Get trade history error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }
}

// Create singleton instance
const supabaseTradingService = new SupabaseTradingService()
export default supabaseTradingService 