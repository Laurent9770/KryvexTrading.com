import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Star,
  User,
  Send,
  Download,
  ArrowRight,
  ArrowUpDown,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Percent,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import supabaseTradingService from "@/services/supabaseTradingService";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tradingStats, setTradingStats] = useState({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    netProfit: 0,
    winRate: 0
  });
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [portfolioData, setPortfolioData] = useState({
    totalBalance: 0,
    totalValue: 0,
    totalPnL: 0,
    pnlPercentage: 0
  });

  const { 
    tradingAccount, 
    fundingAccount, 
    activityFeed, 
    tradingHistory, 
    portfolioStats,
    realTimePrices,
    updateTradingBalance,
    updateFundingBalance,
    addActivity,
    addTrade,
    updatePortfolioStats
  } = useAuth();

  // Load user data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    }
  }, [isAuthenticated, user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load trading stats
      const { success: statsSuccess, stats } = await supabaseTradingService.getTradingStats(user.id);
      if (statsSuccess && stats) {
        setTradingStats({
          totalTrades: stats.totalTrades,
          wins: stats.winningTrades,
          losses: stats.losingTrades,
          netProfit: stats.netProfit,
          winRate: stats.winRate
        });
      }

      // Load recent trades
      const { success: tradesSuccess, trades } = await supabaseTradingService.getRecentTrades(user.id, 10);
      if (tradesSuccess && trades) {
        setRecentTrades(trades.map(trade => ({
          id: trade.id,
          symbol: 'BTC/USDT', // Default symbol
          type: trade.trade_type,
          amount: trade.amount,
          price: trade.price,
          pnl: trade.profit_loss,
          status: trade.result,
          timestamp: trade.created_at
        })));
      }

      // Load portfolio data
      const { success: portfolioSuccess, portfolio } = await supabaseTradingService.getPortfolioData(user.id);
      if (portfolioSuccess && portfolio) {
        setPortfolioData({
          totalBalance: portfolio.totalBalance,
          totalValue: portfolio.totalValue,
          totalPnL: portfolio.totalPnL,
          pnlPercentage: portfolio.pnlPercentage
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadUserData();
      updatePortfolioStats();
      toast({
        title: "Dashboard Updated",
        description: "All data has been refreshed successfully",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewDetails = (activity: any) => {
    switch (activity.type) {
      case "spot":
      case "futures":
      case "options":
      case "binary":
      case "quant":
        navigate('/trading');
        break;
      case "wallet":
        navigate('/wallet');
        break;
      case "bot":
        navigate('/trading');
        break;
      case "staking":
        navigate('/trading');
        break;
      case "profile":
        navigate('/settings');
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-kucoin-green mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Welcome to Kryvex Trading</h1>
          <p className="text-slate-400 mb-6">Please log in to access your dashboard</p>
          <Button onClick={() => navigate('/auth')} className="bg-kucoin-green hover:bg-kucoin-green/90">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="kucoin-container py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
              <AvatarImage 
                src={user?.avatar || "/placeholder.svg"} 
                alt="Profile Picture"
              />
              <AvatarFallback className="bg-gradient-to-br from-kucoin-green to-kucoin-blue text-white text-sm sm:text-base">
                {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Kryvex Trading Platform</h1>
              <p className="text-sm sm:text-base text-slate-400">Welcome back, {user?.firstName || "John"}!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Market Analysis
            </Button>
            <Button 
              className="bg-kucoin-green hover:bg-kucoin-green/90 text-white"
              onClick={() => navigate('/trading')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Start Trading
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Account Setup Card */}
        {user?.kycStatus === 'pending' && (
          <Card className="bg-orange-500/10 border-orange-500/20 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FileText className="w-8 h-8 text-orange-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Complete Your Account Setup</h3>
                  <p className="text-slate-300">Your account requires verification to access all trading features.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-slate-400">KYC Status:</span>
                    <Badge variant="outline" className="border-orange-500/20 text-orange-400">
                      pending
                    </Badge>
                    <div className="w-32 bg-slate-700 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => navigate('/kyc')}
              >
                Complete Verification
              </Button>
            </div>
          </Card>
        )}

        {/* Account Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-slate-800/50 border-slate-700 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Account Balance</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  ${portfolioData.totalBalance.toFixed(2)}
                </p>
                <p className="text-xs sm:text-sm text-green-400">+0.5% from last week</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Active Trades</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">0</p>
                <p className="text-xs sm:text-sm text-slate-400">No active positions</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Total P&L</p>
                <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${portfolioData.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioData.totalPnL >= 0 ? '+' : ''}${portfolioData.totalPnL.toFixed(2)}
                </p>
                <p className="text-xs sm:text-sm text-slate-400">All time profit/loss</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Win Rate</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-400">
                  {tradingStats.totalTrades > 0 ? `${tradingStats.winRate.toFixed(1)}%` : '--%'}
                </p>
                <p className="text-xs sm:text-sm text-slate-400">No trades yet</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Market Overview</TabsTrigger>
            <TabsTrigger value="positions" className="text-xs sm:text-sm">My Positions</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm">Recent Activity</TabsTrigger>
          </TabsList>

          {/* Market Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Top Trading Pairs</h2>
                  <p className="text-slate-400">Real-time market data for popular trading pairs.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">B</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">BTC/USDT</p>
                      <p className="text-sm text-slate-400">Vol: $427,500,000</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">$95,250.75</p>
                    <p className="text-sm text-green-400">+3.42%</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* My Positions Tab */}
          <TabsContent value="positions" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Active Positions</h2>
                <Button 
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => navigate('/trading')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Open New Position
                </Button>
              </div>
              
              <div className="text-center py-8">
                <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No active positions</p>
                <p className="text-sm text-slate-500 mt-2">Start trading to see your positions here</p>
              </div>
            </Card>
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                <Button 
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => navigate('/trading-history')}
                >
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {recentTrades.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">No recent activity</p>
                    <p className="text-sm text-slate-500 mt-2">Your trading activity will appear here</p>
                  </div>
                ) : (
                  recentTrades.map((trade) => (
                    <div 
                      key={trade.id}
                      className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">📈</div>
                        <div>
                          <p className="font-medium text-white">
                            {trade.type.toUpperCase()} {trade.symbol}
                          </p>
                          <p className="text-sm text-slate-400">
                            {new Date(trade.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </p>
                        <Badge className={`mt-1 ${
                          trade.status === 'win' ? 'bg-green-500/10 text-green-400' :
                          trade.status === 'loss' ? 'bg-red-500/10 text-red-400' :
                          'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {trade.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;