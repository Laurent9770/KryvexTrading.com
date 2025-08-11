interface ForexPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume?: number;
  lastUpdated: string;
}

interface ForexPriceFormatted {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  rawPrice: number;
  rawChange: number;
  rawChangePercent: number;
  high: string;
  low: string;
  volume?: string;
  lastUpdated: string;
}

class ForexPriceService {
  private static instance: ForexPriceService;
  private prices: Map<string, ForexPriceFormatted> = new Map();
  private lastUpdate: Date | null = null;
  private updateInterval: number = 30000; // 30 seconds for forex
  private listeners: Set<(prices: Map<string, ForexPriceFormatted>) => void> = new Set();
  private isUpdating: boolean = false;

  private constructor() {}

  static getInstance(): ForexPriceService {
    if (!ForexPriceService.instance) {
      ForexPriceService.instance = new ForexPriceService();
    }
    return ForexPriceService.instance;
  }

  private formatPrice(price: number, symbol: string): string {
    // Forex pairs typically have 4-5 decimal places
    if (symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('GBP')) {
      return price.toFixed(5);
    }
    // JPY pairs have 2-3 decimal places
    if (symbol.includes('JPY')) {
      return price.toFixed(3);
    }
    // Stocks and indices
    if (price < 1) {
      return price.toFixed(4);
    } else if (price < 100) {
      return price.toFixed(2);
    } else {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }

  private formatChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(4)}`;
  }

  private formatChangePercent(changePercent: number): string {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  }

  private formatLargeNumber(num: number): string {
    if (num >= 1e12) {
      return `${(num / 1e12).toFixed(1)}T`;
    } else if (num >= 1e9) {
      return `${(num / 1e9).toFixed(1)}B`;
    } else if (num >= 1e6) {
      return `${(num / 1e6).toFixed(1)}M`;
    } else if (num >= 1e3) {
      return `${(num / 1e3).toFixed(1)}K`;
    }
    return num.toFixed(0);
  }

  async fetchForexPrices(): Promise<void> {
    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      // Forex pairs using Alpha Vantage API (free tier)
      const forexSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD'];
      const forexData = await this.fetchAlphaVantageForex(forexSymbols);

      // Stocks using Alpha Vantage API
      const stockSymbols = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META'];
      const stockData = await this.fetchAlphaVantageStocks(stockSymbols);

      // Commodities and indices using alternative API
      const commodityData = await this.fetchCommoditiesAndIndices();

      // Combine all data
      const allData = [...forexData, ...stockData, ...commodityData];

      // Update prices map
      allData.forEach(item => {
        this.prices.set(item.symbol, {
          symbol: item.symbol,
          name: item.name,
          price: this.formatPrice(item.price, item.symbol),
          change: this.formatChange(item.change),
          changePercent: this.formatChangePercent(item.changePercent),
          isPositive: item.changePercent >= 0,
          rawPrice: item.price,
          rawChange: item.change,
          rawChangePercent: item.changePercent,
          high: this.formatPrice(item.high, item.symbol),
          low: this.formatPrice(item.low, item.symbol),
          volume: item.volume ? this.formatLargeNumber(item.volume) : undefined,
          lastUpdated: item.lastUpdated
        });
      });

      this.lastUpdate = new Date();
      this.notifyListeners();

    } catch (error) {
      console.error('Error fetching forex prices:', error);
      // Set fallback prices if API fails
      this.setFallbackPrices();
    } finally {
      this.isUpdating = false;
    }
  }

  private async fetchAlphaVantageForex(symbols: string[]): Promise<ForexPrice[]> {
    const results: ForexPrice[] = [];
    
    for (const symbol of symbols) {
      try {
        // Using Alpha Vantage API for forex data
        const response = await fetch(
          `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol.slice(0, 3)}&to_currency=${symbol.slice(3)}&apikey=demo`,
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
        
        if (data['Realtime Currency Exchange Rate']) {
          const rate = data['Realtime Currency Exchange Rate'];
          const price = parseFloat(rate['5. Exchange Rate']);
          const change = 0; // Alpha Vantage doesn't provide change in free tier
          const changePercent = 0;
          
          results.push({
            symbol,
            name: `${symbol.slice(0, 3)}/${symbol.slice(3)}`,
            price,
            change,
            changePercent,
            high: price,
            low: price,
            lastUpdated: rate['6. Last Refreshed']
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch ${symbol}:`, error);
      }
    }

    return results;
  }

  private async fetchAlphaVantageStocks(symbols: string[]): Promise<ForexPrice[]> {
    const results: ForexPrice[] = [];
    
    for (const symbol of symbols) {
      try {
        // Using Alpha Vantage API for stock data
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`,
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
        
        if (data['Global Quote']) {
          const quote = data['Global Quote'];
          const price = parseFloat(quote['05. price']);
          const change = parseFloat(quote['09. change']);
          const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
          const high = parseFloat(quote['03. high']);
          const low = parseFloat(quote['04. low']);
          const volume = parseFloat(quote['06. volume']);
          
          results.push({
            symbol,
            name: this.getStockName(symbol),
            price,
            change,
            changePercent,
            high,
            low,
            volume,
            lastUpdated: quote['07. latest trading day']
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch ${symbol}:`, error);
      }
    }

    return results;
  }

  private async fetchCommoditiesAndIndices(): Promise<ForexPrice[]> {
    // For commodities and indices, we'll use a different approach
    // Since Alpha Vantage has limitations, we'll use a more reliable source
    const results: ForexPrice[] = [];
    
    try {
      // Using a free financial API for commodities and indices
      const response = await fetch(
        'https://api.twelvedata.com/price?symbol=XAUUSD,XAGUSD,SPX,IXIC&apikey=demo',
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            const symbol = item.symbol;
            const price = parseFloat(item.price);
            const change = 0; // API doesn't provide change in this endpoint
            const changePercent = 0;
            
            results.push({
              symbol,
              name: this.getCommodityIndexName(symbol),
              price,
              change,
              changePercent,
              high: price,
              low: price,
              lastUpdated: new Date().toISOString()
            });
          });
        }
      }
    } catch (error) {
      console.warn('Failed to fetch commodities and indices:', error);
    }

    return results;
  }

  private getStockName(symbol: string): string {
    const names: Record<string, string> = {
      'AAPL': 'Apple',
      'TSLA': 'Tesla',
      'GOOGL': 'Google',
      'MSFT': 'Microsoft',
      'AMZN': 'Amazon',
      'META': 'Meta'
    };
    return names[symbol] || symbol;
  }

  private getCommodityIndexName(symbol: string): string {
    const names: Record<string, string> = {
      'XAUUSD': 'Gold',
      'XAGUSD': 'Silver',
      'SPX': 'S&P 500',
      'IXIC': 'NASDAQ'
    };
    return names[symbol] || symbol;
  }

  private setFallbackPrices(): void {
    const fallbackData: ForexPrice[] = [
      // Forex
      { symbol: "EURUSD", name: "EUR/USD", price: 1.0864, change: 0.12, changePercent: 0.12, high: 1.0870, low: 1.0850, lastUpdated: new Date().toISOString() },
      { symbol: "GBPUSD", name: "GBP/USD", price: 1.2734, change: -0.08, changePercent: -0.08, high: 1.2740, low: 1.2720, lastUpdated: new Date().toISOString() },
      { symbol: "USDJPY", name: "USD/JPY", price: 148.32, change: 0.24, changePercent: 0.24, high: 148.50, low: 148.10, lastUpdated: new Date().toISOString() },
      // Stocks
      { symbol: "AAPL", name: "Apple", price: 185.67, change: 1.45, changePercent: 1.45, high: 186.00, low: 184.50, volume: 50000000, lastUpdated: new Date().toISOString() },
      { symbol: "TSLA", name: "Tesla", price: 248.85, change: 2.67, changePercent: 2.67, high: 250.00, low: 247.00, volume: 80000000, lastUpdated: new Date().toISOString() },
      { symbol: "GOOGL", name: "Google", price: 2845.32, change: -0.45, changePercent: -0.45, high: 2850.00, low: 2840.00, volume: 20000000, lastUpdated: new Date().toISOString() },
      // Commodities
      { symbol: "XAUUSD", name: "Gold", price: 2015.67, change: 0.78, changePercent: 0.78, high: 2020.00, low: 2010.00, lastUpdated: new Date().toISOString() },
      { symbol: "XAGUSD", name: "Silver", price: 24.85, change: 1.23, changePercent: 1.23, high: 25.00, low: 24.70, lastUpdated: new Date().toISOString() },
      // Indices
      { symbol: "SPX500", name: "S&P 500", price: 4785.23, change: 0.45, changePercent: 0.45, high: 4790.00, low: 4780.00, lastUpdated: new Date().toISOString() },
      { symbol: "NAS100", name: "NASDAQ", price: 15234.56, change: 0.89, changePercent: 0.89, high: 15250.00, low: 15220.00, lastUpdated: new Date().toISOString() }
    ];

    fallbackData.forEach(item => {
      this.prices.set(item.symbol, {
        symbol: item.symbol,
        name: item.name,
        price: this.formatPrice(item.price, item.symbol),
        change: this.formatChange(item.change),
        changePercent: this.formatChangePercent(item.changePercent),
        isPositive: item.changePercent >= 0,
        rawPrice: item.price,
        rawChange: item.change,
        rawChangePercent: item.changePercent,
        high: this.formatPrice(item.high, item.symbol),
        low: this.formatPrice(item.low, item.symbol),
        volume: item.volume ? this.formatLargeNumber(item.volume) : undefined,
        lastUpdated: item.lastUpdated
      });
    });

    this.lastUpdate = new Date();
    this.notifyListeners();
  }

  getPrices(): Map<string, ForexPriceFormatted> {
    return new Map(this.prices);
  }

  getPrice(symbol: string): ForexPriceFormatted | null {
    return this.prices.get(symbol.toUpperCase()) || null;
  }

  subscribe(callback: (prices: Map<string, ForexPriceFormatted>) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(new Map(this.prices));
      } catch (error) {
        console.warn('Error in forex price listener:', error);
      }
    });
  }

  startAutoUpdate(): void {
    if (this.shouldUpdate()) {
      this.fetchForexPrices();
    }
    
    // Set up interval for continuous updates
    setInterval(() => {
      if (this.shouldUpdate()) {
        this.fetchForexPrices();
      }
    }, this.updateInterval);
  }

  shouldUpdate(): boolean {
    return !this.lastUpdate || 
           (new Date().getTime() - this.lastUpdate.getTime()) > this.updateInterval;
  }

  getLastUpdateTime(): Date | null {
    return this.lastUpdate;
  }

  refresh(): Promise<void> {
    return this.fetchForexPrices();
  }
}

export const forexPriceService = ForexPriceService.getInstance();
export type { ForexPrice, ForexPriceFormatted };
