import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import supabaseAdminDataService from '@/services/supabaseAdminDataService';
import supabaseTradingService from '@/services/supabaseTradingService';
import supabase from '@/lib/supabaseClient';
import AdminWithdrawalManager from '@/components/AdminWithdrawalManager';
import AdminWalletManager from '@/components/AdminWalletManager';
import AdminTradingManager from '@/components/AdminTradingManager';
import AdminKYCManager from '@/components/AdminKYCManager';
import AdminBalanceManager from '@/components/AdminBalanceManager';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileText,
  Activity
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrades: 0,
    totalVolume: 0,
    totalProfit: 0,
    pendingWithdrawals: 0,
    pendingDeposits: 0,
    pendingKYC: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Load all users
      const users = await supabaseAdminDataService.getAllUsers();
      
      // Load trading stats
      const tradingStats = await supabaseTradingService.getTradingStats();
      
      // Load withdrawal and deposit stats
      const withdrawalRequests = await supabaseAdminDataService.getWithdrawalRequests();
      const depositRequests = await supabaseAdminDataService.getDepositRequests();
      
      // Load KYC stats
      const { data: kycDocuments } = await supabase
        .from('kyc_documents')
        .select('status')
        .eq('status', 'pending');
      
      setStats({
        totalUsers: users.length,
        totalTrades: tradingStats.stats?.totalTrades || 0,
        totalVolume: tradingStats.stats?.totalVolume || 0,
        totalProfit: tradingStats.stats?.totalProfit || 0,
        pendingWithdrawals: withdrawalRequests.filter(req => req.status === 'pending').length,
        pendingDeposits: depositRequests.filter(req => req.status === 'pending').length,
        pendingKYC: kycDocuments?.length || 0
      });
      
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
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

      {/* Pending Actions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
                <p className="text-2xl font-bold">{stats.pendingWithdrawals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Deposits</p>
                <p className="text-2xl font-bold">{stats.pendingDeposits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending KYC</p>
                <p className="text-2xl font-bold">{stats.pendingKYC}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>
            Manage users, trading, withdrawals, deposits, and KYC verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="withdraw" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="trading">All Trade</TabsTrigger>
              <TabsTrigger value="kyc">KYC</TabsTrigger>
              <TabsTrigger value="balance">Balance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="withdraw" className="mt-6">
              <AdminWithdrawalManager />
            </TabsContent>
            
            <TabsContent value="deposit" className="mt-6">
              <AdminWalletManager />
            </TabsContent>
            
            <TabsContent value="trading" className="mt-6">
              <AdminTradingManager />
            </TabsContent>
            
            <TabsContent value="kyc" className="mt-6">
              <AdminKYCManager />
            </TabsContent>
            
            <TabsContent value="balance" className="mt-6">
              <AdminBalanceManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;