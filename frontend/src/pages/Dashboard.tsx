import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  Clock,
  RefreshCw,
  Activity,
  BarChart3,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  User,
  Shield,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import supabaseTradingService from "@/services/supabaseTradingService";


const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Handle URL parameter for tab switching
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'trading', 'portfolio', 'activity'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const loadUserData = async () => {
    if (!user) return;

    setIsLoadingData(true);
    setError(null);

    try {
      // Load trading stats with error handling
      try {
        const { success: statsSuccess, stats } = await supabaseTradingService.getTradingStats(user.id);
        if (statsSuccess && stats) {
          setTradingStats({
            totalTrades: stats.totalTrades || 0,
            wins: stats.winningTrades || 0,
            losses: stats.losingTrades || 0,
            netProfit: stats.netProfit || 0,
            winRate: stats.winRate || 0
          });
        }
      } catch (statsError) {
        console.warn('Could not load trading stats:', statsError);
        // Use data from AuthContext as fallback
        setTradingStats({
          totalTrades: tradingHistory.length,
          wins: tradingHistory.filter(t => t.outcome === 'win').length,
          losses: tradingHistory.filter(t => t.outcome === 'lose').length,
          netProfit: tradingHistory.reduce((sum, t) => sum + (t.profit || 0) - (t.loss || 0), 0),
          winRate: tradingHistory.length > 0 ? 
            (tradingHistory.filter(t => t.outcome === 'win').length / tradingHistory.length) * 100 : 0
        });
      }

      // Load recent trades
      try {
        const { success: tradesSuccess, data: trades } = await supabaseTradingService.getTradeHistory(user.id, 1, 10);
        if (tradesSuccess && trades) {
          setRecentTrades(trades);
        } else {
          // Use data from AuthContext as fallback
          setRecentTrades(tradingHistory.slice(0, 10));
        }
      } catch (tradesError) {
        console.warn('Could not load recent trades:', tradesError);
        setRecentTrades(tradingHistory.slice(0, 10));
      }

      // Calculate portfolio data
      const totalTradingBalance = Object.values(tradingAccount).reduce((sum, asset) => {
        return sum + parseFloat(asset.usdValue.replace('$', ''));
      }, 0);
      
      const totalFundingBalance = parseFloat(fundingAccount.USDT.usdValue.replace('$', ''));
      const totalBalance = totalTradingBalance + totalFundingBalance;
      
      setPortfolioData({
        totalBalance,
        totalValue: totalBalance,
        totalPnL: tradingHistory.reduce((sum, t) => sum + (t.profit || 0) - (t.loss || 0), 0),
        pnlPercentage: totalBalance > 0 ? 
          (tradingHistory.reduce((sum, t) => sum + (t.profit || 0) - (t.loss || 0), 0) / totalBalance) * 100 : 0
      });

    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadUserData();
      toast({
        title: "Data Refreshed",
        description: "Your dashboard data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewDetails = (activity: any) => {
    // Navigate to appropriate page based on activity type
    switch (activity.type) {
      case 'trade':
        navigate('/trading-history');
        break;
      case 'deposit':
        navigate('/wallet');
        break;
      case 'withdrawal':
        navigate('/withdraw');
        break;
      default:
        navigate('/trading-history');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'trade':
        return <Activity className="w-4 h-4" />;
      case 'deposit':
        return <Plus className="w-4 h-4 text-green-500" />;
      case 'withdrawal':
        return <Minus className="w-4 h-4 text-red-500" />;
      case 'login':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'kyc_submitted':
        return <Shield className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'trade':
        return 'bg-blue-500';
      case 'deposit':
        return 'bg-green-500';
      case 'withdrawal':
        return 'bg-red-500';
      case 'login':
        return 'bg-blue-500';
      case 'kyc_submitted':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatActivityDescription = (activity: any) => {
    switch (activity.type) {
      case 'trade':
        return `${activity.action || 'Trade'} ${activity.symbol || 'Unknown'} - ${activity.amount || 0} ${activity.currency || 'USDT'}`;
      case 'deposit':
        return `Deposit ${activity.amount || 0} ${activity.currency || 'USDT'}`;
      case 'withdrawal':
        return `Withdrawal ${activity.amount || 0} ${activity.currency || 'USDT'}`;
      case 'login':
        return 'User logged in';
      case 'kyc_submitted':
        return 'KYC verification submitted';
      default:
        return activity.description || 'Activity';
    }
  };

  const safeArray = (data: any): any[] => {
    return Array.isArray(data) ? data : [];
  };

  const safeNumber = (value: any): number => {
    return typeof value === 'number' ? value : 0;
  };

  const safeString = (value: any): string => {
    return typeof value === 'string' ? value : '';
  };

  const safeTradingAccount = tradingAccount || {
    USDT: { balance: '0.00000000', usdValue: '$0.00', available: '0.00000000' }
  };

  const safeActivityFeed = safeArray(activityFeed);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {safeString(user?.email || 'User')}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your trading account
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${safeNumber(portfolioData.totalBalance).toFixed(2)}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                    <p className="text-2xl font-bold text-foreground">
                      {safeNumber(tradingStats.totalTrades)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {safeNumber(tradingStats.winRate).toFixed(1)}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-primary" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                    <p className={`text-2xl font-bold ${safeNumber(tradingStats.netProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${safeNumber(tradingStats.netProfit).toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </Card>
            </div>

            {/* Recent Activity & Trading History */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Recent Activity & Trading History</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/trading-history')}>
                    View Trading History
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("activity")}>
                    View All Activity
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {/* Combine activity feed and trading history */}
                {(() => {
                  const allActivities = [
                    ...safeActivityFeed.map(activity => ({ ...activity, source: 'activity' })),
                    ...safeArray(recentTrades).map(trade => ({ 
                      ...trade, 
                      source: 'trade',
                      type: 'trade',
                      description: `${trade?.type || 'Trade'} ${trade?.symbol || trade?.pair || 'Unknown'} - ${trade?.outcome === 'win' ? 'Won' : trade?.outcome === 'lose' ? 'Lost' : 'Pending'}`,
                      amount: trade?.profit || trade?.amount || 0
                    }))
                  ].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
                  .slice(0, 12);

                  return allActivities.map((item, index) => (
                    <div 
                      key={item?.id || index} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                      onClick={() => item.source === 'trade' ? navigate('/trading-history') : handleViewDetails(item)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 ${getActivityColor(item?.type || 'default')} rounded-full`}></div>
                        <div className="flex items-center gap-2">
                          {item.source === 'trade' ? (
                            <Activity className="w-4 h-4" />
                          ) : (
                            getActivityIcon(item?.type || 'default')
                          )}
                          <span className="text-sm text-foreground">
                            {item.source === 'trade' ? item.description : formatActivityDescription(item)}
                          </span>
                          {item.source === 'trade' && (
                            <Badge variant="outline" className="text-xs">
                              {safeString(item?.type || 'trade')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item?.amount && (
                          <span className={`text-sm font-medium ${
                            item.type === 'deposit' || (item.source === 'trade' && item.outcome === 'win') ? 'text-green-600' : 
                            item.type === 'withdrawal' || (item.source === 'trade' && item.outcome === 'lose') ? 'text-red-600' : 
                            'text-foreground'
                          }`}>
                            {item.type === 'deposit' || (item.source === 'trade' && item.outcome === 'win') ? '+' : ''}${safeNumber(item.amount).toFixed(2)}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {item?.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
                {safeActivityFeed.length === 0 && safeArray(recentTrades).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No recent activity or trades</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Trading Tab */}
          <TabsContent value="trading" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Trades</h3>
              <div className="space-y-3">
                {safeArray(recentTrades).slice(0, 10).map((trade, index) => (
                  <div key={trade?.id || index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${trade?.outcome === 'win' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-sm text-foreground">
                          {safeString(trade?.symbol || trade?.pair || 'Unknown Pair')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {safeString(trade?.type || 'trade')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${safeNumber(trade?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${safeNumber(trade?.profit || 0).toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {trade?.timestamp ? new Date(trade.timestamp).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
                {safeArray(recentTrades).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No recent trades</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Portfolio Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${safeNumber(portfolioData.totalValue).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                  <p className={`text-2xl font-bold ${safeNumber(portfolioData.totalPnL) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${safeNumber(portfolioData.totalPnL).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Trading Balance</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${safeNumber(safeTradingAccount.USDT?.usdValue?.replace('$', '') || 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Funding Balance</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${safeNumber(fundingAccount.USDT?.usdValue?.replace('$', '') || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">All Activity</h3>
              <div className="space-y-3">
                {safeActivityFeed.map((activity, index) => (
                  <div 
                    key={activity?.id || index} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(activity)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 ${getActivityColor(activity?.type || 'default')} rounded-full`}></div>
                      <div className="flex items-center gap-2">
                        {getActivityIcon(activity?.type || 'default')}
                        <span className="text-sm text-foreground">
                          {formatActivityDescription(activity)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activity?.amount && (
                        <span className={`text-sm font-medium ${
                          activity.type === 'deposit' ? 'text-green-600' : 
                          activity.type === 'withdrawal' ? 'text-red-600' : 
                          'text-foreground'
                        }`}>
                          {activity.type === 'deposit' ? '+' : ''}${safeNumber(activity.amount).toFixed(2)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {activity?.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
                {safeActivityFeed.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No activity found</p>
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