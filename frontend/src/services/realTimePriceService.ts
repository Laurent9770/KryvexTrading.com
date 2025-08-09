import { supabase } from '@/integrations/supabase/client';

export interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  timestamp: string;
}

class RealTimePriceService {
  private prices: Map<string, CryptoPrice> = new Map();
  private subscribers: Set<(prices: Map<string, CryptoPrice>) => void> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor() {
    this.initializePrices();
    this.startRealTimeUpdates();
  }

  private async initializePrices() {
    try {
      console.log('🔄 Fetching market data...');
      
      // Try CoinGecko API with CORS proxy for production
      const isProduction = window.location.hostname !== 'localhost';
      const apiUrl = isProduction 
        ? 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano,bnb&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true')
        : 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano,bnb&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true';
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        let data;
        if (isProduction) {
          const proxyResponse = await response.json();
          data = JSON.parse(proxyResponse.contents);
        } else {
          data = await response.json();
        }
        
        console.log('📊 Market data received:', data);
        
        const symbols = {
          bitcoin: 'BTC',
          ethereum: 'ETH',
          solana: 'SOL',
          cardano: 'ADA',
          bnb: 'BNB'
        };

        Object.entries(data).forEach(([id, priceData]: [string, any]) => {
          const symbol = symbols[id as keyof typeof symbols];
          if (symbol && priceData.usd) {
            this.prices.set(symbol, {
              symbol,
              price: priceData.usd,
              change24h: priceData.usd_24h_change || 0,
              volume24h: priceData.usd_24h_vol || 0,
              marketCap: priceData.usd_market_cap || 0,
              lastUpdated: new Date().toISOString()
            });
          }
        });
      } else {
        console.warn('⚠️ Failed to fetch real market data, using fallback');
        this.initializeFallbackPrices();
      }
    } catch (error) {
      console.error('❌ Error fetching real market data:', error);
      this.initializeFallbackPrices();
    }
  }

  private initializeFallbackPrices() {
    // Fallback prices (only used if API fails)
    const fallbackPrices: CryptoPrice[] = [
      {
        symbol: 'BTC',
        price: 43250.50,
        change24h: 2.5,
        volume24h: 25000000000,
        marketCap: 850000000000,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'ETH',
        price: 2650.75,
        change24h: -1.2,
        volume24h: 15000000000,
        marketCap: 320000000000,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'SOL',
        price: 98.25,
        change24h: 5.8,
        volume24h: 2000000000,
        marketCap: 45000000000,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'ADA',
        price: 0.485,
        change24h: 1.3,
        volume24h: 800000000,
        marketCap: 17000000000,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'BNB',
        price: 320.45,
        change24h: 0.8,
        volume24h: 1200000000,
        marketCap: 48000000000,
        lastUpdated: new Date().toISOString()
      }
    ];

    fallbackPrices.forEach(price => {
      this.prices.set(price.symbol, price);
    });
  }

  private startRealTimeUpdates() {
    // Update prices every 30 seconds with real market data
    this.updateInterval = setInterval(() => {
      this.updatePrices();
    }, 30000);

    // Also try to connect to Supabase real-time for actual live data
    this.connectToSupabaseRealtime();
  }

  private async connectToSupabaseRealtime() {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase client not available for real-time prices');
        return;
      }

      const channel = supabase
        .channel('price_updates')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'price_history' 
          }, 
          (payload) => {
            const newPrice = payload.new as PriceUpdate;
            this.updatePriceFromSupabase(newPrice);
          }
        )
        .subscribe((status) => {
          console.log('📊 Real-time price subscription status:', status);
          this.isConnected = status === 'SUBSCRIBED';
        });

      console.log('✅ Real-time price service connected');
    } catch (error) {
      console.error('❌ Failed to connect to real-time price service:', error);
    }
  }

  private updatePriceFromSupabase(priceUpdate: PriceUpdate) {
    const existingPrice = this.prices.get(priceUpdate.symbol);
    if (existingPrice) {
      const updatedPrice: CryptoPrice = {
        ...existingPrice,
        price: priceUpdate.price,
        change24h: priceUpdate.change24h,
        volume24h: priceUpdate.volume24h,
        lastUpdated: priceUpdate.timestamp
      };
      this.prices.set(priceUpdate.symbol, updatedPrice);
      this.notifySubscribers();
    }
  }

  private async updatePrices() {
    try {
      // Fetch updated real market data
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano,bnb&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true');
      
      if (response.ok) {
        const data = await response.json();
        
        const symbols = {
          bitcoin: 'BTC',
          ethereum: 'ETH',
          solana: 'SOL',
          cardano: 'ADA',
          bnb: 'BNB'
        };

        Object.entries(data).forEach(([id, priceData]: [string, any]) => {
          const symbol = symbols[id as keyof typeof symbols];
          if (symbol && priceData.usd) {
            this.prices.set(symbol, {
              symbol,
              price: priceData.usd,
              change24h: priceData.usd_24h_change || 0,
              volume24h: priceData.usd_24h_vol || 0,
              marketCap: priceData.usd_market_cap || 0,
              lastUpdated: new Date().toISOString()
            });
          }
        });

        this.notifySubscribers();
      }
    } catch (error) {
      console.error('❌ Error updating real market data:', error);
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(new Map(this.prices));
      } catch (error) {
        console.error('❌ Error in price update callback:', error);
      }
    });
  }

  // Public API
  public subscribe(callback: (prices: Map<string, CryptoPrice>) => void) {
    this.subscribers.add(callback);
    
    // Immediately send current prices
    callback(new Map(this.prices));
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public getPrices(): Map<string, CryptoPrice> {
    return new Map(this.prices);
  }

  public getPrice(symbol: string): CryptoPrice | undefined {
    return this.prices.get(symbol);
  }

  public isRealtimeConnected(): boolean {
    return this.isConnected;
  }

  public async addPriceUpdate(priceUpdate: PriceUpdate) {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('price_history')
          .insert([priceUpdate]);

        if (error) {
          console.error('❌ Failed to add price update:', error);
        } else {
          console.log('✅ Price update added to database');
        }
      }
    } catch (error) {
      console.error('❌ Error adding price update:', error);
    }
  }

  public disconnect() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.subscribers.clear();
    console.log('🔌 Real-time price service disconnected');
  }
}

// Create singleton instance
const realTimePriceService = new RealTimePriceService();

export default realTimePriceService;
