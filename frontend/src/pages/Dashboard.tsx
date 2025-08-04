import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityItem } from "@/services/activityService";
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
  Percent
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import tradingEngine from "@/services/tradingEngine";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminAccessHelper from "@/components/AdminAccessHelper";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityItem['type'] | 'all'>('all');
  const [livePortfolioStats, setLivePortfolioStats] = useState({
    totalBalance: "$0.00",
    totalPnl: "$0.00",
    pnlPercentage: "0.0%",
    totalTrades: 0,
    winRate: "0.0%",
    activePositions: 0
  });
  const [unifiedTradeHistory, setUnifiedTradeHistory] = useState<any[]>([]);
  const [tradeStatistics, setTradeStatistics] = useState({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    netProfit: 0,
    winRate: 0
  });
  const [portfolioData, setPortfolioData] = useState({
    totalBalance: 0,
    assets: [],
    distribution: []
  });
  const [recentTrades, setRecentTrades] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    pnlChart: [],
    volumeChart: [],
    winLossDistribution: { wins: 0, losses: 0 },
    insights: {
      mostTradedPair: '',
      mostUsedTradeType: '',
      bestPerformingBot: '',
      bestTrade: ''
    }
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

  // Load unified trade history and statistics
  useEffect(() => {
    const loadTradeData = () => {
      const history = tradingEngine.getTradeHistory();
      const stats = tradingEngine.getTradeStatistics();
      
      setUnifiedTradeHistory(history);
      setTradeStatistics(stats);
    };

    loadTradeData();
    
    // Refresh trade data every 5 seconds
    const interval = setInterval(loadTradeData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Load portfolio data
  useEffect(() => {
    const loadPortfolioData = async () => {
      try {
        if (user?.id) {
          const response = await fetch(`/api/portfolio/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setPortfolioData(data);
          }
        }
      } catch (error) {
        console.error('Error loading portfolio data:', error);
      }
    };

    loadPortfolioData();
    
    // Refresh portfolio data every 10 seconds
    const interval = setInterval(loadPortfolioData, 10000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  // Load recent trades data
  useEffect(() => {
    const loadRecentTrades = async () => {
      try {
        if (user?.id) {
          const response = await fetch(`/api/trades/recent/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setRecentTrades(data);
          }
        }
      } catch (error) {
        console.error('Error loading recent trades:', error);
      }
    };

    loadRecentTrades();
    
    // Refresh recent trades every 15 seconds
    const interval = setInterval(loadRecentTrades, 15000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        if (user?.id) {
          const response = await fetch(`/api/analytics/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setAnalyticsData(data);
          }
        }
      } catch (error) {
        console.error('Error loading analytics data:', error);
      }
    };

    loadAnalyticsData();
    
    // Refresh analytics data every 30 seconds
    const interval = setInterval(loadAnalyticsData, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  // Calculate total values with real-time updates
  useEffect(() => {
    const calculateLivePortfolioStats = () => {
      const totalTradingValue = Object.entries(tradingAccount).reduce((sum, [symbol, asset]) => {
        const realTimePrice = realTimePrices[symbol]?.price || 0;
        const balance = parseFloat(asset.balance.replace(/,/g, ''));
        return sum + (balance * realTimePrice);
      }, 0);

      const totalFundingValue = parseFloat(fundingAccount.USDT.usdValue.replace('$', '').replace(',', ''));
      const totalValue = totalTradingValue + totalFundingValue;

      // Calculate P&L based on real-time prices
      const totalPnl = Object.entries(tradingAccount).reduce((sum, [symbol, asset]) => {
        const realTimePrice = realTimePrices[symbol]?.price || 0;
        const balance = parseFloat(asset.balance.replace(/,/g, ''));
        const basePrice = getAssetBasePrice(symbol);
        return sum + (balance * (realTimePrice - basePrice));
      }, 0);

      const pnlPercentage = totalValue > 0 ? (totalPnl / totalValue) * 100 : 0;

      setLivePortfolioStats({
        totalBalance: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        totalPnl: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pnlPercentage: `${pnlPercentage >= 0 ? '+' : ''}${pnlPercentage.toFixed(1)}%`,
        totalTrades: tradeStatistics.totalTrades,
        winRate: `${tradeStatistics.winRate.toFixed(1)}%`,
        activePositions: portfolioStats.activePositions
      });
    };

    calculateLivePortfolioStats();
    const interval = setInterval(calculateLivePortfolioStats, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [tradingAccount, fundingAccount, realTimePrices, portfolioStats, tradeStatistics]);

  const getAssetBasePrice = (asset: string): number => {
    const basePrices: { [key: string]: number } = {
      BTC: 45000,
      ETH: 3000,
      USDT: 1,
      SOL: 400,
      ADA: 0.8
    };
    return basePrices[asset] || 0;
  };

  const getAssetName = (symbol: string): string => {
    const names: { [key: string]: string } = {
      BTC: "Bitcoin",
      ETH: "Ethereum",
      USDT: "Tether",
      SOL: "Solana",
      ADA: "Cardano"
    };
    return names[symbol] || symbol;
  };

  // Calculate total values
  const totalTradingValue = Object.values(tradingAccount).reduce((sum, asset) => {
    return sum + parseFloat(asset.usdValue.replace('$', '').replace(',', ''));
  }, 0);

  const totalFundingValue = parseFloat(fundingAccount.USDT.usdValue.replace('$', '').replace(',', ''));

  // Asset allocation calculation with real-time prices
  const assetAllocation = Object.entries(tradingAccount).map(([symbol, asset]) => {
    const realTimePrice = realTimePrices[symbol]?.price || getAssetBasePrice(symbol);
    const balance = parseFloat(asset.balance.replace(/,/g, ''));
    const value = balance * realTimePrice;
    const totalValue = Object.entries(tradingAccount).reduce((sum, [sym, ast]) => {
      const rtPrice = realTimePrices[sym]?.price || getAssetBasePrice(sym);
      const bal = parseFloat(ast.balance.replace(/,/g, ''));
      return sum + (bal * rtPrice);
    }, 0);
    const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
    
    const colors: { [key: string]: string } = {
      BTC: "#F7931A",
      ETH: "#627EEA",
      USDT: "#26A17B",
      SOL: "#9945FF",
      ADA: "#0033AD"
    };

    return {
      symbol,
      name: getAssetName(symbol),
      percentage: Math.round(percentage),
      value: `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: colors[symbol] || "#666666",
      priceChange: realTimePrices[symbol] ? `${realTimePrices[symbol].change >= 0 ? '+' : ''}${realTimePrices[symbol].change.toFixed(2)}%` : '0.00%'
    };
  });

  // Performance metrics with real-time data
  const performanceMetrics = {
    dailyPnl: livePortfolioStats.totalPnl,
    weeklyPnl: "+$8,567.89",
    monthlyPnl: "+$23,456.78",
    totalTrades: livePortfolioStats.totalTrades,
    winningTrades: Math.round(livePortfolioStats.totalTrades * parseFloat(livePortfolioStats.winRate) / 100),
    losingTrades: livePortfolioStats.totalTrades - Math.round(livePortfolioStats.totalTrades * parseFloat(livePortfolioStats.winRate) / 100),
    averageWin: "$234.56",
    averageLoss: "$156.78",
    largestWin: "$1,234.56",
    largestLoss: "$567.89"
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "trade":
        return "📈";
      case "transfer":
        return "💸";
      case "conversion":
        return "🔄";
      case "deposit":
        return "💰";
      case "withdrawal":
        return "📤";
      case "bot":
        return "🤖";
      default:
        return "📊";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-400";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400";
      case "failed":
        return "bg-red-500/10 text-red-400";
      case "active":
        return "bg-blue-500/10 text-blue-400";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  const getPnlColor = (pnl: string) => {
    return pnl && pnl.startsWith("+") ? "text-green-400" : "text-red-400";
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call to refresh data
    setTimeout(() => {
      setIsRefreshing(false);
      updatePortfolioStats();
      toast({
        title: "Dashboard Updated",
        description: "All data has been refreshed successfully",
      });
    }, 2000);
  };

  const handleViewDetails = (activity: ActivityItem) => {
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

  // Update portfolio stats when balances change
  useEffect(() => {
    const interval = setInterval(() => {
      updatePortfolioStats();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [tradingAccount, fundingAccount, updatePortfolioStats]);

  // WebSocket real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.onopen = () => {
      console.log('WebSocket connected for Dashboard');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'portfolio_updated':
            if (data.userId === user?.id) {
              setPortfolioData(data.portfolioData);
            }
            break;
          case 'trade_completed':
            if (data.userId === user?.id) {
              // Refresh recent trades
              const loadRecentTrades = async () => {
                try {
                  const response = await fetch(`/api/trades/recent/${user.id}`);
                  if (response.ok) {
                    const tradeData = await response.json();
                    setRecentTrades(tradeData);
                  }
                } catch (error) {
                  console.error('Error refreshing recent trades:', error);
                }
              };
              loadRecentTrades();
            }
            break;
          case 'analytics_updated':
            if (data.userId === user?.id) {
              setAnalyticsData(data.analyticsData);
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      ws.close();
    };
  }, [user?.id]);

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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{t('portfolioDashboard')}</h1>
              <p className="text-sm sm:text-base text-slate-400">{t('welcomeBack')}, {user?.firstName || "John"} {user?.lastName || "Trader"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs sm:text-sm">
              <Star className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Verified Trader</span>
              <span className="sm:hidden">Verified</span>
            </Badge>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs sm:text-sm"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              <span className="sm:hidden">{isRefreshing ? '...' : '↻'}</span>
            </Button>
          </div>
        </div>

        {/* Admin Access Helper - Only show if user is not admin */}
        {user && !user.email?.includes('admin') && (
          <div className="mb-6">
            <AdminAccessHelper />
          </div>
        )}

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-slate-800/50 border-slate-700 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Total Balance</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{livePortfolioStats.totalBalance}</p>
                <p className={`text-xs sm:text-sm ${livePortfolioStats.pnlPercentage && livePortfolioStats.pnlPercentage.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {livePortfolioStats.pnlPercentage}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Total P&L</p>
                <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${livePortfolioStats.totalPnl && livePortfolioStats.totalPnl.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {livePortfolioStats.totalPnl}
                </p>
                <p className="text-xs sm:text-sm text-slate-400">{livePortfolioStats.totalTrades} trades</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Win Rate</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-400">{livePortfolioStats.winRate}</p>
                <p className="text-xs sm:text-sm text-slate-400">{performanceMetrics.winningTrades}/{livePortfolioStats.totalTrades}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Active Positions</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-400">{livePortfolioStats.activePositions}</p>
                <p className="text-xs sm:text-sm text-slate-400">Open trades</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">{t('overview')}</TabsTrigger>
            <TabsTrigger value="portfolio" className="text-xs sm:text-sm">{t('portfolio')}</TabsTrigger>
            <TabsTrigger value="trading-history" className="text-xs sm:text-sm">{t('recentTrades')}</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">{t('analytics')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Activity Feed */}
              <div className="lg:col-span-2">
                <Card className="bg-slate-800/50 border-slate-700 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-white">Recent Activity</h2>
                    <div className="flex gap-1 sm:gap-2">
                      <Button 
                        size="sm" 
                        variant={activityFilter === 'all' ? 'default' : 'outline'} 
                        className={activityFilter === 'all' ? 'bg-kucoin-green text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
                        onClick={() => setActivityFilter('all')}
                      >
                        All
                      </Button>
                      <Button 
                        size="sm" 
                        variant={activityFilter === 'spot' || activityFilter === 'futures' || activityFilter === 'options' || activityFilter === 'binary' || activityFilter === 'quant' ? 'default' : 'outline'} 
                        className={activityFilter === 'spot' || activityFilter === 'futures' || activityFilter === 'options' || activityFilter === 'binary' || activityFilter === 'quant' ? 'bg-kucoin-green text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
                        onClick={() => setActivityFilter('spot')}
                      >
                        Trades
                      </Button>
                      <Button 
                        size="sm" 
                        variant={activityFilter === 'wallet' ? 'default' : 'outline'} 
                        className={activityFilter === 'wallet' ? 'bg-kucoin-green text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
                        onClick={() => setActivityFilter('wallet')}
                      >
                        Transfers
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {activityFeed
                      .filter(activity => activityFilter === 'all' || activity.type === activityFilter)
                      .map((activity) => (
                      <div 
                        key={activity.id}
                        className="flex items-center gap-4 p-4 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(activity)}
                      >
                        <div className="text-2xl">{activity.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-white">
                                {activity.action} {activity.symbol || ''}
                              </p>
                              <p className="text-sm text-slate-400">
                                {activity.description} • {activity.time}
                              </p>
                            </div>
                            <div className="text-right">
                              {activity.meta?.pnl && (
                                <p className={`font-medium ${getPnlColor(activity.meta.pnl)}`}>
                                  {activity.meta.pnl}
                                </p>
                              )}
                              <Badge className={`mt-1 ${getStatusColor(activity.status)}`}>
                                {activity.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Performance</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Daily P&L</span>
                      <span className={`font-medium ${performanceMetrics.dailyPnl && performanceMetrics.dailyPnl.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                        {performanceMetrics.dailyPnl}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Weekly P&L</span>
                      <span className="text-green-400 font-medium">{performanceMetrics.weeklyPnl}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly P&L</span>
                      <span className="text-green-400 font-medium">{performanceMetrics.monthlyPnl}</span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Account Balances</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Trading Account</span>
                      <span className="text-white font-medium">${totalTradingValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Funding Account</span>
                      <span className="text-white font-medium">${totalFundingValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Value</span>
                      <span className="text-green-400 font-medium">${(totalTradingValue + totalFundingValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Wallet Balance</p>
                    <p className="text-2xl font-bold text-white">{livePortfolioStats.totalBalance}</p>
                    <p className={`text-sm ${livePortfolioStats.pnlPercentage && livePortfolioStats.pnlPercentage.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {livePortfolioStats.pnlPercentage} today
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Trading Account</p>
                    <p className="text-2xl font-bold text-white">${totalTradingValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-sm text-slate-400">{Object.keys(tradingAccount).length} assets</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Funding Account</p>
                    <p className="text-2xl font-bold text-white">${totalFundingValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-sm text-slate-400">Available for trading</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset Breakdown */}
              <div className="lg:col-span-2">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Asset Breakdown</h2>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => navigate('/wallet')}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Go to Wallet
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => navigate('/wallet')}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Transfer
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {assetAllocation.map((asset, index) => (
                      <div key={asset.symbol} className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: asset.color }}
                          ></div>
                          <div>
                            <p className="font-medium text-white">{asset.symbol}</p>
                            <p className="text-sm text-slate-400">{asset.name}</p>
                            <p className="text-xs text-slate-500">
                              <span className={`${asset.priceChange && asset.priceChange.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                {asset.priceChange}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white">{asset.value}</p>
                          <p className="text-sm text-slate-400">{asset.percentage}% of total</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Portfolio Distribution */}
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Portfolio Distribution</h3>
                  <div className="h-64 bg-slate-700/50 rounded-lg flex items-center justify-center">
                    <PieChart className="w-16 h-16 text-slate-400" />
                  </div>
                  <div className="mt-4 space-y-2">
                    {assetAllocation.slice(0, 5).map((asset) => (
                      <div key={asset.symbol} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: asset.color }}
                          ></div>
                          <span className="text-sm text-slate-300">{asset.symbol}</span>
                        </div>
                        <span className="text-sm text-slate-400">{asset.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-kucoin-green hover:bg-kucoin-green/90 text-white"
                      onClick={() => navigate('/trading')}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Start Trading
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => navigate('/wallet')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Deposit Funds
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => navigate('/wallet')}
                    >
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Withdraw
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Trading History Tab */}
          <TabsContent value="trading-history" className="space-y-6">
            {/* Recent Trades Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Trades</p>
                    <p className="text-2xl font-bold text-white">{tradeStatistics.totalTrades}</p>
                    <p className="text-sm text-slate-400">All time</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Win Rate</p>
                    <p className="text-2xl font-bold text-green-400">{tradeStatistics.winRate.toFixed(1)}%</p>
                    <p className="text-sm text-slate-400">{tradeStatistics.wins} wins</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Net Profit</p>
                    <p className={`text-2xl font-bold ${tradeStatistics.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${tradeStatistics.netProfit.toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-400">Total P&L</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Avg Duration</p>
                    <p className="text-2xl font-bold text-purple-400">5.2m</p>
                    <p className="text-sm text-slate-400">Per trade</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Trades</h2>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => navigate('/trading-history')}
                  >
                    View All Trading History
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-400 font-medium">Trade Type</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Symbol</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Direction</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Entry Price</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Result</th>
                      <th className="text-left p-3 text-slate-400 font-medium">P&L (USDT)</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Time Executed</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unifiedTradeHistory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400">
                          No trades found. Start trading to see your history here.
                        </td>
                      </tr>
                    ) : (
                      recentTrades.length > 0 ? (
                        recentTrades.map((trade) => (
                          <tr key={trade.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                            <td className="p-3">
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                                {trade.type}
                              </Badge>
                            </td>
                            <td className="p-3 text-white font-medium">{trade.symbol}</td>
                            <td className="p-3">
                              <Badge className={
                                trade.direction === 'LONG' 
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }>
                                {trade.direction}
                              </Badge>
                            </td>
                            <td className="p-3 text-slate-300">${trade.entryPrice.toFixed(2)}</td>
                            <td className="p-3">
                              <Badge className={
                                trade.result === 'WIN' 
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                  : trade.result === 'LOSS'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              }>
                                {trade.result}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {trade.pnl > 0 ? (
                                <span className="text-green-400 font-medium">+${trade.pnl.toFixed(2)}</span>
                              ) : trade.pnl < 0 ? (
                                <span className="text-red-400 font-medium">${trade.pnl.toFixed(2)}</span>
                              ) : (
                                <span className="text-slate-400">--</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-300">
                              {new Date(trade.timeExecuted).toLocaleTimeString()}
                            </td>
                            <td className="p-3 text-slate-300">
                              {trade.duration}
                            </td>
                          </tr>
                        ))
                      ) : (
                        unifiedTradeHistory.slice(0, 10).map((trade) => (
                          <tr key={trade.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                            <td className="p-3">
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                                {trade.type || 'SPOT'}
                              </Badge>
                            </td>
                            <td className="p-3 text-white font-medium">{trade.symbol}</td>
                            <td className="p-3">
                              <Badge className={
                                trade.action === 'buy' 
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }>
                                {trade.action === 'buy' ? 'LONG' : 'SHORT'}
                              </Badge>
                            </td>
                            <td className="p-3 text-slate-300">${trade.price?.toFixed(2)}</td>
                            <td className="p-3">
                              <Badge className={
                                trade.status === 'won' 
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                  : trade.status === 'lost'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              }>
                                {trade.status === 'won' ? 'WIN' : trade.status === 'lost' ? 'LOSS' : 'PENDING'}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {trade.profit ? (
                                <span className="text-green-400 font-medium">+${trade.profit.toFixed(2)}</span>
                              ) : trade.loss ? (
                                <span className="text-red-400 font-medium">-${trade.loss.toFixed(2)}</span>
                              ) : (
                                <span className="text-slate-400">--</span>
                              )}
                            </td>
                            <td className="p-3 text-slate-300">
                              {new Date(trade.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="p-3 text-slate-300">
                              {trade.duration || '5m'}
                            </td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Trades Count</p>
                    <p className="text-2xl font-bold text-white">{tradeStatistics.totalTrades}</p>
                    <p className="text-sm text-slate-400">All trading types</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Win Rate %</p>
                    <p className="text-2xl font-bold text-green-400">{tradeStatistics.winRate.toFixed(1)}%</p>
                    <p className="text-sm text-slate-400">{tradeStatistics.wins} wins</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Avg Trade Duration</p>
                    <p className="text-2xl font-bold text-yellow-400">5.2m</p>
                    <p className="text-sm text-slate-400">Per trade</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profit & Loss Chart */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Profit & Loss Chart</h2>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      7D
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      30D
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      All Time
                    </Button>
                  </div>
                </div>
                <div className="h-64 bg-slate-700/50 rounded-lg flex items-center justify-center">
                  <LineChart className="w-16 h-16 text-slate-400" />
                </div>
              </Card>

              {/* Trading Insights */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-bold mb-6 text-white">Trading Insights</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                                         <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                       <p className="text-sm text-slate-400">Most Traded Pair</p>
                       <p className="text-xl font-bold text-green-400">{analyticsData.insights.mostTradedPair || 'BTC/USDT'}</p>
                     </div>
                     <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                       <p className="text-sm text-slate-400">Most Used Trade Type</p>
                       <p className="text-xl font-bold text-blue-400">{analyticsData.insights.mostUsedTradeType || 'Spot'}</p>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                       <p className="text-sm text-slate-400">Best Performing Bot</p>
                       <p className="text-xl font-bold text-purple-400">{analyticsData.insights.bestPerformingBot || 'Arbitrage Pro'}</p>
                     </div>
                     <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                       <p className="text-sm text-slate-400">Best Trade</p>
                       <p className="text-xl font-bold text-yellow-400">{analyticsData.insights.bestTrade || '+$1,234.56'}</p>
                     </div>
                   </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trade Volume Chart */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-bold mb-6 text-white">Trade Volume per Day</h2>
                <div className="h-64 bg-slate-700/50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-16 h-16 text-slate-400" />
                </div>
              </Card>

              {/* Win vs Loss Chart */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-bold mb-6 text-white">Win vs Loss Distribution</h2>
                <div className="h-64 bg-slate-700/50 rounded-lg flex items-center justify-center">
                  <PieChart className="w-16 h-16 text-slate-400" />
                </div>
                                 <div className="mt-4 flex justify-center gap-8">
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                     <span className="text-sm text-slate-300">Wins: {analyticsData.winLossDistribution.wins || tradeStatistics.wins}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                     <span className="text-sm text-slate-300">Losses: {analyticsData.winLossDistribution.losses || tradeStatistics.losses}</span>
                   </div>
                 </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;