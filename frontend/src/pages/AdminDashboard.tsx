import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';

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
  AlertTriangle, 
  FileText, 
  Settings,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  BarChart3,
  Activity,
  Zap,
  Lock,
  Unlock,
  UserCheck,
  CreditCard,
  Banknote,
  PieChart,
  MessageSquare,
  Wallet,
  Target,
  Play,
  Pause
} from 'lucide-react';

import AdminUserManagement from '@/components/AdminUserManagement';
import AdminKYCVerification from '@/components/AdminKYCVerification';
import AdminAuditTrail from '@/components/AdminAuditTrail';
import AdminDepositManager from '@/components/AdminDepositManager';

import AdminTradingControl from '@/components/AdminTradingControl';
import AdminWithdrawalManager from '@/components/AdminWithdrawalManager';
import AdminWalletManager from '@/components/AdminWalletManager';
import { AdminRoomManagement } from '@/components/AdminRoomManagement';
import tradingEngine from "@/services/tradingEngine";
import websocketService from "@/services/websocketService";

interface User {
  id: string;
  full_name: string;
  email: string;
  kyc_status: string;
  account_balance: number;
  is_verified: boolean;
  created_at: string;
}

interface Deposit {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string; email: string };
}

interface Trade {
  id: string;
  amount: number;
  trade_type: string;
  status: string;
  result: string;
  profit_loss: number;
  created_at: string;
  user_id: string;
  profiles: { full_name: string; email: string };
}

interface SpotTrade {
  id: string;
  user_id: string;
  trade_type: 'spot';
  direction: 'buy' | 'sell';
  amount: number;
  entry_price: number;
  start_time: string;
  duration: number;
  end_time: string;
  status: 'running' | 'completed' | 'cancelled';
  outcome: 'win' | 'lose' | 'admin_override' | null;
  payout: number | null;
  profit_percentage: number;
}

interface TradeRequest {
  type: 'spot' | 'futures';
  action: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
  duration: number;
  leverage: number;
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isAdmin, checkAdminAccess } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Additional security check - redirect if not admin
  useEffect(() => {
    const hasAdminAccess = checkAdminAccess();
    if (!hasAdminAccess) {
      console.warn('Unauthorized access attempt to admin dashboard by:', user?.email);
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive"
      });
      navigate('/');
      return;
    }
    
    console.log('Admin dashboard accessed by:', user?.email);
  }, [user, isAuthenticated, isAdmin, checkAdminAccess, navigate, toast]);

  // Don't render anything if not admin
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  // Determine active tab based on URL
  const getInitialTab = () => {
    if (location.pathname === '/admin/trading-control') {
      return 'trading-control';
    }
    return 'users'; // Default to Users tab for admins
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [spotTrades, setSpotTrades] = useState<SpotTrade[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalTrades: 0,
    pendingKyc: 0,
    totalVolume: 0,
    activeUsers: 0,
    pendingDeposits: 0,
    totalBalance: 0,
    avgWinRate: 0,
    newUsersToday: 0,
    withdrawalStats: {
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      totalAmount: 0
    }
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);



  useEffect(() => {
    // Subscribe to WebSocket events for real-time updates
    const handleNewUserRegistration = (data: any) => {
      console.log('AdminDashboard: New user registered:', data);
      // Add new user to users list
      const newUser = {
        id: data.userId || `user-${Date.now()}`,
        full_name: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        email: data.email,
        kyc_status: data.kycStatus || 'pending',
        account_balance: data.accountBalance || 0,
        is_verified: data.isVerified || false,
        created_at: new Date().toISOString()
      };
      
      setUsers(prev => [newUser, ...prev]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers + 1,
        newUsersToday: prev.newUsersToday + 1
      }));
      
      // Add to recent activity
      setRecentActivity(prev => [{
        id: `activity-${Date.now()}`,
        type: 'user_registered',
        description: `New user ${newUser.full_name} registered`,
        timestamp: new Date().toISOString(),
        userId: newUser.id,
        userEmail: newUser.email
      }, ...prev.slice(0, 9)]);
      
      toast({
        title: "New User Registered",
        description: `${newUser.full_name} (${newUser.email}) has joined the platform`,
        duration: 5000
      });
    };

    const handleWalletUpdate = (data: any) => {
      console.log('AdminDashboard: Wallet updated:', data);
      
      // Check if data is valid
      if (!data || !data.userId) {
        console.warn('AdminDashboard: Invalid wallet update data:', data);
        return;
      }
      
      // Update user wallet balance
      setUsers(prev => prev.map(user => 
        user.id === data.userId 
          ? { ...user, account_balance: data.newBalance || user.account_balance }
          : user
      ));
      
      // Add to recent activity
      setRecentActivity(prev => [{
        id: `activity-${Date.now()}`,
        type: 'wallet_updated',
        description: `Wallet updated for user ${data.userId}`,
        timestamp: new Date().toISOString(),
        userId: data.userId,
        amount: data.amount,
        operation: data.operation
      }, ...prev.slice(0, 9)]);
    };

    const handleTradeCompleted = (data: any) => {
      console.log('AdminDashboard: Trade completed:', data);
      
      // Check if data is valid
      if (!data || !data.userId) {
        console.warn('AdminDashboard: Invalid trade completed data:', data);
        return;
      }
      
      // Add to recent activity
      setRecentActivity(prev => [{
        id: `activity-${Date.now()}`,
        type: 'trade_completed',
        description: `Trade ${data.tradeId} completed - ${data.result} (${data.profitLoss})`,
        timestamp: new Date().toISOString(),
        userId: data.userId,
        tradeId: data.tradeId,
        result: data.result,
        profitLoss: data.profitLoss
      }, ...prev.slice(0, 9)]);
      
      // Update trading stats
      fetchDashboardData();
    };

    const handleKYCStatusUpdate = (data: any) => {
      console.log('AdminDashboard: KYC status updated:', data);
      
      // Check if data is valid
      if (!data || !data.userId) {
        console.warn('AdminDashboard: Invalid KYC status update data:', data);
        return;
      }
      
      // Update user KYC status
      setUsers(prev => prev.map(user => 
        user.id === data.userId 
          ? { ...user, kyc_status: data.status }
          : user
      ));
      
      // Add to recent activity
      setRecentActivity(prev => [{
        id: `activity-${Date.now()}`,
        type: 'kyc_status_updated',
        description: `KYC status updated for user ${data.userId} to ${data.status}`,
        timestamp: new Date().toISOString(),
        userId: data.userId,
        status: data.status
      }, ...prev.slice(0, 9)]);
    };

    const handleKYCSubmissionCreated = (data: any) => {
      console.log('AdminDashboard: KYC submission created:', data);
      
      // Check if data is valid
      if (!data || !data.userId) {
        console.warn('AdminDashboard: Invalid KYC submission data:', data);
        return;
      }
      
      // Add to recent activity
      setRecentActivity(prev => [{
        id: `activity-${Date.now()}`,
        type: 'kyc_submission_created',
        description: `New KYC submission from user ${data.userId}`,
        timestamp: new Date().toISOString(),
        userId: data.userId,
        submissionId: data.submissionId
      }, ...prev.slice(0, 9)]);
      
      toast({
        title: "New KYC Submission",
        description: `User ${data.userId} has submitted KYC documents for review`,
        duration: 5000
      });
    };

    const handleDepositRequest = (data: any) => {
      console.log('AdminDashboard: Deposit request received:', data);
      
      // Check if data is valid
      if (!data || !data.userId) {
        console.warn('AdminDashboard: Invalid deposit request data:', data);
        return;
      }
      
      // Add to recent activity
      setRecentActivity(prev => [{
        id: `activity-${Date.now()}`,
        type: 'deposit_request',
        description: `New deposit request: ${data.amount} ${data.currency}`,
        timestamp: new Date().toISOString(),
        userId: data.userId,
        amount: data.amount,
        currency: data.currency
      }, ...prev.slice(0, 9)]);
      
      toast({
        title: "New Deposit Request",
        description: `User ${data.userId} has requested deposit of ${data.amount} ${data.currency}`,
        duration: 5000
      });
    };

    const handleWithdrawalRequest = (data: any) => {
      console.log('AdminDashboard: Withdrawal request received:', data);
      
      // Check if data is valid
      if (!data || !data.userId) {
        console.warn('AdminDashboard: Invalid withdrawal request data:', data);
        return;
      }
      
      // Add to recent activity
      setRecentActivity(prev => [{
        id: `activity-${Date.now()}`,
        type: 'withdrawal_request',
        description: `New withdrawal request: ${data.amount} ${data.currency}`,
        timestamp: new Date().toISOString(),
        userId: data.userId,
        amount: data.amount,
        currency: data.currency
      }, ...prev.slice(0, 9)]);
      
      toast({
        title: "New Withdrawal Request",
        description: `User ${data.userId} has requested withdrawal of ${data.amount} ${data.currency}`,
        duration: 5000
      });
    };

    // Subscribe to WebSocket events
    websocketService.on('user_registered', handleNewUserRegistration);
    websocketService.on('wallet_updated', handleWalletUpdate);
    websocketService.on('trade_completed', handleTradeCompleted);
    websocketService.on('kyc_status_updated', handleKYCStatusUpdate);
    websocketService.on('kyc_submission_created', handleKYCSubmissionCreated);
    websocketService.on('deposit_request', handleDepositRequest);
    websocketService.on('withdrawal_request', handleWithdrawalRequest);

    // Initial data fetch
    fetchDashboardData();

    // Set up periodic refresh
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds

    return () => {
      // Cleanup WebSocket listeners
      websocketService.off('user_registered', handleNewUserRegistration);
      websocketService.off('wallet_updated', handleWalletUpdate);
      websocketService.off('trade_completed', handleTradeCompleted);
      websocketService.off('kyc_status_updated', handleKYCStatusUpdate);
      websocketService.off('kyc_submission_created', handleKYCSubmissionCreated);
      websocketService.off('deposit_request', handleDepositRequest);
      websocketService.off('withdrawal_request', handleWithdrawalRequest);
      
      clearInterval(interval);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get real user data from user persistence service
      let allUsers: any[] = [];
      try {
        const userPersistenceService = await import('@/services/userPersistenceService');
        if (userPersistenceService.default && typeof userPersistenceService.default.getAllUsers === 'function') {
          allUsers = userPersistenceService.default.getAllUsers();
        } else {
          console.warn('userPersistenceService.getAllUsers not available, using fallback');
        }
      } catch (error) {
        console.warn('Error loading userPersistenceService:', error);
      }
      
      // Get registered users from localStorage
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      
      // Combine all users and remove duplicates
      const allUserData = [...allUsers, ...registeredUsers];
      const uniqueUsers = allUserData.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );

      // Get real trade data from trading engine
      const tradeHistory = tradingEngine.getTradeHistory();
      const tradeStats = tradingEngine.getTradeStatistics();
      const spotTrades = tradingEngine.getSpotTrades();
      
      // Get real wallet data
      let allUserWallets: any[] = [];
      let withdrawalStats: any = { totalRequests: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 };
      try {
        const walletService = await import('@/services/walletService');
        if (walletService.default && typeof walletService.default.getAllUserWallets === 'function') {
          allUserWallets = walletService.default.getAllUserWallets();
          withdrawalStats = walletService.default.getWithdrawalStats();
        } else {
          console.warn('walletService methods not available, using fallback');
        }
      } catch (error) {
        console.warn('Error loading walletService:', error);
      }
      
      // Get real deposit data (from wallet transactions)
      let walletTransactions: any[] = [];
      try {
        const walletService = await import('@/services/walletService');
        if (walletService.default && typeof walletService.default.getWalletTransactions === 'function') {
          walletTransactions = walletService.default.getWalletTransactions();
        } else {
          console.warn('walletService.getWalletTransactions not available, using fallback');
        }
      } catch (error) {
        console.warn('Error loading walletService for transactions:', error);
      }
      
      const depositTransactions = walletTransactions.filter(tx => 
        tx.action === 'admin_fund' || tx.action === 'fund'
      );

      // Convert users to the expected format
      const realUsers = uniqueUsers
        .filter(user => user && user.id) // Filter out undefined/null users
        .map(user => ({
          id: user.id,
          full_name: user.username || user.firstName + ' ' + user.lastName || user.email,
          email: user.email,
          kyc_status: user.kycLevel2?.status || user.kycStatus || 'unverified',
          account_balance: allUserWallets.find(w => w.userId === user.id)?.fundingWallet?.USDT || 0,
          is_verified: user.kycLevel1?.status === 'verified' || user.kycStatus === 'verified',
          created_at: user.createdAt || new Date().toISOString()
        }));

      // Convert deposit transactions to the expected format
      const realDeposits = depositTransactions
        .filter(tx => tx && tx.userId) // Filter out undefined/null transactions
        .map(tx => ({
          id: tx.id,
          amount: tx.amount,
          currency: tx.asset,
          status: tx.status,
          created_at: tx.timestamp,
          user_id: tx.userId,
          profiles: { 
            full_name: tx.username, 
            email: allUserWallets.find(w => w.userId === tx.userId)?.email || 'unknown@example.com' 
          }
        }));

      // Convert trade history to the expected format
      const realTrades = tradeHistory
        .filter(trade => trade && trade.id) // Filter out undefined/null trades
        .slice(0, 10)
        .map(trade => ({
          id: trade.id,
          amount: trade.amount,
          trade_type: trade.action,
          status: trade.status,
          result: trade.status === 'won' ? 'win' : 'loss',
          profit_loss: trade.profit || trade.loss || 0,
          created_at: trade.timestamp.toISOString(),
          user_id: 'current-user',
          profiles: { full_name: 'Current User', email: 'user@example.com' }
        }));

      // Calculate real statistics
      const verifiedUsers = realUsers.filter(u => u.is_verified).length;
      const pendingKyc = realUsers.filter(u => 
        u.kyc_status === 'pending' || u.kyc_status === 'unverified'
      ).length;
      const totalBalance = realUsers.reduce((sum, u) => sum + u.account_balance, 0);
      const totalDeposits = realDeposits.reduce((sum, d) => sum + Number(d.amount), 0);
      const pendingDeposits = realDeposits.filter(d => d.status === 'pending').length;
      const totalVolume = tradeHistory.reduce((sum, t) => sum + Number(t.amount), 0);

      // Calculate average win rate from trades
      const completedTrades = tradeHistory.filter(t => t.status === 'won' || t.status === 'lost');
      const avgWinRate = completedTrades.length > 0 
        ? (completedTrades.filter(t => t.status === 'won').length / completedTrades.length) * 100
        : 0;

      setUsers(realUsers);
      setDeposits(realDeposits);
      setTrades(realTrades);
      setSpotTrades(spotTrades);
      
      setStats({
        totalUsers: realUsers.length,
        pendingKyc: pendingKyc,
        activeUsers: verifiedUsers,
        totalDeposits: totalDeposits,
        pendingDeposits: pendingDeposits,
        totalTrades: tradeStats.totalTrades,
        totalVolume: totalVolume,
        totalBalance: totalBalance,
        avgWinRate: avgWinRate,
        newUsersToday: 0, // TODO: Calculate from user creation dates
        withdrawalStats: {
          totalRequests: withdrawalStats.totalRequests,
          pendingRequests: withdrawalStats.pending,
          approvedRequests: withdrawalStats.approved,
          rejectedRequests: withdrawalStats.rejected,
          totalAmount: withdrawalStats.totalAmount
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    }
  };

  const handleDepositStatus = async (depositId: string, status: string) => {
    try {
      // TODO: Implement real API call to update deposit status
      // const response = await fetch(`/api/deposits/${depositId}/status`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status })
      // });
      // 
      // if (!response.ok) throw new Error('Failed to update deposit status');
      // 
      // const updatedDeposit = await response.json();
      // 
      // // Update local state with the response from server
      // const updatedDeposits = deposits.map(deposit => 
      //   deposit.id === depositId ? updatedDeposit : deposit
      // );
      // setDeposits(updatedDeposits);

      // For now, update local state until real API is implemented
      const updatedDeposits = deposits.map(deposit => 
        deposit.id === depositId 
          ? { ...deposit, status, processed_at: new Date().toISOString() }
          : deposit
      );
      
      setDeposits(updatedDeposits);

      toast({
        title: "Success",
        description: `Deposit ${status} successfully`
      });
    } catch (error) {
      console.error('Error updating deposit:', error);
      toast({
        title: "Error",
        description: "Failed to update deposit status",
        variant: "destructive"
      });
    }
  };

  const handleKycStatus = async (userId: string, status: string) => {
    try {
      // TODO: Implement real API call to update KYC status
      // const response = await fetch(`/api/users/${userId}/kyc-status`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ kyc_status: status })
      // });
      // 
      // if (!response.ok) throw new Error('Failed to update KYC status');
      // 
      // const updatedUser = await response.json();
      // 
      // // Update local state with the response from server
      // const updatedUsers = users.map(user => 
      //   user.id === userId ? updatedUser : user
      // );
      // setUsers(updatedUsers);

      // For now, update local state until real API is implemented
      const updatedUsers = users.map(user => 
        user.id === userId 
          ? { ...user, kyc_status: status }
          : user
      );
      
      setUsers(updatedUsers);

      toast({
        title: "Success",
        description: `KYC status updated to ${status}`
      });
    } catch (error) {
      console.error('Error updating KYC status:', error);
      toast({
        title: "Error",
        description: "Failed to update KYC status",
        variant: "destructive"
      });
    }
  };

  const handleProfileUpdate = (data: any) => {
    console.log('Received profile update:', data);
    const updatedUsers = users.map(user => {
      if (user.id === data.userId) {
        return { ...user, ...data.profileData };
      }
      return user;
    });
    setUsers(updatedUsers);
    
    // Add to activity feed
    setRecentActivity(prev => [{
      id: Date.now(),
      type: 'profile_update',
      user: data.profileData.firstName + ' ' + data.profileData.lastName,
      action: 'Updated profile information',
      timestamp: new Date().toISOString(),
      details: `Updated: ${Object.keys(data.profileData).filter(key => key !== 'updatedAt').join(', ')}`
    }, ...prev.slice(0, 9)]);
    
    toast({
      title: "Profile Updated",
      description: `User ${data.profileData.firstName} ${data.profileData.lastName} updated their profile.`,
    });
  };

  const handleSecurityUpdate = (data: any) => {
    console.log('Received security update:', data);
    
    // Add to activity feed
    setRecentActivity(prev => [{
      id: Date.now(),
      type: 'security_update',
      user: 'User',
      action: 'Updated security settings',
      timestamp: new Date().toISOString(),
      details: `2FA: ${data.securityData.twoFactorEnabled ? 'Enabled' : 'Disabled'}`
    }, ...prev.slice(0, 9)]);
    
    toast({
      title: "Security Settings Updated",
      description: `User updated their security settings.`,
    });
  };

  const handleNotificationUpdate = (data: any) => {
    console.log('Received notification update:', data);
    
    // Add to activity feed
    setRecentActivity(prev => [{
      id: Date.now(),
      type: 'notification_update',
      user: 'User',
      action: 'Updated notification preferences',
      timestamp: new Date().toISOString(),
      details: 'Email and push notification settings changed'
    }, ...prev.slice(0, 9)]);
    
    toast({
      title: "Notification Preferences Updated",
      description: `User updated their notification preferences.`,
    });
  };

  const handleDisplayUpdate = (data: any) => {
    console.log('Received display update:', data);
    
    // Add to activity feed
    setRecentActivity(prev => [{
      id: Date.now(),
      type: 'display_update',
      user: 'User',
      action: 'Updated display preferences',
      timestamp: new Date().toISOString(),
      details: `Theme: ${data.displayData.theme}, Language: ${data.displayData.language}`
    }, ...prev.slice(0, 9)]);
    
    toast({
      title: "Display Preferences Updated",
      description: `User updated their display preferences.`,
    });
  };

  const handleKYCUpdate = (data: any) => {
    console.log('Received KYC update:', data);
    const updatedUsers = users.map(user => {
      if (user.id === data.userId) {
        return { 
          ...user, 
          kyc_status: data.kycData.level3.status 
        };
      }
      return user;
    });
    setUsers(updatedUsers);
    
    // Add to activity feed
    setRecentActivity(prev => [{
      id: Date.now(),
      type: 'kyc_update',
      user: 'User',
      action: 'Submitted Level 3 KYC documents',
      timestamp: new Date().toISOString(),
      details: `Documents: ${Object.keys(data.kycData.documents || {}).join(', ')}`
    }, ...prev.slice(0, 9)]);
    
    toast({
      title: "KYC Status Updated",
      description: `User submitted Level 3 KYC documents for review.`,
    });
  };

  const handleSpotTradeUpdate = (data: any) => {
    console.log('Received spot trade update:', data);
    const updatedSpotTrades = spotTrades.map(trade => {
      if (trade.id === data.tradeId) {
        return { ...trade, ...data.tradeData };
      }
      return trade;
    });
    setSpotTrades(updatedSpotTrades);
  };

  const handleNewUserRegistration = (data: any) => {
    console.log('AdminDashboard: New user registered:', data);
    
    // Create new user object from registration data
    const newUser: User = {
      id: data.user.id,
      full_name: data.user.full_name || data.user.email.split('@')[0],
      email: data.user.email,
      kyc_status: 'pending',
      account_balance: 0,
      is_verified: false,
      created_at: data.timestamp || new Date().toISOString()
    };

    // Add new user to the beginning of the list
    setUsers(prevUsers => [newUser, ...prevUsers]);
    
    // Update stats
    setStats(prevStats => ({
      ...prevStats,
      totalUsers: prevStats.totalUsers + 1,
      pendingKyc: prevStats.pendingKyc + 1
    }));

    // Add to recent activity
    setRecentActivity(prev => [{
      id: Date.now(),
      type: 'user_registered',
      user: newUser.full_name,
      action: 'New user registered',
      timestamp: new Date().toISOString(),
      details: `Email: ${newUser.email}`
    }, ...prev.slice(0, 9)]);

    toast({
      title: "New User Registered",
      description: `${newUser.full_name} (${newUser.email}) has joined the platform`,
      duration: 5000,
    });
  };

  const handleWalletUpdate = (data: any) => {
    console.log('Wallet updated:', data);
    // Refresh wallet data
    fetchDashboardData();
  };

  const handleTradeCompleted = (data: any) => {
    console.log('Trade completed:', data);
    // Update local trade data
    const updatedTrades = trades.map(trade => {
      if (trade.id === data.tradeId) {
        return { ...trade, status: data.tradeData.status, result: data.tradeData.result };
      }
      return trade;
    });
    setTrades(updatedTrades);

    // Add to activity feed
    setRecentActivity(prev => [{
      id: Date.now(),
      type: 'trade_completed',
      user: 'System',
      action: 'Trade completed',
      timestamp: new Date().toISOString(),
      details: `Trade ID: ${data.tradeId}, Result: ${data.tradeData.result}`
    }, ...prev.slice(0, 9)]);

    toast({
      title: "Trade Completed",
      description: `Trade ${data.tradeId} completed. Result: ${data.tradeData.result}`,
    });
  };

  const handleKYCStatusUpdate = (data: any) => {
    console.log('KYC status updated:', data);
    const updatedUsers = users.map(user => {
      if (user.id === data.userId) {
        return { ...user, kyc_status: data.kycData.level3.status };
      }
      return user;
    });
    setUsers(updatedUsers);

    // Add to activity feed
    setRecentActivity(prev => [{
      id: Date.now(),
      type: 'kyc_status_updated',
      user: 'System',
      action: 'KYC Status Updated',
      timestamp: new Date().toISOString(),
      details: `User ID: ${data.userId}, New Status: ${data.kycData.level3.status}`
    }, ...prev.slice(0, 9)]);

    toast({
      title: "KYC Status Updated",
      description: `KYC status for user ${data.userId} updated to ${data.kycData.level3.status}`,
    });
  };

  const handleKYCSubmissionCreated = (data: any) => {
    console.log('KYC submission created:', data);
    // Add to activity feed
    setRecentActivity(prev => [{
      id: Date.now(),
      type: 'kyc_submission_created',
      user: 'System',
      action: 'KYC Submission Created',
      timestamp: new Date().toISOString(),
      details: `User ID: ${data.userId}, Submission ID: ${data.submissionId}`
    }, ...prev.slice(0, 9)]);

    toast({
      title: "KYC Submission Created",
      description: `KYC submission created for user ${data.userId} with ID ${data.submissionId}`,
    });
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeposits = deposits.filter(deposit => {
    if (filterStatus === 'all') return true;
    return deposit.status === filterStatus;
  });

  // Navigation functions
  const handleNavigateToTab = (tabName: string) => {
    const tabsList = document.querySelector('[role="tablist"]') as HTMLElement;
    const targetTab = tabsList?.querySelector(`[value="${tabName}"]`) as HTMLElement;
    if (targetTab) {
      targetTab.click();
      toast({
        title: "Navigation",
        description: `Switched to ${tabName} tab`
      });
    }
  };

  const handleNavigateToExternal = (path: string) => {
    navigate(path);
  };

  const handleExportData = () => {
    // Create CSV data for export
    const csvData = [
      ['User', 'Email', 'KYC Status', 'Balance', 'Created'],
      ...users.map(user => [
        user.full_name || 'N/A',
        user.email,
        user.kyc_status,
        user.account_balance?.toString() || '0',
        new Date(user.created_at).toLocaleDateString()
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Data exported successfully"
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Admin Header with Dark Theme */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Control Center</h1>
                <p className="text-slate-400 text-sm">Kryvex Trading Platform Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <Lock className="w-3 h-3 mr-1" />
                Administrator Access
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={handleExportData}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Admin Stats Grid - Different styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <Badge className="bg-blue-500/20 text-blue-400 text-xs">Total</Badge>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-blue-300 text-sm">Registered Users</p>
              <p className="text-xs text-slate-400 mt-1">{stats.activeUsers} verified</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <Badge className="bg-green-500/20 text-green-400 text-xs">USD</Badge>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">${stats.totalDeposits.toLocaleString()}</p>
              <p className="text-green-300 text-sm">Total Deposits</p>
              <p className="text-xs text-slate-400 mt-1">{stats.pendingDeposits} pending</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <Badge className="bg-purple-500/20 text-purple-400 text-xs">Active</Badge>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.totalTrades}</p>
              <p className="text-purple-300 text-sm">Total Trades</p>
              <p className="text-xs text-slate-400 mt-1">${stats.totalVolume.toLocaleString()} volume</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border border-orange-700/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <Badge className="bg-orange-500/20 text-orange-400 text-xs">Pending</Badge>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.pendingKyc}</p>
              <p className="text-orange-300 text-sm">KYC Reviews</p>
              <p className="text-xs text-slate-400 mt-1">Requires attention</p>
            </div>
          </div>
        </div>



        {/* Admin Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-1">
            <TabsList className="w-full bg-transparent grid grid-cols-8">
              <TabsTrigger 
                value="users" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400"
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger 
                value="kyc" 
                className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-400"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                KYC
              </TabsTrigger>
              <TabsTrigger 
                value="deposits" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-400"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Deposits
              </TabsTrigger>
              <TabsTrigger 
                value="trading-control" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
              >
                <Activity className="w-4 h-4 mr-2" />
                Trading Control
              </TabsTrigger>
              <TabsTrigger 
                value="withdrawals" 
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
              >
                <Banknote className="w-4 h-4 mr-2" />
                Withdrawals
              </TabsTrigger>
              <TabsTrigger 
                value="wallets" 
                className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-slate-400"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Wallets
              </TabsTrigger>
              <TabsTrigger 
                value="audit" 
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-400"
              >
                <Activity className="w-4 h-4 mr-2" />
                Audit
              </TabsTrigger>
              <TabsTrigger 
                value="rooms" 
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Rooms
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users">
            <AdminUserManagement />
          </TabsContent>

          <TabsContent value="trading-control">
            <AdminTradingControl />
          </TabsContent>

          <TabsContent value="rooms">
            <AdminRoomManagement />
          </TabsContent>

          <TabsContent value="deposits">
            <AdminDepositManager />
          </TabsContent>


          <TabsContent value="kyc">
            <AdminKYCVerification />
          </TabsContent>
          
          <TabsContent value="withdrawals">
            <AdminWithdrawalManager />
          </TabsContent>
          
          <TabsContent value="wallets">
            <AdminWalletManager />
          </TabsContent>
          
          <TabsContent value="audit">
            <AdminAuditTrail />
          </TabsContent>




        </Tabs>
      </div>
    </div>
  );
}