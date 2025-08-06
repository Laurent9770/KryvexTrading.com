import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Search,
  Download,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import supabaseTradingService from "@/services/supabaseTradingService";

interface Trade {
  id: string;
  type: string;
  action: string;
  symbol: string;
  amount: number;
  price: number;
  profit?: number;
  loss?: number;
  timestamp: Date;
  status: string;
}

const TradeHistory = () => {
  const { realTimePrices } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // Get real trade history from Supabase
  const loadTradeHistory = async () => {
    try {
      const { user } = useAuth();
      if (!user?.id) return;
      
      const tradeHistoryResponse = await supabaseTradingService.getTradeHistory(user.id, 1, 100);
      
      if (tradeHistoryResponse.success && tradeHistoryResponse.trades) {
        const formattedTrades = tradeHistoryResponse.trades.map(trade => ({
          id: trade.id,
          type: 'spot', // Default type since we don't have it in the trade data
          action: trade.trade_type,
          symbol: trade.trading_pair_id,
          amount: trade.amount,
          price: trade.price,
          profit: trade.profit_loss > 0 ? trade.profit_loss : undefined,
          loss: trade.profit_loss < 0 ? Math.abs(trade.profit_loss) : undefined,
          timestamp: new Date(trade.created_at),
          status: trade.status
        }));
        setTrades(formattedTrades);
        setFilteredTrades(formattedTrades);
      }
    } catch (error) {
      console.error('Error loading trade history:', error);
    }
  };

  useEffect(() => {
    loadTradeHistory();
  }, []);

  useEffect(() => {
    let filtered = trades;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(trade =>
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(trade => trade.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(trade => trade.status === statusFilter);
    }

    setFilteredTrades(filtered);
  }, [trades, searchTerm, typeFilter, statusFilter]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      loadTradeHistory();
      setIsLoading(false);
    }, 500);
  };

  const handleExport = () => {
    const csvContent = [
      ["ID", "Type", "Action", "Symbol", "Amount", "Price", "Profit/Loss", "Status", "Date"],
      ...filteredTrades.map(trade => [
        trade.id,
        trade.type,
        trade.action,
        trade.symbol,
        trade.amount.toString(),
        trade.price.toString(),
        (trade.profit || trade.loss || 0).toString(),
        trade.status,
        trade.timestamp.toLocaleString()
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trade-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'lost':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Trade History</h3>
            <p className="text-sm text-slate-400">Your complete trading activity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search trades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-700 border-slate-600 text-white"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
            <SelectValue placeholder="Trade Type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="spot">Spot</SelectItem>
            <SelectItem value="futures">Futures</SelectItem>
            <SelectItem value="options">Options</SelectItem>
            <SelectItem value="binary">Binary</SelectItem>
            <SelectItem value="quant">Quant</SelectItem>
            <SelectItem value="bot">Bot</SelectItem>
            <SelectItem value="staking">Staking</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-slate-400 flex items-center justify-end">
          {filteredTrades.length} of {trades.length} trades
        </div>
      </div>

      {/* Trade List */}
      <div className="space-y-3">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-300 mb-2">No Trades Found</h4>
            <p className="text-slate-400">
              {trades.length === 0 ? "Start trading to see your history here." : "No trades match your current filters."}
            </p>
          </div>
        ) : (
          filteredTrades.map((trade) => (
            <div key={trade.id} className="border border-slate-700 rounded-lg p-4 hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    trade.action === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {trade.action === 'buy' ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{trade.symbol}</span>
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                        {trade.type}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(trade.status)}`}>
                        {trade.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-400">
                      {trade.action.toUpperCase()} {trade.amount} @ ${trade.price.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-semibold ${
                    trade.profit ? 'text-green-400' : trade.loss ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {trade.profit ? `+$${trade.profit.toFixed(2)}` : 
                     trade.loss ? `-$${trade.loss.toFixed(2)}` : '$0.00'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatTime(trade.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default TradeHistory;