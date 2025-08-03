import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, TrendingUp, TrendingDown, Crown, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface AdminSpotTradeControlProps {
  activeTrades: SpotTrade[];
  onTradeOverride: (tradeId: string, outcome: 'win' | 'lose') => void;
}

const AdminSpotTradeControl = ({ activeTrades, onTradeOverride }: AdminSpotTradeControlProps) => {
  const { toast } = useToast();
  const [selectedTrade, setSelectedTrade] = useState<string>('');
  const [overrideOutcome, setOverrideOutcome] = useState<'win' | 'lose'>('win');

  const handleOverride = () => {
    if (!selectedTrade) {
      toast({
        variant: "destructive",
        title: "No Trade Selected",
        description: "Please select a trade to override"
      });
      return;
    }

    onTradeOverride(selectedTrade, overrideOutcome);
    setSelectedTrade('');
    
    toast({
      title: "Trade Overridden",
      description: `Trade ${selectedTrade} manually set to ${overrideOutcome.toUpperCase()}`
    });
  };

  const formatTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = Math.max(0, end.getTime() - now.getTime());
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-orange-200 bg-orange-50/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <Crown className="w-5 h-5" />
          Admin Spot Trade Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Trades */}
        <div>
          <h4 className="font-semibold mb-2">Active Spot Trades ({activeTrades.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {activeTrades.map((trade) => (
              <div key={trade.id} className="p-3 border rounded-lg bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${trade.direction === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.direction.toUpperCase()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        ${trade.amount}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Entry: ${trade.entry_price.toLocaleString()} • Duration: {trade.duration}m
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-orange-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono text-sm">
                        {formatTimeRemaining(trade.end_time)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      +{trade.profit_percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {activeTrades.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No active spot trades
              </div>
            )}
          </div>
        </div>

        {/* Manual Override */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-700">
            <AlertTriangle className="w-4 h-4" />
            Manual Override
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Select Trade</label>
              <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a trade to override" />
                </SelectTrigger>
                <SelectContent>
                  {activeTrades.map((trade) => (
                    <SelectItem key={trade.id} value={trade.id}>
                      {trade.direction.toUpperCase()} ${trade.amount} - {formatTimeRemaining(trade.end_time)} left
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Override Outcome</label>
              <Select value={overrideOutcome} onValueChange={(value: 'win' | 'lose') => setOverrideOutcome(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="win">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      Force WIN
                    </div>
                  </SelectItem>
                  <SelectItem value="lose">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      Force LOSE
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleOverride}
              disabled={!selectedTrade}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              Override Trade Outcome
            </Button>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Admin Statistics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="text-lg font-bold text-green-600">
                {activeTrades.filter(t => t.outcome === 'win').length}
              </div>
              <div className="text-xs text-muted-foreground">Forced Wins</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="text-lg font-bold text-red-600">
                {activeTrades.filter(t => t.outcome === 'lose').length}
              </div>
              <div className="text-xs text-muted-foreground">Forced Losses</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSpotTradeControl; 