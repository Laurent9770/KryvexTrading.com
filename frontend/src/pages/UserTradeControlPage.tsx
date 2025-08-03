import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import TradeOverrideControl from '@/components/TradeOverrideControl';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Activity,
  TrendingUp,
  Clock,
  AlertTriangle,
  Shield
} from 'lucide-react';

interface UserInfo {
  userId: string;
  username: string;
  email: string;
  lastActivity: string;
  totalTrades: number;
  activeTrades: number;
}

interface Trade {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'HIGHER' | 'LOWER' | 'ARBITRAGE';
  amount: number;
  entryPrice: number;
  currentPrice?: number;
  status: 'pending' | 'running' | 'completed';
  startTime: string;
  endTime?: string;
  duration: number;
  remainingTime?: number;
  pnl?: number;
  result?: 'WIN' | 'LOSE';
  type: 'spot' | 'futures' | 'options' | 'binary' | 'quant' | 'bots' | 'staking';
}

const UserTradeControlPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [trades, setTrades] = useState<{
    spot: Trade[];
    futures: Trade[];
    options: Trade[];
    binary: Trade[];
    quant: Trade[];
    bots: Trade[];
    staking: Trade[];
  }>({
    spot: [],
    futures: [],
    options: [],
    binary: [],
    quant: [],
    bots: [],
    staking: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('spot');

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // Mock data - in real app, this would fetch from API
      const mockUserInfo: UserInfo = {
        userId: userId!,
        username: 'trader1',
        email: 'trader1@example.com',
        lastActivity: new Date().toISOString(),
        totalTrades: 25,
        activeTrades: 8
      };

             const mockTrades: {
         spot: Trade[];
         futures: Trade[];
         options: Trade[];
         binary: Trade[];
         quant: Trade[];
         bots: Trade[];
         staking: Trade[];
       } = {
         spot: [
           {
             id: 'spot-1',
             symbol: 'BTC/USDT',
             direction: 'LONG' as const,
             amount: 500,
             entryPrice: 45000,
             status: 'running' as const,
             startTime: new Date(Date.now() - 300000).toISOString(),
             duration: 5,
             remainingTime: 120,
             type: 'spot' as const
           },
           {
             id: 'spot-2',
             symbol: 'ETH/USDT',
             direction: 'SHORT' as const,
             amount: 300,
             entryPrice: 3000,
             status: 'completed' as const,
             startTime: new Date(Date.now() - 600000).toISOString(),
             endTime: new Date().toISOString(),
             duration: 10,
             pnl: 45.67,
             result: 'WIN' as const,
             type: 'spot' as const
           }
         ],
         futures: [
           {
             id: 'futures-1',
             symbol: 'BTC/USDT',
             direction: 'LONG' as const,
             amount: 1000,
             entryPrice: 45000,
             status: 'running' as const,
             startTime: new Date(Date.now() - 180000).toISOString(),
             duration: 15,
             remainingTime: 720,
             type: 'futures' as const
           }
         ],
         options: [
           {
             id: 'options-1',
             symbol: 'BTC/USDT',
             direction: 'LONG' as const,
             amount: 200,
             entryPrice: 45000,
             status: 'pending' as const,
             startTime: new Date().toISOString(),
             duration: 30,
             type: 'options' as const
           }
         ],
         binary: [
           {
             id: 'binary-1',
             symbol: 'BTC/USDT',
             direction: 'HIGHER' as const,
             amount: 150,
             entryPrice: 45000,
             status: 'running' as const,
             startTime: new Date(Date.now() - 120000).toISOString(),
             duration: 5,
             remainingTime: 180,
             type: 'binary' as const
           }
         ],
         quant: [
           {
             id: 'quant-1',
             symbol: 'BTC/USDT',
             direction: 'ARBITRAGE' as const,
             amount: 800,
             entryPrice: 44950,
             status: 'completed' as const,
             startTime: new Date(Date.now() - 300000).toISOString(),
             endTime: new Date().toISOString(),
             duration: 2,
             pnl: 12.34,
             result: 'WIN' as const,
             type: 'quant' as const
           }
         ],
         bots: [
           {
             id: 'bots-1',
             symbol: 'ETH/USDT',
             direction: 'LONG' as const,
             amount: 400,
             entryPrice: 3000,
             status: 'running' as const,
             startTime: new Date(Date.now() - 60000).toISOString(),
             duration: 60,
             remainingTime: 3240,
             type: 'bots' as const
           }
         ],
         staking: [
           {
             id: 'staking-1',
             symbol: 'USDT',
             direction: 'LONG' as const,
             amount: 1000,
             entryPrice: 1,
             status: 'running' as const,
             startTime: new Date(Date.now() - 86400000).toISOString(),
             duration: 1440, // 24 hours
             remainingTime: 828000, // 23 hours
             type: 'staking' as const
           }
         ]
       };

      setUserInfo(mockUserInfo);
      setTrades(mockTrades);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load user trading data"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTradeOverride = async (tradeId: string, result: 'WIN' | 'LOSE') => {
    try {
      // Mock API call - in real app, this would call the backend
      console.log(`Overriding trade ${tradeId} to ${result}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      const tradeType = activeTab as keyof typeof trades;
      const updatedTrades = trades[tradeType].map(trade => 
        trade.id === tradeId 
          ? { ...trade, status: 'completed', result, endTime: new Date().toISOString() }
          : trade
      );
      
      setTrades(prev => ({
        ...prev,
        [tradeType]: updatedTrades
      }));

      toast({
        title: "Trade Override Successful",
        description: `Successfully forced ${result.toLowerCase()} for ${activeTab} trade`
      });
    } catch (error) {
      console.error('Error overriding trade:', error);
      throw error;
    }
  };

  const getTotalActiveTrades = () => {
    return Object.values(trades).reduce((total, tradeList) => 
      total + tradeList.filter(t => t.status === 'running' || t.status === 'pending').length, 0
    );
  };

  const getTotalCompletedTrades = () => {
    return Object.values(trades).reduce((total, tradeList) => 
      total + tradeList.filter(t => t.status === 'completed').length, 0
    );
  };

  const getTotalWins = () => {
    return Object.values(trades).reduce((total, tradeList) => 
      total + tradeList.filter(t => t.result === 'WIN').length, 0
    );
  };

  const getTotalLosses = () => {
    return Object.values(trades).reduce((total, tradeList) => 
      total + tradeList.filter(t => t.result === 'LOSE').length, 0
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/trading-control')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trading Control
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <User className="w-8 h-8" />
              User Trade Control
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage trading activities for {userInfo.username}
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">{userInfo.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{userInfo.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Active Trades</p>
                <p className="font-medium text-blue-600">{getTotalActiveTrades()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Last Activity</p>
                <p className="font-medium">{new Date(userInfo.lastActivity).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Wins</p>
                <p className="text-2xl font-bold text-green-600">{getTotalWins()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Losses</p>
                <p className="text-2xl font-bold text-red-600">{getTotalLosses()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Trades</p>
                <p className="text-2xl font-bold text-blue-600">{getTotalActiveTrades()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{getTotalCompletedTrades()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Types Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Trading Control
          </CardTitle>
          <CardDescription>
            Override trade outcomes for all trading types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="spot">Spot</TabsTrigger>
              <TabsTrigger value="futures">Futures</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
              <TabsTrigger value="binary">Binary</TabsTrigger>
              <TabsTrigger value="quant">Quant</TabsTrigger>
              <TabsTrigger value="bots">Bots</TabsTrigger>
              <TabsTrigger value="staking">Staking</TabsTrigger>
            </TabsList>

            <TabsContent value="spot" className="mt-6">
              <TradeOverrideControl
                trades={trades.spot}
                tradeType="spot"
                onOverride={handleTradeOverride}
              />
            </TabsContent>

            <TabsContent value="futures" className="mt-6">
              <TradeOverrideControl
                trades={trades.futures}
                tradeType="futures"
                onOverride={handleTradeOverride}
              />
            </TabsContent>

            <TabsContent value="options" className="mt-6">
              <TradeOverrideControl
                trades={trades.options}
                tradeType="options"
                onOverride={handleTradeOverride}
              />
            </TabsContent>

            <TabsContent value="binary" className="mt-6">
              <TradeOverrideControl
                trades={trades.binary}
                tradeType="binary"
                onOverride={handleTradeOverride}
              />
            </TabsContent>

            <TabsContent value="quant" className="mt-6">
              <TradeOverrideControl
                trades={trades.quant}
                tradeType="quant"
                onOverride={handleTradeOverride}
              />
            </TabsContent>

            <TabsContent value="bots" className="mt-6">
              <TradeOverrideControl
                trades={trades.bots}
                tradeType="bots"
                onOverride={handleTradeOverride}
              />
            </TabsContent>

            <TabsContent value="staking" className="mt-6">
              <TradeOverrideControl
                trades={trades.staking}
                tradeType="staking"
                onOverride={handleTradeOverride}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserTradeControlPage; 