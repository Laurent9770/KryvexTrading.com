interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  last_updated: string;
}

interface CryptoPriceFormatted {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
  marketCap: string;
  volume: string;
  rawPrice: number;
  rawChange: number;
}

class CryptoPriceService {
  private static instance: CryptoPriceService;
  private prices: Map<string, CryptoPriceFormatted> = new Map();
  private lastUpdate: Date | null = null;
  private updateInterval: number = 60000; // 1 minute
  private listeners: Set<(prices: Map<string, CryptoPriceFormatted>) => void> = new Set();

  private constructor() {}

  static getInstance(): CryptoPriceService {
    if (!CryptoPriceService.instance) {
      CryptoPriceService.instance = new CryptoPriceService();
    }
    return CryptoPriceService.instance;
  }

  private formatPrice(price: number): string {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    } else if (price < 1) {
      return `$${price.toFixed(4)}`;
    } else if (price < 100) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }

  private formatLargeNumber(num: number): string {
    if (num >= 1e12) {
      return `$${(num / 1e12).toFixed(1)}T`;
    } else if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(1)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(1)}M`;
    } else if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(1)}K`;
    }
    return `$${num.toFixed(0)}`;
  }

  private formatChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  async fetchPrices(): Promise<void> {
    try {
      const coinIds = [
        'bitcoin',
        'ethereum', 
        'binancecoin',
        'solana',
        'ripple',
        'cardano',
        'avalanche-2',
        'shiba-inu',
        'chainlink',
        'polygon'
      ];

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const symbolMap: Record<string, { name: string; symbol: string }> = {
        'bitcoin': { name: 'Bitcoin', symbol: 'BTC' },
        'ethereum': { name: 'Ethereum', symbol: 'ETH' },
        'binancecoin': { name: 'BNB', symbol: 'BNB' },
        'solana': { name: 'Solana', symbol: 'SOL' },
        'ripple': { name: 'XRP', symbol: 'XRP' },
        'cardano': { name: 'Cardano', symbol: 'ADA' },
        'avalanche-2': { name: 'Avalanche', symbol: 'AVAX' },
        'shiba-inu': { name: 'Shiba Inu', symbol: 'SHIB' },
        'chainlink': { name: 'Chainlink', symbol: 'LINK' },
        'polygon': { name: 'Polygon', symbol: 'MATIC' }
      };

      this.prices.clear();
      
      Object.entries(data).forEach(([coinId, priceData]: [string, any]) => {
        const info = symbolMap[coinId];
        if (info && priceData) {
          const formatted: CryptoPriceFormatted = {
            symbol: info.symbol,
            name: info.name,
            price: this.formatPrice(priceData.usd),
            change: this.formatChange(priceData.usd_24h_change || 0),
            isPositive: (priceData.usd_24h_change || 0) >= 0,
            marketCap: this.formatLargeNumber(priceData.usd_market_cap || 0),
            volume: this.formatLargeNumber(priceData.usd_24h_vol || 0),
            rawPrice: priceData.usd,
            rawChange: priceData.usd_24h_change || 0
          };
          
          this.prices.set(info.symbol, formatted);
        }
      });

      this.lastUpdate = new Date();
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error);
      // Fallback to mock data if API fails
      this.setFallbackPrices();
    }
  }

  private setFallbackPrices(): void {
    const fallbackData: CryptoPriceFormatted[] = [
      { symbol: 'BTC', name: 'Bitcoin', price: '$97,234.50', change: '+2.45%', isPositive: true, marketCap: '$1.9T', volume: '$342M', rawPrice: 97234.50, rawChange: 2.45 },
      { symbol: 'ETH', name: 'Ethereum', price: '$3,456.78', change: '-1.23%', isPositive: false, marketCap: '$415B', volume: '$187M', rawPrice: 3456.78, rawChange: -1.23 },
      { symbol: 'BNB', name: 'BNB', price: '$692.34', change: '+4.67%', isPositive: true, marketCap: '$103B', volume: '$89M', rawPrice: 692.34, rawChange: 4.67 },
      { symbol: 'SOL', name: 'Solana', price: '$234.56', change: '+6.78%', isPositive: true, marketCap: '$110B', volume: '$76M', rawPrice: 234.56, rawChange: 6.78 },
      { symbol: 'XRP', name: 'XRP', price: '$2.34', change: '+15.67%', isPositive: true, marketCap: '$133B', volume: '$98M', rawPrice: 2.34, rawChange: 15.67 }
    ];

    this.prices.clear();
    fallbackData.forEach(crypto => {
      this.prices.set(crypto.symbol, crypto);
    });
    
    this.lastUpdate = new Date();
    this.notifyListeners();
  }

  getPrices(): Map<string, CryptoPriceFormatted> {
    return new Map(this.prices);
  }

  getPrice(symbol: string): CryptoPriceFormatted | null {
    return this.prices.get(symbol.toUpperCase()) || null;
  }

  subscribe(callback: (prices: Map<string, CryptoPriceFormatted>) => void): () => void {
    this.listeners.add(callback);
    
    // If we have prices, call immediately
    if (this.prices.size > 0) {
      callback(this.prices);
    }

    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      callback(this.prices);
    });
  }

  startAutoUpdate(): void {
    // Initial fetch
    this.fetchPrices();
    
    // Set up interval
    setInterval(() => {
      this.fetchPrices();
    }, this.updateInterval);
  }

  shouldUpdate(): boolean {
    if (!this.lastUpdate) return true;
    const now = new Date();
    return (now.getTime() - this.lastUpdate.getTime()) > this.updateInterval;
  }

  getLastUpdateTime(): Date | null {
    return this.lastUpdate;
  }
}

export const cryptoPriceService = CryptoPriceService.getInstance();
export type { CryptoPriceFormatted };