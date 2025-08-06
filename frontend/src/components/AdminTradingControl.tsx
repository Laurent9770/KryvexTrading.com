import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import supabaseAdminDataService, { AdminTradeSummary } from '@/services/supabaseAdminDataService';
import { 
  Users, 
  Search, 
  Eye, 
  TrendingUp, 
  Activity,
  Clock,
  User,
  Mail,
  ArrowRight,
  Filter
} from 'lucide-react';
import supabaseTradingService from '@/services/supabaseTradingService';

const AdminTradingControl: React.FC = () => {
  const [users, setUsers] = useState<AdminTradeSummary[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminTradeSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUsersWithActiveTrades();
    
    // Set up WebSocket listener for real-time trade updates
    const handleTradeUpdate = (data: any) => {
      console.log('AdminTradingControl: Trade update received:', data);
      
      // Update the user's trade summary
      setUsers(prev => prev.map(user => 
        user.userId === data.userId 
          ? {
              ...user,
              activeTrades: {
                ...user.activeTrades,
                [data.tradeType]: data.status === 'completed' 
                  ? Math.max(0, user.activeTrades[data.tradeType] - 1)
                  : user.activeTrades[data.tradeType]
              },
              totalActive: data.status === 'completed' 
                ? Math.max(0, user.totalActive - 1)
                : user.totalActive,
              lastActivity: new Date().toISOString()
            }
          : user
      ));
    };
    
    // Subscribe to Supabase real-time events
    // TODO: Implement admin-level trade subscriptions
    
    // Set up periodic refresh
    const interval = setInterval(loadUsersWithActiveTrades, 30000);
    
    return () => {
      clearInterval(interval);
      // TODO: Cleanup admin-level trade subscriptions
    };
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const loadUsersWithActiveTrades = async () => {
    setIsLoading(true);
    try {
      console.log('=== DEBUG: AdminTradingControl loading users with active trades ===');
      
          // Use supabaseAdminDataService to get real trade summaries based on actual users
    const tradeSummaries = await supabaseAdminDataService.getTradeSummaries();
      console.log('Users with active trades loaded:', tradeSummaries.length);
      console.log('Users with active trades data:', tradeSummaries);
      
      setUsers(tradeSummaries);
      setFilteredUsers(tradeSummaries);
      
      console.log('=== DEBUG: AdminTradingControl data loading complete ===');
    } catch (error) {
      console.error('Error loading users with active trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleOpenTradeControl = (userId: string) => {
    // Navigate to user-specific trade control page
    navigate(`/admin/trading-control/${userId}`);
  };

  const getTradeTypeBadge = (count: number, type: string) => {
    if (count === 0) return null;
    
    const colors = {
      spot: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      futures: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      options: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      binary: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      quant: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      bots: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      staking: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300'
    };

    return (
      <Badge key={type} className={`${colors[type as keyof typeof colors]} text-xs`}>
        {type.toUpperCase()}: {count}
      </Badge>
    );
  };

  const formatLastActivity = (timestamp: string) => {
    const now = new Date();
    const activity = new Date(timestamp);
    const diffMs = now.getTime() - activity.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return activity.toLocaleDateString();
  };

  const getTotalActiveTrades = () => {
    return users.reduce((total, user) => total + user.totalActive, 0);
  };

  const getActiveUsersCount = () => {
    return users.filter(user => user.totalActive > 0).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8" />
            Trading Control Panel
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and control all user trading activities across all platforms
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{getActiveUsersCount()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Active Trades</p>
                <p className="text-2xl font-bold">{getTotalActiveTrades()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Recent Activity</p>
                <p className="text-2xl font-bold">{users.filter(u => {
                  const lastActivity = new Date(u.lastActivity);
                  const now = new Date();
                  return (now.getTime() - lastActivity.getTime()) < 3600000; // 1 hour
                }).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Trade Types</p>
                <p className="text-2xl font-bold">7</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Users
          </CardTitle>
          <CardDescription>
            Find users with active trades to manage their trading activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users with Active Trades</CardTitle>
          <CardDescription>
            Click on a user to access their detailed trading control panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No users found matching your search.' : 'No users with active trades found.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.userId} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{user.username}</span>
                          <span className="text-sm text-muted-foreground">({user.email})</span>
                        </div>
                        <Badge variant="secondary">
                          {user.totalActive} Active Trades
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(user.activeTrades).map(([type, count]) => 
                          getTradeTypeBadge(count, type)
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last activity: {formatLastActivity(user.lastActivity)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        onClick={() => handleOpenTradeControl(user.userId)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Open Trade Control
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative actions for trading control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              <span>View All Trades</span>
              <span className="text-xs text-muted-foreground">Global trade overview</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Activity className="w-6 h-6" />
              <span>Trade Analytics</span>
              <span className="text-xs text-muted-foreground">Performance metrics</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Clock className="w-6 h-6" />
              <span>Recent Overrides</span>
              <span className="text-xs text-muted-foreground">Admin action history</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTradingControl; 