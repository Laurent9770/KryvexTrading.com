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
        console.warn('Failed to load trading stats:', statsError);
        // Keep default values
      }

      // Load recent trades with error handling
      try {
        const { success: tradesSuccess, trades } = await supabaseTradingService.getRecentTrades(user.id, 10);
        if (tradesSuccess && trades && Array.isArray(trades)) {
          setRecentTrades(trades);
        } else {
          setRecentTrades([]);
        }
      } catch (tradesError) {
        console.warn('Failed to load recent trades:', tradesError);
        setRecentTrades([]);
      }

      // Load portfolio data with error handling
      try {
        const { success: portfolioSuccess, portfolio } = await supabaseTradingService.getPortfolioData(user.id);
        if (portfolioSuccess && portfolio) {
          setPortfolioData({
            totalBalance: portfolio.totalBalance || 0,
            totalValue: portfolio.totalValue || 0,
            totalPnL: portfolio.totalPnL || 0,
            pnlPercentage: portfolio.pnlPercentage || 0
          });
        }
      } catch (portfolioError) {
        console.warn('Failed to load portfolio data:', portfolioError);
        // Keep default values
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadUserData();
      toast({
        title: "Dashboard refreshed",
        description: "Your dashboard data has been updated.",
      });
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewDetails = (activity: any) => {
    if (!activity || !activity.id) {
      console.warn('Invalid activity data:', activity);
      return;
    }
    
    try {
      navigate(`/trading-history/${activity.id}`);
    } catch (error) {
      console.error('Error navigating to activity details:', error);
    }
  };

  // Safe data access helpers
  const safeArray = (data: any): any[] => {
    return Array.isArray(data) ? data : [];
  };

  const safeNumber = (value: any): number => {
    return typeof value === 'number' && !isNaN(value) ? value : 0;
  };

  const safeString = (value: any): string => {
    return typeof value === 'string' ? value : '';
  };

  // Get safe data from auth context
  const safeTradingAccount = tradingAccount || {};
  const safeFundingAccount = fundingAccount || {};
  const safeActivityFeed = safeArray(activityFeed);
  const safeTradingHistory = safeArray(tradingHistory);
  const safePortfolioStats = portfolioStats || {};
  const safeRealTimePrices = realTimePrices || {};

  // Show loading state
  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-foreground mb-2">Dashboard Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadUserData} className="w-full">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show authentication required
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-blue-500 text-4xl mb-4">🔐</div>
          <h1 className="text-xl font-bold text-foreground mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access your dashboard.</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

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
                      ${safeNumber(safeTradingAccount.balance || 0).toFixed(2)}
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

            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("activity")}>
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {safeActivityFeed.slice(0, 5).map((activity, index) => (
                  <div key={activity?.id || index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm text-foreground">
                        {safeString(activity?.description || 'Activity')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {activity?.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                ))}
                {safeActivityFeed.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No recent activity</p>
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
                      <span className="text-sm text-foreground">
                        {safeString(trade?.pair || 'Unknown Pair')}
                      </span>
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
              </div>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">All Activity</h3>
              <div className="space-y-3">
                {safeActivityFeed.map((activity, index) => (
                  <div key={activity?.id || index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm text-foreground">
                        {safeString(activity?.description || 'Activity')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {activity?.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'N/A'}
                    </span>
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