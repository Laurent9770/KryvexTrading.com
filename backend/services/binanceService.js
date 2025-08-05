const crypto = require('crypto');
const axios = require('axios');

class BinanceService {
  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY;
    this.secretKey = process.env.BINANCE_SECRET_KEY;
    this.baseUrl = 'https://api.binance.com';
    this.testnetUrl = 'https://testnet.binance.vision';
  }

  // Generate signature for authenticated requests
  generateSignature(queryString) {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(queryString)
      .digest('hex');
  }

  // Get current prices for all symbols
  async getPrices() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/ticker/price`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Binance prices:', error);
      throw error;
    }
  }

  // Get 24hr ticker statistics
  async get24hrStats(symbol = null) {
    try {
      const url = symbol 
        ? `${this.baseUrl}/api/v3/ticker/24hr?symbol=${symbol}`
        : `${this.baseUrl}/api/v3/ticker/24hr`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching 24hr stats:', error);
      throw error;
    }
  }

  // Get kline/candlestick data
  async getKlines(symbol, interval = '1h', limit = 100) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/klines`, {
        params: {
          symbol: symbol.toUpperCase(),
          interval,
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching klines:', error);
      throw error;
    }
  }

  // Get account information (requires authentication)
  async getAccountInfo() {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);

      const response = await axios.get(`${this.baseUrl}/api/v3/account`, {
        params: {
          timestamp,
          signature
        },
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }

  // Get open orders
  async getOpenOrders(symbol = null) {
    try {
      const timestamp = Date.now();
      let queryString = `timestamp=${timestamp}`;
      if (symbol) {
        queryString += `&symbol=${symbol.toUpperCase()}`;
      }
      const signature = this.generateSignature(queryString);

      const response = await axios.get(`${this.baseUrl}/api/v3/openOrders`, {
        params: {
          timestamp,
          signature,
          ...(symbol && { symbol: symbol.toUpperCase() })
        },
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching open orders:', error);
      throw error;
    }
  }

  // Place a new order
  async placeOrder(symbol, side, type, quantity, price = null) {
    try {
      const timestamp = Date.now();
      let queryString = `symbol=${symbol.toUpperCase()}&side=${side.toUpperCase()}&type=${type.toUpperCase()}&quantity=${quantity}&timestamp=${timestamp}`;
      
      if (price && type !== 'MARKET') {
        queryString += `&price=${price}`;
      }

      const signature = this.generateSignature(queryString);

      const response = await axios.post(`${this.baseUrl}/api/v3/order`, null, {
        params: {
          symbol: symbol.toUpperCase(),
          side: side.toUpperCase(),
          type: type.toUpperCase(),
          quantity,
          timestamp,
          signature,
          ...(price && type !== 'MARKET' && { price })
        },
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  // Cancel an order
  async cancelOrder(symbol, orderId) {
    try {
      const timestamp = Date.now();
      const queryString = `symbol=${symbol.toUpperCase()}&orderId=${orderId}&timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);

      const response = await axios.delete(`${this.baseUrl}/api/v3/order`, {
        params: {
          symbol: symbol.toUpperCase(),
          orderId,
          timestamp,
          signature
        },
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  }

  // Get order status
  async getOrderStatus(symbol, orderId) {
    try {
      const timestamp = Date.now();
      const queryString = `symbol=${symbol.toUpperCase()}&orderId=${orderId}&timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);

      const response = await axios.get(`${this.baseUrl}/api/v3/order`, {
        params: {
          symbol: symbol.toUpperCase(),
          orderId,
          timestamp,
          signature
        },
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting order status:', error);
      throw error;
    }
  }

  // Get trading pairs info
  async getExchangeInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/exchangeInfo`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exchange info:', error);
      throw error;
    }
  }

  // Get recent trades
  async getRecentTrades(symbol, limit = 100) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/trades`, {
        params: {
          symbol: symbol.toUpperCase(),
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent trades:', error);
      throw error;
    }
  }

  // Get order book
  async getOrderBook(symbol, limit = 100) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/depth`, {
        params: {
          symbol: symbol.toUpperCase(),
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching order book:', error);
      throw error;
    }
  }
}

module.exports = new BinanceService(); 