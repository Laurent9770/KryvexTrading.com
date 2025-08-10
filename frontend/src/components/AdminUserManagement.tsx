import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  DollarSign, 
  Lock, 
  Unlock, 
  UserCheck, 
  XCircle,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Download,
  MoreHorizontal,
  Wallet,
  Activity,
  Clock,
  Shield,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  TrendingUp,
  TrendingDown,
  User,
  Settings,
  Trash2,
  Archive,
  RefreshCw,
  Bell
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import adminUserService, { AdminUser, UserStats } from '@/services/adminUserService';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  username?: string;
  kycLevel: number;
  kycStatus: 'pending' | 'verified' | 'rejected';
  accountStatus: 'active' | 'suspended' | 'banned';
  walletBalance: number;
  tradingBalance: number;
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  lastLogin?: string;
  createdAt: string;
  isVerified: boolean;
  country?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export default function AdminUserManagement() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    suspendedUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    totalBalance: 0,
    totalTrades: 0,
    averageWinRate: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Modal states
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  
  // Form states
  const [walletAdjustment, setWalletAdjustment] = useState({
    type: 'add' as 'add' | 'subtract',
    amount: 0,
    reason: ''
  });
  const [messageData, setMessageData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'error'
  });

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔍 Loading users using admin service...');
      const result = await adminUserService.getAllUsers();
      
      if (result.success && result.users) {
        // Convert AdminUser to User interface for compatibility
        const users: User[] = result.users.map((adminUser: AdminUser) => ({
          id: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.firstName || '',
          lastName: adminUser.lastName || '',
          phone: adminUser.phone || '',
          username: adminUser.username || '',
          kycLevel: adminUser.kycLevel,
          kycStatus: adminUser.kycStatus,
          accountStatus: adminUser.accountStatus,
          walletBalance: adminUser.walletBalance,
          tradingBalance: adminUser.tradingBalance,
          totalTrades: adminUser.totalTrades,
          winRate: adminUser.winRate,
          totalProfit: adminUser.totalProfit,
          lastLogin: adminUser.lastLogin,
          createdAt: adminUser.createdAt,
          isVerified: adminUser.isVerified,
          country: adminUser.country || '',
          emailVerified: adminUser.emailVerified || false
        }));

        setUsers(users);
        const stats = await adminUserService.getUserStats(result.users);
        setUserStats(stats);
        console.log('✅ Successfully loaded', users.length, 'users from database');
      } else {
        console.error('❌ Failed to load users:', result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to load users",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserStatusChange = async (userId: string, status: string, reason?: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const result = await adminUserService.updateUserStatus(userId, status, reason);
      
      if (result.success) {
        // Update user status in admin state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { 
              ...user, 
              accountStatus: status as 'active' | 'suspended' | 'banned'
            } : user
          )
        );

        toast({
          title: 'User Status Updated',
          description: `User status changed to ${status}`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update user status',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive'
      });
    }
  };

  const handleWalletAdjustment = async () => {
    if (!selectedUser) return;

    try {
      const result = await adminUserService.adjustUserBalance(
        selectedUser.id,
        walletAdjustment.amount,
        walletAdjustment.type as 'add' | 'subtract',
        walletAdjustment.reason
      );

      if (result.success) {
        // Reload users to get updated data
        await loadUsers();

        // Reset form
        setWalletAdjustment({
          type: 'add',
          amount: 0,
          reason: ''
        });
        setIsWalletModalOpen(false);

        toast({
          title: "Wallet Adjusted",
          description: `${walletAdjustment.type === 'add' ? 'Added' : 'Subtracted'} ${walletAdjustment.amount} USDT to ${selectedUser.firstName} ${selectedUser.lastName}'s wallet.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to adjust wallet",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adjusting wallet:', error);
      toast({
        title: "Error",
        description: "Failed to adjust wallet",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser) return;

    try {
      const result = await adminUserService.sendMessageToUser(
        selectedUser.id,
        messageData.message,
        messageData.title
      );

      if (result.success) {
        // Reset form
        setMessageData({
          title: '',
          message: '',
          type: 'info'
        });
        setIsMessageModalOpen(false);

        toast({
          title: "Message Sent",
          description: `Message sent to ${selectedUser.firstName} ${selectedUser.lastName}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send message",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.accountStatus === statusFilter;
    const matchesKyc = kycFilter === 'all' || user.kycStatus === kycFilter;
    
    return matchesSearch && matchesStatus && matchesKyc;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-400">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500/10 text-yellow-400">Suspended</Badge>;
      case 'banned':
        return <Badge className="bg-red-500/10 text-red-400">Banned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getKYCBadge = (level: number, status: string) => {
    if (level === 2 && status === 'verified') {
      return <Badge className="bg-green-500/10 text-green-400">Level 2</Badge>;
    } else if (level === 1 && status === 'pending') {
      return <Badge className="bg-yellow-500/10 text-yellow-400">Level 1 Pending</Badge>;
    } else if (status === 'rejected') {
      return <Badge className="bg-red-500/10 text-red-400">Rejected</Badge>;
    } else {
      return <Badge variant="outline">Not Verified</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Access Denied</h3>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage all registered users, view their activity, and control their accounts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadUsers} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{userStats.newUsersToday} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {userStats.totalUsers > 0 ? ((userStats.activeUsers / userStats.totalUsers) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.verifiedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {userStats.totalUsers > 0 ? ((userStats.verifiedUsers / userStats.totalUsers) * 100).toFixed(1) : 0}% verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(userStats.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Across all users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.averageWinRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average across users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={kycFilter} onValueChange={setKycFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by KYC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All KYC</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            All registered users with their account information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">Wallet: {formatCurrency(user.walletBalance)}</p>
                        <p className="text-sm">Trading: {formatCurrency(user.tradingBalance)}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.totalTrades} trades • {user.winRate.toFixed(1)}% win rate
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.accountStatus)}
                    </TableCell>
                    <TableCell>
                      {getKYCBadge(user.kycLevel, user.kycStatus)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsActivityModalOpen(true);
                          }}>
                            <Activity className="h-4 w-4 mr-2" />
                            View Activity
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsWalletModalOpen(true);
                          }}>
                            <Wallet className="h-4 w-4 mr-2" />
                            Adjust Balance
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsMessageModalOpen(true);
                          }}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserStatusChange(user.id, 'suspended', 'Admin action')}>
                            <Lock className="h-4 w-4 mr-2" />
                            Suspend User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserStatusChange(user.id, 'active', 'Admin action')}>
                            <Unlock className="h-4 w-4 mr-2" />
                            Activate User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Wallet Adjustment Modal */}
      <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust User Balance</DialogTitle>
            <DialogDescription>
              Add or subtract funds from the user's wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Adjustment Type</label>
              <Select value={walletAdjustment.type} onValueChange={(value: 'add' | 'subtract') => setWalletAdjustment(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Funds</SelectItem>
                  <SelectItem value="subtract">Subtract Funds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Amount (USDT)</label>
              <Input
                type="number"
                value={walletAdjustment.amount}
                onChange={(e) => setWalletAdjustment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={walletAdjustment.reason}
                onChange={(e) => setWalletAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for adjustment"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsWalletModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleWalletAdjustment}>
                Confirm Adjustment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Message Modal */}
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to User</DialogTitle>
            <DialogDescription>
              Send a direct message to the selected user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Message Title</label>
              <Input
                value={messageData.title}
                onChange={(e) => setMessageData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter message title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={messageData.message}
                onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter your message"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsMessageModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage}>
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Activity Modal */}
      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>User Activity</DialogTitle>
            <DialogDescription>
              Recent activity for the selected user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Activity tracking coming soon</p>
                <p className="text-sm text-muted-foreground mt-2">This feature will show detailed user activity logs</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 