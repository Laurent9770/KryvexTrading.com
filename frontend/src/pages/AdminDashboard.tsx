import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Download,
  BarChart3,
  Activity,
  CreditCard,
  Banknote,
  RefreshCw,
  Key,
  Wallet as WalletIcon
} from 'lucide-react';

import AdminKYCVerification from '@/components/AdminKYCVerification';
import AdminDepositManager from '@/components/AdminDepositManager';
import AdminTradeControl from '@/components/AdminTradeControl';
import AdminWithdrawalManager from '@/components/AdminWithdrawalManager';
import AdminWalletManager from '@/components/AdminWalletManager';
import supabaseTradingService from "@/services/supabaseTradingService";
import supabaseAdminDataService from "@/services/supabaseAdminDataService";

interface User {
  id: string;
  full_name: string;
  email: string;
  kyc_status: string;
  account_balance: number;
  is_verified: boolean;
  created_at: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  totalBalance: number;
  avgWinRate: number;
  totalTrades: number;
  completedTrades: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    totalBalance: 0,
    avgWinRate: 0,
    totalTrades: 0,
    completedTrades: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch users
      const adminUsers = await supabaseAdminDataService.getAllUsers();
      
      // Map AdminUser to User interface
      const users: User[] = adminUsers.map(adminUser => ({
        id: adminUser.id,
        full_name: `${adminUser.firstName} ${adminUser.lastName}`.trim() || adminUser.username,
        email: adminUser.email,
        kyc_status: adminUser.kycStatus,
        account_balance: adminUser.tradingBalance || 0,
        is_verified: adminUser.kycStatus === 'verified',
        created_at: adminUser.createdAt
      }));
      
      setAllUsers(users);
      
      // Fetch trading stats
      const tradingStatsResponse = await supabaseTradingService.getTradingStats();
      
      // Calculate dashboard statistics
      const totalUsers = users.length;
      const verifiedUsers = users.filter(user => user.kyc_status === 'verified').length;
      const totalBalance = users.reduce((sum, user) => sum + (user.account_balance || 0), 0);
      
      // Calculate win rate from trading stats
      const stats = tradingStatsResponse.stats || {};
      const totalTrades = stats.totalTrades || 0;
      const completedTrades = stats.completedTrades || 0;
      const winningTrades = stats.winningTrades || 0;
      const avgWinRate = completedTrades > 0 ? (winningTrades / completedTrades) * 100 : 0;
      
      // Get pending counts (these would need to be implemented in the services)
      const pendingDeposits = 0; // TODO: Implement
      const pendingWithdrawals = 0; // TODO: Implement
      
      setStats({
        totalUsers,
        activeUsers: totalUsers, // Simplified for now
        verifiedUsers,
        totalBalance,
        avgWinRate,
        totalTrades,
        completedTrades,
        pendingDeposits,
        pendingWithdrawals
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
    toast({
      title: "Refreshed",
      description: "Dashboard data has been refreshed",
    });
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast({
      title: "Export",
      description: "Export functionality coming soon",
    });
  };

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'verified' && user.is_verified) ||
                         (statusFilter === 'unverified' && !user.is_verified);
    const matchesKyc = kycFilter === 'all' || user.kyc_status === kycFilter;
    
    return matchesSearch && matchesStatus && matchesKyc;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400">Manage your trading platform</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <p className="text-xs text-slate-400">+0 today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Verified Users</CardTitle>
            <Shield className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.verifiedUsers}</div>
            <p className="text-xs text-slate-400">{stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}% verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.totalBalance.toFixed(2)}</div>
            <p className="text-xs text-slate-400">Across all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Avg Win Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.avgWinRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-400">Average across users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
            <p className="text-xs text-slate-400">{stats.completedTrades} completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="kyc" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            KYC
          </TabsTrigger>
          <TabsTrigger value="deposits" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Deposits
          </TabsTrigger>
          <TabsTrigger value="trading" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trading
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="wallets" className="flex items-center gap-2">
            <WalletIcon className="h-4 w-4" />
            Wallets
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">User Management</h2>
              <p className="text-slate-400">Manage all registered users, view their activity, and control their accounts.</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kycFilter} onValueChange={setKycFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All KYC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
              <CardDescription>All registered users with their account information.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={
                          user.kyc_status === 'approved' ? 'default' :
                          user.kyc_status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {user.kyc_status}
                        </Badge>
                      </TableCell>
                      <TableCell>${user.account_balance?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        {user.is_verified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KYC Tab */}
        <TabsContent value="kyc">
          <AdminKYCVerification />
        </TabsContent>

        {/* Deposits Tab */}
        <TabsContent value="deposits">
          <AdminDepositManager />
        </TabsContent>

        {/* Trading Tab */}
        <TabsContent value="trading">
          <AdminTradeControl />
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals">
          <AdminWithdrawalManager />
        </TabsContent>

        {/* Wallets Tab */}
        <TabsContent value="wallets">
          <AdminWalletManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;