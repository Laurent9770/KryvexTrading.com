const express = require('express');
const router = express.Router();
const binanceService = require('../services/binanceService');
const binanceAdminService = require('../services/binanceAdminService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all current prices
router.get('/prices', async (req, res) => {
  try {
    const prices = await binanceService.getPrices();
    res.json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// Get 24hr statistics for a specific symbol or all symbols
router.get('/stats/:symbol?', async (req, res) => {
  try {
    const { symbol } = req.params;
    const stats = await binanceService.get24hrStats(symbol);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get kline/candlestick data
router.get('/klines/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 100 } = req.query;
    const klines = await binanceService.getKlines(symbol, interval, limit);
    res.json(klines);
  } catch (error) {
    console.error('Error fetching klines:', error);
    res.status(500).json({ error: 'Failed to fetch kline data' });
  }
});

// Get account information (requires authentication)
router.get('/account', authenticateToken, async (req, res) => {
  try {
    // Check if user can trade
    const canTrade = await binanceAdminService.canUserTrade(req.user.id);
    if (!canTrade.canTrade) {
      return res.status(403).json({ error: canTrade.reason });
    }

    const accountInfo = await binanceService.getAccountInfo();
    res.json(accountInfo);
  } catch (error) {
    console.error('Error fetching account info:', error);
    res.status(500).json({ error: 'Failed to fetch account information' });
  }
});

// Get open orders
router.get('/orders/open/:symbol?', authenticateToken, async (req, res) => {
  try {
    // Check if user can trade
    const canTrade = await binanceAdminService.canUserTrade(req.user.id);
    if (!canTrade.canTrade) {
      return res.status(403).json({ error: canTrade.reason });
    }

    const { symbol } = req.params;
    const orders = await binanceService.getOpenOrders(symbol);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching open orders:', error);
    res.status(500).json({ error: 'Failed to fetch open orders' });
  }
});

// Place a new order
router.post('/orders', authenticateToken, async (req, res) => {
  try {
    const { symbol, side, type, quantity, price } = req.body;
    
    if (!symbol || !side || !type || !quantity) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check if user can trade
    const canTrade = await binanceAdminService.canUserTrade(req.user.id);
    if (!canTrade.canTrade) {
      return res.status(403).json({ error: canTrade.reason });
    }

    const order = await binanceService.placeOrder(symbol, side, type, quantity, price, req.user.id);
    res.json(order);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: error.message || 'Failed to place order' });
  }
});

// Cancel an order
router.delete('/orders/:symbol/:orderId', async (req, res) => {
  try {
    const { symbol, orderId } = req.params;
    const result = await binanceService.cancelOrder(symbol, orderId);
    res.json(result);
  } catch (error) {
    console.error('Error canceling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Get order status
router.get('/orders/:symbol/:orderId', async (req, res) => {
  try {
    const { symbol, orderId } = req.params;
    const order = await binanceService.getOrderStatus(symbol, orderId);
    res.json(order);
  } catch (error) {
    console.error('Error fetching order status:', error);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

// Get exchange information
router.get('/exchange-info', async (req, res) => {
  try {
    const exchangeInfo = await binanceService.getExchangeInfo();
    res.json(exchangeInfo);
  } catch (error) {
    console.error('Error fetching exchange info:', error);
    res.status(500).json({ error: 'Failed to fetch exchange information' });
  }
});

// Get recent trades
router.get('/trades/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 100 } = req.query;
    const trades = await binanceService.getRecentTrades(symbol, limit);
    res.json(trades);
  } catch (error) {
    console.error('Error fetching recent trades:', error);
    res.status(500).json({ error: 'Failed to fetch recent trades' });
  }
});

// Get order book
router.get('/depth/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 100 } = req.query;
    const orderBook = await binanceService.getOrderBook(symbol, limit);
    res.json(orderBook);
  } catch (error) {
    console.error('Error fetching order book:', error);
    res.status(500).json({ error: 'Failed to fetch order book' });
  }
});

// Get popular trading pairs
router.get('/popular-pairs', async (req, res) => {
  try {
    const exchangeInfo = await binanceService.getExchangeInfo();
    const popularPairs = exchangeInfo.symbols
      .filter(symbol => symbol.status === 'TRADING')
      .filter(symbol => symbol.quoteAsset === 'USDT' || symbol.quoteAsset === 'BTC')
      .slice(0, 20)
      .map(symbol => ({
        symbol: symbol.symbol,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        status: symbol.status
      }));
    
    res.json(popularPairs);
  } catch (error) {
    console.error('Error fetching popular pairs:', error);
    res.status(500).json({ error: 'Failed to fetch popular pairs' });
  }
});

// ===== ADMIN ROUTES =====

// Get Binance settings (admin only)
router.get('/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await binanceAdminService.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching Binance settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update Binance settings (admin only)
router.put('/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await binanceAdminService.updateSettings(req.body, req.user.id);
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating Binance settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get trading statistics (admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await binanceAdminService.getTradingStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching trading stats:', error);
    res.status(500).json({ error: 'Failed to fetch trading stats' });
  }
});

// Test API connection (admin only)
router.post('/admin/test-connection', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await binanceAdminService.testApiConnection();
    res.json(result);
  } catch (error) {
    console.error('Error testing API connection:', error);
    res.status(500).json({ error: 'Failed to test API connection' });
  }
});

// Update API keys (admin only)
router.put('/admin/api-keys', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { apiKey, secretKey } = req.body;
    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'API key and secret key are required' });
    }

    const result = await binanceAdminService.updateApiKeys(apiKey, secretKey, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error updating API keys:', error);
    res.status(500).json({ error: 'Failed to update API keys' });
  }
});

// Toggle Binance trading (admin only)
router.post('/admin/toggle-trading', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    const result = await binanceAdminService.toggleTrading(enabled, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error toggling trading:', error);
    res.status(500).json({ error: 'Failed to toggle trading' });
  }
});

// Set maintenance mode (admin only)
router.post('/admin/maintenance-mode', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    const result = await binanceAdminService.setMaintenanceMode(enabled, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error setting maintenance mode:', error);
    res.status(500).json({ error: 'Failed to set maintenance mode' });
  }
});

// Get user permissions (admin only)
router.get('/admin/user-permissions/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const permissions = await binanceAdminService.getUserPermissions(userId);
    res.json(permissions);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    res.status(500).json({ error: 'Failed to get user permissions' });
  }
});

module.exports = router; 