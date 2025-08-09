import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Target, BookOpen, Activity, Settings, Star, Wallet, Clock, TrendingDown as Down, TrendingUp as Up, Brain, Bot, Lock, CircleDollarSign, RefreshCw, Zap, Shield, AlertTriangle, Calculator, Info, Timer, Search, Filter, Eye, Play, Pause, Plus, Code, Rocket, X, Loader2, Percent, Coins, Award, Unlock, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import realTimePriceService, { CryptoPrice } from '@/services/realTimePriceService';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const ViewOnlyTradingPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const [cryptoPrices, setCryptoPrices] = useState<Map<string, CryptoPrice>>(new Map());
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [activeTab, setActiveTab] = useState("spot");

  useEffect(() => {
    // Subscribe to real-time price updates
    const unsubscribe = realTimePriceService.subscribe((prices) => {
      setCryptoPrices(prices);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {Math.abs(change).toFixed(2)}%
      </span>
    );
  };

  const handleTradeAction = (action: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in or create an account to start trading",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    // KYC restrictions removed - all authenticated users can trade
    navigate('/trading');
  };

  const getCurrentPrice = () => {
    const btcPrice = cryptoPrices.get('BTC');
    return btcPrice ? btcPrice.price : 43250.50;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {/* Trading Pair Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-card border rounded-lg p-3 sm:p-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-6">
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{selectedPair}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">View-only Trading Interface</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{formatPrice(getCurrentPrice())}</span>
                {formatChange(2.5)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Authentication Banner */}
        {!isAuthenticated && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Sign In to Start Trading</h3>
                    <p className="text-blue-700">Create an account to access all trading features</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate('/auth')}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/auth')}>
                    Create Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KYC Banner removed - verification is now optional */}
        {false && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-orange-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-orange-900">Complete KYC Verification</h3>
                    <p className="text-orange-700">Verify your identity to access all trading features</p>
                  </div>
                </div>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => navigate('/kyc')}
                >
                  Complete Verification
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Trading Chart Area */}
          <div className="lg:col-span-3">
            <Card className="h-96">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Trading Chart</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">View Only</Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTradeAction('chart')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Full Chart
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-80">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Interactive trading chart</p>
                  <Button onClick={() => handleTradeAction('chart')}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In to View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Trade</CardTitle>
                <CardDescription>Place orders instantly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Amount (USDT)</Label>
                  <Input placeholder="0.00" disabled />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleTradeAction('buy')}
                    disabled={!isAuthenticated}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Buy
                  </Button>
                  <Button 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleTradeAction('sell')}
                    disabled={!isAuthenticated}
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Sell
                  </Button>
                </div>
                {!isAuthenticated && (
                  <p className="text-xs text-muted-foreground text-center">
                    Sign in to start trading
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from(cryptoPrices.values()).slice(0, 5).map((data) => (
                  <div key={data.symbol} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{data.symbol}</Badge>
                      <span className="text-sm font-medium">{formatPrice(data.price)}</span>
                    </div>
                    <div className="text-sm">
                      {formatChange(data.change24h)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trading Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleTradeAction('spot')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Spot Trading
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleTradeAction('futures')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Futures Trading
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleTradeAction('options')}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Options Trading
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleTradeAction('bots')}
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Trading Bots
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trading Tabs */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="spot">Spot</TabsTrigger>
              <TabsTrigger value="futures">Futures</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
              <TabsTrigger value="bots">Bots</TabsTrigger>
            </TabsList>
            
            <TabsContent value="spot" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Spot Trading</CardTitle>
                  <CardDescription>Trade cryptocurrencies directly</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Sign in to access spot trading</p>
                  <Button onClick={() => handleTradeAction('spot')}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In to Trade
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="futures" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Futures Trading</CardTitle>
                  <CardDescription>Trade with leverage</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Sign in to access futures trading</p>
                  <Button onClick={() => handleTradeAction('futures')}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In to Trade
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="options" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Options Trading</CardTitle>
                  <CardDescription>Advanced options strategies</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Sign in to access options trading</p>
                  <Button onClick={() => handleTradeAction('options')}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In to Trade
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="bots" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trading Bots</CardTitle>
                  <CardDescription>Automated trading strategies</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Sign in to access trading bots</p>
                  <Button onClick={() => handleTradeAction('bots')}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In to Trade
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ViewOnlyTradingPage;
