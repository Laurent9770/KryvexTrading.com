import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import Navigation from "@/components/Navigation";
import TradingViewChart from "@/components/TradingViewChart";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Shield,
  Zap,
  BarChart3,
  Settings,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import tradingEngine, { TradeRequest } from "@/services/tradingEngine";

const FuturesPage = () => {
  const [selectedPair, setSelectedPair] = useState("BTCUSDT");
  const [leverage, setLeverage] = useState([10]);
  const [position, setPosition] = useState<'long' | 'short'>('long');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('limit');
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [crossMargin, setCrossMargin] = useState(true);
  const [postOnly, setPostOnly] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();
  const { addActivity, addTrade } = useAuth();

  const futuresPairs = [
    { symbol: "BTCUSDT", name: "Bitcoin", price: 67543.21, change: 2.34, volume: "2.4B", funding: "0.0125%" },
    { symbol: "ETHUSDT", name: "Ethereum", price: 3234.56, change: 1.23, volume: "1.8B", funding: "0.0089%" },
    { symbol: "BNBUSDT", name: "BNB", price: 623.45, change: -0.56, volume: "456M", funding: "-0.0034%" },
    { symbol: "SOLUSDT", name: "Solana", price: 234.67, change: 4.12, volume: "678M", funding: "0.0156%" },
  ];

  const orderBook = {
    asks: [
      { price: 67550, amount: 0.45, total: 0.45 },
      { price: 67548, amount: 0.32, total: 0.77 },
      { price: 67545, amount: 0.28, total: 1.05 },
      { price: 67544, amount: 0.67, total: 1.72 },
      { price: 67543, amount: 0.89, total: 2.61 },
    ],
    bids: [
      { price: 67542, amount: 0.56, total: 0.56 },
      { price: 67540, amount: 0.43, total: 0.99 },
      { price: 67538, amount: 0.39, total: 1.38 },
      { price: 67535, amount: 0.72, total: 2.10 },
      { price: 67533, amount: 0.84, total: 2.94 },
    ]
  };

  const positions = [
    { symbol: "BTCUSDT", side: "Long", size: 0.5, entryPrice: 66500, markPrice: 67543, pnl: 521.5, margin: 3350, leverage: "20x" },
    { symbol: "ETHUSDT", side: "Short", size: 2.0, entryPrice: 3300, markPrice: 3234, pnl: 132.0, margin: 648, leverage: "10x" },
  ];

  const handlePlaceOrder = async () => {
    if (!amount || (orderType !== 'market' && !price)) {
      toast({
        title: "Invalid Order",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    try {
      const tradeRequest: TradeRequest = {
        type: 'futures',
        action: position === 'long' ? 'buy' : 'sell',
        symbol: selectedPair.split('USDT')[0],
        amount: parseFloat(amount),
        price: parseFloat(price || selectedPairData?.price.toString() || "0"),
        leverage: leverage[0],
      };

      const result = await tradingEngine.executeTrade(tradeRequest);

      if (result.success) {
        const tradeActivity = {
          type: "trade",
          action: `${position.toUpperCase()} FUTURES`,
          symbol: selectedPair,
          amount: `${amount} ${selectedPair}`,
          price: `$${parseFloat(price || selectedPairData?.price.toString() || "0").toLocaleString()}`,
          pnl: result.profit ? `+$${result.profit.toFixed(2)}` : result.loss ? `-$${result.loss.toFixed(2)}` : '0',
          status: "completed",
          time: "Just now",
          icon: position === 'long' ? "📈" : "📉"
        };
        addActivity(tradeActivity);
        addTrade({
          pair: selectedPair,
          type: position,
          amount: amount,
          price: `$${parseFloat(price || selectedPairData?.price.toString() || "0").toLocaleString()}`,
          pnl: result.profit ? `+$${result.profit.toFixed(2)}` : result.loss ? `-$${result.loss.toFixed(2)}` : '0',
          status: "completed"
        });

        toast({
          title: "Order Placed Successfully",
          description: `${position.toUpperCase()} ${amount} ${selectedPair} at ${orderType === 'market' ? 'market price' : price}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Order Failed",
          description: result.message || "Unknown error occurred."
        });
      }
    } catch (error) {
      console.error("Error placing futures order:", error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: "Failed to place order due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }

    // Reset form
    setAmount("");
    setPrice("");
    setStopPrice("");
  };

  const selectedPairData = futuresPairs.find(p => p.symbol === selectedPair);
  const notionalValue = parseFloat(amount || "0") * parseFloat(price || selectedPairData?.price.toString() || "0");
  const marginRequired = notionalValue / leverage[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <div className="pt-16">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-foreground">Futures Trading</h1>
              <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                <Zap className="w-3 h-3 mr-1" />
                Up to 125x Leverage
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Risk Level: Moderate</span>
            </div>
          </div>

          {/* Trading Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Trading Pairs & Order Book */}
            <div className="space-y-6">
              {/* Trading Pairs */}
              <Card className="kucoin-card-professional border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Futures Pairs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {futuresPairs.map((pair) => (
                    <div
                      key={pair.symbol}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedPair === pair.symbol 
                          ? 'bg-kucoin-green/10 border border-kucoin-green/30' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedPair(pair.symbol)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-foreground">{pair.symbol}</span>
                        <span className={`text-xs ${pair.change >= 0 ? 'text-kucoin-green' : 'text-kucoin-red'}`}>
                          {pair.change >= 0 ? '+' : ''}{pair.change}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">${pair.price.toLocaleString()}</div>
                      <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                        <span>Vol: {pair.volume}</span>
                        <span className={pair.funding.includes('-') ? 'text-kucoin-red' : 'text-kucoin-green'}>
                          {pair.funding}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Order Book */}
              <Card className="kucoin-card-professional border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Order Book</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Asks */}
                    <div className="space-y-1">
                      {orderBook.asks.reverse().map((ask, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-kucoin-red">{ask.price.toLocaleString()}</span>
                          <span className="text-muted-foreground">{ask.amount}</span>
                        </div>
                      ))}
                    </div>

                    {/* Spread */}
                    <div className="text-center py-2">
                      <span className="text-lg font-bold text-foreground">
                        ${selectedPairData?.price.toLocaleString()}
                      </span>
                      <div className={`text-xs ${selectedPairData && selectedPairData.change >= 0 ? 'text-kucoin-green' : 'text-kucoin-red'}`}>
                        {selectedPairData && selectedPairData.change >= 0 ? '+' : ''}{selectedPairData?.change}%
                      </div>
                    </div>

                    {/* Bids */}
                    <div className="space-y-1">
                      {orderBook.bids.map((bid, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-kucoin-green">{bid.price.toLocaleString()}</span>
                          <span className="text-muted-foreground">{bid.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Positions */}
              <Card className="kucoin-card-professional border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Open Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {positions.map((pos, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-foreground">{pos.symbol}</span>
                          <Badge variant={pos.side === 'Long' ? 'default' : 'destructive'} className="text-xs">
                            {pos.side} {pos.leverage}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Size:</span>
                            <span className="text-foreground">{pos.size}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Entry:</span>
                            <span className="text-foreground">${pos.entryPrice}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">PnL:</span>
                            <span className={pos.pnl >= 0 ? 'text-kucoin-green' : 'text-kucoin-red'}>
                              ${pos.pnl >= 0 ? '+' : ''}{pos.pnl}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Center Column - Chart */}
            <div className="lg:col-span-2">
              <Card className="kucoin-card-professional border-0 h-[600px]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground">{selectedPair} Perpetual</CardTitle>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-muted-foreground">Mark Price:</span>
                      <span className="font-medium text-foreground">${selectedPairData?.price.toLocaleString()}</span>
                      <span className="text-muted-foreground">Funding:</span>
                      <span className={selectedPairData?.funding.includes('-') ? 'text-kucoin-red' : 'text-kucoin-green'}>
                        {selectedPairData?.funding}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-full">
                  <TradingViewChart 
                    symbol={`BINANCE:${selectedPair}`}
                    theme="dark"
                    height={500}
                    interval="5"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Form */}
            <div className="space-y-6">
              {/* Order Form */}
              <Card className="kucoin-card-professional border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground">Place Order</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                        <Target className="w-3 h-3 mr-1" />
                        Leverage: {leverage[0]}x
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Position Type */}
                  <Tabs value={position} onValueChange={(value) => setPosition(value as 'long' | 'short')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="long" className="text-kucoin-green data-[state=active]:bg-kucoin-green data-[state=active]:text-white">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Long
                      </TabsTrigger>
                      <TabsTrigger value="short" className="text-kucoin-red data-[state=active]:bg-kucoin-red data-[state=active]:text-white">
                        <TrendingDown className="w-4 h-4 mr-2" />
                        Short
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Leverage */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Leverage</Label>
                      <span className="text-sm font-medium text-foreground">{leverage[0]}x</span>
                    </div>
                    <Slider
                      value={leverage}
                      onValueChange={setLeverage}
                      max={125}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1x</span>
                      <span>25x</span>
                      <span>50x</span>
                      <span>125x</span>
                    </div>
                  </div>

                  {/* Margin Mode */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Cross Margin</Label>
                    <Switch 
                      checked={crossMargin} 
                      onCheckedChange={setCrossMargin}
                    />
                  </div>

                  <Separator />

                  {/* Order Type */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Order Type</Label>
                    <Select value={orderType} onValueChange={(value) => setOrderType(value as any)}>
                      <SelectTrigger className="kucoin-input-professional">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">Market</SelectItem>
                        <SelectItem value="limit">Limit</SelectItem>
                        <SelectItem value="stop">Stop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price (for limit orders) */}
                  {orderType !== 'market' && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Price (USDT)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="kucoin-input-professional"
                      />
                    </div>
                  )}

                  {/* Stop Price (for stop orders) */}
                  {orderType === 'stop' && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Stop Price (USDT)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={stopPrice}
                        onChange={(e) => setStopPrice(e.target.value)}
                        className="kucoin-input-professional"
                      />
                    </div>
                  )}

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Amount ({selectedPair.slice(0, -4)})</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="kucoin-input-professional"
                    />
                  </div>

                  {/* Advanced Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">Post-Only</Label>
                      <Switch checked={postOnly} onCheckedChange={setPostOnly} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">Reduce-Only</Label>
                      <Switch checked={reduceOnly} onCheckedChange={setReduceOnly} />
                    </div>
                  </div>

                  {/* Order Summary */}
                  {amount && (
                    <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Notional Value:</span>
                        <span className="text-foreground">${notionalValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Margin Required:</span>
                        <span className="text-foreground">${marginRequired.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Est. Liq. Price:</span>
                        <span className="text-kucoin-red">$58,234.56</span>
                      </div>
                    </div>
                  )}

                  {/* Place Order Button */}
                  <Button 
                    onClick={handlePlaceOrder}
                    className={`w-full ${
                      position === 'long' 
                        ? 'bg-kucoin-green hover:bg-kucoin-green/90 text-white' 
                        : 'bg-kucoin-red hover:bg-kucoin-red/90 text-white'
                    }`}
                    disabled={isExecuting}
                  >
                    {isExecuting ? 'Placing Order...' : (position === 'long' ? 'Buy / Long' : 'Sell / Short')}
                  </Button>
                </CardContent>
              </Card>

              {/* Account Balance */}
              <Card className="kucoin-card-professional border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Futures Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Available Balance:</span>
                    <span className="text-sm font-medium text-foreground">$12,450.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Used Margin:</span>
                    <span className="text-sm text-foreground">$3,998.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Unrealized PnL:</span>
                    <span className="text-sm text-kucoin-green">+$653.50</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total Balance:</span>
                    <span className="text-sm font-bold text-foreground">$16,448.00</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturesPage;