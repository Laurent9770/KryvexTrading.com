import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Timer
} from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'HIGHER' | 'LOWER' | 'ARBITRAGE';
  amount: number;
  entryPrice: number;
  currentPrice?: number;
  status: 'pending' | 'running' | 'completed';
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  remainingTime?: number; // in seconds
  pnl?: number;
  result?: 'WIN' | 'LOSE';
  type: 'spot' | 'futures' | 'options' | 'binary' | 'quant' | 'bots' | 'staking';
}

interface TradeOverrideControlProps {
  trades: Trade[];
  tradeType: string;
  onOverride: (tradeId: string, result: 'WIN' | 'LOSE') => Promise<void>;
  isLoading?: boolean;
}

const TradeOverrideControl: React.FC<TradeOverrideControlProps> = ({
  trades,
  tradeType,
  onOverride,
  isLoading = false
}) => {
  const [selectedTrade, setSelectedTrade] = useState<string>('');
  const [overrideResult, setOverrideResult] = useState<'WIN' | 'LOSE'>('WIN');
  const [isOverriding, setIsOverriding] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const activeTrades = trades.filter(trade => trade.status === 'running' || trade.status === 'pending');
  const completedTrades = trades.filter(trade => trade.status === 'completed');

  const handleOverride = async () => {
    if (!selectedTrade) {
      toast({
        variant: "destructive",
        title: "No Trade Selected",
        description: "Please select a trade to override"
      });
      return;
    }

    setIsOverriding(true);
    try {
      await onOverride(selectedTrade, overrideResult);
      
      toast({
        title: "Trade Override Successful",
        description: `Successfully forced ${overrideResult.toLowerCase()} for ${tradeType} trade`
      });
      
      setSelectedTrade('');
      setOverrideResult('WIN');
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error overriding trade:', error);
      toast({
        variant: "destructive",
        title: "Override Failed",
        description: "Failed to override trade. Please try again."
      });
    } finally {
      setIsOverriding(false);
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'LONG':
      case 'HIGHER':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'SHORT':
      case 'LOWER':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'ARBITRAGE':
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'running':
        return <Badge variant="default" className="flex items-center gap-1"><Timer className="w-3 h-3" /> Running</Badge>;
      case 'completed':
        return <Badge variant="outline" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'WIN':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> WIN</Badge>;
      case 'LOSE':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> LOSE</Badge>;
      default:
        return null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(price);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getTradeStats = () => {
    const total = trades.length;
    const active = activeTrades.length;
    const completed = completedTrades.length;
    const wins = completedTrades.filter(t => t.result === 'WIN').length;
    const losses = completedTrades.filter(t => t.result === 'LOSE').length;

    return { total, active, completed, wins, losses };
  };

  const stats = getTradeStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {tradeType.charAt(0).toUpperCase() + tradeType.slice(1)} Trading
        </CardTitle>
        <CardDescription>
          Manage {tradeType} trades and override outcomes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Trades</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.losses}</p>
            <p className="text-xs text-muted-foreground">Losses</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Override Control */}
        {activeTrades.length > 0 && (
          <Card className="border-2 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5" />
                Trade Override Control
              </CardTitle>
              <CardDescription>
                Force WIN or LOSE for active trades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Trade</label>
                  <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a trade to override" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTrades.map((trade) => (
                        <SelectItem key={trade.id} value={trade.id}>
                          {trade.symbol} - {trade.direction} - ${trade.amount}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Override Result</label>
                  <Select value={overrideResult} onValueChange={(value) => setOverrideResult(value as 'WIN' | 'LOSE')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WIN">Force WIN</SelectItem>
                      <SelectItem value="LOSE">Force LOSE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    disabled={!selectedTrade || isOverriding}
                    className="w-full"
                  >
                    {isOverriding ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Overriding...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Override Trade
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Trade Override</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to force this trade to {overrideResult.toLowerCase()}? 
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleOverride}
                      disabled={isOverriding}
                    >
                      {isOverriding ? 'Overriding...' : 'Confirm Override'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {/* Active Trades */}
        {activeTrades.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Active Trades</h3>
            <div className="space-y-3">
              {activeTrades.map((trade) => (
                <Card key={trade.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          {getDirectionIcon(trade.direction)}
                          <span className="font-medium">{trade.symbol}</span>
                          <span className="text-sm text-muted-foreground">{trade.direction}</span>
                        </div>
                        {getStatusBadge(trade.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">{formatAmount(trade.amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Entry Price</p>
                          <p className="font-medium">{formatPrice(trade.entryPrice)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{trade.duration}m</p>
                        </div>
                        {trade.remainingTime && (
                          <div>
                            <p className="text-muted-foreground">Remaining</p>
                            <p className="font-medium text-amber-600">{formatTime(trade.remainingTime)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Trades */}
        {completedTrades.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent Completed Trades</h3>
            <div className="space-y-3">
              {completedTrades.slice(0, 5).map((trade) => (
                <Card key={trade.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          {getDirectionIcon(trade.direction)}
                          <span className="font-medium">{trade.symbol}</span>
                          <span className="text-sm text-muted-foreground">{trade.direction}</span>
                        </div>
                        {getResultBadge(trade.result || '')}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">{formatAmount(trade.amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Entry Price</p>
                          <p className="font-medium">{formatPrice(trade.entryPrice)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{trade.duration}m</p>
                        </div>
                        {trade.pnl && (
                          <div>
                            <p className="text-muted-foreground">P&L</p>
                            <p className={`font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {trade.pnl >= 0 ? '+' : ''}{formatAmount(trade.pnl)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {trades.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No {tradeType} trades found for this user.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradeOverrideControl; 