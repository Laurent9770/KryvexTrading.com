import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import supabaseTradingService from '@/services/supabaseTradingService';
import supabase from '@/lib/supabaseClient';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  RefreshCw,
  DollarSign,
  Activity
} from 'lucide-react';

interface Trade {
  id: string;
  userId: string;
  userEmail: string;
  username: string;
  pair: string;
  amount: number;
  profit_loss: number;
  status: 'pending' | 'completed' | 'cancelled';
  result?: 'win' | 'loss';
  created_at: string;
}

const AdminTradingManager: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss'>('all');
  const [stats, setStats] = useState({
    totalTrades: 0,
    pendingTrades: 0,
    completedTrades: 0,
    cancelledTrades: 0,
    totalVolume: 0,
    totalProfit: 0,
    winRate: 0
  });

  const { toast } = useToast();

  useEffect(() => {
    loadTrades();
  }, []);

  useEffect(() => {
    filterTrades();
  }, [trades, searchTerm, statusFilter, resultFilter]);

  const loadTrades = async () => {
    try {
      setIsLoading(true);
      
      // Get all trades
      const tradesResponse = await supabaseTradingService.getActiveTrades();
      const tradesData = tradesResponse.data || [];
      
      // Get user profiles for the trades
      const userIds = [...new Set(tradesData.map((trade: any) => trade.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      const profilesMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      // Map trades with user data
      const tradesWithUsers: Trade[] = tradesData.map((trade: any) => {
        const profile = profilesMap.get(trade.user_id) as { email: string; full_name: string } | undefined;
        return {
          id: trade.id,
          userId: trade.user_id,
          userEmail: profile?.email || 'Unknown',
          username: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
          pair: trade.pair || 'BTC/USDT',
          amount: trade.amount || 0,
          profit_loss: trade.profit_loss || 0,
          status: trade.status || 'pending',
          result: trade.result,
          created_at: trade.created_at
        };
      });

      setTrades(tradesWithUsers);
      calculateStats(tradesWithUsers);
      
    } catch (error) {
      console.error('Error loading trades:', error);
      toast({
        title: "Error",
        description: "Failed to load trading data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (tradesData: Trade[]) => {
    const totalTrades = tradesData.length;
    const pendingTrades = tradesData.filter(t => t.status === 'pending').length;
    const completedTrades = tradesData.filter(t => t.status === 'completed').length;
    const cancelledTrades = tradesData.filter(t => t.status === 'cancelled').length;
    const totalVolume = tradesData.reduce((sum, t) => sum + t.amount, 0);
    const totalProfit = tradesData.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const winningTrades = tradesData.filter(t => t.result === 'win').length;
    const winRate = completedTrades > 0 ? (winningTrades / completedTrades) * 100 : 0;

    setStats({
      totalTrades,
      pendingTrades,
      completedTrades,
      cancelledTrades,
      totalVolume,
      totalProfit,
      winRate
    });
  };

  const filterTrades = () => {
    let filtered = trades;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.pair.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trade => trade.status === statusFilter);
    }

    // Result filter
    if (resultFilter !== 'all') {
      filtered = filtered.filter(trade => trade.result === resultFilter);
    }

    setFilteredTrades(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'completed':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResultBadge = (result?: string) => {
    if (!result) return null;
    
    switch (result) {
      case 'win':
        return <Badge variant="default" className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Win</Badge>;
      case 'loss':
        return <Badge variant="destructive" className="flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Loss</Badge>;
      default:
        return null;
    }
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{stats.totalTrades}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingTrades}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">{formatAmount(stats.totalVolume)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by user or pair..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Result</label>
              <Select value={resultFilter} onValueChange={(value: any) => setResultFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={loadTrades}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trading History</CardTitle>
          <CardDescription>
            All trading activities across the platform. Showing {filteredTrades.length} of {trades.length} trades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Profit/Loss</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No trades found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{trade.username}</div>
                        <div className="text-sm text-muted-foreground">{trade.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{trade.pair}</TableCell>
                    <TableCell>{formatAmount(trade.amount)}</TableCell>
                    <TableCell>
                      <span className={trade.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {trade.profit_loss >= 0 ? '+' : ''}{formatAmount(trade.profit_loss)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(trade.status)}</TableCell>
                    <TableCell>{getResultBadge(trade.result)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(trade.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTradingManager;
