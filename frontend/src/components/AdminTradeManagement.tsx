import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown,
  Search, 
  Filter, 
  Eye, 
  Download, 
  Clock,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  MoreHorizontal,
  Zap,
  Target,
  BarChart3,
  Activity,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Trade {
  id: string;
  user_id: string;
  trade_type: string;
  asset: string;
  amount: number;
  direction: 'up' | 'down';
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  result?: 'win' | 'lose' | 'draw';
  profit_loss?: number;
  payout_percentage?: number;
  expiry_time: string;
  created_at: string;
  completed_at?: string;
  user_profile?: {
    full_name: string;
    email: string;
  };
}

export default function AdminTradeManagement() {
  const { toast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isForceOutcomeModalOpen, setIsForceOutcomeModalOpen] = useState(false);
  const [forceOutcome, setForceOutcome] = useState<'win' | 'lose' | 'draw'>('win');

  // Mock analytics data
  const mockTradeData = [
    { date: '2024-01-01', total: 156, wins: 89, losses: 67, volume: 45000 },
    { date: '2024-01-02', total: 189, wins: 112, losses: 77, volume: 52000 },
    { date: '2024-01-03', total: 134, wins: 78, losses: 56, volume: 38000 },
    { date: '2024-01-04', total: 201, wins: 123, losses: 78, volume: 61000 },
    { date: '2024-01-05', total: 167, wins: 95, losses: 72, volume: 48000 },
    { date: '2024-01-06', total: 223, wins: 134, losses: 89, volume: 67000 },
    { date: '2024-01-07', total: 178, wins: 102, losses: 76, volume: 52000 }
  ];

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    filterTrades();
  }, [trades, searchTerm, statusFilter, typeFilter]);

  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select(`
          *,
          user_profile:profiles!user_id(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
      toast({
        title: "Error",
        description: "Failed to load trades",
        variant: "destructive"
      });
    }
  };

  const filterTrades = () => {
    let filtered = trades;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(trade =>
        trade.user_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.user_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.asset?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trade => trade.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(trade => trade.trade_type === typeFilter);
    }

    setFilteredTrades(filtered);
  };

  const handleForceTradeOutcome = async () => {
    if (!selectedTrade) return;

    try {
      const { error } = await supabase
        .from('trades')
        .update({
          result: forceOutcome,
          status: 'completed',
          completed_at: new Date().toISOString(),
          profit_loss: forceOutcome === 'win' ? selectedTrade.amount * (selectedTrade.payout_percentage || 0.8) : -selectedTrade.amount
        })
        .eq('id', selectedTrade.id);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_admin_id: (await supabase.auth.getUser()).data.user?.id,
        p_action_type: 'force_trade_outcome',
        p_target_user_id: selectedTrade.user_id,
        p_target_table: 'trades',
        p_target_id: selectedTrade.id,
        p_description: `Forced trade outcome to ${forceOutcome} for trade ${selectedTrade.id}`
      });

      toast({
        title: "Success",
        description: `Trade outcome forced to ${forceOutcome}`
      });

      setIsForceOutcomeModalOpen(false);
      fetchTrades();
    } catch (error) {
      console.error('Error forcing trade outcome:', error);
      toast({
        title: "Error",
        description: "Failed to force trade outcome",
        variant: "destructive"
      });
    }
  };

  const handleCancelTrade = async (tradeId: string) => {
    try {
      const { error } = await supabase
        .from('trades')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trade cancelled successfully"
      });

      fetchTrades();
    } catch (error) {
      console.error('Error cancelling trade:', error);
      toast({
        title: "Error",
        description: "Failed to cancel trade",
        variant: "destructive"
      });
    }
  };

  const exportTradeData = () => {
    const csvContent = [
      ['User', 'Asset', 'Type', 'Amount', 'Direction', 'Status', 'Result', 'P&L', 'Created'],
      ...filteredTrades.map(trade => [
        trade.user_profile?.full_name || trade.user_profile?.email || 'Unknown',
        trade.asset,
        trade.trade_type,
        trade.amount.toString(),
        trade.direction,
        trade.status,
        trade.result || 'N/A',
        trade.profit_loss?.toString() || '0',
        new Date(trade.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trades_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'active':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Play className="w-3 h-3 mr-1" />Active</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  const getResultBadge = (result?: string) => {
    switch (result) {
      case 'win':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><TrendingUp className="w-3 h-3 mr-1" />Win</Badge>;
      case 'lose':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><TrendingDown className="w-3 h-3 mr-1" />Lose</Badge>;
      case 'draw':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><RotateCcw className="w-3 h-3 mr-1" />Draw</Badge>;
      default:
        return <span className="text-slate-400">-</span>;
    }
  };

  const getDirectionBadge = (direction: string) => {
    return direction === 'up' ? (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><TrendingUp className="w-3 h-3 mr-1" />Up</Badge>
    ) : (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><TrendingDown className="w-3 h-3 mr-1" />Down</Badge>
    );
  };

  const getStats = () => {
    const totalTrades = filteredTrades.length;
    const activeTrades = filteredTrades.filter(t => t.status === 'active').length;
    const completedTrades = filteredTrades.filter(t => t.status === 'completed').length;
    const totalVolume = filteredTrades.reduce((sum, t) => sum + t.amount, 0);
    const totalProfit = filteredTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const winRate = completedTrades > 0 ? 
      (filteredTrades.filter(t => t.result === 'win').length / completedTrades * 100).toFixed(1) : '0';

    return { totalTrades, activeTrades, completedTrades, totalVolume, totalProfit, winRate };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalTrades}</p>
                <p className="text-blue-300 text-sm">Total Trades</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.activeTrades}</p>
                <p className="text-green-300 text-sm">Active Trades</p>
              </div>
              <Play className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">${stats.totalVolume.toLocaleString()}</p>
                <p className="text-purple-300 text-sm">Total Volume</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.winRate}%</p>
                <p className="text-orange-300 text-sm">Win Rate</p>
              </div>
              <Target className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Trading Activity</CardTitle>
            <CardDescription className="text-slate-400">Daily trading volume and results</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockTradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} />
                <Line type="monotone" dataKey="wins" stroke="#10b981" strokeWidth={3} />
                <Line type="monotone" dataKey="losses" stroke="#ef4444" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Trading Volume</CardTitle>
            <CardDescription className="text-slate-400">Daily trading volume in USD</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockTradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="volume" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search trades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600 text-white w-64"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="binary">Binary Options</SelectItem>
                  <SelectItem value="futures">Futures</SelectItem>
                  <SelectItem value="spot">Spot Trading</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={exportTradeData} variant="outline" className="border-slate-600 text-slate-300">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Trade Management</CardTitle>
          <CardDescription className="text-slate-400">
            Monitor and manage all trading activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">User</TableHead>
                <TableHead className="text-slate-300">Asset</TableHead>
                <TableHead className="text-slate-300">Type</TableHead>
                <TableHead className="text-slate-300">Amount</TableHead>
                <TableHead className="text-slate-300">Direction</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Result</TableHead>
                <TableHead className="text-slate-300">P&L</TableHead>
                <TableHead className="text-slate-300">Created</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.map((trade) => (
                <TableRow key={trade.id} className="border-slate-700">
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">
                        {trade.user_profile?.full_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-slate-400">
                        {trade.user_profile?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white font-medium">{trade.asset}</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {trade.trade_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white font-medium">${trade.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    {getDirectionBadge(trade.direction)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(trade.status)}
                  </TableCell>
                  <TableCell>
                    {getResultBadge(trade.result)}
                  </TableCell>
                  <TableCell className={trade.profit_loss && trade.profit_loss > 0 ? 'text-green-400' : trade.profit_loss && trade.profit_loss < 0 ? 'text-red-400' : 'text-slate-300'}>
                    {trade.profit_loss ? `$${trade.profit_loss.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {new Date(trade.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-600">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedTrade(trade);
                            setIsTradeModalOpen(true);
                          }}
                          className="text-slate-300 hover:bg-slate-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {trade.status === 'active' && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedTrade(trade);
                                setForceOutcome('win');
                                setIsForceOutcomeModalOpen(true);
                              }}
                              className="text-green-300 hover:bg-slate-700"
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Force Win
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedTrade(trade);
                                setForceOutcome('lose');
                                setIsForceOutcomeModalOpen(true);
                              }}
                              className="text-red-300 hover:bg-slate-700"
                            >
                              <TrendingDown className="w-4 h-4 mr-2" />
                              Force Lose
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleCancelTrade(trade.id)}
                              className="text-orange-300 hover:bg-slate-700"
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              Cancel Trade
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trade Details Modal */}
      <Dialog open={isTradeModalOpen} onOpenChange={setIsTradeModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trade Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              Detailed information about this trade
            </DialogDescription>
          </DialogHeader>
          {selectedTrade && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">User</label>
                  <p className="text-white">{selectedTrade.user_profile?.full_name || selectedTrade.user_profile?.email || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Asset</label>
                  <p className="text-white font-medium">{selectedTrade.asset}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Trade Type</label>
                  <Badge className="bg-blue-500/20 text-blue-400">{selectedTrade.trade_type}</Badge>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Amount</label>
                  <p className="text-white font-medium">${selectedTrade.amount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Direction</label>
                  <div>{getDirectionBadge(selectedTrade.direction)}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Status</label>
                  <div>{getStatusBadge(selectedTrade.status)}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Result</label>
                  <div>{getResultBadge(selectedTrade.result)}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">P&L</label>
                  <p className={selectedTrade.profit_loss && selectedTrade.profit_loss > 0 ? 'text-green-400' : selectedTrade.profit_loss && selectedTrade.profit_loss < 0 ? 'text-red-400' : 'text-slate-300'}>
                    {selectedTrade.profit_loss ? `$${selectedTrade.profit_loss.toLocaleString()}` : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Created</label>
                  <p className="text-slate-300">{new Date(selectedTrade.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Expires</label>
                  <p className="text-slate-300">{new Date(selectedTrade.expiry_time).toLocaleString()}</p>
                </div>
                {selectedTrade.completed_at && (
                  <div>
                    <label className="text-sm text-slate-400">Completed</label>
                    <p className="text-slate-300">{new Date(selectedTrade.completed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {selectedTrade.status === 'active' && (
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => {
                      setForceOutcome('win');
                      setIsForceOutcomeModalOpen(true);
                      setIsTradeModalOpen(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Force Win
                  </Button>
                  <Button 
                    onClick={() => {
                      setForceOutcome('lose');
                      setIsForceOutcomeModalOpen(true);
                      setIsTradeModalOpen(false);
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Force Lose
                  </Button>
                  <Button 
                    onClick={() => handleCancelTrade(selectedTrade.id)}
                    variant="outline"
                    className="border-orange-600 text-orange-400"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Cancel Trade
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Force Outcome Modal */}
      <Dialog open={isForceOutcomeModalOpen} onOpenChange={setIsForceOutcomeModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Force Trade Outcome</DialogTitle>
            <DialogDescription className="text-slate-400">
              Manually set the outcome for {selectedTrade?.user_profile?.full_name || selectedTrade?.user_profile?.email}'s trade
            </DialogDescription>
          </DialogHeader>
          {selectedTrade && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Trade Details</label>
                <div className="bg-slate-800 rounded-lg p-4 mt-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Asset:</span>
                      <span className="text-white ml-2">{selectedTrade.asset}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Amount:</span>
                      <span className="text-white ml-2">${selectedTrade.amount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Direction:</span>
                      <span className="text-white ml-2">{selectedTrade.direction === 'up' ? 'Up' : 'Down'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white ml-2">{selectedTrade.trade_type}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400">Outcome</label>
                <Select value={forceOutcome} onValueChange={(value) => setForceOutcome(value as 'win' | 'lose' | 'draw')}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="lose">Lose</SelectItem>
                    <SelectItem value="draw">Draw</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={handleForceTradeOutcome}
                  className={forceOutcome === 'win' ? 'bg-green-600 hover:bg-green-700' : forceOutcome === 'lose' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}
                >
                  {forceOutcome === 'win' && <TrendingUp className="w-4 h-4 mr-2" />}
                  {forceOutcome === 'lose' && <TrendingDown className="w-4 h-4 mr-2" />}
                  {forceOutcome === 'draw' && <RotateCcw className="w-4 h-4 mr-2" />}
                  Force {forceOutcome.charAt(0).toUpperCase() + forceOutcome.slice(1)}
                </Button>
                <Button 
                  onClick={() => setIsForceOutcomeModalOpen(false)} 
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 