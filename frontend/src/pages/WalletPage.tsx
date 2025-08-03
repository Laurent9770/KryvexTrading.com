import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft,
  Plus,
  Minus,
  ArrowRight,
  ArrowUpDown,
  RefreshCw,
  Copy,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import tradingEngine, { TradeRequest } from "@/services/tradingEngine";

const WalletPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { 
    tradingAccount, 
    fundingAccount, 
    realTimePrices,
    updateTradingBalance, 
    updateFundingBalance, 
    addActivity 
  } = useAuth();
  
  const [showSmallBalances, setShowSmallBalances] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [portfolioValue, setPortfolioValue] = useState({
    totalValue: 0,
    totalPnl: 0,
    pnlPercentage: 0
  });

  // Calculate total values with real-time updates
  useEffect(() => {
    const calculatePortfolioValue = () => {
      const totalTradingValue = Object.entries(tradingAccount).reduce((sum, [symbol, asset]) => {
        const realTimePrice = realTimePrices[symbol]?.price || 0;
        const balance = parseFloat(asset.balance.replace(/,/g, ''));
        return sum + (balance * realTimePrice);
      }, 0);

      const totalFundingValue = parseFloat(fundingAccount.USDT.usdValue.replace('$', '').replace(',', ''));
      const totalValue = totalTradingValue + totalFundingValue;

      // Calculate P&L based on real-time prices
      const totalPnl = Object.entries(tradingAccount).reduce((sum, [symbol, asset]) => {
        const realTimePrice = realTimePrices[symbol]?.price || 0;
        const balance = parseFloat(asset.balance.replace(/,/g, ''));
        const basePrice = getAssetBasePrice(symbol);
        return sum + (balance * (realTimePrice - basePrice));
      }, 0);

      const pnlPercentage = totalValue > 0 ? (totalPnl / totalValue) * 100 : 0;

      setPortfolioValue({
        totalValue,
        totalPnl,
        pnlPercentage
      });
    };

    calculatePortfolioValue();
    const interval = setInterval(calculatePortfolioValue, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [tradingAccount, fundingAccount, realTimePrices]);

  const getAssetBasePrice = (asset: string): number => {
    const basePrices: { [key: string]: number } = {
      BTC: 45000,
      ETH: 3000,
      USDT: 1,
      SOL: 400,
      ADA: 0.8
    };
    return basePrices[asset] || 0;
  };

  const handleDeposit = () => {
    navigate('/deposit');
  };

  const handleWithdraw = () => {
    navigate('/withdraw');
  };

  const handleTransfer = () => {
    navigate('/transfer');
  };

  const handleConvert = () => {
    navigate('/convert');
  };

  const handleTrade = () => {
    navigate('/trading');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Wallet Updated",
        description: "All balances have been refreshed successfully",
      });
    }, 2000);
  };

  const handleHideSmallBalances = () => {
    setShowSmallBalances(!showSmallBalances);
  };

  const handleTransferToFunding = async (asset: string) => {
    const assetData = tradingAccount[asset];
    if (!assetData) {
      toast({
        title: "Asset Not Found",
        description: "Selected asset not found in trading account",
        variant: "destructive"
      });
      return;
    }

    const availableBalance = parseFloat(assetData.available.replace(/,/g, ''));
    if (availableBalance <= 0) {
      toast({
        title: "Insufficient Balance",
        description: `No ${asset} available for transfer`,
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    try {
      // Calculate USDT value of the asset
      const assetPrice = getAssetPrice(asset);
      const usdtValue = availableBalance * assetPrice;

      // Remove asset from trading account
      updateTradingBalance(asset, availableBalance, 'subtract');
      
      // Add USDT equivalent to funding account
      updateFundingBalance(usdtValue, 'add');

      const transferActivity = {
        type: "wallet" as const,
        action: "TRANSFERRED_TO_FUNDING",
        description: `Transferred ${availableBalance} ${asset} to Funding Account`,
        symbol: asset,
        amount: `${availableBalance} ${asset}`,
        price: `$${usdtValue.toFixed(2)}`,
        pnl: "0",
        status: "completed" as const,
        icon: "💸"
      };
      addActivity(transferActivity);

      toast({
        title: "Transfer Successful",
        description: `Transferred ${availableBalance} ${asset} to Funding Account`,
      });
    } catch (error) {
      console.error("Error transferring to funding:", error);
      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: "Failed to transfer due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTransferToTrading = async () => {
    const fundingBalance = parseFloat(fundingAccount.USDT.available.replace(/,/g, ''));
    if (fundingBalance <= 0) {
      toast({
        title: "Insufficient Balance",
        description: "No USDT available in Funding Account",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    try {
      // Remove USDT from funding account
      updateFundingBalance(fundingBalance, 'subtract');
      
      // Add USDT to trading account
      updateTradingBalance('USDT', fundingBalance, 'add');

      const transferActivity = {
        type: "wallet" as const,
        action: "TRANSFERRED_TO_TRADING",
        description: `Transferred ${fundingBalance} USDT to Trading Account`,
        symbol: "USDT",
        amount: `${fundingBalance} USDT`,
        price: `$${fundingBalance.toFixed(2)}`,
        pnl: "0",
        status: "completed" as const,
        icon: "💸"
      };
      addActivity(transferActivity);

      toast({
        title: "Transfer Successful",
        description: `Transferred $${fundingBalance.toFixed(2)} to Trading Account`,
      });
    } catch (error) {
      console.error("Error transferring to trading:", error);
      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: "Failed to transfer due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getAssetPrice = (asset: string): number => {
    return realTimePrices[asset]?.price || getAssetBasePrice(asset);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(label);
    toast({
      title: "Copied!",
      description: `${label} address copied to clipboard`,
    });
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Get real transaction data from trading engine
  const getTransactionHistory = () => {
    return []; // Empty array - only real transaction data will be shown
  };

  // Get real deposit data - empty for now, will be populated with real data
  const getDepositHistory = () => {
    return []; // Empty array - only real deposit data will be shown
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="kucoin-container py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('wallet')}</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {t('walletDescription')}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              variant="outline" 
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
          </div>
        </div>

        {/* Portfolio Overview */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-semibold">{t('portfolioOverview')}</h2>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalValue')}</p>
                  <p className="text-2xl sm:text-3xl font-bold">${portfolioValue.totalValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('totalPnl')}</p>
                  <p className={`text-xl sm:text-2xl font-bold ${portfolioValue.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolioValue.totalPnl >= 0 ? '+' : ''}${portfolioValue.totalPnl.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('pnlPercentage')}</p>
                  <p className={`text-xl sm:text-2xl font-bold ${portfolioValue.pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolioValue.pnlPercentage >= 0 ? '+' : ''}{portfolioValue.pnlPercentage.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={handleDeposit} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                {t('deposit')}
              </Button>
              <Button onClick={handleWithdraw} variant="outline" className="flex-1 sm:flex-none">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                {t('withdraw')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Account Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Portfolio Card */}
          <Card className="bg-slate-800/50 border-slate-700 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Total Portfolio</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">${portfolioValue.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className={`text-xs sm:text-sm ${portfolioValue.pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioValue.pnlPercentage >= 0 ? '+' : ''}{portfolioValue.pnlPercentage.toFixed(2)}% (24h)
                </p>
              </div>
            </div>
          </Card>

          {/* Funding Account Card */}
          <Card className="bg-slate-800/50 border-slate-700 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Funding Account</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">${parseFloat(fundingAccount.USDT.usdValue.replace('$', '').replace(',', '')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs sm:text-sm text-slate-400">USDT Only</p>
              </div>
            </div>
          </Card>

          {/* P&L Card */}
          <Card className="bg-slate-800/50 border-slate-700 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-400">P&L (24h)</p>
                <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${portfolioValue.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioValue.totalPnl >= 0 ? '+' : ''}${portfolioValue.totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={`text-xs sm:text-sm ${portfolioValue.pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioValue.pnlPercentage >= 0 ? '+' : ''}{portfolioValue.pnlPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Trading Account Summary */}
        <div className="mb-6 sm:mb-8">
          <Card className="bg-slate-800/50 border-slate-700 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">Trading Account</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-slate-400">Total Value:</span>
                <span className="text-sm sm:text-lg font-bold text-white">
                  ${Object.entries(tradingAccount).reduce((sum, [symbol, asset]) => {
                    const realTimePrice = realTimePrices[symbol]?.price || getAssetBasePrice(symbol);
                    const balance = parseFloat(asset.balance.replace(/,/g, ''));
                    return sum + (balance * realTimePrice);
                  }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {Object.entries(tradingAccount).map(([symbol, asset]) => {
                const balance = parseFloat(asset.balance);
                const realTimePrice = realTimePrices[symbol]?.price || getAssetBasePrice(symbol);
                const usdValue = balance * realTimePrice;
                const basePrice = getAssetBasePrice(symbol);
                const priceChange = realTimePrice - basePrice;
                const priceChangePercent = (priceChange / basePrice) * 100;
                
                return (
                  <div key={symbol} className="p-4 border border-slate-700 rounded-lg hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{symbol}</span>
                        </div>
                        <span className="font-medium text-white">{symbol}</span>
                      </div>
                      <span className={`text-xs ${priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-400">Balance</span>
                        <span className="text-sm text-white">{balance.toFixed(8)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-400">Available</span>
                        <span className="text-sm text-white">{asset.available}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-400">Value</span>
                        <span className="text-sm font-medium text-white">${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTransferToFunding(symbol)}
                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 text-xs bg-slate-800/30 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        To Funding
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate('/trading')}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs shadow-sm hover:shadow-md transition-all duration-200 border-0"
                      >
                        Trade
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8">
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-6 text-white">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button
                onClick={handleDeposit}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-14 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-0"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span className="font-medium">Deposit</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleWithdraw}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 h-14 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 bg-slate-800/30"
              >
                <ArrowUpRight className="w-5 h-5 mr-2" />
                <span className="font-medium">Withdraw</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleTransfer}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 h-14 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 bg-slate-800/30"
              >
                <ArrowUpDown className="w-5 h-5 mr-2" />
                <span className="font-medium">Transfer</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleConvert}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 h-14 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 bg-slate-800/30"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                <span className="font-medium">Convert</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleTrade}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 h-14 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 bg-slate-800/30"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                <span className="font-medium">Trade</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Funding Account Summary */}
        <div className="mb-8">
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Funding Account</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Total Value:</span>
                <span className="text-lg font-bold text-white">{fundingAccount.USDT.usdValue}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border border-slate-700 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-white">USDT</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Tether (USDT)</h3>
                    <p className="text-sm text-slate-400">Stablecoin</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Balance</span>
                    <span className="text-sm text-white">{fundingAccount.USDT.balance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Available</span>
                    <span className="text-sm text-white">{fundingAccount.USDT.available}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Value</span>
                    <span className="text-sm font-medium text-white">{fundingAccount.USDT.usdValue}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTransferToTrading}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 text-xs bg-slate-800/30 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    To Trading
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleWithdraw}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs shadow-sm hover:shadow-md transition-all duration-200 border-0"
                  >
                    Withdraw
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
            <TabsTrigger value="trading">{t('tradingAccount')}</TabsTrigger>
            <TabsTrigger value="funding">{t('fundingAccount')}</TabsTrigger>
            <TabsTrigger value="history">{t('history')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trading Account Assets */}
              <div className="lg:col-span-2">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">{t('tradingAccount')} Assets</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleHideSmallBalances}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      {showSmallBalances ? t('hideSmall') : t('showAll')}
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(tradingAccount).map(([symbol, asset]) => {
                      const balance = parseFloat(asset.balance);
                      const realTimePrice = realTimePrices[symbol]?.price || getAssetBasePrice(symbol);
                      const usdValue = balance * realTimePrice;
                      const basePrice = getAssetBasePrice(symbol);
                      const priceChange = realTimePrice - basePrice;
                      const priceChangePercent = (priceChange / basePrice) * 100;
                      
                      // Hide small balances if enabled
                      if (!showSmallBalances && usdValue < 10) return null;
                      
                      return (
                        <div key={symbol} className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-bold text-white">{symbol}</span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{symbol}</p>
                              <p className="text-sm text-slate-400">{balance.toFixed(8)} {symbol}</p>
                              <p className="text-xs text-slate-500">
                                ${realTimePrice.toLocaleString()} 
                                <span className={`ml-2 ${priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white">${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p className="text-sm text-slate-400">Available: {asset.available}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTransferToFunding(symbol)}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              To Funding
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => navigate('/trading')}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Trade
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Recent Deposits */}
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Recent Deposits</h3>
                  <div className="space-y-3">
                    {getDepositHistory().map((deposit) => (
                      <div key={deposit.id} className="flex items-center justify-between p-3 border border-slate-700 rounded hover:bg-slate-700/50 transition-colors">
                        <div>
                          <p className="font-medium text-white">{deposit.amount} {deposit.asset}</p>
                          <p className="text-sm text-slate-400">{deposit.time}</p>
                        </div>
                        <Badge className={
                          deposit.status === 'completed' 
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-yellow-500/10 text-yellow-400'
                        }>
                          {deposit.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Trading Account Tab */}
          <TabsContent value="trading" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h2 className="text-xl font-bold mb-6 text-white">Trading Account</h2>
                  <div className="space-y-4">
                    {Object.entries(tradingAccount).map(([symbol, asset]) => {
                      const balance = parseFloat(asset.balance);
                      const realTimePrice = realTimePrices[symbol]?.price || getAssetBasePrice(symbol);
                      const usdValue = balance * realTimePrice;
                      
                      return (
                        <div key={symbol} className="flex items-center justify-between p-4 border border-slate-700 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                              <span className="text-lg font-bold text-white">{symbol}</span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{symbol}</p>
                              <p className="text-sm text-slate-400">Balance: {asset.balance}</p>
                              <p className="text-sm text-slate-400">Available: {asset.available}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white">${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTransferToFunding(symbol)}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                To Funding
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => navigate('/trading')}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Trade
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Account Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Value</span>
                      <span className="text-white font-medium">${portfolioValue.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assets</span>
                      <span className="text-white font-medium">{Object.keys(tradingAccount).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">24h Change</span>
                      <span className={`font-medium ${portfolioValue.pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {portfolioValue.pnlPercentage >= 0 ? '+' : ''}{portfolioValue.pnlPercentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Funding Account Tab */}
          <TabsContent value="funding" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h2 className="text-xl font-bold mb-6 text-white">Funding Account (USDT Only)</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 border border-slate-700 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-bold text-white">USDT</span>
                        </div>
                        <div>
                          <p className="font-medium text-white">Tether (USDT)</p>
                          <p className="text-sm text-slate-400">Balance: {fundingAccount.USDT.balance}</p>
                          <p className="text-sm text-slate-400">Available: {fundingAccount.USDT.available}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-white">{fundingAccount.USDT.usdValue}</p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleTransferToTrading}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            To Trading
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleWithdraw}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Withdraw
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Funding Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Value</span>
                      <span className="text-white font-medium">{fundingAccount.USDT.usdValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Available</span>
                      <span className="text-white font-medium">{fundingAccount.USDT.available} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Locked</span>
                      <span className="text-slate-400 font-medium">0.00 USDT</span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button
                      onClick={handleDeposit}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Deposit USDT
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleTransferToTrading}
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Transfer to Trading
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h2 className="text-xl font-bold mb-6 text-white">Transaction History</h2>
              <div className="space-y-4">
                {getTransactionHistory().map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'spot' && transaction.action === 'sell' ? 'bg-green-500/20' :
                        transaction.type === 'spot' && transaction.action === 'buy' ? 'bg-red-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        {transaction.type === 'spot' && transaction.action === 'sell' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-400" />
                        ) : transaction.type === 'spot' && transaction.action === 'buy' ? (
                          <ArrowDownLeft className="w-5 h-5 text-red-400" />
                        ) : (
                          <ArrowUpDown className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white capitalize">{transaction.type} {transaction.action}</p>
                        <p className="text-sm text-slate-400">{transaction.amount} {transaction.asset}</p>
                        <p className="text-xs text-slate-500">{transaction.time}</p>
                      </div>
                    </div>
                    <Badge className={
                      transaction.status === 'completed' 
                        ? 'bg-green-500/10 text-green-400' 
                        : 'bg-yellow-500/10 text-yellow-400'
                    }>
                      {transaction.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WalletPage;