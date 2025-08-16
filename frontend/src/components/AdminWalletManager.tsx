import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import adminWalletService, { 
  AdminWalletTransactionParams, 
  UserWalletBalance, 
  UserTransactionHistory 
} from '../services/adminWalletService';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AdminWalletManagerProps {
  className?: string;
}

const AdminWalletManager: React.FC<AdminWalletManagerProps> = ({ className = '' }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('fund');
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<UserWalletBalance | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<UserTransactionHistory | null>(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [systemStats, setSystemStats] = useState<any>(null);

  // Fund form data
  const [fundFormData, setFundFormData] = useState<AdminWalletTransactionParams>({
    target_user_email: '',
    amount: 0,
    currency: 'USDT',
    wallet_type: 'funding',
    description: 'Admin funding',
    admin_notes: ''
  });

  // Deduct form data
  const [deductFormData, setDeductFormData] = useState<AdminWalletTransactionParams>({
    target_user_email: '',
    amount: 0,
    currency: 'USDT',
    wallet_type: 'funding',
    description: 'Admin deduction',
    admin_notes: ''
  });

  const currencies = ['USDT', 'USD', 'EUR', 'GBP', 'BTC', 'ETH'];
  const walletTypes = ['funding', 'trading'];

  // Load system stats on component mount
  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      const stats = await adminWalletService.getSystemStats();
      setSystemStats(stats);
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const handleFundInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFundFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleDeductInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDeductFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await adminWalletService.sendMoneyToUser(fundFormData);
      
      toast({
        title: "Success",
        description: `Successfully funded ${result.target_user_email} with $${result.amount.toFixed(2)} ${result.currency}`,
      });

      // Reset form
      setFundFormData({
        target_user_email: '',
        amount: 0,
        currency: 'USDT',
        wallet_type: 'funding',
        description: 'Admin funding',
        admin_notes: ''
      });

      // Refresh user info if showing
      if (showUserInfo && fundFormData.target_user_email) {
        await loadUserInfo(fundFormData.target_user_email);
      }

      // Refresh system stats
      await loadSystemStats();

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fund user wallet',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await adminWalletService.deductMoneyFromUser(deductFormData);
      
      toast({
        title: "Success",
        description: `Successfully deducted $${result.amount.toFixed(2)} ${result.currency} from ${result.target_user_email}`,
      });

      // Reset form
      setDeductFormData({
        target_user_email: '',
        amount: 0,
        currency: 'USDT',
        wallet_type: 'funding',
        description: 'Admin deduction',
        admin_notes: ''
      });

      // Refresh user info if showing
      if (showUserInfo && deductFormData.target_user_email) {
        await loadUserInfo(deductFormData.target_user_email);
      }

      // Refresh system stats
      await loadSystemStats();

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to deduct from user wallet',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async (email: string) => {
    try {
      const [balance, history] = await Promise.all([
        adminWalletService.getUserWalletBalance(email),
        adminWalletService.getUserTransactionHistory(email, 10, 0)
      ]);
      setUserBalance(balance);
      setTransactionHistory(history);
      setShowUserInfo(true);
    } catch (error) {
      console.error('Error loading user info:', error);
      toast({
        title: "Error",
        description: "Failed to load user information",
        variant: "destructive"
      });
    }
  };

  const handleCheckUser = async (email: string) => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter a user email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await loadUserInfo(email);
      toast({
        title: "Success",
        description: "User information loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Statistics */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{systemStats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold">${systemStats.totalBalance.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Recent Transactions</p>
                  <p className="text-2xl font-bold">{systemStats.recentTransactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-bold">{new Date(systemStats.lastUpdated).toLocaleTimeString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Management</CardTitle>
          <CardDescription>
            Manage user wallets - add or remove funds (Mock money for educational purposes only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fund" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Fund User
              </TabsTrigger>
              <TabsTrigger value="deduct" className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Deduct Funds
              </TabsTrigger>
            </TabsList>
            
            {/* Fund User Tab */}
            <TabsContent value="fund" className="space-y-4">
              <form onSubmit={handleFundSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fund-email">User Email</Label>
                    <Input
                      id="fund-email"
                      name="target_user_email"
                      type="email"
                      value={fundFormData.target_user_email}
                      onChange={handleFundInputChange}
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fund-amount">Amount</Label>
                    <Input
                      id="fund-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={fundFormData.amount}
                      onChange={handleFundInputChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fund-currency">Currency</Label>
                    <Select 
                      name="currency" 
                      value={fundFormData.currency} 
                      onValueChange={(value) => setFundFormData(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fund-wallet-type">Wallet Type</Label>
                    <Select 
                      name="wallet_type" 
                      value={fundFormData.wallet_type} 
                      onValueChange={(value) => setFundFormData(prev => ({ ...prev, wallet_type: value as 'funding' | 'trading' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {walletTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="fund-description">Description</Label>
                  <Input
                    id="fund-description"
                    name="description"
                    value={fundFormData.description}
                    onChange={handleFundInputChange}
                    placeholder="Reason for funding"
                  />
                </div>

                <div>
                  <Label htmlFor="fund-notes">Admin Notes</Label>
                  <Textarea
                    id="fund-notes"
                    name="admin_notes"
                    value={fundFormData.admin_notes}
                    onChange={handleFundInputChange}
                    placeholder="Internal notes (optional)"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Processing...' : 'Fund User Wallet'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => handleCheckUser(fundFormData.target_user_email)}
                    disabled={loading || !fundFormData.target_user_email}
                  >
                    Check User
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Deduct Funds Tab */}
            <TabsContent value="deduct" className="space-y-4">
              <form onSubmit={handleDeductSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deduct-email">User Email</Label>
                    <Input
                      id="deduct-email"
                      name="target_user_email"
                      type="email"
                      value={deductFormData.target_user_email}
                      onChange={handleDeductInputChange}
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deduct-amount">Amount</Label>
                    <Input
                      id="deduct-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={deductFormData.amount}
                      onChange={handleDeductInputChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deduct-currency">Currency</Label>
                    <Select 
                      name="currency" 
                      value={deductFormData.currency} 
                      onValueChange={(value) => setDeductFormData(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="deduct-wallet-type">Wallet Type</Label>
                    <Select 
                      name="wallet_type" 
                      value={deductFormData.wallet_type} 
                      onValueChange={(value) => setDeductFormData(prev => ({ ...prev, wallet_type: value as 'funding' | 'trading' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {walletTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="deduct-description">Description</Label>
                  <Input
                    id="deduct-description"
                    name="description"
                    value={deductFormData.description}
                    onChange={handleDeductInputChange}
                    placeholder="Reason for deduction"
                  />
                </div>

                <div>
                  <Label htmlFor="deduct-notes">Admin Notes</Label>
                  <Textarea
                    id="deduct-notes"
                    name="admin_notes"
                    value={deductFormData.admin_notes}
                    onChange={handleDeductInputChange}
                    placeholder="Internal notes (optional)"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} variant="destructive" className="flex-1">
                    {loading ? 'Processing...' : 'Deduct from User Wallet'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => handleCheckUser(deductFormData.target_user_email)}
                    disabled={loading || !deductFormData.target_user_email}
                  >
                    Check User
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* User Information Display */}
      {showUserInfo && userBalance && (
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              {userBalance.email} - Last updated: {new Date(userBalance.last_updated).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <p className="text-sm text-muted-foreground">{userBalance.full_name || 'N/A'}</p>
              </div>
              <div>
                <Label>Account Balance</Label>
                <p className="text-sm font-medium">${userBalance.account_balance.toFixed(2)}</p>
              </div>
              <div>
                <Label>Total USD Balance</Label>
                <p className="text-sm font-medium">${userBalance.total_balance_usd.toFixed(2)}</p>
              </div>
            </div>

            {/* Wallet Details */}
            <div>
              <Label>Wallet Details</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                {userBalance.wallets.map((wallet, index) => (
                  <div key={index} className="bg-muted p-3 rounded">
                    <p className="text-sm text-muted-foreground">{wallet.wallet_type} ({wallet.asset})</p>
                    <p className="font-medium">${wallet.balance.toFixed(2)} {wallet.asset}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            {transactionHistory && transactionHistory.transactions.length > 0 && (
              <div>
                <Label>Recent Transactions</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto mt-2">
                  {transactionHistory.transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="bg-muted p-2 rounded text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{transaction.description}</span>
                        <Badge variant={transaction.transaction_type === 'deposit' ? 'default' : 'destructive'}>
                          {transaction.transaction_type === 'deposit' ? '+' : '-'}
                          ${transaction.amount.toFixed(2)} {transaction.currency}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mock Money Disclaimer */}
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Mock Money System
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-300">
                All funds and transactions are simulation data for educational purposes only. No real money is involved.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWalletManager; 