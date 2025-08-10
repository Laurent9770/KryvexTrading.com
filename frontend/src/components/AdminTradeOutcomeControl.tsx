import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Play,
  Pause,
  RotateCcw,
  Shield,
  Settings,
  Activity,
  FileText,
  Lock,
  Unlock,
  AlertCircle,
  Info
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface User {
  id: string;
  full_name: string;
  email: string;
  trade_outcome_mode: 'default' | 'force_win' | 'force_loss';
  trade_outcome_applies_to: 'all_trades' | 'new_trades';
  trade_outcome_reason?: string;
  trade_outcome_enabled_at?: string;
  trade_outcome_enabled_by?: string;
  total_trades: number;
  win_rate: number;
  total_profit: number;
}

interface TradeOutcomeLog {
  id: string;
  admin_id: string;
  user_id: string;
  previous_mode: string;
  new_mode: string;
  applies_to: string;
  reason?: string;
  created_at: string;
  admin_profile?: {
    full_name: string;
    email: string;
  };
  user_profile?: {
    full_name: string;
    email: string;
  };
}

export default function AdminTradeOutcomeControl() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isControlModalOpen, setIsControlModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [outcomeLogs, setOutcomeLogs] = useState<TradeOutcomeLog[]>([]);
  const [controlData, setControlData] = useState({
    mode: 'default' as 'default' | 'force_win' | 'force_loss',
    appliesTo: 'new_trades' as 'all_trades' | 'new_trades',
    reason: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, modeFilter]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          trade_outcome_mode,
          trade_outcome_applies_to,
          trade_outcome_reason,
          trade_outcome_enabled_at,
          trade_outcome_enabled_by
        `)
        .order('full_name', { ascending: true });

      if (error) throw error;

      // TODO: Implement real trading stats calculation from API
      // const usersWithStats = await Promise.all((data || []).map(async user => {
      //   const stats = await fetchUserTradingStats(user.id);
      //   return { ...user, ...stats };
      // }));

      // For now, use empty stats until real API is implemented
      const usersWithStats = (data || []).map(user => ({
        ...user,
        total_trades: 0,
        win_rate: 0,
        total_profit: 0
      }));

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Mode filter
    if (modeFilter !== 'all') {
      filtered = filtered.filter(user => user.trade_outcome_mode === modeFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleTradeOutcomeControl = async () => {
    if (!selectedUser) return;

    try {
      // Update user's trade outcome mode
      const { error: userError } = await supabase
        .from('profiles')
        .update({
          trade_outcome_mode: controlData.mode,
          trade_outcome_applies_to: controlData.appliesTo,
          trade_outcome_reason: controlData.reason,
          trade_outcome_enabled_at: new Date().toISOString(),
          trade_outcome_enabled_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', selectedUser.id);

      if (userError) throw userError;

      // Log the action
      const { error: logError } = await supabase
        .from('trade_outcome_logs')
        .insert({
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          user_id: selectedUser.id,
          previous_mode: selectedUser.trade_outcome_mode || 'default',
          new_mode: controlData.mode,
          applies_to: controlData.appliesTo,
          reason: controlData.reason
        });

      if (logError) throw logError;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_admin_id: (await supabase.auth.getUser()).data.user?.id,
        p_action_type: 'trade_outcome_control',
        p_target_user_id: selectedUser.id,
        p_description: `Changed trade outcome mode to ${controlData.mode} (${controlData.appliesTo})${controlData.reason ? `: ${controlData.reason}` : ''}`
      });

      // If applying to all trades, update existing trades
      if (controlData.appliesTo === 'all_trades' && controlData.mode !== 'default') {
        await updateExistingTrades(selectedUser.id, controlData.mode);
      }

      toast({
        title: "Success",
        description: `Trade outcome mode updated to ${controlData.mode}`
      });

      setIsControlModalOpen(false);
      setControlData({ mode: 'default', appliesTo: 'new_trades', reason: '' });
      fetchUsers();
    } catch (error) {
      console.error('Error updating trade outcome control:', error);
      toast({
        title: "Error",
        description: "Failed to update trade outcome control",
        variant: "destructive"
      });
    }
  };

  const updateExistingTrades = async (userId: string, mode: string) => {
    try {
      const result = mode === 'force_win' ? 'win' : 'lose';
      const profitLoss = mode === 'force_win' ? 100 : -100; // TODO: Calculate real P&L from API

      const { error } = await supabase
        .from('trades')
        .update({
          result,
          profit_loss: profitLoss,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;
    } catch (error) {
      console.error('Error updating existing trades:', error);
    }
  };

  const fetchOutcomeLogs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('trade_outcome_logs')
        .select(`
          *,
          admin_profile:profiles!admin_id(full_name, email),
          user_profile:profiles!user_id(full_name, email)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOutcomeLogs(data || []);
    } catch (error) {
      console.error('Error fetching outcome logs:', error);
    }
  };

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'force_win':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><TrendingUp className="w-3 h-3 mr-1" />Force WIN</Badge>;
      case 'force_loss':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><TrendingDown className="w-3 h-3 mr-1" />Force LOSS</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30"><Settings className="w-3 h-3 mr-1" />Default</Badge>;
    }
  };

  const getAppliesToBadge = (appliesTo: string) => {
    switch (appliesTo) {
      case 'all_trades':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">All Trades</Badge>;
      case 'new_trades':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">New Trades</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{appliesTo}</Badge>;
    }
  };

  const getStats = () => {
    const totalUsers = filteredUsers.length;
    const forceWinUsers = filteredUsers.filter(u => u.trade_outcome_mode === 'force_win').length;
    const forceLossUsers = filteredUsers.filter(u => u.trade_outcome_mode === 'force_loss').length;
    const defaultUsers = filteredUsers.filter(u => u.trade_outcome_mode === 'default').length;

    return { totalUsers, forceWinUsers, forceLossUsers, defaultUsers };
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
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-blue-300 text-sm">Total Users</p>
              </div>
              <User className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.forceWinUsers}</p>
                <p className="text-green-300 text-sm">Force WIN</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.forceLossUsers}</p>
                <p className="text-red-300 text-sm">Force LOSS</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.defaultUsers}</p>
                <p className="text-slate-300 text-sm">Default Mode</p>
              </div>
              <Settings className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning Alert */}
      <Alert className="bg-orange-500/10 border-orange-500/30">
        <AlertCircle className="h-4 w-4 text-orange-400" />
        <AlertDescription className="text-orange-300">
          <strong>⚠️ Trade Outcome Control:</strong> This feature allows you to override normal trading logic. 
          Use with extreme caution as it affects user trading experience and platform integrity.
        </AlertDescription>
      </Alert>

      {/* Filters and Actions */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600 text-white w-64"
                />
              </div>

              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="force_win">Force WIN</SelectItem>
                  <SelectItem value="force_loss">Force LOSS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">🧪 Trade Result Control</CardTitle>
          <CardDescription className="text-slate-400">
            Override trade outcomes for specific users. Use with extreme caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">User</TableHead>
                <TableHead className="text-slate-300">Current Mode</TableHead>
                <TableHead className="text-slate-300">Applies To</TableHead>
                <TableHead className="text-slate-300">Trading Stats</TableHead>
                <TableHead className="text-slate-300">Last Updated</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-slate-700">
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{user.full_name || 'N/A'}</div>
                      <div className="text-sm text-slate-400">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getModeBadge(user.trade_outcome_mode || 'default')}
                  </TableCell>
                  <TableCell>
                    {user.trade_outcome_applies_to ? getAppliesToBadge(user.trade_outcome_applies_to) : <span className="text-slate-400">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-slate-400">Trades:</span>
                        <span className="text-white ml-1">{user.total_trades}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-400">Win Rate:</span>
                        <span className="text-white ml-1">{user.win_rate}%</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-400">P&L:</span>
                        <span className={user.total_profit > 0 ? 'text-green-400' : 'text-red-400'}>
                          ${user.total_profit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {user.trade_outcome_enabled_at ? new Date(user.trade_outcome_enabled_at).toLocaleDateString() : '-'}
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
                            setSelectedUser(user);
                            setControlData({
                              mode: user.trade_outcome_mode || 'default',
                              appliesTo: user.trade_outcome_applies_to || 'new_trades',
                              reason: user.trade_outcome_reason || ''
                            });
                            setIsControlModalOpen(true);
                          }}
                          className="text-slate-300 hover:bg-slate-700"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Control Trade Outcomes
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedUser(user);
                            fetchOutcomeLogs(user.id);
                            setIsLogModalOpen(true);
                          }}
                          className="text-slate-300 hover:bg-slate-700"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View History
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trade Outcome Control Modal */}
      <Dialog open={isControlModalOpen} onOpenChange={setIsControlModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>🧪 Trade Result Control</DialogTitle>
            <DialogDescription className="text-slate-400">
              Override trade outcomes for {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Current Status */}
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Current Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Mode</label>
                    <div className="mt-1">{getModeBadge(selectedUser.trade_outcome_mode || 'default')}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Applies To</label>
                    <div className="mt-1">{selectedUser.trade_outcome_applies_to ? getAppliesToBadge(selectedUser.trade_outcome_applies_to) : <span className="text-slate-400">-</span>}</div>
                  </div>
                  {selectedUser.trade_outcome_reason && (
                    <div className="col-span-2">
                      <label className="text-sm text-slate-400">Reason</label>
                      <p className="text-white mt-1">{selectedUser.trade_outcome_reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Control Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Trade Outcome Mode</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="default"
                      name="mode"
                      value="default"
                      checked={controlData.mode === 'default'}
                      onChange={(e) => setControlData(prev => ({ ...prev, mode: e.target.value as 'default' | 'force_win' | 'force_loss' }))}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600"
                    />
                    <label htmlFor="default" className="text-white flex items-center">
                      <span className="w-3 h-3 bg-slate-400 rounded-full mr-2"></span>
                      Default (Normal trading logic)
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="force_win"
                      name="mode"
                      value="force_win"
                      checked={controlData.mode === 'force_win'}
                      onChange={(e) => setControlData(prev => ({ ...prev, mode: e.target.value as 'default' | 'force_win' | 'force_loss' }))}
                      className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600"
                    />
                    <label htmlFor="force_win" className="text-white flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Force WIN – All trades will result in WIN
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="force_loss"
                      name="mode"
                      value="force_loss"
                      checked={controlData.mode === 'force_loss'}
                      onChange={(e) => setControlData(prev => ({ ...prev, mode: e.target.value as 'default' | 'force_win' | 'force_loss' }))}
                      className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600"
                    />
                    <label htmlFor="force_loss" className="text-white flex items-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      Force LOSS – All trades will result in LOSS
                    </label>
                  </div>
                </div>

                {/* Applies To Selection */}
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Applies To</label>
                  <Select value={controlData.appliesTo} onValueChange={(value) => setControlData(prev => ({ ...prev, appliesTo: value as 'all_trades' | 'new_trades' }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="new_trades">New Trades Only</SelectItem>
                      <SelectItem value="all_trades">All Trades (Including Active)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Reason (Optional)</label>
                  <Textarea
                    value={controlData.reason}
                    onChange={(e) => setControlData(prev => ({ ...prev, reason: e.target.value }))}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="Reason for overriding trade outcomes..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {controlData.mode === 'force_win' && (
                  <Button 
                    onClick={handleTradeOutcomeControl}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Force WIN for this User
                  </Button>
                )}
                {controlData.mode === 'force_loss' && (
                  <Button 
                    onClick={handleTradeOutcomeControl}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Force LOSS for this User
                  </Button>
                )}
                {controlData.mode === 'default' && (
                  <Button 
                    onClick={handleTradeOutcomeControl}
                    className="bg-slate-600 hover:bg-slate-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Normal Trading
                  </Button>
                )}
                <Button 
                  onClick={() => setIsControlModalOpen(false)} 
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

      {/* Outcome Logs Modal */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trade Outcome Control History</DialogTitle>
            <DialogDescription className="text-slate-400">
              Complete history of trade outcome changes for {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300">Admin</TableHead>
                    <TableHead className="text-slate-300">Previous Mode</TableHead>
                    <TableHead className="text-slate-300">New Mode</TableHead>
                    <TableHead className="text-slate-300">Applies To</TableHead>
                    <TableHead className="text-slate-300">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outcomeLogs.map((log) => (
                    <TableRow key={log.id} className="border-slate-700">
                      <TableCell className="text-slate-300">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">
                            {log.admin_profile?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-slate-400">
                            {log.admin_profile?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getModeBadge(log.previous_mode)}
                      </TableCell>
                      <TableCell>
                        {getModeBadge(log.new_mode)}
                      </TableCell>
                      <TableCell>
                        {getAppliesToBadge(log.applies_to)}
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-xs truncate">
                        {log.reason || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 