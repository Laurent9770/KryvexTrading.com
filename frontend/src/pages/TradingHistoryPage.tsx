import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Filter,
  Download,
  Search,
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Minus,
  User,
  Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import supabaseTradingService from "@/services/supabaseTradingService";

// Helper function to safely convert to number
const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const TradingHistoryPage = () => {
  const { user, tradingHistory, activityFeed } = useAuth();
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [statistics, setStatistics] = useState({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    netProfit: 0,
    winRate: 0
  });

  // Load trade history and statistics
  useEffect(() => {
    const loadTradeHistory = async () => {
      if (!user?.id) return;
      
      try {
        // Try to load from Supabase first
        const historyResponse = await supabaseTradingService.getTradeHistory(user.id, 1, 100);
        const statsResponse = await supabaseTradingService.getTradingStats(user.id);
        
        let allTrades: any[] = [];
        
        if (historyResponse.success && historyResponse.data) {
          allTrades = [...historyResponse.data];
        }
        
        // Add trades from AuthContext (local state)
        if (tradingHistory && tradingHistory.length > 0) {
          allTrades = [...allTrades, ...tradingHistory];
        }
        
        // Add trade activities from activityFeed
        const tradeActivities = activityFeed
          .filter(activity => activity.type === 'trade')
          .map(activity => ({
            id: activity.id,
            type: 'trade',
            action: activity.description.includes('buy') ? 'buy' : 'sell',
            symbol: activity.description.split(' ')[1] || 'Unknown',
            amount: activity.amount || 0,
            price: activity.amount || 0,
            profit: activity.description.includes('won') ? activity.amount : 0,
            loss: activity.description.includes('lost') ? activity.amount : 0,
            status: activity.description.includes('won') ? 'won' : 
                   activity.description.includes('lost') ? 'lost' : 'pending',
            timestamp: activity.timestamp,
            outcome: activity.description.includes('won') ? 'win' : 
                    activity.description.includes('lost') ? 'lose' : 'pending'
          }));
        
        allTrades = [...allTrades, ...tradeActivities];
        
        // Remove duplicates based on id and timestamp
        const uniqueTrades = allTrades.filter((trade, index, self) => 
          index === self.findIndex(t => 
            t.id === trade.id && t.timestamp === trade.timestamp
          )
        );
        
        // Sort by timestamp (newest first)
        uniqueTrades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setTradeHistory(uniqueTrades);
        
        // Calculate statistics
        const totalTrades = uniqueTrades.length;
        const wins = uniqueTrades.filter(t => t.status === 'won' || t.outcome === 'win').length;
        const losses = uniqueTrades.filter(t => t.status === 'lost' || t.outcome === 'lose').length;
        const netProfit = uniqueTrades.reduce((sum, t) => sum + safeNumber(t.profit) - safeNumber(t.loss), 0);
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        
        setStatistics({
          totalTrades,
          wins,
          losses,
          netProfit,
          winRate
        });
        
      } catch (error) {
        console.error('Error loading trade history:', error);
        
        // Fallback to AuthContext data only
        const allTrades = [...tradingHistory];
        const tradeActivities = activityFeed
          .filter(activity => activity.type === 'trade')
          .map(activity => ({
            id: activity.id,
            type: 'trade',
            action: activity.description.includes('buy') ? 'buy' : 'sell',
            symbol: activity.description.split(' ')[1] || 'Unknown',
            amount: activity.amount || 0,
            price: activity.amount || 0,
            profit: activity.description.includes('won') ? activity.amount : 0,
            loss: activity.description.includes('lost') ? activity.amount : 0,
            status: activity.description.includes('won') ? 'won' : 
                   activity.description.includes('lost') ? 'lost' : 'pending',
            timestamp: activity.timestamp,
            outcome: activity.description.includes('won') ? 'win' : 
                    activity.description.includes('lost') ? 'lose' : 'pending'
          }));
        
        const uniqueTrades = [...allTrades, ...tradeActivities]
          .filter((trade, index, self) => 
            index === self.findIndex(t => 
              t.id === trade.id && t.timestamp === trade.timestamp
            )
          )
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setTradeHistory(uniqueTrades);
        
        const totalTrades = uniqueTrades.length;
        const wins = uniqueTrades.filter(t => t.status === 'won' || t.outcome === 'win').length;
        const losses = uniqueTrades.filter(t => t.status === 'lost' || t.outcome === 'lose').length;
        const netProfit = uniqueTrades.reduce((sum, t) => sum + safeNumber(t.profit) - safeNumber(t.loss), 0);
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        
        setStatistics({
          totalTrades,
          wins,
          losses,
          netProfit,
          winRate
        });
      }
    };
    
    loadTradeHistory();
  }, [user?.id, tradingHistory, activityFeed]);

  // Filter trade history
  useEffect(() => {
    let filtered = [...tradeHistory];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by trade type
    if (selectedType !== 'all') {
      filtered = filtered.filter(trade => trade.type === selectedType);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(trade => 
        trade.status === selectedStatus || trade.outcome === selectedStatus
      );
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      filtered = filtered.filter(trade => 
        new Date(trade.timestamp) >= cutoffDate
      );
    }

    setFilteredHistory(filtered);
  }, [tradeHistory, searchTerm, selectedType, selectedStatus, dateRange]);

  const getStatusIcon = (status: string, outcome?: string) => {
    const finalStatus = status || outcome;
    switch (finalStatus) {
      case 'won':
      case 'win':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'lost':
      case 'lose':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string, outcome?: string) => {
    const finalStatus = status || outcome;
    switch (finalStatus) {
      case 'won':
      case 'win':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Won</Badge>;
      case 'lost':
      case 'lose':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Lost</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'spot':
        return <Activity className="w-4 h-4" />;
      case 'futures':
        return <TrendingUp className="w-4 h-4" />;
      case 'options':
        return <BarChart3 className="w-4 h-4" />;
      case 'binary':
        return <Clock className="w-4 h-4" />;
      case 'quant':
        return <TrendingDown className="w-4 h-4" />;
      case 'bot':
        return <Activity className="w-4 h-4" />;
      case 'staking':
        return <DollarSign className="w-4 h-4" />;
      case 'trade':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Type', 'Action', 'Symbol', 'Amount', 'Price', 'Profit', 'Loss', 'Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredHistory.map(trade => [
        trade.id,
        trade.type,
        trade.action,
        trade.symbol,
        trade.amount,
        trade.price,
        trade.profit || 0,
        trade.loss || 0,
        trade.status || trade.outcome,
        new Date(trade.timestamp).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="kucoin-container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Trading History</h1>
              <p className="text-muted-foreground">Complete trading activity across all platforms</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="kucoin-card p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-xl font-bold text-foreground">{statistics.totalTrades}</p>
              </div>
            </div>
          </Card>

          <Card className="kucoin-card p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wins</p>
                <p className="text-xl font-bold text-green-500">{statistics.wins}</p>
              </div>
            </div>
          </Card>

          <Card className="kucoin-card p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Losses</p>
                <p className="text-xl font-bold text-red-500">{statistics.losses}</p>
              </div>
            </div>
          </Card>

          <Card className="kucoin-card p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-xl font-bold text-yellow-500">{safeNumber(statistics.winRate).toFixed(1)}%</p>
              </div>
            </div>
          </Card>

          <Card className="kucoin-card p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className={`text-xl font-bold ${safeNumber(statistics.netProfit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {safeNumber(statistics.netProfit) >= 0 ? '+' : ''}${safeNumber(statistics.netProfit).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="kucoin-card p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search trades..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="spot">Spot</SelectItem>
                <SelectItem value="futures">Futures</SelectItem>
                <SelectItem value="options">Options</SelectItem>
                <SelectItem value="binary">Binary</SelectItem>
                <SelectItem value="quant">Quant</SelectItem>
                <SelectItem value="bot">Bot</SelectItem>
                <SelectItem value="staking">Staking</SelectItem>
                <SelectItem value="trade">Trade</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1">Last 24h</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Trade History Table */}
        <Card className="kucoin-card p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Trade ID</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Action</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Symbol</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Price</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Profit/Loss</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      No trades found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((trade) => (
                    <tr key={trade.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(trade.type)}
                          <span className="font-mono text-sm">{trade.id}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <Badge variant="outline" className="capitalize">
                          {trade.type}
                        </Badge>
                      </td>
                      <td className="py-4 px-2">
                        <Badge className={trade.action === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                          {trade.action?.toUpperCase() || 'TRADE'}
                        </Badge>
                      </td>
                      <td className="py-4 px-2 font-medium">{trade.symbol}</td>
                      <td className="py-4 px-2 text-right font-mono">{safeNumber(trade.amount).toFixed(2)}</td>
                      <td className="py-4 px-2 text-right font-mono">${safeNumber(trade.price).toFixed(2)}</td>
                      <td className="py-4 px-2 text-right">
                        {trade.profit ? (
                          <span className="text-green-500 font-medium">+${safeNumber(trade.profit).toFixed(2)}</span>
                        ) : trade.loss ? (
                          <span className="text-red-500 font-medium">-${safeNumber(trade.loss).toFixed(2)}</span>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(trade.status, trade.outcome)}
                          {getStatusBadge(trade.status, trade.outcome)}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right text-sm text-muted-foreground">
                        {new Date(trade.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TradingHistoryPage; 