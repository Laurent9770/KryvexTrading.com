import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import walletService, { UserWallet, WalletTransaction } from '@/services/walletService';
import { 
  Plus, 
  Minus, 
  Wallet, 
  User, 
  DollarSign, 
  Calendar,
  Copy,
  Eye,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import websocketService from '@/services/websocketService';

const AdminWalletManager: React.FC = () => {
  const [userWallets, setUserWallets] = useState<UserWallet[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWallet | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [fundForm, setFundForm] = useState({
    amount: '',
    asset: 'USDT',
    walletType: 'funding' as 'funding' | 'trading',
    remarks: ''
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    
    // Set up WebSocket listener for real-time wallet updates
    const handleWalletUpdate = (data: any) => {
      console.log('AdminWalletManager: Wallet updated:', data);
      
      // Update the specific user's wallet
      setUserWallets(prev => prev.map(wallet => 
        wallet.userId === data.userId 
          ? {
              ...wallet,
              fundingWallet: data.walletType === 'funding' 
                ? { ...wallet.fundingWallet, [data.asset]: data.newBalance }
                : wallet.fundingWallet,
              tradingWallet: data.walletType === 'trading'
                ? { ...wallet.tradingWallet, [data.asset]: data.newBalance }
                : wallet.tradingWallet,
              lastUpdated: new Date().toISOString()
            }
          : wallet
      ));
      
      // Add new transaction to the list
      const newTransaction: WalletTransaction = {
        id: `tx-${Date.now()}`,
        userId: data.userId,
        username: data.username,
        action: data.operation === 'add' ? 'admin_fund' : 'admin_deduct',
        walletType: data.walletType,
        amount: data.amount,
        asset: data.asset,
        performedBy: data.adminEmail || 'admin',
        timestamp: new Date().toISOString(),
        remarks: data.remarks,
        status: 'completed',
        balance: data.newBalance,
        adminEmail: data.adminEmail
      };
      
      setWalletTransactions(prev => [newTransaction, ...prev]);
    };
    
    // Subscribe to WebSocket events
    websocketService.on('wallet_updated', handleWalletUpdate);
    
    // Set up periodic refresh
    const interval = setInterval(loadData, 30000);
    
    return () => {
      clearInterval(interval);
      websocketService.off('wallet_updated', handleWalletUpdate);
    };
  }, []);

  const loadData = () => {
    const wallets = walletService.getAllUserWallets();
    const transactions = walletService.getWalletTransactions();
    setUserWallets(wallets);
    setWalletTransactions(transactions);
  };

  const handleFundWallet = async (userWallet: UserWallet) => {
    if (!user) return;

    const amount = parseFloat(fundForm.amount);
    if (!amount || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0."
      });
      return;
    }

    setIsProcessing(true);
    try {
      const success = walletService.fundUserWallet(
        userWallet.userId,
        userWallet.username,
        fundForm.walletType,
        amount,
        fundForm.asset,
        user.email,
        fundForm.remarks
      );

      if (success) {
        toast({
          title: "Wallet Funded",
          description: `Successfully added ${amount} ${fundForm.asset} to ${userWallet.username}'s ${fundForm.walletType} wallet`
        });
        loadData();
        setFundForm({
          amount: '',
          asset: 'USDT',
          walletType: 'funding',
          remarks: ''
        });
        setSelectedUser(null);
      } else {
        toast({
          variant: "destructive",
          title: "Funding Failed",
          description: "Failed to fund user wallet"
        });
      }
    } catch (error) {
      console.error('Error funding wallet:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fund user wallet"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeductFromWallet = async (userWallet: UserWallet) => {
    if (!user) return;

    const amount = parseFloat(fundForm.amount);
    if (!amount || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0."
      });
      return;
    }

    setIsProcessing(true);
    try {
      const success = walletService.deductFromWallet(
        userWallet.userId,
        userWallet.username,
        fundForm.walletType,
        amount,
        fundForm.asset,
        user.email,
        fundForm.remarks
      );

      if (success) {
        toast({
          title: "Amount Deducted",
          description: `Successfully deducted ${amount} ${fundForm.asset} from ${userWallet.username}'s ${fundForm.walletType} wallet`
        });
        loadData();
        setFundForm({
          amount: '',
          asset: 'USDT',
          walletType: 'funding',
          remarks: ''
        });
        setSelectedUser(null);
      } else {
        toast({
          variant: "destructive",
          title: "Deduction Failed",
          description: "Insufficient balance or invalid operation"
        });
      }
    } catch (error) {
      console.error('Error deducting from wallet:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deduct from user wallet"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatBalance = (balance: number, asset: string) => {
    return `${balance.toLocaleString()} ${asset}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'fund':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'withdraw':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'deduct':
        return <Minus className="w-4 h-4 text-red-500" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'fund':
        return <Badge variant="default" className="flex items-center gap-1"><Plus className="w-3 h-3" /> Funded</Badge>;
      case 'withdraw':
        return <Badge variant="secondary" className="flex items-center gap-1"><Minus className="w-3 h-3" /> Withdrawn</Badge>;
      case 'deduct':
        return <Badge variant="destructive" className="flex items-center gap-1"><Minus className="w-3 h-3" /> Deducted</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User Wallets</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* User Wallets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                User Wallets
              </CardTitle>
              <CardDescription>
                Manage user wallet balances. Add or deduct funds from user wallets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userWallets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No user wallets found.
                  </div>
                ) : (
                  userWallets.map((userWallet) => (
                    <Card key={userWallet.userId} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{userWallet.username}</span>
                              <span className="text-sm text-muted-foreground">({userWallet.email})</span>
                            </div>
                            <Badge variant="outline">
                              Last updated: {formatDate(userWallet.lastUpdated)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Funding Wallet */}
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                Funding Wallet
                              </h4>
                              <div className="space-y-2">
                                {Object.entries(userWallet.fundingWallet).map(([asset, balance]) => (
                                  <div key={asset} className="flex justify-between items-center">
                                    <span className="text-sm">{asset}</span>
                                    <span className="font-medium">{formatBalance(balance, asset)}</span>
                                  </div>
                                ))}
                                {Object.keys(userWallet.fundingWallet).length === 0 && (
                                  <span className="text-sm text-muted-foreground">No funds</span>
                                )}
                              </div>
                            </div>

                            {/* Trading Wallet */}
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-blue-500" />
                                Trading Wallet
                              </h4>
                              <div className="space-y-2">
                                {Object.entries(userWallet.tradingWallet).map(([asset, balance]) => (
                                  <div key={asset} className="flex justify-between items-center">
                                    <span className="text-sm">{asset}</span>
                                    <span className="font-medium">{formatBalance(balance, asset)}</span>
                                  </div>
                                ))}
                                {Object.keys(userWallet.tradingWallet).length === 0 && (
                                  <span className="text-sm text-muted-foreground">No funds</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => setSelectedUser(userWallet)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Funds
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Funds to {userWallet.username}</DialogTitle>
                                <DialogDescription>
                                  Add funds to the user's wallet
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="amount">Amount</Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Enter amount"
                                    value={fundForm.amount}
                                    onChange={(e) => setFundForm(prev => ({ ...prev, amount: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="asset">Asset</Label>
                                  <Select value={fundForm.asset} onValueChange={(asset) => setFundForm(prev => ({ ...prev, asset }))}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="USDT">USDT</SelectItem>
                                      <SelectItem value="BTC">BTC</SelectItem>
                                      <SelectItem value="ETH">ETH</SelectItem>
                                      <SelectItem value="SOL">SOL</SelectItem>
                                      <SelectItem value="ADA">ADA</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="walletType">Wallet Type</Label>
                                  <Select value={fundForm.walletType} onValueChange={(walletType) => setFundForm(prev => ({ ...prev, walletType: walletType as 'funding' | 'trading' }))}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="funding">Funding Wallet</SelectItem>
                                      <SelectItem value="trading">Trading Wallet</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                                  <Textarea
                                    id="remarks"
                                    placeholder="Enter remarks"
                                    value={fundForm.remarks}
                                    onChange={(e) => setFundForm(prev => ({ ...prev, remarks: e.target.value }))}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => handleFundWallet(userWallet)}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? 'Processing...' : 'Add Funds'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => setSelectedUser(userWallet)}
                              >
                                <Minus className="w-4 h-4 mr-1" />
                                Deduct Funds
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Deduct Funds from {userWallet.username}</DialogTitle>
                                <DialogDescription>
                                  Deduct funds from the user's wallet
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="amount">Amount</Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Enter amount"
                                    value={fundForm.amount}
                                    onChange={(e) => setFundForm(prev => ({ ...prev, amount: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="asset">Asset</Label>
                                  <Select value={fundForm.asset} onValueChange={(asset) => setFundForm(prev => ({ ...prev, asset }))}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="USDT">USDT</SelectItem>
                                      <SelectItem value="BTC">BTC</SelectItem>
                                      <SelectItem value="ETH">ETH</SelectItem>
                                      <SelectItem value="SOL">SOL</SelectItem>
                                      <SelectItem value="ADA">ADA</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="walletType">Wallet Type</Label>
                                  <Select value={fundForm.walletType} onValueChange={(walletType) => setFundForm(prev => ({ ...prev, walletType: walletType as 'funding' | 'trading' }))}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="funding">Funding Wallet</SelectItem>
                                      <SelectItem value="trading">Trading Wallet</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                                  <Textarea
                                    id="remarks"
                                    placeholder="Enter remarks"
                                    value={fundForm.remarks}
                                    onChange={(e) => setFundForm(prev => ({ ...prev, remarks: e.target.value }))}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                                  Cancel
                                </Button>
                                <Button 
                                  variant="destructive"
                                  onClick={() => handleDeductFromWallet(userWallet)}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? 'Processing...' : 'Deduct Funds'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                View all wallet-related transactions performed by admins.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {walletTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found.
                  </div>
                ) : (
                  walletTransactions.map((transaction) => (
                    <Card key={transaction.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              {getActionIcon(transaction.action)}
                              <span className="font-medium">{transaction.username}</span>
                            </div>
                            {getActionBadge(transaction.action)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Amount</p>
                              <p className="font-medium">{formatBalance(transaction.amount, transaction.asset)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Wallet Type</p>
                              <p className="font-medium capitalize">{transaction.walletType}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Performed By</p>
                              <p className="font-medium">{transaction.performedBy}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Date</p>
                              <p className="font-medium">{formatDate(transaction.timestamp)}</p>
                            </div>
                          </div>

                          {transaction.remarks && (
                            <div className="mt-3">
                              <p className="text-sm text-muted-foreground mb-1">Remarks</p>
                              <p className="text-sm">{transaction.remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminWalletManager; 