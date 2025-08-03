import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Clock,
  User,
  Shield,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  MapPin,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Settings,
  Lock,
  Unlock,
  MessageSquare,
  Wallet,
  CreditCard
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_user_id?: string;
  target_table?: string;
  target_id?: string;
  old_values?: any;
  new_values?: any;
  description: string;
  ip_address?: string;
  created_at: string;
  admin_profile?: {
    full_name: string;
    email: string;
  };
  target_user_profile?: {
    full_name: string;
    email: string;
  };
}

interface UserSession {
  id: string;
  user_id: string;
  session_token?: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  login_at: string;
  last_activity?: string;
  logout_at?: string;
  user_profile?: {
    full_name: string;
    email: string;
  };
}

interface WalletAdjustment {
  id: string;
  user_id: string;
  admin_id: string;
  adjustment_type: 'add' | 'subtract';
  amount: number;
  currency: string;
  reason: string;
  previous_balance: number;
  new_balance: number;
  created_at: string;
  user_profile?: {
    full_name: string;
    email: string;
  };
  admin_profile?: {
    full_name: string;
    email: string;
  };
}

export default function AdminAuditTrail() {
  const { toast } = useToast();
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [walletAdjustments, setWalletAdjustments] = useState<WalletAdjustment[]>([]);
  const [filteredActions, setFilteredActions] = useState<AdminAction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedAction, setSelectedAction] = useState<AdminAction | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('actions');

  // Mock analytics data
  const mockActivityData = [
    { date: '2024-01-01', actions: 45, sessions: 120, adjustments: 8 },
    { date: '2024-01-02', actions: 52, sessions: 135, adjustments: 12 },
    { date: '2024-01-03', actions: 38, sessions: 98, adjustments: 6 },
    { date: '2024-01-04', actions: 67, sessions: 156, adjustments: 15 },
    { date: '2024-01-05', actions: 43, sessions: 112, adjustments: 9 },
    { date: '2024-01-06', actions: 58, sessions: 143, adjustments: 11 },
    { date: '2024-01-07', actions: 49, sessions: 128, adjustments: 7 }
  ];

  const actionTypeData = [
    { type: 'user_status_change', count: 23, color: '#3b82f6' },
    { type: 'wallet_adjustment', count: 45, color: '#10b981' },
    { type: 'kyc_review', count: 18, color: '#f59e0b' },
    { type: 'send_message', count: 12, color: '#8b5cf6' },
    { type: 'deposit_approval', count: 31, color: '#ef4444' }
  ];

  useEffect(() => {
    fetchAuditData();
  }, []);

  useEffect(() => {
    filterActions();
  }, [adminActions, searchTerm, actionTypeFilter, dateFilter]);

  const fetchAuditData = async () => {
    try {
      // Mock data for admin actions
      const mockAdminActions = [
        {
          id: '1',
          admin_id: 'admin-001',
          action_type: 'user_status_change',
          target_user_id: 'user-001',
          description: 'Changed user status to active',
          old_values: { status: 'inactive' },
          new_values: { status: 'active' },
          ip_address: '192.168.1.100',
          created_at: '2024-01-15T10:30:00Z',
          admin_profile: { full_name: 'Admin User', email: 'admin@kryvex.com' },
          target_user_profile: { full_name: 'John Trader', email: 'trader1@example.com' }
        },
        {
          id: '2',
          admin_id: 'admin-001',
          action_type: 'wallet_adjustment',
          target_user_id: 'user-001',
          description: 'Added 1000 USDT to wallet',
          old_values: { balance: 5000 },
          new_values: { balance: 6000 },
          ip_address: '192.168.1.100',
          created_at: '2024-01-14T15:20:00Z',
          admin_profile: { full_name: 'Admin User', email: 'admin@kryvex.com' },
          target_user_profile: { full_name: 'John Trader', email: 'trader1@example.com' }
        }
      ];

      // Mock data for user sessions
      const mockUserSessions = [
        {
          id: '1',
          user_id: 'user-001',
          ip_address: '192.168.1.50',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          is_active: true,
          login_at: '2024-01-15T09:00:00Z',
          last_activity: '2024-01-15T10:30:00Z',
          user_profile: { full_name: 'John Trader', email: 'trader1@example.com' }
        }
      ];

      // Mock data for wallet adjustments
      const mockWalletAdjustments = [
        {
          id: '1',
          user_id: 'user-001',
          admin_id: 'admin-001',
          adjustment_type: 'add' as const,
          amount: 1000,
          currency: 'USDT',
          reason: 'Bonus payment',
          previous_balance: 5000,
          new_balance: 6000,
          created_at: '2024-01-14T15:20:00Z',
          user_profile: { full_name: 'John Trader', email: 'trader1@example.com' },
          admin_profile: { full_name: 'Admin User', email: 'admin@kryvex.com' }
        }
      ];

      setAdminActions(mockAdminActions);
      setUserSessions(mockUserSessions);
      setWalletAdjustments(mockWalletAdjustments);
    } catch (error) {
      console.error('Error fetching audit data:', error);
      toast({
        title: "Error",
        description: "Failed to load audit data",
        variant: "destructive"
      });
    }
  };

  const filterActions = () => {
    let filtered = adminActions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(action =>
        action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.admin_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.admin_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.target_user_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.target_user_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Action type filter
    if (actionTypeFilter !== 'all') {
      filtered = filtered.filter(action => action.action_type === actionTypeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(action => new Date(action.created_at) >= filterDate);
    }

    setFilteredActions(filtered);
  };

  const getActionTypeBadge = (actionType: string) => {
    const typeConfig: { [key: string]: { color: string; icon: any; label: string } } = {
      'user_status_change': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: User, label: 'User Status' },
      'wallet_adjustment': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Wallet, label: 'Wallet' },
      'kyc_review': { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Shield, label: 'KYC' },
      'send_message': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: MessageSquare, label: 'Message' },
      'deposit_approval': { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: CreditCard, label: 'Deposit' }
    };

    const config = typeConfig[actionType] || { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Settings, label: actionType };
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const exportAuditData = () => {
    const csvContent = [
      ['Date', 'Admin', 'Action Type', 'Target User', 'Description', 'IP Address'],
      ...filteredActions.map(action => [
        new Date(action.created_at).toLocaleString(),
        action.admin_profile?.full_name || action.admin_profile?.email || 'Unknown',
        action.action_type,
        action.target_user_profile?.full_name || action.target_user_profile?.email || 'N/A',
        action.description,
        action.ip_address || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_trail_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'user_status_change':
        return <User className="w-4 h-4" />;
      case 'wallet_adjustment':
        return <Wallet className="w-4 h-4" />;
      case 'kyc_review':
        return <Shield className="w-4 h-4" />;
      case 'send_message':
        return <MessageSquare className="w-4 h-4" />;
      case 'deposit_approval':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{filteredActions.length}</p>
                <p className="text-blue-300 text-sm">Total Actions</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{userSessions.length}</p>
                <p className="text-green-300 text-sm">Active Sessions</p>
              </div>
              <User className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{walletAdjustments.length}</p>
                <p className="text-purple-300 text-sm">Wallet Adjustments</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  {filteredActions.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).length}
                </p>
                <p className="text-orange-300 text-sm">Today's Actions</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Activity Overview</CardTitle>
            <CardDescription className="text-slate-400">Daily activity trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line type="monotone" dataKey="actions" stroke="#3b82f6" strokeWidth={3} />
                <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={3} />
                <Line type="monotone" dataKey="adjustments" stroke="#f59e0b" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Action Types Distribution</CardTitle>
            <CardDescription className="text-slate-400">Breakdown by action type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={actionTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ type, count }) => `${type}: ${count}`}
                >
                  {actionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search actions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600 text-white w-64"
                />
              </div>

              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="user_status_change">User Status</SelectItem>
                  <SelectItem value="wallet_adjustment">Wallet</SelectItem>
                  <SelectItem value="kyc_review">KYC</SelectItem>
                  <SelectItem value="send_message">Messages</SelectItem>
                  <SelectItem value="deposit_approval">Deposits</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={exportAuditData} variant="outline" className="border-slate-600 text-slate-300">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different audit views */}
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'actions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('actions')}
            className={activeTab === 'actions' ? 'bg-blue-600' : 'border-slate-600 text-slate-300'}
          >
            <Activity className="w-4 h-4 mr-2" />
            Admin Actions
          </Button>
          <Button
            variant={activeTab === 'sessions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('sessions')}
            className={activeTab === 'sessions' ? 'bg-green-600' : 'border-slate-600 text-slate-300'}
          >
            <User className="w-4 h-4 mr-2" />
            User Sessions
          </Button>
          <Button
            variant={activeTab === 'adjustments' ? 'default' : 'outline'}
            onClick={() => setActiveTab('adjustments')}
            className={activeTab === 'adjustments' ? 'bg-purple-600' : 'border-slate-600 text-slate-300'}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Wallet Adjustments
          </Button>
        </div>

        {/* Admin Actions Table */}
        {activeTab === 'actions' && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Admin Action Log</CardTitle>
              <CardDescription className="text-slate-400">
                Complete audit trail of all administrative actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300">Admin</TableHead>
                    <TableHead className="text-slate-300">Action</TableHead>
                    <TableHead className="text-slate-300">Target</TableHead>
                    <TableHead className="text-slate-300">Description</TableHead>
                    <TableHead className="text-slate-300">IP Address</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActions.map((action) => (
                    <TableRow key={action.id} className="border-slate-700">
                      <TableCell className="text-slate-300">
                        {new Date(action.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">
                            {action.admin_profile?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-slate-400">
                            {action.admin_profile?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActionTypeBadge(action.action_type)}
                      </TableCell>
                      <TableCell>
                        {action.target_user_profile ? (
                          <div>
                            <div className="font-medium text-white">
                              {action.target_user_profile.full_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-slate-400">
                              {action.target_user_profile.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-xs truncate">
                        {action.description}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {action.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-800 border-slate-600">
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedAction(action);
                                setIsActionModalOpen(true);
                              }}
                              className="text-slate-300 hover:bg-slate-700"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* User Sessions Table */}
        {activeTab === 'sessions' && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">User Sessions</CardTitle>
              <CardDescription className="text-slate-400">
                Active user sessions and login history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">User</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Login Time</TableHead>
                    <TableHead className="text-slate-300">Last Activity</TableHead>
                    <TableHead className="text-slate-300">IP Address</TableHead>
                    <TableHead className="text-slate-300">User Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userSessions.map((session) => (
                    <TableRow key={session.id} className="border-slate-700">
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">
                            {session.user_profile?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-slate-400">
                            {session.user_profile?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={session.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                          {session.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {session.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(session.login_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {session.last_activity ? new Date(session.last_activity).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {session.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-400 max-w-xs truncate">
                        {session.user_agent || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Wallet Adjustments Table */}
        {activeTab === 'adjustments' && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Wallet Adjustments</CardTitle>
              <CardDescription className="text-slate-400">
                All manual wallet balance adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300">User</TableHead>
                    <TableHead className="text-slate-300">Admin</TableHead>
                    <TableHead className="text-slate-300">Type</TableHead>
                    <TableHead className="text-slate-300">Amount</TableHead>
                    <TableHead className="text-slate-300">Balance Change</TableHead>
                    <TableHead className="text-slate-300">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {walletAdjustments.map((adjustment) => (
                    <TableRow key={adjustment.id} className="border-slate-700">
                      <TableCell className="text-slate-300">
                        {new Date(adjustment.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">
                            {adjustment.user_profile?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-slate-400">
                            {adjustment.user_profile?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">
                            {adjustment.admin_profile?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-slate-400">
                            {adjustment.admin_profile?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={adjustment.adjustment_type === 'add' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                          {adjustment.adjustment_type === 'add' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {adjustment.adjustment_type === 'add' ? 'Added' : 'Subtracted'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        ${adjustment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-slate-400">${adjustment.previous_balance.toLocaleString()} → ${adjustment.new_balance.toLocaleString()}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-xs truncate">
                        {adjustment.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Details Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Action Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              Detailed information about this administrative action
            </DialogDescription>
          </DialogHeader>
          {selectedAction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Action Type</label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getActionIcon(selectedAction.action_type)}
                    <span className="text-white">{selectedAction.action_type}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Date & Time</label>
                  <p className="text-white">{new Date(selectedAction.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Admin</label>
                  <p className="text-white">{selectedAction.admin_profile?.full_name || selectedAction.admin_profile?.email || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">IP Address</label>
                  <p className="text-white">{selectedAction.ip_address || 'N/A'}</p>
                </div>
              </div>

              {selectedAction.target_user_profile && (
                <div>
                  <label className="text-sm text-slate-400">Target User</label>
                  <p className="text-white">{selectedAction.target_user_profile.full_name || selectedAction.target_user_profile.email}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-slate-400">Description</label>
                <p className="text-white">{selectedAction.description}</p>
              </div>

              {(selectedAction.old_values || selectedAction.new_values) && (
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Changes</label>
                  <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                    {selectedAction.old_values && (
                      <div>
                        <span className="text-red-400 text-sm">Previous:</span>
                        <pre className="text-xs text-slate-300 mt-1">{JSON.stringify(selectedAction.old_values, null, 2)}</pre>
                      </div>
                    )}
                    {selectedAction.new_values && (
                      <div>
                        <span className="text-green-400 text-sm">New:</span>
                        <pre className="text-xs text-slate-300 mt-1">{JSON.stringify(selectedAction.new_values, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 