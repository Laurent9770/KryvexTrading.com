const axios = require('axios');
const crypto = require('crypto');

class ExternalApiService {
  constructor() {
    this.coingeckoBaseUrl = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';
    this.binanceBaseUrl = process.env.BINANCE_BASE_URL || 'https://api.binance.com/api/v3';
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY;
    this.binanceApiKey = process.env.BINANCE_API_KEY;
    this.binanceSecretKey = process.env.BINANCE_SECRET_KEY;
    
    // Rate limiting
    this.requestCounts = new Map();
    this.lastReset = Date.now();
  }

  // Rate limiting helper
  checkRateLimit(apiName, maxRequests = 100, windowMs = 60000) {
    const now = Date.now();
    const key = `${apiName}_${Math.floor(now / windowMs)}`;
    
    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, 0);
    }
    
    const count = this.requestCounts.get(key);
    if (count >= maxRequests) {
      throw new Error(`Rate limit exceeded for ${apiName}`);
    }
    
    this.requestCounts.set(key, count + 1);
    return true;
  }

  // Clean up old rate limit entries
  cleanupRateLimits() {
    const now = Date.now();
    for (const [key] of this.requestCounts) {
      const timestamp = parseInt(key.split('_')[1]) * 60000;
      if (now - timestamp > 120000) { // 2 minutes
        this.requestCounts.delete(key);
      }
    }
  }

  // Make HTTP request with error handling
  async makeRequest(url, options = {}) {
    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Kryvex-Trading-Platform/1.0',
          'Accept': 'application/json',
          ...options.headers
        },
        timeout: options.timeout || 10000,
        ...options
      });

      return response.data;
    } catch (error) {
      console.error(`API request failed: ${url}`, error.message);
      
      if (error.response) {
        throw new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error('Network error: No response received');
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  // ===== COINGECKO API =====

  // Get cryptocurrency prices
  async getCryptoPrices(ids, vsCurrencies = 'usd') {
    try {
      this.checkRateLimit('coingecko', 50, 60000);
      
      const url = `${this.coingeckoBaseUrl}/simple/price`;
      const params = {
        ids: Array.isArray(ids) ? ids.join(',') : ids,
        vs_currencies: Array.isArray(vsCurrencies) ? vsCurrencies.join(',') : vsCurrencies
      };

      const data = await this.makeRequest(url, { params });
      return data;
    } catch (error) {
      console.error('Get crypto prices error:', error);
      throw new Error('Failed to fetch cryptocurrency prices');
    }
  }

  // Get cryptocurrency market data
  async getCryptoMarketData(ids, vsCurrency = 'usd') {
    try {
      this.checkRateLimit('coingecko', 30, 60000);
      
      const url = `${this.coingeckoBaseUrl}/coins/markets`;
      const params = {
        vs_currency: vsCurrency,
        ids: Array.isArray(ids) ? ids.join(',') : ids,
        order: 'market_cap_desc',
        per_page: 250,
        page: 1,
        sparkline: false,
        locale: 'en'
      };

      const data = await this.makeRequest(url, { params });
      return data;
    } catch (error) {
      console.error('Get crypto market data error:', error);
      throw new Error('Failed to fetch cryptocurrency market data');
    }
  }

  // Get cryptocurrency details
  async getCryptoDetails(id) {
    try {
      this.checkRateLimit('coingecko', 20, 60000);
      
      const url = `${this.coingeckoBaseUrl}/coins/${id}`;
      const params = {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: false
      };

      const data = await this.makeRequest(url, { params });
      return data;
    } catch (error) {
      console.error('Get crypto details error:', error);
      throw new Error('Failed to fetch cryptocurrency details');
    }
  }

  // Get trending cryptocurrencies
  async getTrendingCryptos() {
    try {
      this.checkRateLimit('coingecko', 10, 60000);
      
      const url = `${this.coingeckoBaseUrl}/search/trending`;
      const data = await this.makeRequest(url);
      return data;
    } catch (error) {
      console.error('Get trending cryptos error:', error);
      throw new Error('Failed to fetch trending cryptocurrencies');
    }
  }

  // Get supported vs currencies
  async getSupportedVsCurrencies() {
    try {
      this.checkRateLimit('coingecko', 5, 60000);
      
      const url = `${this.coingeckoBaseUrl}/simple/supported_vs_currencies`;
      const data = await this.makeRequest(url);
      return data;
    } catch (error) {
      console.error('Get supported vs currencies error:', error);
      throw new Error('Failed to fetch supported currencies');
    }
  }

  // ===== BINANCE API =====

  // Generate Binance signature
  generateBinanceSignature(queryString) {
    if (!this.binanceSecretKey) {
      throw new Error('Binance secret key not configured');
    }
    return crypto.createHmac('sha256', this.binanceSecretKey).update(queryString).digest('hex');
  }

  // Get Binance ticker price
  async getBinanceTickerPrice(symbol) {
    try {
      this.checkRateLimit('binance', 1200, 60000);
      
      const url = `${this.binanceBaseUrl}/ticker/price`;
      const params = { symbol: symbol.toUpperCase() };

      const data = await this.makeRequest(url, { params });
      return data;
    } catch (error) {
      console.error('Get Binance ticker price error:', error);
      throw new Error('Failed to fetch Binance ticker price');
    }
  }

  // Get Binance 24hr ticker
  async getBinance24hrTicker(symbol) {
    try {
      this.checkRateLimit('binance', 1200, 60000);
      
      const url = `${this.binanceBaseUrl}/ticker/24hr`;
      const params = { symbol: symbol.toUpperCase() };

      const data = await this.makeRequest(url, { params });
      return data;
    } catch (error) {
      console.error('Get Binance 24hr ticker error:', error);
      throw new Error('Failed to fetch Binance 24hr ticker');
    }
  }

  // Get Binance klines (candlestick data)
  async getBinanceKlines(symbol, interval = '1h', limit = 100) {
    try {
      this.checkRateLimit('binance', 1200, 60000);
      
      const url = `${this.binanceBaseUrl}/klines`;
      const params = {
        symbol: symbol.toUpperCase(),
        interval,
        limit
      };

      const data = await this.makeRequest(url, { params });
      return data;
    } catch (error) {
      console.error('Get Binance klines error:', error);
      throw new Error('Failed to fetch Binance klines');
    }
  }

  // Get Binance exchange info
  async getBinanceExchangeInfo() {
    try {
      this.checkRateLimit('binance', 10, 60000);
      
      const url = `${this.binanceBaseUrl}/exchangeInfo`;
      const data = await this.makeRequest(url);
      return data;
    } catch (error) {
      console.error('Get Binance exchange info error:', error);
      throw new Error('Failed to fetch Binance exchange info');
    }
  }

  // ===== UNIVERSAL CRYPTO DATA =====

  // Get comprehensive crypto data for trading pairs
  async getTradingPairData(symbol) {
    try {
      // Extract base and quote from symbol (e.g., BTCUSDT -> BTC, USDT)
      const base = symbol.replace(/USDT|USD|BTC|ETH$/, '');
      const quote = symbol.replace(base, '');
      
      const coingeckoId = this.mapSymbolToCoingeckoId(base);
      
      const [priceData, marketData] = await Promise.all([
        this.getCryptoPrices(coingeckoId, quote.toLowerCase()),
        this.getCryptoMarketData(coingeckoId, quote.toLowerCase())
      ]);

      return {
        symbol,
        base,
        quote,
        price: priceData[coingeckoId]?.[quote.toLowerCase()] || 0,
        marketCap: marketData[0]?.market_cap || 0,
        volume24h: marketData[0]?.total_volume || 0,
        change24h: marketData[0]?.price_change_percentage_24h || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Get trading pair data error:', error);
      throw new Error('Failed to fetch trading pair data');
    }
  }

  // Map common symbols to CoinGecko IDs
  mapSymbolToCoingeckoId(symbol) {
    const mapping = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'ADA': 'cardano',
      'XRP': 'ripple',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash',
      'XLM': 'stellar',
      'EOS': 'eos',
      'TRX': 'tron',
      'NEO': 'neo',
      'IOTA': 'iota',
      'VET': 'vechain',
      'ATOM': 'cosmos',
      'ALGO': 'algorand',
      'XTZ': 'tezos',
      'DASH': 'dash',
      'ZEC': 'zcash'
    };

    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  // Get multiple trading pairs data
  async getMultipleTradingPairsData(symbols) {
    try {
      const promises = symbols.map(symbol => this.getTradingPairData(symbol));
      const results = await Promise.allSettled(promises);
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Failed to fetch data for ${symbols[index]}:`, result.reason);
          return {
            symbol: symbols[index],
            error: result.reason.message
          };
        }
      });
    } catch (error) {
      console.error('Get multiple trading pairs data error:', error);
      throw new Error('Failed to fetch multiple trading pairs data');
    }
  }

  // Get market overview
  async getMarketOverview() {
    try {
      const [trendingData, marketData] = await Promise.all([
        this.getTrendingCryptos(),
        this.getCryptoMarketData(['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple'], 'usd')
      ]);

      return {
        trending: trendingData.coins?.slice(0, 7) || [],
        topGainers: marketData.filter(coin => coin.price_change_percentage_24h > 0).slice(0, 5),
        topLosers: marketData.filter(coin => coin.price_change_percentage_24h < 0).slice(0, 5),
        marketCap: marketData.reduce((sum, coin) => sum + coin.market_cap, 0),
        volume24h: marketData.reduce((sum, coin) => sum + coin.total_volume, 0),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Get market overview error:', error);
      throw new Error('Failed to fetch market overview');
    }
  }

  // ===== CACHE MANAGEMENT =====

  // Simple in-memory cache
  cache = new Map();
  cacheTimeout = 30000; // 30 seconds

  // Get cached data
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  // Set cached data
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cached crypto prices
  async getCachedCryptoPrices(ids, vsCurrencies = 'usd') {
    const cacheKey = `prices_${ids}_${vsCurrencies}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const data = await this.getCryptoPrices(ids, vsCurrencies);
    this.setCachedData(cacheKey, data);
    return data;
  }

  // ===== HEALTH CHECK =====

  // Check API health
  async checkApiHealth() {
    try {
      const [coingeckoHealth, binanceHealth] = await Promise.allSettled([
        this.makeRequest(`${this.coingeckoBaseUrl}/ping`),
        this.makeRequest(`${this.binanceBaseUrl}/ping`)
      ]);

      return {
        coingecko: coingeckoHealth.status === 'fulfilled',
        binance: binanceHealth.status === 'fulfilled',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('API health check error:', error);
      return {
        coingecko: false,
        binance: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Cleanup on interval
  startCleanup() {
    setInterval(() => {
      this.cleanupRateLimits();
    }, 60000); // Every minute
  }
}

module.exports = new ExternalApiService(); 