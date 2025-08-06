import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Info,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import supabaseTradingService from "@/services/supabaseTradingService";

const ConvertPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, addActivity, realTimePrices, tradingAccount } = useAuth();
  const [fromAsset, setFromAsset] = useState("BTC");
  const [toAsset, setToAsset] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [convertedAmount, setConvertedAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Get available assets from trading account
  const getAvailableAssets = () => {
    return Object.entries(tradingAccount).map(([symbol, asset]) => ({
      symbol,
      name: symbol,
      balance: asset.available,
      usdValue: `$${(parseFloat(asset.available.replace(/,/g, '')) * (realTimePrices[symbol]?.price || 0)).toFixed(2)}`
    }));
  };

  // Get real-time exchange rates from auth context
  const getExchangeRate = () => {
    if (fromAsset === toAsset) return 1;
    const fromPrice = realTimePrices[fromAsset]?.price || 0;
    const toPrice = realTimePrices[toAsset]?.price || 0;
    return fromPrice > 0 && toPrice > 0 ? fromPrice / toPrice : 0;
  };

  const calculateConversion = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setConvertedAmount("");
      return;
    }

    const rate = getExchangeRate();
    const converted = parseFloat(amount) * rate;
    setExchangeRate(rate);
    setConvertedAmount(converted.toFixed(6));
  };

  const handleMaxAmount = () => {
    const balance = getAvailableAssets().find(asset => asset.symbol === fromAsset) || getAvailableAssets()[0];
    setAmount(balance.balance);
  };

  const validateConversion = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to convert",
        variant: "destructive"
      });
      return false;
    }

    const balance = getAvailableAssets().find(asset => asset.symbol === fromAsset);
    const numAmount = parseFloat(amount);
    const numBalance = parseFloat(balance?.balance || "0");

    if (numAmount > numBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${balance?.balance} ${fromAsset} available`,
        variant: "destructive"
      });
      return false;
    }

    if (fromAsset === toAsset) {
      toast({
        title: "Same Asset",
        description: "Cannot convert to the same asset",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleConvert = async () => {
    if (!validateConversion()) return;

    setIsExecuting(true);
    try {
      const numAmount = parseFloat(amount);
      const rate = getExchangeRate();
      const convertedValue = numAmount * rate;

      // Create a conversion trade through Supabase
      const result = await supabaseTradingService.simulateTrade(user?.id || '', fromAsset, numAmount, 'sell');

      if (result.success) {
        // Create a second trade to buy the to asset
        const buyResult = await supabaseTradingService.simulateTrade(user?.id || '', toAsset, convertedValue / getExchangeRate(), 'buy');

        if (buyResult.success) {
          const conversionActivity = {
            type: "conversion",
            action: "CONVERTED",
            symbol: `${fromAsset}/${toAsset}`,
            amount: `${numAmount} ${fromAsset} → ${convertedValue.toFixed(6)} ${toAsset}`,
            price: `Rate: ${rate.toFixed(6)}`,
            pnl: "0",
            status: "completed",
            time: "Just now",
            icon: "🔄"
          };
          addActivity(conversionActivity);

          toast({
            title: "Conversion Successful",
            description: `Converted ${numAmount} ${fromAsset} to ${convertedValue.toFixed(6)} ${toAsset}`,
          });

          // Reset form
          setAmount("");
          setConvertedAmount("");
          setShowConfirmation(false);
        } else {
          toast({
            variant: "destructive",
            title: "Conversion Failed",
            description: buyResult.message || "Failed to complete conversion."
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Conversion Failed",
          description: result.message || "Unknown error occurred."
        });
      }
    } catch (error) {
      console.error("Error converting assets:", error);
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: "Failed to convert due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleBack = () => {
    navigate('/wallet');
  };

  // Calculate conversion when amount or assets change
  useEffect(() => {
    calculateConversion();
  }, [amount, fromAsset, toAsset]);

  const recentConversions = [
    { from: "BTC", to: "USDT", amount: "0.05", converted: "2,425", time: "2 hours ago" },
    { from: "ETH", to: "USDT", amount: "1.2", converted: "3,840", time: "5 hours ago" },
    { from: "SOL", to: "USDT", amount: "10", converted: "4,850", time: "1 day ago" }
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="kucoin-container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Wallet
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Convert Assets</h1>
              <p className="text-slate-400">Convert between different cryptocurrencies</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Rates
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Conversion Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conversion Form */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h2 className="text-xl font-bold mb-6 text-white">Convert Assets</h2>
              
              <div className="space-y-6">
                {/* From Asset */}
                <div>
                  <Label htmlFor="fromAsset" className="text-sm font-medium text-slate-300">
                    Convert From
                  </Label>
                  <div className="flex gap-3 mt-2">
                    <Select value={fromAsset} onValueChange={setFromAsset}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {getAvailableAssets().map((asset) => (
                          <SelectItem key={asset.symbol} value={asset.symbol}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{asset.symbol}</span>
                              <span className="text-slate-400">({asset.name})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleMaxAmount}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      MAX
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Available: {getAvailableAssets().find(asset => asset.symbol === fromAsset)?.balance} {fromAsset} ({getAvailableAssets().find(asset => asset.symbol === fromAsset)?.usdValue})
                  </p>
                </div>

                {/* Conversion Arrow */}
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-slate-400" />
                  </div>
                </div>

                {/* To Asset */}
                <div>
                  <Label htmlFor="toAsset" className="text-sm font-medium text-slate-300">
                    Convert To
                  </Label>
                  <div className="flex gap-3 mt-2">
                    <Select value={toAsset} onValueChange={setToAsset}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {getAvailableAssets().map((asset) => (
                          <SelectItem key={asset.symbol} value={asset.symbol}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{asset.symbol}</span>
                              <span className="text-slate-400">({asset.name})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={convertedAmount}
                        readOnly
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Exchange Rate Info */}
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Exchange Rate</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Rate</p>
                      <p className="font-semibold text-white">1 {fromAsset} = {exchangeRate} {toAsset}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Fee</p>
                      <p className="font-semibold text-green-400">0.1%</p>
                    </div>
                  </div>
                </div>

                {/* Convert Button */}
                <Button
                  onClick={handleConvert}
                  disabled={isExecuting || !amount || !convertedAmount || fromAsset === toAsset}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Convert Now
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Important Notes */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Important Notes
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Conversions are instant and cannot be reversed.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Exchange rates are updated in real-time.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>A 0.1% conversion fee applies to all transactions.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>To withdraw funds, convert to USDT first, then transfer to Funding Account.</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Conversion Stats</h3>
              <div className="space-y-4">
                <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                  <p className="text-sm text-slate-400">Total Conversions (24h)</p>
                  <p className="text-xl font-bold text-green-400">$45,670.89</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                  <p className="text-sm text-slate-400">Average Rate</p>
                  <p className="text-xl font-bold text-blue-400">$32,450.67</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
                  <p className="text-sm text-slate-400">Conversion Fee</p>
                  <p className="text-xl font-bold text-yellow-400">0.1%</p>
                </div>
              </div>
            </Card>

            {/* Recent Conversions */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Recent Conversions</h3>
              <div className="space-y-3">
                {recentConversions.map((conversion, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-slate-700 rounded hover:bg-slate-700/50 transition-colors">
                    <div>
                      <p className="font-medium text-white">{conversion.amount} {conversion.from}</p>
                      <p className="text-sm text-slate-400">→ {conversion.converted} {conversion.to}</p>
                      <p className="text-xs text-slate-500">{conversion.time}</p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Rate Alerts */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Rate Alerts
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-300">BTC/USDT +2.5%</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-slate-300">ETH/USDT -1.2%</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-300">SOL/USDT +5.8%</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-slate-800 border-slate-700 p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Conversion Successful!</h3>
                <p className="text-slate-400 mb-4">
                  Successfully converted {amount} {fromAsset} to {convertedAmount} {toAsset}.
                </p>
                <Button
                  onClick={() => setShowConfirmation(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  OK
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConvertPage; 