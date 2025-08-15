import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Loader2, Search, DollarSign, TrendingUp, Users, Wallet } from 'lucide-react';

interface UserBalance {
  user_id: string;
  email: string;
  full_name: string;
  wallet_type: string;
  asset: string;
  balance: number;
  role: string;
  account_status: string;
  last_balance_update: string;
  user_created_at: string;
}

interface BalanceSummary {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  wallet_count: number;
  total_usdt: number;
  total_usd: number;
  trading_balance: number;
  funding_balance: number;
  last_activity: string;
  user_created_at: string;
}

interface SystemStats {
  total_users: number;
  active_users: number;
  total_usdt_balance: number;
  total_usd_balance: number;
  total_trading_balance: number;
  total_funding_balance: number;
  wallet_count: number;
  balance_history_count: number;
  last_balance_update: string;
  last_balance_change: string;
}

export default function AdminBalanceManager() {
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [balanceSummaries, setBalanceSummaries] = useState<BalanceSummary[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [newBalance, setNewBalance] = useState('');
  const [selectedWalletType, setSelectedWalletType] = useState('trading');
  const [selectedAsset, setSelectedAsset] = useState('USDT');
  const [reason, setReason] = useState('');
  const [updatingBalance, setUpdatingBalance] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user balances
      const { data: balances, error: balancesError } = await supabase
        .from('admin_user_balances')
        .select('*')
        .order('user_created_at', { ascending: false });

      if (balancesError) throw balancesError;
      setUserBalances(balances || []);

      // Load balance summaries
      const { data: summaries, error: summariesError } = await supabase
        .from('admin_balance_summary')
        .select('*')
        .order('total_usdt', { ascending: false });

      if (summariesError) throw summariesError;
      setBalanceSummaries(summaries || []);

      // Load system stats
      const { data: stats, error: statsError } = await supabase
        .rpc('get_system_balance_stats');

      if (statsError) throw statsError;
      setSystemStats(stats);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load balance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserBalance = async () => {
    if (!selectedUser || !newBalance || !reason) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdatingBalance(true);
      
      const { data, error } = await supabase
        .rpc('update_user_balance', {
          target_user_id: selectedUser,
          wallet_type_param: selectedWalletType,
          asset_param: selectedAsset,
          new_balance: parseFloat(newBalance),
          change_type_param: 'admin_adjustment',
          reason_param: reason
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Balance updated successfully. Change: ${data.change_amount} ${selectedAsset}`,
      });

      // Reset form
      setSelectedUser('');
      setNewBalance('');
      setReason('');
      
      // Reload data
      await loadData();

    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: "Error",
        description: "Failed to update balance",
        variant: "destructive",
      });
    } finally {
      setUpdatingBalance(false);
    }
  };

  const filteredBalances = userBalances.filter(balance =>
    balance.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.user_id.includes(searchTerm)
  );

  const filteredSummaries = balanceSummaries.filter(summary =>
    summary.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.user_id.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading balance data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Balance Management</h1>
        <Button onClick={loadData} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* System Statistics */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{systemStats.total_users}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total USDT</p>
                  <p className="text-2xl font-bold">${systemStats.total_usdt_balance.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total USD</p>
                  <p className="text-2xl font-bold">${systemStats.total_usd_balance.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Wallets</p>
                  <p className="text-2xl font-bold">{systemStats.wallet_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Balance Update Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update User Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {balanceSummaries.map((summary) => (
                    <SelectItem key={summary.user_id} value={summary.user_id}>
                      {summary.email} ({summary.full_name || 'No name'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Wallet Type</label>
              <Select value={selectedWalletType} onValueChange={setSelectedWalletType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trading">Trading</SelectItem>
                  <SelectItem value="funding">Funding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Asset</label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">New Balance</label>
              <Input
                type="number"
                step="0.00000001"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="text-sm font-medium">Reason</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for balance change"
            />
          </div>
          
          <Button 
            onClick={updateUserBalance} 
            disabled={updatingBalance || !selectedUser || !newBalance || !reason}
            className="mt-4"
          >
            {updatingBalance && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Balance
          </Button>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email, name, or user ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Balance Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Balance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Wallets</TableHead>
                <TableHead>Total USDT</TableHead>
                <TableHead>Total USD</TableHead>
                <TableHead>Trading Balance</TableHead>
                <TableHead>Funding Balance</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSummaries.map((summary) => (
                <TableRow key={summary.user_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{summary.email}</p>
                      <p className="text-sm text-muted-foreground">{summary.full_name || 'No name'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={summary.role === 'admin' ? 'default' : 'secondary'}>
                      {summary.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{summary.wallet_count}</TableCell>
                  <TableCell>${summary.total_usdt.toLocaleString()}</TableCell>
                  <TableCell>${summary.total_usd.toLocaleString()}</TableCell>
                  <TableCell>${summary.trading_balance.toLocaleString()}</TableCell>
                  <TableCell>${summary.funding_balance.toLocaleString()}</TableCell>
                  <TableCell>
                    {summary.last_activity ? new Date(summary.last_activity).toLocaleDateString() : 'Never'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Balance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed User Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Wallet Type</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBalances.map((balance) => (
                <TableRow key={`${balance.user_id}-${balance.wallet_type}-${balance.asset}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{balance.email}</p>
                      <p className="text-sm text-muted-foreground">{balance.full_name || 'No name'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={balance.wallet_type === 'trading' ? 'default' : 'secondary'}>
                      {balance.wallet_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{balance.asset}</TableCell>
                  <TableCell>${balance.balance.toLocaleString()}</TableCell>
                                     <TableCell>
                     <Badge variant={(balance.account_status || 'active') === 'active' ? 'default' : 'destructive'}>
                       {balance.account_status || 'active'}
                     </Badge>
                   </TableCell>
                  <TableCell>
                    {balance.last_balance_update ? new Date(balance.last_balance_update).toLocaleDateString() : 'Never'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
