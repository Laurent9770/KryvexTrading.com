interface ForexPriceFormatted {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
  rawPrice: number;
  rawChangePercent: number;
}

class ForexPriceService {
  private static instance: ForexPriceService;
  private prices: Map<string, ForexPriceFormatted> = new Map();
  private lastUpdate: Date | null = null;
  private updateInterval: number = 60000; // 1 minute
  private listeners: Set<(prices: Map<string, ForexPriceFormatted>) => void> = new Set();
  private isUpdating: boolean = false;

  private constructor() {
    this.initializeMockPrices();
  }

  static getInstance(): ForexPriceService {
    if (!ForexPriceService.instance) {
      ForexPriceService.instance = new ForexPriceService();
    }
    return ForexPriceService.instance;
  }

  private initializeMockPrices(): void {
    const mockPrices: ForexPriceFormatted[] = [
      {
        symbol: 'EURUSD',
        name: 'Euro / US Dollar',
        price: '$1.0864',
        change: '+0.12%',
        isPositive: true,
        rawPrice: 1.0864,
        rawChangePercent: 0.12
      },
      {
        symbol: 'GBPUSD',
        name: 'British Pound / US Dollar',
        price: '$1.2734',
        change: '-0.08%',
        isPositive: false,
        rawPrice: 1.2734,
        rawChangePercent: -0.08
      },
      {
        symbol: 'USDJPY',
        name: 'US Dollar / Japanese Yen',
        price: '¥148.32',
        change: '+0.24%',
        isPositive: true,
        rawPrice: 148.32,
        rawChangePercent: 0.24
      },
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: '$185.67',
        change: '+1.45%',
        isPositive: true,
        rawPrice: 185.67,
        rawChangePercent: 1.45
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: '$248.85',
        change: '+2.67%',
        isPositive: true,
        rawPrice: 248.85,
        rawChangePercent: 2.67
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: '$2845.32',
        change: '-0.45%',
        isPositive: false,
        rawPrice: 2845.32,
        rawChangePercent: -0.45
      },
      {
        symbol: 'XAUUSD',
        name: 'Gold / US Dollar',
        price: '$2015.67',
        change: '+0.78%',
        isPositive: true,
        rawPrice: 2015.67,
        rawChangePercent: 0.78
      },
      {
        symbol: 'XAGUSD',
        name: 'Silver / US Dollar',
        price: '$24.85',
        change: '+1.23%',
        isPositive: true,
        rawPrice: 24.85,
        rawChangePercent: 1.23
      },
      {
        symbol: 'SPX',
        name: 'S&P 500',
        price: '$4785.23',
        change: '+0.45%',
        isPositive: true,
        rawPrice: 4785.23,
        rawChangePercent: 0.45
      },
      {
        symbol: 'IXIC',
        name: 'NASDAQ',
        price: '$15234.56',
        change: '+0.89%',
        isPositive: true,
        rawPrice: 15234.56,
        rawChangePercent: 0.89
      }
    ];

    mockPrices.forEach(price => {
      this.prices.set(price.symbol, price);
    });

    this.lastUpdate = new Date();
  }

  private updateMockPrices(): void {
    this.prices.forEach((price, symbol) => {
      // Simulate small price movements
      const changePercent = (Math.random() - 0.5) * 2; // -1% to +1%
      const newPrice = price.rawPrice * (1 + changePercent / 100);
      
      const updatedPrice: ForexPriceFormatted = {
        ...price,
        rawPrice: newPrice,
        rawChangePercent: changePercent,
        price: this.formatPrice(newPrice),
        change: this.formatChange(changePercent),
        isPositive: changePercent >= 0
      };
      
      this.prices.set(symbol, updatedPrice);
    });
    
    this.lastUpdate = new Date();
  }

  private formatPrice(price: number): string {
    if (price < 1) {
      return `$${price.toFixed(4)}`;
    } else if (price < 100) {
      return `$${price.toFixed(2)}`;
    } else if (price < 1000) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }

  private formatChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  async fetchPrices(): Promise<void> {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.updateMockPrices();
      this.notifyListeners();
    } catch (error) {
      console.error('Error fetching forex prices:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(new Map(this.prices));
      } catch (error) {
        console.error('Error notifying forex price listener:', error);
      }
    });
  }

  subscribe(callback: (prices: Map<string, ForexPriceFormatted>) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current prices
    callback(new Map(this.prices));
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  getPrices(): Map<string, ForexPriceFormatted> {
    return new Map(this.prices);
  }

  getPrice(symbol: string): ForexPriceFormatted | null {
    return this.prices.get(symbol.toUpperCase()) || null;
  }

  getLastUpdateTime(): Date | null {
    return this.lastUpdate;
  }

  shouldUpdate(): boolean {
    if (!this.lastUpdate) return true;
    return Date.now() - this.lastUpdate.getTime() > this.updateInterval;
  }

  startAutoUpdate(): void {
    if (this.isUpdating) return;
    
    const update = async () => {
      await this.fetchPrices();
      setTimeout(update, this.updateInterval);
    };
    
    update();
  }

  stopAutoUpdate(): void {
    this.isUpdating = false;
  }

  refresh(): void {
    this.fetchPrices();
  }
}

export const forexPriceService = ForexPriceService.getInstance();
export type { ForexPriceFormatted };
