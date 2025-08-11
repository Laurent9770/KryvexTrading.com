import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Eye, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  User,
  Target,
  Settings,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import supabaseTradingService from '@/services/supabaseTradingService';

interface Trade {
  id: string;
  user_id: string;
  trade_type: 'spot' | 'futures' | 'binary' | 'options' | 'quant';
  direction: 'buy' | 'sell';
  amount: number;
  symbol: string;
  entry_price: number;
  current_price: number;
  status: 'running' | 'completed' | 'cancelled';
  outcome: 'win' | 'lose' | 'admin_override' | null;
  profit_percentage: number;
  start_time: string;
  end_time?: string;
  user_profile?: {
    full_name: string;
    email: string;
  };
}

interface TradingFeature {
  id: string;
  name: string;
  type: 'spot' | 'futures' | 'binary' | 'options' | 'quant';
  is_enabled: boolean;
  min_investment: number;
  max_investment: number;
  roi_percentage: number;
  duration_minutes: number;
  risk_level: 'low' | 'medium' | 'high';
}

const AdminTradeControl: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [tradingFeatures, setTradingFeatures] = useState<TradingFeature[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trades');

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTrades();
  }, [searchTerm, statusFilter, typeFilter, trades]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load active trades
      const tradesResponse = await supabaseTradingService.getActiveTrades();
      if (tradesResponse.success) {
        setTrades(tradesResponse.data || []);
      }

      // Load trading features configuration
      const featuresResponse = await supabaseTradingService.getTradingFeatures();
      if (featuresResponse.success) {
        setTradingFeatures(featuresResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading trade data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load trade data"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTrades = () => {
    let filtered = trades;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.user_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.user_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trade => trade.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(trade => trade.trade_type === typeFilter);
    }

    setFilteredTrades(filtered);
  };

  const handleForceTradeOutcome = async (tradeId: string, outcome: 'win' | 'lose') => {
    if (!user) return;

    try {
      const result = await supabaseTradingService.forceTradeOutcome(tradeId, outcome, user.email);
      
      if (result.success) {
        toast({
          title: "Trade Outcome Updated",
          description: `Trade marked as ${outcome} successfully`
        });
        
        // Update local state
        setTrades(prev => prev.map(trade => 
          trade.id === tradeId 
            ? { ...trade, outcome: 'admin_override', status: 'completed', end_time: new Date().toISOString() }
            : trade
        ));
        
        setSelectedTrade(null);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Failed to update trade outcome"
        });
      }
    } catch (error) {
      console.error('Error forcing trade outcome:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update trade outcome"
      });
    }
  };

  const handleToggleFeature = async (featureId: string, enabled: boolean) => {
    try {
      const result = await supabaseTradingService.updateTradingFeature(featureId, { is_enabled: enabled });
      
      if (result.success) {
        toast({
          title: "Feature Updated",
          description: `Trading feature ${enabled ? 'enabled' : 'disabled'} successfully`
        });
        
        setTradingFeatures(prev => prev.map(feature => 
          feature.id === featureId 
            ? { ...feature, is_enabled: enabled }
            : feature
        ));
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update trading feature"
        });
      }
    } catch (error) {
      console.error('Error updating trading feature:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update trading feature"
      });
    }
  };

  const handleUpdateFeatureSettings = async (featureId: string, settings: Partial<TradingFeature>) => {
    try {
      const result = await supabaseTradingService.updateTradingFeature(featureId, settings);
      
      if (result.success) {
        toast({
          title: "Settings Updated",
          description: "Trading feature settings updated successfully"
        });
        
        setTradingFeatures(prev => prev.map(feature => 
          feature.id === featureId 
            ? { ...feature, ...settings }
            : feature
        ));
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update feature settings"
        });
      }
    } catch (error) {
      console.error('Error updating feature settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update feature settings"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />Running</Badge>;
      case 'completed':
        return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome) {
      case 'win':
        return <Badge variant="default" className="bg-green-500"><TrendingUp className="w-3 h-3 mr-1" />Win</Badge>;
      case 'lose':
        return <Badge variant="destructive"><TrendingDown className="w-3 h-3 mr-1" />Loss</Badge>;
      case 'admin_override':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Admin Override</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      spot: 'bg-blue-500',
      futures: 'bg-purple-500',
      binary: 'bg-orange-500',
      options: 'bg-green-500',
      quant: 'bg-red-500'
    };
    
    return <Badge variant="default" className={colors[type as keyof typeof colors] || 'bg-gray-500'}>
      {type.toUpperCase()}
    </Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trades">Active Trades</TabsTrigger>
          <TabsTrigger value="features">Trading Features</TabsTrigger>
        </TabsList>

        <TabsContent value="trades" className="space-y-6">
          {/* Trade Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Trades</CardTitle>
                  <CardDescription>
                    Monitor and control user trades. Force trade outcomes when necessary.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search by user or symbol..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="spot">Spot</SelectItem>
                    <SelectItem value="futures">Futures</SelectItem>
                    <SelectItem value="binary">Binary</SelectItem>
                    <SelectItem value="options">Options</SelectItem>
                    <SelectItem value="quant">Quant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Trades Table */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading trades...</p>
                </div>
              ) : filteredTrades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No trades found matching your criteria.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Entry Price</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{trade.user_profile?.full_name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">{trade.user_profile?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(trade.trade_type)}</TableCell>
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>{formatCurrency(trade.amount)}</TableCell>
                        <TableCell>{formatCurrency(trade.entry_price)}</TableCell>
                        <TableCell>{formatCurrency(trade.current_price)}</TableCell>
                        <TableCell>{getStatusBadge(trade.status)}</TableCell>
                        <TableCell>{getOutcomeBadge(trade.outcome)}</TableCell>
                        <TableCell>
                          {trade.status === 'running' && (
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => setSelectedTrade(trade)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Force Trade Outcome</DialogTitle>
                                    <DialogDescription>
                                      Force the outcome for {trade.user_profile?.full_name}'s {trade.trade_type} trade on {trade.symbol}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Trade Details:</p>
                                      <p>Amount: {formatCurrency(trade.amount)}</p>
                                      <p>Entry Price: {formatCurrency(trade.entry_price)}</p>
                                      <p>Current Price: {formatCurrency(trade.current_price)}</p>
                                      <p>Profit %: {trade.profit_percentage}%</p>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button 
                                      variant="outline" 
                                      onClick={() => setSelectedTrade(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => handleForceTradeOutcome(trade.id, 'lose')}
                                    >
                                      Force Loss
                                    </Button>
                                    <Button 
                                      onClick={() => handleForceTradeOutcome(trade.id, 'win')}
                                    >
                                      Force Win
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          {/* Trading Features Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Trading Features</CardTitle>
                  <CardDescription>
                    Enable/disable trading features and adjust settings.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading features...</p>
                </div>
              ) : tradingFeatures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No trading features found.
                </div>
              ) : (
                <div className="grid gap-4">
                  {tradingFeatures.map((feature) => (
                    <Card key={feature.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h4 className="font-medium">{feature.name}</h4>
                            {getTypeBadge(feature.type)}
                            <Badge variant={feature.is_enabled ? "default" : "secondary"}>
                              {feature.is_enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Min Investment:</span>
                              <p className="font-medium">{formatCurrency(feature.min_investment)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Max Investment:</span>
                              <p className="font-medium">{formatCurrency(feature.max_investment)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">ROI %:</span>
                              <p className="font-medium">{feature.roi_percentage}%</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Duration:</span>
                              <p className="font-medium">{feature.duration_minutes} min</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={feature.is_enabled ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleToggleFeature(feature.id, !feature.is_enabled)}
                          >
                            {feature.is_enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {feature.is_enabled ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Open settings modal
                              toast({
                                title: "Settings",
                                description: "Feature settings modal coming soon"
                              });
                            }}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTradeControl;
