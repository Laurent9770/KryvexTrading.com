import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import binanceService, { BinanceStats, BinanceOrder, BinanceTrade } from '@/services/binanceService';
import { useAuth } from '@/contexts/AuthContext';

interface BinanceTradingProps {
  symbol?: string;
}

export const BinanceTrading: React.FC<BinanceTradingProps> = ({ symbol = 'BTCUSDT' }) => {
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<BinanceStats | null>(null);
  const [openOrders, setOpenOrders] = useState<BinanceOrder[]>([]);
  const [recentTrades, setRecentTrades] = useState<BinanceTrade[]>([]);
  const [permissions, setPermissions] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check user permissions
  const checkPermissions = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://kryvextrading-com.onrender.com'}/api/binance/admin/user-permissions/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  // Fetch market data
  const fetchMarketData = async () => {
    try {
      const statsData = await binanceService.getStats(selectedSymbol);
      setStats(Array.isArray(statsData) ? statsData[0] : statsData);
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  // Fetch open orders
  const fetchOpenOrders = async () => {
    try {
      const orders = await binanceService.getOpenOrders(selectedSymbol);
      setOpenOrders(orders);
    } catch (error) {
      console.error('Error fetching open orders:', error);
    }
  };

  // Fetch recent trades
  const fetchRecentTrades = async () => {
    try {
      const trades = await binanceService.getRecentTrades(selectedSymbol, 20);
      setRecentTrades(trades);
    } catch (error) {
      console.error('Error fetching recent trades:', error);
    }
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!quantity) {
      toast({
        title: "Error",
        description: "Please enter quantity",
        variant: "destructive"
      });
      return;
    }

    if (orderType === 'LIMIT' && !price) {
      toast({
        title: "Error",
        description: "Please enter price for limit order",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const order = await binanceService.placeOrder(
        selectedSymbol,
        orderSide,
        orderType,
        quantity,
        orderType === 'LIMIT' ? price : undefined
      );

      toast({
        title: "Order Placed",
        description: `Successfully placed ${orderSide} order for ${quantity} ${selectedSymbol}`,
      });

      // Reset form
      setQuantity('');
      setPrice('');
      
      // Refresh data
      fetchOpenOrders();
      fetchMarketData();
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Error",
        description: error instanceof Error ? error.message : "Failed to place order",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async (orderId: number) => {
    try {
      await binanceService.cancelOrder(selectedSymbol, orderId);
      toast({
        title: "Order Cancelled",
        description: "Order has been cancelled successfully",
      });
      fetchOpenOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Cancellation Error",
        description: error instanceof Error ? error.message : "Failed to cancel order",
        variant: "destructive"
      });
    }
  };

  // Auto-refresh data
  useEffect(() => {
    checkPermissions();
    fetchMarketData();
    fetchOpenOrders();
    fetchRecentTrades();

    const interval = setInterval(() => {
      fetchMarketData();
      fetchRecentTrades();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // Check if user has access
  if (!permissions?.hasAccess) {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Access Restricted</CardTitle>
            <CardDescription className="text-slate-400">
              {permissions?.reason || 'You do not have permission to access Binance trading'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔒</div>
              <p className="text-slate-400">
                Binance trading is currently restricted. Please contact an administrator for access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Data */}
      {stats && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{selectedSymbol} Market Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                <p className="text-sm text-slate-400">Last Price</p>
                <p className="text-xl font-bold text-white">${parseFloat(stats.lastPrice).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                <p className="text-sm text-slate-400">24h Change</p>
                <p className={`text-xl font-bold ${parseFloat(stats.priceChangePercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(stats.priceChangePercent).toFixed(2)}%
                </p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                <p className="text-sm text-slate-400">24h Volume</p>
                <p className="text-xl font-bold text-white">{parseFloat(stats.volume).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                <p className="text-sm text-slate-400">High/Low</p>
                <p className="text-sm font-bold text-white">
                  ${parseFloat(stats.highPrice).toFixed(2)} / ${parseFloat(stats.lowPrice).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Form */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Place Order</CardTitle>
            <CardDescription className="text-slate-400">
              Trade {selectedSymbol} on Binance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Symbol Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Symbol</label>
              <Input
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="e.g., BTCUSDT"
              />
            </div>

            {/* Order Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Order Type</label>
              <Select value={orderType} onValueChange={(value: 'MARKET' | 'LIMIT') => setOrderType(value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARKET">Market</SelectItem>
                  <SelectItem value="LIMIT">Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order Side */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Side</label>
              <div className="flex gap-2">
                <Button
                  variant={orderSide === 'BUY' ? 'default' : 'outline'}
                  onClick={() => setOrderSide('BUY')}
                  className={`flex-1 ${orderSide === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'border-slate-600'}`}
                >
                  BUY
                </Button>
                <Button
                  variant={orderSide === 'SELL' ? 'default' : 'outline'}
                  onClick={() => setOrderSide('SELL')}
                  className={`flex-1 ${orderSide === 'SELL' ? 'bg-red-600 hover:bg-red-700' : 'border-slate-600'}`}
                >
                  SELL
                </Button>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Quantity</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter quantity"
                step="0.0001"
              />
            </div>

            {/* Price (for limit orders) */}
            {orderType === 'LIMIT' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Price</label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter price"
                  step="0.01"
                />
              </div>
            )}

            {/* Place Order Button */}
            <Button
              onClick={handlePlaceOrder}
              disabled={loading || !quantity || (orderType === 'LIMIT' && !price)}
              className={`w-full ${orderSide === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {loading ? 'Processing...' : `${orderSide} ${selectedSymbol}`}
            </Button>
          </CardContent>
        </Card>

        {/* Open Orders */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Open Orders</CardTitle>
            <CardDescription className="text-slate-400">
              Your active orders for {selectedSymbol}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {openOrders.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No open orders</p>
              ) : (
                openOrders.map((order) => (
                  <div key={order.orderId} className="p-3 bg-slate-700/50 rounded border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          order.side === 'BUY' 
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-red-500/10 text-red-400'
                        }>
                          {order.side}
                        </Badge>
                        <span className="text-sm text-slate-300">{order.symbol}</span>
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-400">
                        {order.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-400 space-y-1">
                      <p>Quantity: {order.origQty}</p>
                      <p>Price: ${parseFloat(order.price).toFixed(2)}</p>
                      <p>Status: {order.status}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelOrder(order.orderId)}
                      className="mt-2 border-red-600 text-red-400 hover:bg-red-600/10"
                    >
                      Cancel
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Trades</CardTitle>
          <CardDescription className="text-slate-400">
            Latest trades for {selectedSymbol}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                <div className="flex items-center gap-2">
                  <Badge className={
                    trade.isBuyerMaker 
                      ? 'bg-red-500/10 text-red-400' 
                      : 'bg-green-500/10 text-green-400'
                  }>
                    {trade.isBuyerMaker ? 'SELL' : 'BUY'}
                  </Badge>
                  <span className="text-sm text-white">${parseFloat(trade.price).toFixed(2)}</span>
                </div>
                <span className="text-sm text-slate-400">{parseFloat(trade.qty).toFixed(4)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BinanceTrading; 