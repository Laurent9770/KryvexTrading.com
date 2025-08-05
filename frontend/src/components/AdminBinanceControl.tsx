import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Shield, 
  Users, 
  Activity, 
  TestTube, 
  Key, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Lock,
  Unlock
} from 'lucide-react';

interface BinanceSettings {
  isEnabled: boolean;
  maintenanceMode: boolean;
  apiKey: string;
  secretKey: string;
  allowSpotTrading: boolean;
  allowFuturesTrading: boolean;
  maxOrderSize: number;
  maxDailyVolume: number;
  maxLeverage: number;
  allowedUserRoles: string[];
  allowedTradingPairs: string[];
  sendOrderNotifications: boolean;
  tradingHours: {
    start: string;
    end: string;
    timezone: string;
  };
}

interface TradingStats {
  isEnabled: boolean;
  maintenanceMode: boolean;
  allowedUserRoles: string[];
  allowedTradingPairs: string[];
  eligibleUsers: number;
  riskControls: {
    maxOrderSize: number;
    maxDailyVolume: number;
    maxLeverage: number;
  };
  tradingHours: {
    start: string;
    end: string;
    timezone: string;
  };
}

export const AdminBinanceControl: React.FC = () => {
  const [settings, setSettings] = useState<BinanceSettings | null>(null);
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [newSecretKey, setNewSecretKey] = useState('');
  const { toast } = useToast();

  const apiUrl = import.meta.env.VITE_API_URL || 'https://kryvextrading-com.onrender.com';

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/binance/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/binance/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Update settings
  const updateSettings = async (updates: Partial<BinanceSettings>) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/binance/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        toast({
          title: "Settings Updated",
          description: "Binance settings have been updated successfully.",
        });
        fetchSettings();
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update Binance settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Test API connection
  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/binance/admin/test-connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        toast({
          title: "Connection Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to test API connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update API keys
  const updateApiKeys = async () => {
    if (!newApiKey || !newSecretKey) {
      toast({
        title: "Missing Keys",
        description: "Please enter both API key and secret key.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/binance/admin/api-keys`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          apiKey: newApiKey,
          secretKey: newSecretKey
        })
      });

      if (response.ok) {
        toast({
          title: "API Keys Updated",
          description: "API keys have been updated successfully.",
        });
        setNewApiKey('');
        setNewSecretKey('');
        fetchSettings();
      } else {
        throw new Error('Failed to update API keys');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update API keys.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle trading
  const toggleTrading = async (enabled: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/binance/admin/toggle-trading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        toast({
          title: enabled ? "Trading Enabled" : "Trading Disabled",
          description: `Binance trading has been ${enabled ? 'enabled' : 'disabled'}.`,
        });
        fetchSettings();
        fetchStats();
      } else {
        throw new Error('Failed to toggle trading');
      }
    } catch (error) {
      toast({
        title: "Toggle Failed",
        description: "Failed to toggle trading status.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Set maintenance mode
  const setMaintenanceMode = async (enabled: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/binance/admin/maintenance-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        toast({
          title: enabled ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled",
          description: `Maintenance mode has been ${enabled ? 'enabled' : 'disabled'}.`,
        });
        fetchSettings();
        fetchStats();
      } else {
        throw new Error('Failed to set maintenance mode');
      }
    } catch (error) {
      toast({
        title: "Maintenance Mode Failed",
        description: "Failed to set maintenance mode.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, []);

  if (!settings) {
    return <div className="text-center py-8">Loading Binance settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Binance Trading Control</h2>
          <p className="text-slate-400">Manage Binance API integration and trading permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={settings.isEnabled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}>
            {settings.isEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
          {settings.maintenanceMode && (
            <Badge className="bg-yellow-500/10 text-yellow-400">
              Maintenance Mode
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Status Card */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Status</CardTitle>
                {settings.isEnabled ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {settings.isEnabled ? 'Active' : 'Inactive'}
                </div>
                <p className="text-xs text-slate-400">
                  {settings.maintenanceMode ? 'Maintenance Mode' : 'Ready for Trading'}
                </p>
              </CardContent>
            </Card>

            {/* Eligible Users */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Eligible Users</CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats?.eligibleUsers || 0}
                </div>
                <p className="text-xs text-slate-400">
                  Users with trading access
                </p>
              </CardContent>
            </Card>

            {/* Risk Controls */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Max Order Size</CardTitle>
                <DollarSign className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ${settings.maxOrderSize.toLocaleString()}
                </div>
                <p className="text-xs text-slate-400">
                  Maximum order value
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-slate-400">
                Manage Binance trading status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <span className="text-white">Enable/Disable Trading</span>
                </div>
                <Button
                  onClick={() => toggleTrading(!settings.isEnabled)}
                  disabled={loading}
                  variant={settings.isEnabled ? 'destructive' : 'default'}
                >
                  {loading ? 'Processing...' : settings.isEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="text-white">Maintenance Mode</span>
                </div>
                <Button
                  onClick={() => setMaintenanceMode(!settings.maintenanceMode)}
                  disabled={loading}
                  variant={settings.maintenanceMode ? 'destructive' : 'outline'}
                >
                  {loading ? 'Processing...' : settings.maintenanceMode ? 'Disable' : 'Enable'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-purple-400" />
                  <span className="text-white">Test API Connection</span>
                </div>
                <Button
                  onClick={testConnection}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Result */}
          {testResult && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">API Connection Test</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-2 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Trading Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure trading parameters and restrictions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Max Order Size (USD)</label>
                  <Input
                    type="number"
                    value={settings.maxOrderSize}
                    onChange={(e) => updateSettings({ maxOrderSize: parseFloat(e.target.value) })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Max Daily Volume (USD)</label>
                  <Input
                    type="number"
                    value={settings.maxDailyVolume}
                    onChange={(e) => updateSettings({ maxDailyVolume: parseFloat(e.target.value) })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Max Leverage</label>
                  <Input
                    type="number"
                    value={settings.maxLeverage}
                    onChange={(e) => updateSettings({ maxLeverage: parseFloat(e.target.value) })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Trading Hours Start</label>
                  <Input
                    type="time"
                    value={settings.tradingHours.start}
                    onChange={(e) => updateSettings({ 
                      tradingHours: { ...settings.tradingHours, start: e.target.value }
                    })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white">Spot Trading</span>
                </div>
                <Switch
                  checked={settings.allowSpotTrading}
                  onCheckedChange={(checked) => updateSettings({ allowSpotTrading: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white">Futures Trading</span>
                </div>
                <Switch
                  checked={settings.allowFuturesTrading}
                  onCheckedChange={(checked) => updateSettings({ allowFuturesTrading: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white">Order Notifications</span>
                </div>
                <Switch
                  checked={settings.sendOrderNotifications}
                  onCheckedChange={(checked) => updateSettings({ sendOrderNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">API Keys</CardTitle>
              <CardDescription className="text-slate-400">
                Manage Binance API credentials securely
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">API Key</label>
                <Input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="Enter new API key"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Secret Key</label>
                <Input
                  type="password"
                  value={newSecretKey}
                  onChange={(e) => setNewSecretKey(e.target.value)}
                  placeholder="Enter new secret key"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <Button
                onClick={updateApiKeys}
                disabled={loading || !newApiKey || !newSecretKey}
                className="w-full"
              >
                {loading ? 'Updating...' : 'Update API Keys'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">User Permissions</CardTitle>
              <CardDescription className="text-slate-400">
                Control which user roles can access Binance trading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Allowed User Roles</label>
                <div className="space-y-2">
                  {['admin', 'premium', 'standard', 'basic'].map((role) => (
                    <div key={role} className="flex items-center justify-between">
                      <span className="text-white capitalize">{role}</span>
                      <Switch
                        checked={settings.allowedUserRoles.includes(role)}
                        onCheckedChange={(checked) => {
                          const newRoles = checked
                            ? [...settings.allowedUserRoles, role]
                            : settings.allowedUserRoles.filter(r => r !== role);
                          updateSettings({ allowedUserRoles: newRoles });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBinanceControl; 