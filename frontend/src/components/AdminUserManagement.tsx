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
  RefreshCw
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import websocketService from '@/services/websocketService';
import userPersistenceService, { UserData } from '@/services/userPersistenceService';

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
  loginAttempts?: number;
  suspensionReason?: string;
  suspendedUntil?: string;
  profilePicture?: string;
  country?: string;
  timezone?: string;
  language?: string;
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

interface UserActivity {
  id: string;
  userId: string;
  activityType: 'login' | 'trade' | 'deposit' | 'withdrawal' | 'kyc_submission' | 'profile_update';
  description: string;
  timestamp: string;
  metadata?: any;
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
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
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
  const [walletAdjustment, setWalletAdjustment] = useState({
    type: 'add',
    amount: 0,
    reason: ''
  });
  const [messageData, setMessageData] = useState({
    title: '',
    message: '',
    type: 'info'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    setupWebSocketListeners();
    
    // Load users from localStorage
    const storedUsers = localStorage.getItem('admin_users');
    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers);
      setUsers(parsedUsers);
      calculateStats(parsedUsers);
    }
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, kycFilter, dateFilter]);

  const setupWebSocketListeners = () => {
    // Listen for new user registrations
    websocketService.on('user_registered', handleNewUserRegistration);
    
    // Listen for user updates
    websocketService.on('profile_updated', handleUserUpdate);
    
    // Listen for KYC updates
    websocketService.on('kyc_level_updated', handleKYCUpdate);
    
    // Listen for wallet updates
    websocketService.on('wallet_updated', handleWalletUpdate);
    
    // Cleanup function
    return () => {
      websocketService.off('user_registered', handleNewUserRegistration);
      websocketService.off('profile_updated', handleUserUpdate);
      websocketService.off('kyc_level_updated', handleKYCUpdate);
      websocketService.off('wallet_updated', handleWalletUpdate);
    };
  };

  const loadUsers = async () => {
    try {
      // Load from user persistence service (real registered users)
      const registeredUsers = userPersistenceService.getAllUsers();
      
      // Convert to User format for admin display
      const adminUsers: User[] = registeredUsers.map((userData: any) => ({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        username: userData.username || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        kycLevel: 0, // Start unverified
        kycStatus: 'pending',
        accountStatus: 'active',
        walletBalance: 0, // Start with 0 balance
        tradingBalance: 0,
        totalTrades: 0,
        winRate: 0,
        totalProfit: 0,
        lastLogin: '',
        createdAt: userData.createdAt || new Date().toISOString(),
        isVerified: false,
        loginAttempts: 0,
        profilePicture: '',
        country: '',
        timezone: '',
        language: 'en',
        twoFactorEnabled: false,
        emailVerified: false,
        phoneVerified: false
      }));
      
      setUsers(adminUsers);
      calculateStats(adminUsers);
      
      // Store in persistence for admin access
      userPersistenceService.storeUsers(adminUsers);
      
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load user data"
      });
    }
  };

  const mergeUsers = (existingUsers: User[], newUsers: any[]): User[] => {
    const userMap = new Map();
    
    // Add existing users
    existingUsers.forEach(user => {
      userMap.set(user.id, user);
    });

    // Add new users
    newUsers.forEach(user => {
      if (!userMap.has(user.id)) {
        const newUser: User = {
          id: user.id,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
          username: user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          kycLevel: user.kycLevel || 0,
          kycStatus: user.kycStatus || 'pending',
          accountStatus: 'active',
          walletBalance: user.walletBalance || 0,
          tradingBalance: user.tradingBalance || 0,
          totalTrades: user.totalTrades || 0,
          winRate: user.winRate || 0,
          totalProfit: user.totalProfit || 0,
          lastLogin: user.lastLogin || '',
          createdAt: user.createdAt || new Date().toISOString(),
          isVerified: user.isVerified || false,
          loginAttempts: user.loginAttempts || 0,
          profilePicture: user.profilePicture || '',
          country: user.country || '',
          timezone: user.timezone || '',
          language: user.language || 'en',
          twoFactorEnabled: user.twoFactorEnabled || false,
          emailVerified: user.emailVerified || false,
          phoneVerified: user.phoneVerified || false
        };
        userMap.set(user.id, newUser);
      }
    });

    return Array.from(userMap.values());
  };

  const handleNewUserRegistration = (data: any) => {
    console.log('AdminUserManagement: Received new user registration:', data);
    
    const newUser: User = {
      id: data.user.id,
      email: data.user.email,
      firstName: data.user.firstName || '',
      lastName: data.user.lastName || '',
      phone: data.user.phone || '',
      username: data.user.username || `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim(),
      kycLevel: 0,
      kycStatus: 'pending',
      accountStatus: 'active',
      walletBalance: 0,
      tradingBalance: 0,
      totalTrades: 0,
      winRate: 0,
      totalProfit: 0,
      lastLogin: '',
      createdAt: data.timestamp || new Date().toISOString(),
      isVerified: false,
      loginAttempts: 0,
      profilePicture: '',
      country: '',
      timezone: '',
      language: 'en',
      twoFactorEnabled: false,
      emailVerified: false,
      phoneVerified: false
    };

    setUsers(prevUsers => {
      const updatedUsers = [newUser, ...prevUsers];
      userPersistenceService.storeUsers(updatedUsers);
      calculateStats(updatedUsers);
      return updatedUsers;
    });

    toast({
      title: 'New User Registered',
      description: `${newUser.firstName} ${newUser.lastName} (${newUser.email}) has joined the platform.`,
    });
  };

  const handleUserUpdate = (data: any) => {
          setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => 
          user.id === data.userId ? { ...user, ...data.updates } : user
        );
        userPersistenceService.storeUsers(updatedUsers);
        calculateStats(updatedUsers);
        return updatedUsers;
      });
  };

  const handleKYCUpdate = (data: any) => {
          setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => 
          user.id === data.userId ? { 
            ...user, 
            kycLevel: data.level,
            kycStatus: data.status 
          } : user
        );
        userPersistenceService.storeUsers(updatedUsers);
        calculateStats(updatedUsers);
        return updatedUsers;
      });
  };

  const handleWalletUpdate = (data: any) => {
          setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => 
          user.id === data.userId ? { 
            ...user, 
            walletBalance: data.walletBalance,
            tradingBalance: data.tradingBalance 
          } : user
        );
        userPersistenceService.storeUsers(updatedUsers);
        calculateStats(updatedUsers);
        return updatedUsers;
      });
  };

  const calculateStats = (userList: User[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats: UserStats = {
      totalUsers: userList.length,
      activeUsers: userList.filter(u => u.accountStatus === 'active').length,
      verifiedUsers: userList.filter(u => u.kycStatus === 'verified').length,
      suspendedUsers: userList.filter(u => u.accountStatus === 'suspended').length,
      newUsersToday: userList.filter(u => new Date(u.createdAt) >= today).length,
      newUsersThisWeek: userList.filter(u => new Date(u.createdAt) >= weekAgo).length,
      newUsersThisMonth: userList.filter(u => new Date(u.createdAt) >= monthAgo).length,
      totalBalance: userList.reduce((sum, u) => sum + u.walletBalance + u.tradingBalance, 0),
      totalTrades: userList.reduce((sum, u) => sum + u.totalTrades, 0),
      averageWinRate: userList.length > 0 ? userList.reduce((sum, u) => sum + u.winRate, 0) / userList.length : 0
    };

    setUserStats(stats);
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.accountStatus === statusFilter);
    }

    // KYC filter
    if (kycFilter !== 'all') {
      filtered = filtered.filter(user => user.kycStatus === kycFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let filterDate: Date;
      
      switch (dateFilter) {
        case 'today':
          filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          filterDate = new Date(0);
      }
      
      filtered = filtered.filter(user => new Date(user.createdAt) >= filterDate);
    }

    setFilteredUsers(filtered);
  };

  const handleUserStatusChange = async (userId: string, status: string, reason?: string) => {
    try {
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => 
          user.id === userId ? { 
            ...user, 
            accountStatus: status as 'active' | 'suspended' | 'banned',
            suspensionReason: reason,
            suspendedUntil: status === 'suspended' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined
          } : user
        );
        userPersistenceService.storeUsers(updatedUsers);
        calculateStats(updatedUsers);
        return updatedUsers;
      });

      toast({
        title: 'User Status Updated',
        description: `User status changed to ${status}`,
      });
    } catch (error) {
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
      const adjustment = {
        type: walletAdjustment.type,
        amount: walletAdjustment.amount,
        reason: walletAdjustment.reason,
        timestamp: new Date().toISOString()
      };

      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => 
          user.id === selectedUser.id ? { 
            ...user, 
            walletBalance: walletAdjustment.type === 'add' 
              ? user.walletBalance + walletAdjustment.amount
              : user.walletBalance - walletAdjustment.amount
          } : user
        );
        userPersistenceService.storeUsers(updatedUsers);
        calculateStats(updatedUsers);
        return updatedUsers;
      });

      setIsWalletModalOpen(false);
      setWalletAdjustment({ type: 'add', amount: 0, reason: '' });

      toast({
        title: 'Wallet Adjusted',
        description: `${walletAdjustment.type === 'add' ? 'Added' : 'Subtracted'} ${walletAdjustment.amount} to user wallet`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to adjust wallet',
        variant: 'destructive'
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser) return;

    try {
      // Send message via WebSocket
      websocketService.sendChatMessage(
        messageData.message,
        'admin_support',
        'Admin',
        'admin_message'
      );

      setIsMessageModalOpen(false);
      setMessageData({ title: '', message: '', type: 'info' });

      toast({
        title: 'Message Sent',
        description: 'Message sent to user successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const exportUserData = () => {
    const csvContent = userPersistenceService.exportUserData();
    
    if (!csvContent) {
      toast({
        title: 'Export Failed',
        description: 'No data to export',
        variant: 'destructive'
      });
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'User data exported to CSV with 1-year retention info',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'suspended':
        return <Badge variant="secondary" className="bg-yellow-500">Suspended</Badge>;
      case 'banned':
        return <Badge variant="destructive">Banned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getKYCBadge = (level: number, status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-500">Level {level}</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500">Level {level} Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Level {level} Rejected</Badge>;
      default:
        return <Badge variant="outline">Level {level}</Badge>;
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
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={exportUserData} 
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
              {((userStats.activeUsers / userStats.totalUsers) * 100).toFixed(1)}% of total
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
              {((userStats.verifiedUsers / userStats.totalUsers) * 100).toFixed(1)}% verified
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
              {userStats.totalTrades} total trades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">KYC Status</label>
              <Select value={kycFilter} onValueChange={setKycFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All KYC</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            All registered users with their account information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
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
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt="Profile" className="h-8 w-8 rounded-full" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="text-xs text-muted-foreground">
                            Joined {formatDate(user.createdAt)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Wallet:</span> {formatCurrency(user.walletBalance)}
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Trading:</span> {formatCurrency(user.tradingBalance)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.totalTrades} trades • {user.winRate.toFixed(1)}% win rate
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.accountStatus)}
                    </TableCell>
                    <TableCell>
                      {getKYCBadge(user.kycLevel, user.kycStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsUserModalOpen(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsWalletModalOpen(true);
                          }}>
                            <Wallet className="mr-2 h-4 w-4" />
                            Adjust Wallet
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsMessageModalOpen(true);
                          }}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsActivityModalOpen(true);
                          }}>
                            <Activity className="mr-2 h-4 w-4" />
                            View Activity
                          </DropdownMenuItem>
                          {user.accountStatus === 'active' ? (
                            <DropdownMenuItem onClick={() => handleUserStatusChange(user.id, 'suspended', 'Admin action')}>
                              <Lock className="mr-2 h-4 w-4" />
                              Suspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUserStatusChange(user.id, 'active')}>
                              <Unlock className="mr-2 h-4 w-4" />
                              Activate User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <p className="text-sm">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-sm">{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Username</label>
                  <p className="text-sm">{selectedUser.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Account Status</label>
                  <div className="mt-1">{getStatusBadge(selectedUser.accountStatus)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">KYC Status</label>
                  <div className="mt-1">{getKYCBadge(selectedUser.kycLevel, selectedUser.kycStatus)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Wallet Balance</label>
                  <p className="text-sm">{formatCurrency(selectedUser.walletBalance)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Trading Balance</label>
                  <p className="text-sm">{formatCurrency(selectedUser.tradingBalance)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Total Trades</label>
                  <p className="text-sm">{selectedUser.totalTrades}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Win Rate</label>
                  <p className="text-sm">{selectedUser.winRate.toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Total Profit</label>
                  <p className="text-sm">{formatCurrency(selectedUser.totalProfit)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Created At</label>
                  <p className="text-sm">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Login</label>
                  <p className="text-sm">{selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Wallet Adjustment Modal */}
      <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust User Wallet</DialogTitle>
            <DialogDescription>
              Add or subtract funds from user's wallet
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
              <label className="text-sm font-medium">Amount</label>
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <Badge variant="outline">{activity.activityType}</Badge>
                        </TableCell>
                        <TableCell>{activity.description}</TableCell>
                        <TableCell>{formatDate(activity.timestamp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 