import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Send, 
  User, 
  Search, 
  AlertCircle, 
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Users,
  Clock,
  Shield,
  ArrowRight,
  ArrowUpDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import tradingEngine, { TradeRequest } from "@/services/tradingEngine";

const TransferPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tradingAccount, fundingAccount, realTimePrices, addActivity } = useAuth();
  const [transferType, setTransferType] = useState<"user" | "account">("user");
  const [fromAccount, setFromAccount] = useState<"trading" | "funding">("trading");
  const [toAccount, setToAccount] = useState<"trading" | "funding">("funding");
  const [fromAsset, setFromAsset] = useState("BTC");
  const [toAsset, setToAsset] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Get real balances from auth context
  const getWalletBalances = () => {
    return Object.entries(tradingAccount).map(([symbol, asset]) => ({
      symbol,
      name: symbol,
      balance: asset.balance,
      usdValue: `$${(parseFloat(asset.balance.replace(/,/g, '')) * (realTimePrices[symbol]?.price || 0)).toFixed(2)}`,
      available: asset.available
    }));
  };

  const getFundingBalances = () => {
    return Object.entries(fundingAccount).map(([symbol, asset]) => ({
      symbol,
      name: symbol,
      balance: asset.balance,
      usdValue: `$${(parseFloat(asset.balance.replace(/,/g, '')) * (realTimePrices[symbol]?.price || 0)).toFixed(2)}`,
      available: asset.available
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
    if (!transferAmount || parseFloat(transferAmount) <= 0) return "";
    const rate = getExchangeRate();
    const converted = parseFloat(transferAmount) * rate;
    
    // Handle very small numbers with better precision
    if (converted < 0.000001) {
      return converted.toFixed(8);
    } else if (converted < 0.01) {
      return converted.toFixed(6);
    } else if (converted < 1) {
      return converted.toFixed(4);
    } else {
      return converted.toFixed(2);
    }
  };

  const handleMaxAmount = () => {
    const balance = getSelectedBalance();
    setAmount(balance.available);
  };

  const handleMaxTransferAmount = () => {
    const balances = fromAccount === "trading" ? getWalletBalances() : getFundingBalances();
    const balance = balances.find(b => b.symbol === fromAsset);
    if (balance) {
      setTransferAmount(balance.available);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // TODO: Implement real API call to search users
      // const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      // const results = await response.json();
      // setSearchResults(results);
      
      // For now, set empty results until real API is implemented
      setSearchResults([]);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectRecipient = (user: any) => {
    setRecipient(user.username);
    setSearchResults([]);
  };

  const validateUserTransfer = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid transfer amount",
        variant: "destructive"
      });
      return false;
    }

    if (!recipient.trim()) {
      toast({
        title: "Recipient Required",
        description: "Please enter a valid recipient username or email",
        variant: "destructive"
      });
      return false;
    }

    const balances = fromAccount === "trading" ? getWalletBalances() : getFundingBalances();
    const balance = balances.find(b => b.symbol === fromAsset);
    
    if (!balance) {
      toast({
        title: "Asset Not Found",
        description: "Selected asset not found in account",
        variant: "destructive"
      });
      return false;
    }

    const numAmount = parseFloat(amount);
    const numBalance = parseFloat(balance.available);

    if (numAmount > numBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${balance.available} ${fromAsset} available`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const validateAccountTransfer = () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid transfer amount",
        variant: "destructive"
      });
      return false;
    }

    const balances = fromAccount === "trading" ? getWalletBalances() : getFundingBalances();
    const balance = balances.find(b => b.symbol === fromAsset);
    
    if (!balance) {
      toast({
        title: "Asset Not Found",
        description: "Selected asset not available in source account",
        variant: "destructive"
      });
      return false;
    }

    const numAmount = parseFloat(transferAmount);
    const numBalance = parseFloat(balance.available);

    if (numAmount > numBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${balance.available} ${fromAsset} available`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleUserTransfer = async () => {
    if (!validateUserTransfer()) return;

    setIsExecuting(true);
    
    try {
      const tradeRequest: TradeRequest = {
        type: "user_transfer",
        action: "sell", // Default action for transfers
        symbol: fromAsset,
        fromAccount: fromAccount,
        toAccount: toAccount,
        fromAsset: fromAsset,
        toAsset: toAsset,
        amount: parseFloat(amount),
        recipient: recipient,
        message: "User transfer"
      };

      const response = await tradingEngine.executeTrade(tradeRequest);
      if (response.success) {
        toast({
          title: "Transfer Sent!",
          description: `Successfully transferred ${amount} ${fromAsset} to ${recipient}`,
        });
        addActivity({
          type: "transfer",
          from: fromAccount,
          to: toAccount,
          asset: fromAsset,
          amount: parseFloat(amount),
          recipient: recipient,
          status: "completed",
          message: "User transfer"
        });
      } else {
        toast({
          title: "Transfer Failed",
          description: response.message || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("User transfer error:", error);
      toast({
        title: "Transfer Failed",
        description: "Failed to send transfer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
      setAmount("");
      setRecipient("");
      setSearchResults([]);
    }
  };

  const handleAccountTransfer = async () => {
    if (!validateAccountTransfer()) return;

    setIsExecuting(true);
    
    const convertedAmount = calculateConversion();
    
    try {
      const tradeRequest: TradeRequest = {
        type: "account_transfer",
        action: "sell", // Default action for transfers
        symbol: fromAsset,
        fromAccount: fromAccount,
        toAccount: toAccount,
        fromAsset: fromAsset,
        toAsset: toAsset,
        amount: parseFloat(transferAmount),
        message: "Account transfer"
      };

      const response = await tradingEngine.executeTrade(tradeRequest);
      if (response.success) {
        toast({
          title: "Transfer Successful!",
          description: `Transferred ${transferAmount} ${fromAsset} to ${convertedAmount} ${toAsset}`,
        });
        addActivity({
          type: "transfer",
          from: fromAccount,
          to: toAccount,
          asset: fromAsset,
          amount: parseFloat(transferAmount),
          recipient: "", // No recipient for account transfers
          status: "completed",
          message: "Account transfer"
        });
      } else {
        toast({
          title: "Transfer Failed",
          description: response.message || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Account transfer error:", error);
      toast({
        title: "Transfer Failed",
        description: "Failed to send transfer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
      setTransferAmount("");
    }
  };

  const handleBack = () => {
    navigate('/wallet');
  };

  const recentTransfers = [
    { recipient: "john_doe", amount: "100", symbol: "USDT", status: "Completed", time: "2 hours ago" },
    { recipient: "jane_smith", amount: "0.05", symbol: "BTC", status: "Completed", time: "5 hours ago" },
    { recipient: "mike_wilson", amount: "1.2", symbol: "ETH", status: "Pending", time: "1 day ago" }
  ];

  const availableAssets = [
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "USDT", name: "Tether" },
    { symbol: "SOL", name: "Solana" },
    { symbol: "ADA", name: "Cardano" }
  ];

  const getSelectedBalance = () => {
    const balances = fromAccount === "trading" ? getWalletBalances() : getFundingBalances();
    return balances.find(balance => balance.symbol === fromAsset) || balances[0];
  };

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
              <h1 className="text-3xl font-bold text-white">Transfer</h1>
              <p className="text-slate-400">Transfer funds between accounts and users</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs value={transferType} onValueChange={(value) => setTransferType(value as "user" | "account")} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user">User Transfer</TabsTrigger>
            <TabsTrigger value="account">Account Transfer</TabsTrigger>
          </TabsList>

          {/* User Transfer Tab */}
          <TabsContent value="user" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Transfer Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Asset Selection */}
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h2 className="text-xl font-bold mb-4 text-white">Select Asset</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {getWalletBalances().map((balance, index) => (
                      <Button
                        key={index}
                        variant={fromAsset === balance.symbol ? "default" : "outline"}
                        className={`h-20 flex-col ${
                          fromAsset === balance.symbol 
                            ? "bg-blue-600 hover:bg-blue-700 text-white" 
                            : "border-slate-600 text-slate-300 hover:bg-slate-700"
                        }`}
                        onClick={() => setFromAsset(balance.symbol)}
                      >
                        <span className="font-bold text-lg">{balance.symbol}</span>
                        <span className="text-xs opacity-80">{balance.available} {balance.symbol}</span>
                        <span className="text-xs opacity-60">${balance.usdValue}</span>
                      </Button>
                    ))}
                  </div>
                </Card>

                {/* Transfer Form */}
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h2 className="text-xl font-bold mb-4 text-white">Transfer Details</h2>
                  
                  <div className="space-y-4">
                    {/* Recipient */}
                    <div className="relative">
                      <Label htmlFor="recipient" className="text-sm font-medium text-slate-300">
                        Recipient
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="recipient"
                          placeholder="Enter username or email"
                          value={recipient}
                          onChange={(e) => {
                            setRecipient(e.target.value);
                            searchUsers(e.target.value);
                          }}
                          className="bg-slate-700 border-slate-600 text-white pr-10"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                      </div>
                      
                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg">
                          {searchResults.map((user, index) => (
                            <div
                              key={user.id}
                              className="flex items-center gap-3 p-3 hover:bg-slate-600 cursor-pointer border-b border-slate-600 last:border-b-0"
                              onClick={() => selectRecipient(user)}
                            >
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{user.avatar}</span>
                              </div>
                              <div>
                                <p className="font-medium text-white">{user.username}</p>
                                <p className="text-xs text-slate-400">{user.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {isSearching && (
                        <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                            <span className="text-sm text-slate-400">Searching...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Amount */}
                    <div>
                      <Label htmlFor="amount" className="text-sm font-medium text-slate-300">
                        Amount ({fromAsset})
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <Button
                          variant="outline"
                          onClick={handleMaxAmount}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          MAX
                        </Button>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Available: {getSelectedBalance().available} {fromAsset}
                      </p>
                    </div>

                    {/* Message */}
                    <div>
                      <Label htmlFor="message" className="text-sm font-medium text-slate-300">
                        Message (Optional)
                      </Label>
                      <Input
                        id="message"
                        placeholder="Add a message to your transfer"
                        value={""} // Message is not used in user transfer
                        onChange={(e) => {}}
                        className="bg-slate-700 border-slate-600 text-white mt-1"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleUserTransfer}
                      disabled={isExecuting || !amount || !recipient}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Transfer
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Transfer Stats</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                      <p className="text-sm text-slate-400">Total Sent (24h)</p>
                      <p className="text-xl font-bold text-green-400">$3,450.67</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                      <p className="text-sm text-slate-400">Total Received</p>
                      <p className="text-xl font-bold text-blue-400">$1,240.00</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
                      <p className="text-sm text-slate-400">Average Time</p>
                      <p className="text-xl font-bold text-yellow-400">Instant</p>
                    </div>
                  </div>
                </Card>

                {/* Recent Transfers */}
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Recent Transfers</h3>
                  <div className="space-y-3">
                    {recentTransfers.map((transfer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-slate-700 rounded hover:bg-slate-700/50 transition-colors">
                        <div>
                          <p className="font-medium text-white">{transfer.amount} {transfer.symbol}</p>
                          <p className="text-sm text-slate-400">to {transfer.recipient}</p>
                          <p className="text-xs text-slate-500">{transfer.time}</p>
                        </div>
                        <Badge className={
                          transfer.status === 'Completed' 
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-yellow-500/10 text-yellow-400'
                        }>
                          {transfer.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Account Transfer Tab */}
          <TabsContent value="account" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Transfer Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Account Selection */}
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h2 className="text-xl font-bold mb-4 text-white">Account Transfer</h2>
                  
                  <div className="space-y-6">
                    {/* From Account */}
                    <div>
                      <Label className="text-sm font-medium text-slate-300">From Account</Label>
                      <div className="flex gap-3 mt-2">
                        <Select value={fromAccount} onValueChange={(value) => setFromAccount(value as "trading" | "funding")}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="trading">Trading Account</SelectItem>
                            <SelectItem value="funding">Funding Account</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={fromAsset} onValueChange={setFromAsset}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {(fromAccount === "trading" ? getWalletBalances() : getFundingBalances()).map((asset) => (
                              <SelectItem key={asset.symbol} value={asset.symbol}>
                                {asset.symbol} - {asset.available}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Transfer Arrow */}
                    <div className="flex justify-center">
                      <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                        <ArrowUpDown className="w-6 h-6 text-slate-400" />
                      </div>
                    </div>

                    {/* To Account */}
                    <div>
                      <Label className="text-sm font-medium text-slate-300">To Account</Label>
                      <div className="flex gap-3 mt-2">
                        <Select value={toAccount} onValueChange={(value) => setToAccount(value as "trading" | "funding")}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="trading">Trading Account</SelectItem>
                            <SelectItem value="funding">Funding Account</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={toAsset} onValueChange={setToAsset}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {availableAssets.map((asset) => (
                              <SelectItem key={asset.symbol} value={asset.symbol}>
                                {asset.symbol} - {asset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <Label htmlFor="transferAmount" className="text-sm font-medium text-slate-300">
                        Amount ({fromAsset})
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="transferAmount"
                          type="number"
                          placeholder="0.00"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <Button
                          variant="outline"
                          onClick={handleMaxTransferAmount}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          MAX
                        </Button>
                      </div>
                    </div>

                    {/* Conversion Preview */}
                    {fromAsset !== toAsset && transferAmount && (
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <h3 className="text-sm font-medium text-slate-300 mb-2">Conversion Preview</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-white">{transferAmount} {fromAsset}</span>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                          <span className="text-green-400">{calculateConversion()} {toAsset}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Rate: 1 {fromAsset} = {getExchangeRate()} {toAsset}
                        </p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      onClick={handleAccountTransfer}
                      disabled={isExecuting || !transferAmount || fromAccount === toAccount}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowUpDown className="w-4 h-4 mr-2" />
                          Transfer Between Accounts
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Account Transfer Stats</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                      <p className="text-sm text-slate-400">Total Transfers (24h)</p>
                      <p className="text-xl font-bold text-green-400">$12,450.67</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                      <p className="text-sm text-slate-400">Success Rate</p>
                      <p className="text-xl font-bold text-blue-400">99.8%</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
                      <p className="text-sm text-slate-400">Average Time</p>
                      <p className="text-xl font-bold text-yellow-400">Instant</p>
                    </div>
                  </div>
                </Card>

                {/* Security */}
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    Security
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-slate-300">2FA Enabled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-slate-300">Instant Verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-slate-300">Secure Network</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Confirmation Modal */}
        {/* This section is no longer needed as transfers are handled directly */}
      </div>
    </div>
  );
};

export default TransferPage; 