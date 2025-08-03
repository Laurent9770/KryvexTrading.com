import websocketService from './websocketService';

export interface Trade {
  id: string;
  user_id: string;
  trading_pair: string;
  trade_type: 'buy' | 'sell';
  order_type: 'market' | 'limit' | 'stop';
  amount: number;
  price: number;
  total_value: number;
  status: 'pending' | 'completed' | 'cancelled';
  outcome?: 'win' | 'loss';
  profit_loss?: number;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  locked_balance: number;
}

export interface CryptoPrice {
  symbol: string;
  price: number;
  change_24h: number;
  volume_24h: number;
}

class TradingService {
  private trades: Trade[] = [];
  private wallets: Wallet[] = [];
  private cryptoPrices: CryptoPrice[] = [];
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupWebSocketListeners();
    this.startPriceUpdates();
  }

  private setupWebSocketListeners() {
    websocketService.on('trade_created', (trade: Trade) => {
      this.trades.push(trade);
      this.emit('trade_created', trade);
    });

    websocketService.on('wallet_updated', (wallet: Wallet) => {
      const index = this.wallets.findIndex(w => w.id === wallet.id);
      if (index >= 0) {
        this.wallets[index] = wallet;
      } else {
        this.wallets.push(wallet);
      }
      this.emit('wallet_updated', wallet);
    });

    websocketService.on('user_data', (data: any) => {
      this.trades = data.trades || [];
      this.wallets = data.wallets || [];
      this.emit('data_loaded', { trades: this.trades, wallets: this.wallets });
    });
  }

  private startPriceUpdates() {
    // Simulate real-time price updates
    setInterval(() => {
      this.updateCryptoPrices();
    }, 5000); // Update every 5 seconds
  }

  private updateCryptoPrices() {
    const symbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT'];
    
    this.cryptoPrices = symbols.map(symbol => ({
      symbol,
      price: this.generateRandomPrice(symbol),
      change_24h: this.generateRandomChange(),
      volume_24h: this.generateRandomVolume()
    }));

    this.emit('prices_updated', this.cryptoPrices);
  }

  private generateRandomPrice(symbol: string): number {
    const basePrices: { [key: string]: number } = {
      'BTC/USDT': 45000,
      'ETH/USDT': 3000,
      'BNB/USDT': 300,
      'ADA/USDT': 0.5,
      'SOL/USDT': 100
    };
    
    const basePrice = basePrices[symbol] || 100;
    const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
    return basePrice * (1 + variation);
  }

  private generateRandomChange(): number {
    return (Math.random() - 0.5) * 10; // ±5% change
  }

  private generateRandomVolume(): number {
    return Math.random() * 1000000 + 100000; // 100k to 1.1M
  }

  // Trading methods
  async createTrade(tradeData: Omit<Trade, 'id' | 'created_at'>): Promise<Trade> {
    const trade: Trade = {
      ...tradeData,
      id: `trade-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    websocketService.createTrade(trade);
    return trade;
  }

  async getTrades(userId?: string): Promise<Trade[]> {
    if (userId) {
      return this.trades.filter(trade => trade.user_id === userId);
    }
    return this.trades;
  }

  async getWallets(userId?: string): Promise<Wallet[]> {
    if (userId) {
      return this.wallets.filter(wallet => wallet.user_id === userId);
    }
    return this.wallets;
  }

  async getCryptoPrices(): Promise<CryptoPrice[]> {
    return this.cryptoPrices;
  }

  async updateWallet(userId: string, currency: string, amount: number, type: 'add' | 'subtract') {
    websocketService.updateWallet(userId, currency, amount, type);
  }

  // Admin methods
  async forceTradeOutcome(tradeId: string, outcome: 'win' | 'loss') {
    const trade = this.trades.find(t => t.id === tradeId);
    if (trade) {
      trade.outcome = outcome;
      trade.profit_loss = outcome === 'win' ? Math.abs(trade.total_value * 0.1) : -trade.total_value * 0.05;
      this.emit('trade_updated', trade);
    }
  }

  async cancelTrade(tradeId: string) {
    const trade = this.trades.find(t => t.id === tradeId);
    if (trade && trade.status === 'pending') {
      trade.status = 'cancelled';
      this.emit('trade_updated', trade);
    }
  }

  // Event listeners
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Utility methods
  calculateProfitLoss(trade: Trade): number {
    if (!trade.outcome) return 0;
    return trade.outcome === 'win' ? trade.total_value * 0.1 : -trade.total_value * 0.05;
  }

  getTotalBalance(wallets: Wallet[]): number {
    return wallets.reduce((total, wallet) => {
      if (wallet.currency === 'USDT') {
        return total + wallet.balance;
      }
      // For other currencies, you might want to convert to USDT
      return total + wallet.balance * 0.1; // Mock conversion
    }, 0);
  }

  formatCurrency(amount: number, currency: string = 'USDT'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USDT' ? 'USD' : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }
}

// Create singleton instance
const tradingService = new TradingService();
export default tradingService; 