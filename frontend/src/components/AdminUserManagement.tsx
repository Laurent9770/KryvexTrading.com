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

import userPersistenceService, { UserData } from '@/services/userPersistenceService';
import userActivityService, { UserActivity as ActivityData, AdminNotification } from '@/services/userActivityService';
import supabaseAdminService from '@/services/supabaseAdminService';

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
  const { updateTradingBalance, updateFundingBalance } = useAuth();
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
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    country: '',
    timezone: '',
    language: 'en'
  });
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
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: string;
    userId?: string;
  }>>([]);
  const [liveActivity, setLiveActivity] = useState<Array<{
    id: string;
    userId: string;
    userName: string;
    action: string;
    details: string;
    timestamp: string;
  }>>([]);

  // Handler functions for userActivityService
  const handleActivityUpdate = (activity: ActivityData) => {
    console.log('AdminUserManagement: Received activity update:', activity);
    
    // Update live activity feed
    setLiveActivity(prev => [{
      id: activity.id,
      userId: activity.userId,
      userName: activity.userName,
      action: activity.action,
      details: activity.details,
      timestamp: activity.timestamp
    }, ...prev.slice(0, 19)]); // Keep last 20 activities
  };

  const handleNotificationUpdate = (notification: AdminNotification) => {
    console.log('AdminUserManagement: Received notification update:', notification);
    
    // Update notifications
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
  };

  // Debug function to add test users
  const addTestUsers = () => {
    const testUsers = [
      {
        id: 'user-1',
        email: 'test1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        username: 'johndoe',
        walletBalance: 1000,
        country: 'USA',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user-2',
        email: 'test2@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+0987654321',
        username: 'janesmith',
        walletBalance: 2500,
        country: 'Canada',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user-3',
        email: 'test3@example.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        phone: '+1122334455',
        username: 'bobjohnson',
        walletBalance: 500,
        country: 'UK',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user-4',
        email: 'test4@example.com',
        firstName: 'Alice',
        lastName: 'Brown',
        phone: '+1555666777',
        username: 'alicebrown',
        walletBalance: 3000,
        country: 'Australia',
        createdAt: new Date().toISOString()
      }
    ];

    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const updatedUsers = [...existingUsers, ...testUsers];
    localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
    
    console.log('Added test users:', testUsers.length);
    loadUsers(); // Reload users
    
    toast({
      title: "Test Users Added",
      description: `Added ${testUsers.length} test users to the system.`,
    });
  };

  useEffect(() => {
    loadUsers();
    
    // Subscribe to userActivityService events
    userActivityService.on('activity', handleActivityUpdate);
    userActivityService.on('notification', handleNotificationUpdate);
    
    // Set up periodic refresh
    const interval = setInterval(loadUsers, 30000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(interval);
      userActivityService.off('activity', handleActivityUpdate);
      userActivityService.off('notification', handleNotificationUpdate);
    };
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, kycFilter, dateFilter]);

  // Load initial data from userActivityService
  useEffect(() => {
    const activities = userActivityService.getActivities();
    const notifications = userActivityService.getNotifications();
    setLiveActivity(activities.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      userName: activity.userName,
      action: activity.action,
      details: activity.details,
      timestamp: activity.timestamp
    })));
    setNotifications(notifications);
  }, []);

  const setupWebSocketListeners = () => {
    // WebSocket functionality replaced with Supabase real-time subscriptions
    // TODO: Implement Supabase real-time subscriptions for user management
  };

  const handleTradeUpdate = (data: any) => {
    console.log('AdminUserManagement: Received trade update:', data);
    
    setUsers(prevUsers => {
      const updatedUsers = prevUsers.map(user => {
        if (user.id === data.userId) {
          return {
            ...user,
            totalTrades: (user.totalTrades || 0) + 1,
            totalProfit: (user.totalProfit || 0) + (data.profit || 0),
            winRate: data.winRate || user.winRate
          };
        }
        return user;
      });
      userPersistenceService.storeUsers(updatedUsers);
      calculateStats(updatedUsers);
      return updatedUsers;
    });
  };

  const handleDepositUpdate = (data: any) => {
    console.log('AdminUserManagement: Received deposit update:', data);
    
    setUsers(prevUsers => {
      const updatedUsers = prevUsers.map(user => {
        if (user.id === data.userId) {
          return {
            ...user,
            walletBalance: data.newBalance || user.walletBalance
          };
        }
        return user;
      });
      userPersistenceService.storeUsers(updatedUsers);
      calculateStats(updatedUsers);
      return updatedUsers;
    });
  };

  const handleWithdrawalUpdate = (data: any) => {
    console.log('AdminUserManagement: Received withdrawal update:', data);
    
    setUsers(prevUsers => {
      const updatedUsers = prevUsers.map(user => {
        if (user.id === data.userId) {
          return {
            ...user,
            walletBalance: data.newBalance || user.walletBalance
          };
        }
        return user;
      });
      userPersistenceService.storeUsers(updatedUsers);
      calculateStats(updatedUsers);
      return updatedUsers;
    });
  };

  const handleUserActivity = (data: any) => {
    console.log('AdminUserManagement: Received user activity:', data);
    
    // Store activity for audit trail
    const activity = {
      id: `activity-${Date.now()}`,
      userId: data.userId,
      activityType: data.type,
      description: data.description,
      timestamp: data.timestamp || new Date().toISOString(),
      metadata: data.metadata || {}
    };

    const existingActivities = JSON.parse(localStorage.getItem('user_activities') || '[]');
    existingActivities.push(activity);
    localStorage.setItem('user_activities', JSON.stringify(existingActivities));
  };

  const handleUserLogin = (data: any) => {
    console.log('AdminUserManagement: User logged in:', data);
    
    setUsers(prevUsers => {
      const updatedUsers = prevUsers.map(user => {
        if (user.id === data.userId) {
          return {
            ...user,
            lastLogin: data.timestamp || new Date().toISOString()
          };
        }
        return user;
      });
      userPersistenceService.storeUsers(updatedUsers);
      return updatedUsers;
    });
  };

  const handleUserLogout = (data: any) => {
    console.log('AdminUserManagement: User logged out:', data);
    
    // Update user's last activity
    const activity = {
      id: `activity-${Date.now()}`,
      userId: data.userId,
      activityType: 'logout',
      description: 'User logged out',
      timestamp: data.timestamp || new Date().toISOString(),
      metadata: { sessionDuration: data.sessionDuration }
    };

    const existingActivities = JSON.parse(localStorage.getItem('user_activities') || '[]');
    existingActivities.push(activity);
    localStorage.setItem('user_activities', JSON.stringify(existingActivities));
  };

  // Add notification to the list
  const addNotification = (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, userId?: string) => {
    const notification = {
      id: `notification-${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      userId
    };

    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications

    // Auto-remove notification after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 10000);
  };

  // Add live activity
  const addLiveActivity = (userId: string, userName: string, action: string, details: string) => {
    const activity = {
      id: `activity-${Date.now()}`,
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString()
    };

    setLiveActivity(prev => [activity, ...prev.slice(0, 19)]); // Keep last 20 activities

    // Auto-remove activity after 30 seconds
    setTimeout(() => {
      setLiveActivity(prev => prev.filter(a => a.id !== activity.id));
    }, 30000);
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch users from backend API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/admin/users?limit=100&offset=0`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const backendUsers: User[] = result.data.map((user: any) => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          username: user.email.split('@')[0],
          kycLevel: 1, // Default level
          kycStatus: user.is_verified ? 'verified' as const : 'pending' as const,
          accountStatus: user.is_active ? 'active' as const : 'suspended' as const,
          walletBalance: parseFloat(user.wallet_balance || 0),
          tradingBalance: parseFloat(user.wallet_balance || 0),
          totalTrades: parseInt(user.total_trades || 0),
          winRate: parseFloat(user.win_rate || 0),
          totalProfit: 0, // Will be calculated separately
          lastLogin: new Date().toISOString(), // Will be fetched separately
          createdAt: user.created_at,
          isVerified: user.is_verified,
          country: user.country,
          profilePicture: user.profile_picture,
          loginAttempts: 0,
          suspensionReason: undefined,
          suspendedUntil: undefined,
          timezone: undefined,
          language: 'en',
          twoFactorEnabled: false,
          emailVerified: user.is_verified,
          phoneVerified: false
        }));

        setUsers(backendUsers);
        calculateStats(backendUsers);
      } else {
        console.error('Failed to fetch users from backend');
        // Fallback to demo data
        const demoUsers = [
          {
            id: '1',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            username: 'johndoe',
            kycLevel: 2,
            kycStatus: 'verified',
            accountStatus: 'active',
            walletBalance: 1500.00,
            tradingBalance: 1200.00,
            totalTrades: 45,
            winRate: 68.5,
            totalProfit: 234.50,
            lastLogin: new Date().toISOString(),
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            isVerified: true,
            country: 'United States'
          },
          {
            id: '2',
            email: 'jane.smith@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '+1987654321',
            username: 'janesmith',
            kycLevel: 1,
            kycStatus: 'pending',
            accountStatus: 'active',
            walletBalance: 750.00,
            tradingBalance: 600.00,
            totalTrades: 23,
            winRate: 52.3,
            totalProfit: -45.20,
            lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            isVerified: false,
            country: 'Canada'
          }
        ];
        setUsers(demoUsers);
        calculateStats(demoUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

    // Add notification and live activity
    const userName = `${newUser.firstName} ${newUser.lastName}`;
    addNotification('success', 'New User Registered', `${userName} (${newUser.email}) has joined the platform.`, newUser.id);
    addLiveActivity(newUser.id, userName, 'Registration', 'New user account created');

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

    // Add notification for profile updates
    const user = users.find(u => u.id === data.userId);
    if (user) {
      const userName = `${user.firstName} ${user.lastName}`;
      addNotification('info', 'User Profile Updated', `${userName} updated their profile.`, data.userId);
      addLiveActivity(data.userId, userName, 'Profile Update', 'User updated profile information');
    }
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

    // Add notification for KYC updates
    const user = users.find(u => u.id === data.userId);
    if (user) {
      const userName = `${user.firstName} ${user.lastName}`;
      const statusText = data.status === 'verified' ? 'approved' : data.status;
      addNotification('success', 'KYC Status Updated', `${userName}'s KYC has been ${statusText}.`, data.userId);
      addLiveActivity(data.userId, userName, 'KYC Update', `KYC status changed to ${data.status} (Level ${data.level})`);
    }
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

    // Add notification for wallet updates
    const user = users.find(u => u.id === data.userId);
    if (user) {
      const userName = `${user.firstName} ${user.lastName}`;
      addNotification('info', 'Wallet Updated', `${userName}'s wallet balance has been updated.`, data.userId);
      addLiveActivity(data.userId, userName, 'Wallet Update', `Wallet balance updated to $${data.walletBalance}`);
    }
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

    // Enhanced search filter - search by ID, email, username, first name, last name
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.id.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower) ||
        `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchLower)
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
      const user = users.find(u => u.id === userId);
      if (!user) return;

      // Update user status in admin state
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

      // Update user status in registered users
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const updatedRegisteredUsers = registeredUsers.map((userData: any) => {
        if (userData.id === userId) {
          return {
            ...userData,
            accountStatus: status,
            suspensionReason: reason,
            suspendedUntil: status === 'suspended' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined
          };
        }
        return userData;
      });
      localStorage.setItem('registeredUsers', JSON.stringify(updatedRegisteredUsers));

      // If user is currently logged in, update their session
      const currentUser = JSON.parse(localStorage.getItem('authUser') || sessionStorage.getItem('authUser') || 'null');
      if (currentUser && currentUser.id === userId) {
        const updatedUser = {
          ...currentUser,
          accountStatus: status,
          suspensionReason: reason,
          suspendedUntil: status === 'suspended' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined
        };
        
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
        sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
      }

      // Log admin action
      const adminAction = {
        id: `action-${Date.now()}`,
        admin_id: 'admin-001',
        action_type: 'status_change',
        target_user_id: userId,
        description: `Changed user status from ${user.accountStatus} to ${status}. Reason: ${reason || 'Admin action'}`,
        ip_address: 'production',
        created_at: new Date().toISOString(),
        admin_profile: {
          full_name: 'Admin Kryvex',
          email: 'admin@kryvex.com'
        },
        target_user_profile: {
          full_name: `${user.firstName} ${user.lastName}`,
          email: user.email
        }
      };

      // Store admin action for audit trail
      const existingActions = JSON.parse(localStorage.getItem('admin_actions') || '[]');
      existingActions.push(adminAction);
      localStorage.setItem('admin_actions', JSON.stringify(existingActions));

      // Real-time notification replaced with Supabase

      toast({
        title: 'User Status Updated',
        description: `User status changed to ${status}`,
      });
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
      // Try to use admin service first
      try {
        if (walletAdjustment.type === 'add') {
          await supabaseAdminService.addFundsToUser(
            selectedUser.id,
            'USDT',
            walletAdjustment.amount,
            walletAdjustment.reason
          );
        } else {
          await supabaseAdminService.removeFundsFromUser(
            selectedUser.id,
            'USDT',
            walletAdjustment.amount,
            walletAdjustment.reason
          );
        }

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

        return;
      } catch (adminError) {
        console.warn('Admin service failed, using local fallback:', adminError);
      }

      // Fallback to local implementation (original code)
      const adjustment = {
        type: walletAdjustment.type,
        amount: walletAdjustment.amount,
        reason: walletAdjustment.reason,
        timestamp: new Date().toISOString(),
        adminId: 'admin-001', // TODO: Get from auth context
        userId: selectedUser.id,
      };

      // Calculate new balance
      const newBalance = walletAdjustment.type === 'add' 
        ? selectedUser.walletBalance + walletAdjustment.amount
        : Math.max(0, selectedUser.walletBalance - walletAdjustment.amount);

      // Update user wallet balance in admin state
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => 
          user.id === selectedUser.id ? { 
            ...user, 
            walletBalance: newBalance
          } : user
        );
        userPersistenceService.storeUsers(updatedUsers);
        calculateStats(updatedUsers);
        return updatedUsers;
      });

      // Update the actual user's wallet balance in localStorage
      // This ensures the user sees the updated balance when they log in
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const updatedRegisteredUsers = registeredUsers.map((user: any) => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            walletBalance: newBalance
          };
        }
        return user;
      });
      localStorage.setItem('registeredUsers', JSON.stringify(updatedRegisteredUsers));

      // If the user is currently logged in, update their session data
      const currentUser = JSON.parse(localStorage.getItem('authUser') || sessionStorage.getItem('authUser') || 'null');
      if (currentUser && currentUser.id === selectedUser.id) {
        const updatedUser = {
          ...currentUser,
          walletBalance: newBalance
        };
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
        sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
      }

      // Store wallet adjustment for audit trail
      const walletAdjustmentRecord = {
        id: `adjustment-${Date.now()}`,
        user_id: selectedUser.id,
        admin_id: 'admin-001',
        adjustment_type: walletAdjustment.type,
        amount: walletAdjustment.amount,
        currency: 'USDT',
        reason: walletAdjustment.reason,
        previous_balance: selectedUser.walletBalance,
        new_balance: newBalance,
        created_at: new Date().toISOString(),
        user_profile: {
          full_name: `${selectedUser.firstName} ${selectedUser.lastName}`,
          email: selectedUser.email
        },
        admin_profile: {
          full_name: 'Admin Kryvex',
          email: 'admin@kryvex.com'
        }
      };

      // Store wallet adjustments for audit trail
      const existingAdjustments = JSON.parse(localStorage.getItem('wallet_adjustments') || '[]');
      existingAdjustments.push(walletAdjustmentRecord);
      localStorage.setItem('wallet_adjustments', JSON.stringify(existingAdjustments));

      // Log admin action
      const adminAction = {
        id: `action-${Date.now()}`,
        admin_id: 'admin-001',
        action_type: 'wallet_adjustment',
        target_user_id: selectedUser.id,
        description: `${walletAdjustment.type === 'add' ? 'Added' : 'Subtracted'} ${walletAdjustment.amount} USDT to user wallet. Reason: ${walletAdjustment.reason}`,
        ip_address: 'production',
        created_at: new Date().toISOString(),
        admin_profile: {
          full_name: 'Admin Kryvex',
          email: 'admin@kryvex.com'
        },
        target_user_profile: {
          full_name: `${selectedUser.firstName} ${selectedUser.lastName}`,
          email: selectedUser.email
        }
      };

      // Store admin action for audit trail
      const existingActions = JSON.parse(localStorage.getItem('admin_actions') || '[]');
      existingActions.push(adminAction);
      localStorage.setItem('admin_actions', JSON.stringify(existingActions));

      // Wallet update notification replaced with Supabase

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

    } catch (error) {
      console.error('Error adjusting wallet:', error);
      toast({
        title: 'Error',
        description: `Failed to adjust wallet: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser) return;

    try {
      // Create message record
      const messageRecord = {
        id: `message-${Date.now()}`,
        from: 'admin@kryvex.com',
        to: selectedUser.email,
        title: messageData.title,
        message: messageData.message,
        type: messageData.type,
        timestamp: new Date().toISOString(),
        read: false,
        admin_profile: {
          full_name: 'Admin Kryvex',
          email: 'admin@kryvex.com'
        },
        user_profile: {
          full_name: `${selectedUser.firstName} ${selectedUser.lastName}`,
          email: selectedUser.email
        }
      };

      // Store message in localStorage for user to see
      const existingMessages = JSON.parse(localStorage.getItem('user_messages') || '[]');
      existingMessages.push(messageRecord);
      localStorage.setItem('user_messages', JSON.stringify(existingMessages));

      // Send message via Supabase (replaced WebSocket)

      // Log admin action
      const adminAction = {
        id: `action-${Date.now()}`,
        admin_id: 'admin-001',
        action_type: 'send_message',
        target_user_id: selectedUser.id,
        description: `Sent message to user: ${messageData.title}`,
        ip_address: 'production',
        created_at: new Date().toISOString(),
        admin_profile: {
          full_name: 'Admin Kryvex',
          email: 'admin@kryvex.com'
        },
        target_user_profile: {
          full_name: `${selectedUser.firstName} ${selectedUser.lastName}`,
          email: selectedUser.email
        }
      };

      // Store admin action for audit trail
      const existingActions = JSON.parse(localStorage.getItem('admin_actions') || '[]');
      existingActions.push(adminAction);
      localStorage.setItem('admin_actions', JSON.stringify(existingActions));

      setIsMessageModalOpen(false);
      setMessageData({ title: '', message: '', type: 'info' });

      toast({
        title: 'Message Sent',
        description: 'Message sent to user successfully',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const loadUserActivities = (userId: string) => {
    try {
      // Load user activities from localStorage
      const allActivities = JSON.parse(localStorage.getItem('user_activities') || '[]');
      const userActivities = allActivities.filter((activity: any) => activity.userId === userId);
      
      // Also load admin actions for this user
      const adminActions = JSON.parse(localStorage.getItem('admin_actions') || '[]');
      const userAdminActions = adminActions.filter((action: any) => action.target_user_id === userId);
      
      // Load wallet adjustments for this user
      const walletAdjustments = JSON.parse(localStorage.getItem('wallet_adjustments') || '[]');
      const userWalletAdjustments = walletAdjustments.filter((adjustment: any) => adjustment.user_id === userId);
      
      // Combine all activities
      const combinedActivities = [
        ...userActivities,
        ...userAdminActions.map((action: any) => ({
          id: action.id,
          userId: action.target_user_id,
          activityType: action.action_type as any,
          description: action.description,
          timestamp: action.created_at,
          metadata: {
            admin: action.admin_profile,
            type: 'admin_action'
          }
        })),
        ...userWalletAdjustments.map((adjustment: any) => ({
          id: adjustment.id,
          userId: adjustment.user_id,
          activityType: 'wallet_adjustment' as any,
          description: `${adjustment.adjustment_type === 'add' ? 'Added' : 'Subtracted'} ${adjustment.amount} USDT. Reason: ${adjustment.reason}`,
          timestamp: adjustment.created_at,
          metadata: {
            amount: adjustment.amount,
            type: adjustment.adjustment_type,
            reason: adjustment.reason,
            previous_balance: adjustment.previous_balance,
            new_balance: adjustment.new_balance
          }
        }))
      ];
      
      // Sort by timestamp (newest first)
      combinedActivities.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setUserActivities(combinedActivities);
    } catch (error) {
      console.error('Error loading user activities:', error);
      setUserActivities([]);
    }
  };

  const exportUserData = () => {
    try {
      let csvContent = '';
      if (userPersistenceService && typeof userPersistenceService.exportUserData === 'function') {
        csvContent = userPersistenceService.exportUserData();
      } else {
        console.warn('userPersistenceService.exportUserData not available');
        toast({
          title: 'Export Failed',
          description: 'Export service not available',
          variant: 'destructive'
        });
        return;
      }
      
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
    } catch (error) {
      console.error('Error exporting user data:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export user data',
        variant: 'destructive'
      });
    }
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
          <Button 
            onClick={addTestUsers} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Add Test Users
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

      {/* Real-time Notifications and Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Live Notifications
            </CardTitle>
            <CardDescription>
              Real-time updates from user activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-xs">User activities will appear here</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      notification.type === 'success' ? 'border-l-green-500 bg-green-50' :
                      notification.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                      notification.type === 'error' ? 'border-l-red-500 bg-red-50' :
                      'border-l-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(notification.timestamp)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                        className="h-6 w-6 p-0"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>
              Real-time user activity monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {liveActivity.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No live activity</p>
                  <p className="text-xs">User actions will appear here</p>
                </div>
              ) : (
                liveActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{activity.userName}</span>
                        <Badge variant="outline" className="text-xs">{activity.action}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{activity.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
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
                             loadUserActivities(user.id);
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