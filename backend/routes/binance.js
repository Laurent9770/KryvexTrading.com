const express = require('express');
const router = express.Router();
const binanceService = require('../services/binanceService');

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
router.get('/account', async (req, res) => {
  try {
    const accountInfo = await binanceService.getAccountInfo();
    res.json(accountInfo);
  } catch (error) {
    console.error('Error fetching account info:', error);
    res.status(500).json({ error: 'Failed to fetch account information' });
  }
});

// Get open orders
router.get('/orders/open/:symbol?', async (req, res) => {
  try {
    const { symbol } = req.params;
    const orders = await binanceService.getOpenOrders(symbol);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching open orders:', error);
    res.status(500).json({ error: 'Failed to fetch open orders' });
  }
});

// Place a new order
router.post('/orders', async (req, res) => {
  try {
    const { symbol, side, type, quantity, price } = req.body;
    
    if (!symbol || !side || !type || !quantity) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const order = await binanceService.placeOrder(symbol, side, type, quantity, price);
    res.json(order);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Failed to place order' });
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

module.exports = router; 