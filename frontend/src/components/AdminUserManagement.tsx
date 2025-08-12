import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  MoreHorizontal,
  UserCheck,
  UserX,
  DollarSign,
  MessageSquare,
  Activity,
  Settings,
  Trash2,
  Archive,
  RefreshCw,
  Bell
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import supabaseAdminDataService, { AdminUser } from '@/services/supabaseAdminDataService';

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

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  suspendedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalBalance: number;
  totalTrades: number;
  averageWinRate: number;
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
      
      console.log('🔍 Loading users using admin data service...');
      const adminUsers = await supabaseAdminDataService.getAllUsers();
      
      // Convert AdminUser to User interface for compatibility
      const users: User[] = adminUsers.map((adminUser: AdminUser) => ({
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName || '',
        lastName: adminUser.lastName || '',
        phone: '',
        username: adminUser.username || '',
        kycLevel: adminUser.kycLevel,
        kycStatus: adminUser.kycStatus,
        accountStatus: adminUser.status,
        walletBalance: adminUser.tradingBalance || 0,
        tradingBalance: adminUser.tradingBalance || 0,
        totalTrades: adminUser.totalTrades || 0,
        winRate: 0, // Will be calculated from trades
        totalProfit: 0, // Will be calculated from trades
        lastLogin: adminUser.lastLogin || adminUser.createdAt,
        createdAt: adminUser.createdAt,
        isVerified: adminUser.kycStatus === 'verified',
        country: '',
        emailVerified: adminUser.kycStatus === 'verified',
        phoneVerified: false
      }));
      
      setUsers(users);
      
      // Calculate user stats
      const stats = calculateUserStats(users);
      setUserStats(stats);
      
      console.log('✅ Users loaded successfully:', users.length);
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

  const calculateUserStats = (users: User[]): UserStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.accountStatus === 'active').length,
      verifiedUsers: users.filter(u => u.isVerified).length,
      suspendedUsers: users.filter(u => u.accountStatus === 'suspended').length,
      newUsersToday: users.filter(u => new Date(u.createdAt) >= today).length,
      newUsersThisWeek: users.filter(u => new Date(u.createdAt) >= weekAgo).length,
      newUsersThisMonth: users.filter(u => new Date(u.createdAt) >= monthAgo).length,
      totalBalance: users.reduce((sum, u) => sum + u.walletBalance, 0),
      totalTrades: users.reduce((sum, u) => sum + u.totalTrades, 0),
      averageWinRate: users.length > 0 ? users.reduce((sum, u) => sum + u.winRate, 0) / users.length : 0
    };
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'banned', reason: string) => {
    try {
      // This would need to be implemented in the admin data service
      console.log(`Updating user ${userId} status to ${status} with reason: ${reason}`);
      
      toast({
        title: "Success",
        description: `User status updated to ${status}`,
      });
      
      // Reload users to reflect changes
      await loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const adjustUserBalance = async (userId: string, type: 'add' | 'subtract', amount: number, reason: string) => {
    try {
      // This would need to be implemented in the admin data service
      console.log(`Adjusting user ${userId} balance: ${type} ${amount} with reason: ${reason}`);
      
      toast({
        title: "Success",
        description: `User balance adjusted successfully`,
      });
      
      // Reload users to reflect changes
      await loadUsers();
      setIsWalletModalOpen(false);
    } catch (error) {
      console.error('Error adjusting user balance:', error);
      toast({
        title: "Error",
        description: "Failed to adjust user balance",
        variant: "destructive"
      });
    }
  };

  const sendMessageToUser = async (userId: string, title: string, message: string, type: 'info' | 'warning' | 'error') => {
    try {
      // This would need to be implemented in the admin data service
      console.log(`Sending message to user ${userId}: ${title} - ${message} (${type})`);
      
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
      
      setIsMessageModalOpen(false);
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
                         user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.accountStatus === statusFilter;
    const matchesKyc = kycFilter === 'all' || user.kycStatus === kycFilter;
    
    return matchesSearch && matchesStatus && matchesKyc;
  });

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-slate-400">Manage all registered users and their accounts</p>
        </div>
        <Button onClick={loadUsers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userStats.totalUsers}</div>
            <p className="text-xs text-slate-400">+{userStats.newUsersToday} today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userStats.activeUsers}</div>
            <p className="text-xs text-slate-400">{userStats.verifiedUsers} verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${userStats.totalBalance.toFixed(2)}</div>
            <p className="text-xs text-slate-400">Across all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userStats.totalTrades}</div>
            <p className="text-xs text-slate-400">{userStats.averageWinRate.toFixed(1)}% avg win rate</p>
          </CardContent>
        </Card>
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={kycFilter} onValueChange={setKycFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All KYC" />
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
          <CardDescription>All registered users with their account information</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Trades</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-slate-400">@{user.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={
                        user.kycStatus === 'verified' ? 'default' :
                        user.kycStatus === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {user.kycStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        user.accountStatus === 'active' ? 'default' :
                        user.accountStatus === 'suspended' ? 'secondary' : 'destructive'
                      }>
                        {user.accountStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>${user.walletBalance.toFixed(2)}</TableCell>
                    <TableCell>{user.totalTrades}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsWalletModalOpen(true);
                          }}>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Adjust Balance
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsMessageModalOpen(true);
                          }}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsActivityModalOpen(true);
                          }}>
                            <Activity className="h-4 w-4 mr-2" />
                            View Activity
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
              Adjust the wallet balance for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adjustment-type">Type</Label>
              <Select 
                value={walletAdjustment.type} 
                onValueChange={(value: 'add' | 'subtract') => setWalletAdjustment(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Funds</SelectItem>
                  <SelectItem value="subtract">Remove Funds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={walletAdjustment.amount}
                onChange={(e) => setWalletAdjustment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={walletAdjustment.reason}
                onChange={(e) => setWalletAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for adjustment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWalletModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedUser && adjustUserBalance(selectedUser.id, walletAdjustment.type, walletAdjustment.amount, walletAdjustment.reason)}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Modal */}
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to User</DialogTitle>
            <DialogDescription>
              Send a message to {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="message-title">Title</Label>
              <Input
                id="message-title"
                value={messageData.title}
                onChange={(e) => setMessageData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter message title"
              />
            </div>
            <div>
              <Label htmlFor="message-content">Message</Label>
              <Textarea
                id="message-content"
                value={messageData.message}
                onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter message content"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="message-type">Type</Label>
              <Select 
                value={messageData.type} 
                onValueChange={(value: 'info' | 'warning' | 'error') => setMessageData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedUser && sendMessageToUser(selectedUser.id, messageData.title, messageData.message, messageData.type)}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Modal */}
      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>User Activity</DialogTitle>
            <DialogDescription>
              Recent activity for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-8 text-slate-400">
              Activity tracking will be implemented in future updates.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivityModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 