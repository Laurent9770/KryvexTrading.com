import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import supabaseAdminDataService from '@/services/supabaseAdminDataService';
import supabase from '@/lib/supabaseClient';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity,
  Target,
  Settings,
  Zap,
  DollarSign,
  User,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface UserTradingControl {
  userId: string;
  username: string;
  userEmail: string;
  mode: 'normal' | 'force_win' | 'force_loss' | 'bot_80_win';
  totalTrades: number;
  winRate: number;
  totalVolume: number;
  totalProfit: number;
}

const AdminTradingManager: React.FC = () => {
  const [userTradingControls, setUserTradingControls] = useState<UserTradingControl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrades: 0,
    totalVolume: 0,
    totalProfit: 0,
    activeWinMode: 0,
    activeLossMode: 0,
    activeBotMode: 0
  });

  const { toast } = useToast();

  useEffect(() => {
    loadUserTradingControls();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [userTradingControls, searchTerm]);

  const loadUserTradingControls = async () => {
    try {
      setIsLoading(true);
      
      // Load all users
      const users = await supabaseAdminDataService.getAllUsers();
      
      // Load trading data for each user
      const { data: trades } = await supabase
        .from('trades')
        .select('*');

      // Load existing trading modes
      const { data: tradingModes } = await supabase
        .from('user_trading_modes')
        .select('*');

      const modesMap = new Map(tradingModes?.map((tm: any) => [tm.user_id, tm.mode]) || []);

             // Calculate user stats and create controls
       const userControls: UserTradingControl[] = users.map((user: any) => {
         const userTrades = trades?.filter((trade: any) => trade.user_id === user.user_id) || [];
         const completedTrades = userTrades.filter((trade: any) => trade.status === 'completed');
         const wins = completedTrades.filter((trade: any) => trade.result === 'win').length;
         const winRate = completedTrades.length > 0 ? (wins / completedTrades.length) * 100 : 0;
         const totalVolume = userTrades.reduce((sum: number, trade: any) => sum + (trade.amount || 0), 0);
         const totalProfit = userTrades.reduce((sum: number, trade: any) => sum + (trade.profit_loss || 0), 0);

         const savedMode = modesMap.get(user.user_id) as string;
         const mode: 'normal' | 'force_win' | 'force_loss' | 'bot_80_win' = 
           (savedMode && ['normal', 'force_win', 'force_loss', 'bot_80_win'].includes(savedMode)) 
             ? savedMode as 'normal' | 'force_win' | 'force_loss' | 'bot_80_win'
             : 'normal';

         return {
           userId: user.user_id,
           username: user.full_name || user.email?.split('@')[0] || 'Unknown',
           userEmail: user.email,
           mode: mode,
           totalTrades: userTrades.length,
           winRate: winRate,
           totalVolume: totalVolume,
           totalProfit: totalProfit
         };
       });

      setUserTradingControls(userControls);
      calculateStats(userControls);
      
    } catch (error) {
      console.error('Error loading user trading controls:', error);
      toast({
        title: "Error",
        description: "Failed to load user trading controls",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (controls: UserTradingControl[]) => {
    const totalUsers = controls.length;
    const totalTrades = controls.reduce((sum, user) => sum + user.totalTrades, 0);
    const totalVolume = controls.reduce((sum, user) => sum + user.totalVolume, 0);
    const totalProfit = controls.reduce((sum, user) => sum + user.totalProfit, 0);
    const activeWinMode = controls.filter(user => user.mode === 'force_win').length;
    const activeLossMode = controls.filter(user => user.mode === 'force_loss').length;
    const activeBotMode = controls.filter(user => user.mode === 'bot_80_win').length;

    setStats({
      totalUsers,
      totalTrades,
      totalVolume,
      totalProfit,
      activeWinMode,
      activeLossMode,
      activeBotMode
    });
  };

  const filterUsers = () => {
    // This will be handled by the UI filtering
  };

  const handleSetTradingMode = async (userId: string, mode: 'normal' | 'force_win' | 'force_loss' | 'bot_80_win') => {
    try {
      // Update user trading mode in database
      const { error } = await supabase
        .from('user_trading_modes')
        .upsert({
          user_id: userId,
          mode: mode,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      setUserTradingControls(prev => prev.map(user => 
        user.userId === userId 
          ? { ...user, mode: mode }
          : user
      ));

      // Recalculate stats
      const updatedControls = userTradingControls.map(user => 
        user.userId === userId 
          ? { ...user, mode: mode }
          : user
      );
      calculateStats(updatedControls);

      const modeText = mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      toast({
        title: "Trading Mode Updated",
        description: `User trading mode set to ${modeText}`,
      });
      
    } catch (error) {
      console.error('Error updating trading mode:', error);
      toast({
        title: "Error",
        description: "Failed to update trading mode",
        variant: "destructive"
      });
    }
  };

  const getTradingModeBadge = (mode: string) => {
    switch (mode) {
      case 'normal':
        return <Badge variant="outline" className="flex items-center gap-1"><Settings className="w-3 h-3" /> Normal</Badge>;
      case 'force_win':
        return <Badge variant="default" className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Force Win</Badge>;
      case 'force_loss':
        return <Badge variant="destructive" className="flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Force Loss</Badge>;
      case 'bot_80_win':
        return <Badge variant="secondary" className="flex items-center gap-1"><Target className="w-3 h-3" /> Bot 80% Win</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getFilteredUsers = () => {
    if (!searchTerm) return userTradingControls;
    return userTradingControls.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading trading controls...</p>
        </div>
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
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
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
              <DollarSign className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">${stats.totalVolume.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-2xl font-bold">${stats.totalProfit.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Mode Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Trading Mode Summary
          </CardTitle>
          <CardDescription>
            Overview of current trading simulation modes across all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Settings className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Normal Mode</p>
                <p className="text-lg font-bold">{stats.totalUsers - stats.activeWinMode - stats.activeLossMode - stats.activeBotMode}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Force Win</p>
                <p className="text-lg font-bold">{stats.activeWinMode}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Force Loss</p>
                <p className="text-lg font-bold">{stats.activeLossMode}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Target className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Bot 80% Win</p>
                <p className="text-lg font-bold">{stats.activeBotMode}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Trading Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                User Trading Controls
              </CardTitle>
              <CardDescription>
                Control trading results for each user. Set simulation modes to override normal trading.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={loadUserTradingControls}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getFilteredUsers().length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No users found matching your search.' : 'No users found.'}
              </div>
            ) : (
              getFilteredUsers().map((user) => (
                <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-medium">{user.username}</h4>
                        <p className="text-sm text-muted-foreground">{user.userEmail}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Trades: {user.totalTrades}</span>
                        <span>Win Rate: {user.winRate.toFixed(1)}%</span>
                        <span>Volume: ${user.totalVolume.toLocaleString()}</span>
                        <span>Profit: ${user.totalProfit.toLocaleString()}</span>
                      </div>
                      {getTradingModeBadge(user.mode)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={user.mode === 'force_win' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSetTradingMode(user.userId, 'force_win')}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Win
                    </Button>
                    <Button
                      variant={user.mode === 'force_loss' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => handleSetTradingMode(user.userId, 'force_loss')}
                      className="flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" />
                      Loss
                    </Button>
                    <Button
                      variant={user.mode === 'bot_80_win' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => handleSetTradingMode(user.userId, 'bot_80_win')}
                      className="flex items-center gap-1"
                    >
                      <Target className="w-3 h-3" />
                      Bot
                    </Button>
                    <Button
                      variant={user.mode === 'normal' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSetTradingMode(user.userId, 'normal')}
                      className="flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      Normal
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTradingManager;
