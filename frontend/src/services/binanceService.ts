export interface BinancePrice {
  symbol: string;
  price: string;
}

export interface BinanceStats {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

export interface BinanceOrder {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  icebergQty: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: string;
}

export interface BinanceTrade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

export interface BinanceOrderBook {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

export class BinanceService {
  private static instance: BinanceService;
  private apiUrl: string;

  private constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'https://kryvextrading-com.onrender.com';
  }

  public static getInstance(): BinanceService {
    if (!BinanceService.instance) {
      BinanceService.instance = new BinanceService();
    }
    return BinanceService.instance;
  }

  // Get all current prices
  async getPrices(): Promise<BinancePrice[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/binance/prices`);
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Binance prices:', error);
      throw error;
    }
  }

  // Get 24hr statistics for a specific symbol or all symbols
  async getStats(symbol?: string): Promise<BinanceStats | BinanceStats[]> {
    try {
      const url = symbol 
        ? `${this.apiUrl}/api/binance/stats/${symbol}`
        : `${this.apiUrl}/api/binance/stats`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Binance stats:', error);
      throw error;
    }
  }

  // Get kline/candlestick data
  async getKlines(symbol: string, interval: string = '1h', limit: number = 100): Promise<BinanceKline[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/binance/klines/${symbol}?interval=${interval}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch kline data');
      }
      const data = await response.json();
      
      // Transform the raw kline data to our interface
      return data.map((kline: any[]) => ({
        openTime: kline[0],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        volume: kline[5],
        closeTime: kline[6],
        quoteAssetVolume: kline[7],
        numberOfTrades: kline[8],
        takerBuyBaseAssetVolume: kline[9],
        takerBuyQuoteAssetVolume: kline[10]
      }));
    } catch (error) {
      console.error('Error fetching Binance klines:', error);
      throw error;
    }
  }

  // Get account information
  async getAccountInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/api/binance/account`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch account information');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Binance account info:', error);
      throw error;
    }
  }

  // Get open orders
  async getOpenOrders(symbol?: string): Promise<BinanceOrder[]> {
    try {
      const url = symbol 
        ? `${this.apiUrl}/api/binance/orders/open/${symbol}`
        : `${this.apiUrl}/api/binance/orders/open`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch open orders');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Binance open orders:', error);
      throw error;
    }
  }

  // Place a new order
  async placeOrder(symbol: string, side: 'BUY' | 'SELL', type: 'MARKET' | 'LIMIT', quantity: string, price?: string): Promise<BinanceOrder> {
    try {
      const response = await fetch(`${this.apiUrl}/api/binance/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          symbol,
          side,
          type,
          quantity,
          ...(price && { price })
        })
      });
      if (!response.ok) {
        throw new Error('Failed to place order');
      }
      return await response.json();
    } catch (error) {
      console.error('Error placing Binance order:', error);
      throw error;
    }
  }

  // Cancel an order
  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/api/binance/orders/${symbol}/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }
      return await response.json();
    } catch (error) {
      console.error('Error canceling Binance order:', error);
      throw error;
    }
  }

  // Get order status
  async getOrderStatus(symbol: string, orderId: number): Promise<BinanceOrder> {
    try {
      const response = await fetch(`${this.apiUrl}/api/binance/orders/${symbol}/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch order status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Binance order status:', error);
      throw error;
    }
  }

  // Get recent trades
  async getRecentTrades(symbol: string, limit: number = 100): Promise<BinanceTrade[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/binance/trades/${symbol}?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recent trades');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Binance recent trades:', error);
      throw error;
    }
  }

  // Get order book
  async getOrderBook(symbol: string, limit: number = 100): Promise<BinanceOrderBook> {
    try {
      const response = await fetch(`${this.apiUrl}/api/binance/depth/${symbol}?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order book');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Binance order book:', error);
      throw error;
    }
  }

  // Get popular trading pairs
  async getPopularPairs(): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/binance/popular-pairs`);
      if (!response.ok) {
        throw new Error('Failed to fetch popular pairs');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Binance popular pairs:', error);
      throw error;
    }
  }

  // Get exchange information
  async getExchangeInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/api/binance/exchange-info`);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange information');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Binance exchange info:', error);
      throw error;
    }
  }
}

export default BinanceService.getInstance(); 