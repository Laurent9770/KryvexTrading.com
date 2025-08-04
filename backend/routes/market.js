const express = require('express');
const externalApiService = require('../services/externalApiService');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get crypto prices
router.get('/prices', async (req, res) => {
  try {
    const { ids, vs_currencies = 'usd' } = req.query;
    
    if (!ids) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'ids parameter is required'
      });
    }

    const prices = await externalApiService.getCachedCryptoPrices(ids.split(','), vs_currencies.split(','));
    
    res.status(200).json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('Get crypto prices error:', error);
    res.status(500).json({
      error: 'Failed to fetch crypto prices',
      message: error.message
    });
  }
});

// Get market overview
router.get('/overview', async (req, res) => {
  try {
    const overview = await externalApiService.getMarketOverview();
    
    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Get market overview error:', error);
    res.status(500).json({
      error: 'Failed to fetch market overview',
      message: error.message
    });
  }
});

// Get trading pair data
router.get('/trading-pairs/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await externalApiService.getTradingPairData(symbol);
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get trading pair data error:', error);
    res.status(500).json({
      error: 'Failed to fetch trading pair data',
      message: error.message
    });
  }
});

// Get multiple trading pairs
router.get('/trading-pairs', async (req, res) => {
  try {
    const { symbols } = req.query;
    
    if (!symbols) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'symbols parameter is required'
      });
    }

    const data = await externalApiService.getMultipleTradingPairsData(symbols.split(','));
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get multiple trading pairs error:', error);
    res.status(500).json({
      error: 'Failed to fetch trading pairs data',
      message: error.message
    });
  }
});

// Get trending cryptocurrencies
router.get('/trending', async (req, res) => {
  try {
    const trending = await externalApiService.getTrendingCryptos();
    
    res.status(200).json({
      success: true,
      data: trending
    });
  } catch (error) {
    console.error('Get trending cryptos error:', error);
    res.status(500).json({
      error: 'Failed to fetch trending cryptocurrencies',
      message: error.message
    });
  }
});

// Get supported currencies
router.get('/currencies', async (req, res) => {
  try {
    const currencies = await externalApiService.getSupportedVsCurrencies();
    
    res.status(200).json({
      success: true,
      data: currencies
    });
  } catch (error) {
    console.error('Get supported currencies error:', error);
    res.status(500).json({
      error: 'Failed to fetch supported currencies',
      message: error.message
    });
  }
});

// Get Binance klines (candlestick data)
router.get('/klines/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 100 } = req.query;
    
    const klines = await externalApiService.getBinanceKlines(symbol, interval, parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: klines
    });
  } catch (error) {
    console.error('Get Binance klines error:', error);
    res.status(500).json({
      error: 'Failed to fetch candlestick data',
      message: error.message
    });
  }
});

// Get API health status
router.get('/health', async (req, res) => {
  try {
    const health = await externalApiService.checkApiHealth();
    
    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Get API health error:', error);
    res.status(500).json({
      error: 'Failed to check API health',
      message: error.message
    });
  }
});

module.exports = router; 