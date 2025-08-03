import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, TrendingUp, Clock, Percent, DollarSign, Lock, Unlock, Award, Activity, Calculator, ArrowUpRight, ArrowDownRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import tradingEngine, { TradeRequest } from "@/services/tradingEngine";

const StakingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { addActivity, addTrade, updateTradingBalance, tradingAccount } = useAuth();
  
  // State Management
  const [activeTab, setActiveTab] = useState("pools");
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [isUnstakeModalOpen, setIsUnstakeModalOpen] = useState(false);
  const [selectedStake, setSelectedStake] = useState(null);
  
  // Calculator State
  const [calculatorAmount, setCalculatorAmount] = useState("");
  const [calculatorDuration, setCalculatorDuration] = useState("30");
  const [calculatorToken, setCalculatorToken] = useState("ETH");
  const [estimatedRewards, setEstimatedRewards] = useState(0);
  
  // Stake Modal State
  const [stakeAmount, setStakeAmount] = useState("");

  // Staking Pools Data
  const stakingPools = [
    {
      id: 'eth-pool',
      token: "ETH",
      name: "Ethereum 2.0 Staking",
      apy: 4.5,
      minStake: 0.1,
      totalStaked: 2500000000,
      rewardType: "ETH",
      duration: "Flexible",
      status: "Active",
      description: "Stake ETH and earn rewards while supporting the Ethereum network",
      icon: "🔵",
      color: "from-blue-500/20 to-indigo-500/20"
    },
    {
      id: 'sol-pool',
      token: "SOL",
      name: "Solana Staking",
      apy: 7.2,
      minStake: 1,
      totalStaked: 890000000,
      rewardType: "SOL",
      duration: "Epoch (~2 days)",
      status: "Active",
      description: "High-performance staking with fast reward distribution",
      icon: "🟣",
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      id: 'ada-pool',
      token: "ADA",
      name: "Cardano Staking",
      apy: 5.1,
      minStake: 10,
      totalStaked: 12300000000,
      rewardType: "ADA",
      duration: "Epoch (~5 days)",
      status: "Active",
      description: "Sustainable staking with proof-of-stake consensus",
      icon: "🟢",
      color: "from-green-500/20 to-emerald-500/20"
    },
    {
      id: 'dot-pool',
      token: "DOT",
      name: "Polkadot Staking",
      apy: 12.8,
      minStake: 1,
      totalStaked: 5800000000,
      rewardType: "DOT",
      duration: "28 days",
      status: "Limited",
      description: "Cross-chain staking with high APY returns",
      icon: "🟡",
      color: "from-yellow-500/20 to-orange-500/20"
    },
    {
      id: 'avax-pool',
      token: "AVAX",
      name: "Avalanche Staking",
      apy: 9.3,
      minStake: 25,
      totalStaked: 3200000000,
      rewardType: "AVAX",
      duration: "Flexible",
      status: "Active",
      description: "Fast and secure staking on the Avalanche network",
      icon: "🔴",
      color: "from-red-500/20 to-pink-500/20"
    },
    {
      id: 'matic-pool',
      token: "MATIC",
      name: "Polygon Staking",
      apy: 6.7,
      minStake: 100,
      totalStaked: 1800000000,
      rewardType: "MATIC",
      duration: "7 days",
      status: "Active",
      description: "Layer 2 scaling solution staking with competitive returns",
      icon: "🟣",
      color: "from-purple-500/20 to-violet-500/20"
    }
  ];

  // My Stakes Data
  const [myStakes, setMyStakes] = useState([
    // Mock data removed - will be loaded from real API
  ]);

  // Staking Overview Stats
  const stakingStats = {
    totalStaked: 0,
    totalRewards: 0,
    avgApy: 0,
    activeStakes: 0,
    totalValue: 0
  };

  // Handlers
  const handleStakeClick = (pool) => {
    console.log('Stake button clicked for pool:', pool);
    setSelectedPool(pool);
    setIsStakeModalOpen(true);
    setStakeAmount(""); // Reset stake amount when opening modal
  };

  const handleUnstakeClick = (stake) => {
    console.log('Unstake button clicked for stake:', stake);
    setSelectedStake(stake);
    setIsUnstakeModalOpen(true);
  };

  const handleClaim = async (stake) => {
    console.log('Claim button clicked for stake:', stake);
    setIsExecuting(true);
    try {
              // For claiming rewards, we don't need to use trading engine
        // Just add the reward value to trading account
        const rewardValue = stake.rewards * getTokenPrice(stake.token);
        updateTradingBalance('USDT', rewardValue, 'add');

        // Log activity
        const tradeActivity = {
          type: "trade",
          action: "REWARDS CLAIMED",
          symbol: `${stake.token} Staking`,
          amount: `${stake.rewards} ${stake.token}`,
          price: `Claimed`,
          pnl: `+$${rewardValue.toFixed(2)}`,
          status: "completed",
          time: "Just now",
          icon: "💰"
        };
        addActivity(tradeActivity);
        addTrade({
          pair: `${stake.token} Staking`,
          type: 'claim',
          amount: stake.rewards.toString(),
          price: "Claimed",
          pnl: `+$${rewardValue.toFixed(2)}`,
          status: "completed"
        });

        // Update stake rewards to 0
        setMyStakes(prev => prev.map(s => 
          s.id === stake.id ? { ...s, rewards: 0, canClaim: false } : s
        ));

        toast({
          title: "Rewards Claimed Successfully!",
          description: `Claimed ${stake.rewards} ${stake.token} worth $${rewardValue.toFixed(2)}`,
        });

        
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast({
        variant: "destructive",
        title: "Claim Failed",
        description: "Failed to claim rewards due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleUnstake = async (stake) => {
    setIsExecuting(true);
    try {
      const tradeRequest: TradeRequest = {
        type: 'staking',
        action: 'unstake',
        symbol: stake.token,
        amount: stake.value, // Use USD value for trading account
        price: 0,
      };

      const result = await tradingEngine.executeTrade(tradeRequest);

      if (result.success) {
        // Update trading balance with unstaked amount
        updateTradingBalance('USDT', stake.value, 'add');

        // Log activity
        const tradeActivity = {
          type: "trade",
          action: "UNSTAKE INITIATED",
          symbol: `${stake.token} Staking`,
          amount: `${stake.amount} ${stake.token}`,
          price: `Unstaking`,
          pnl: `+$${stake.value.toFixed(2)}`,
          status: "pending",
          time: "Just now",
          icon: "📤"
        };
        addActivity(tradeActivity);
        addTrade({
          pair: `${stake.token} Staking`,
          type: 'unstake',
          amount: stake.amount.toString(),
          price: "Unstaking",
          pnl: `+$${stake.value.toFixed(2)}`,
          status: "pending"
        });

        // Update stake status
        setMyStakes(prev => prev.map(s => 
          s.id === stake.id ? { ...s, status: "Pending Unstake", canUnstake: false } : s
        ));

        toast({
          title: "Unstaking Initiated Successfully",
          description: "Your unstaking request has been submitted. It will be processed within 24 hours.",
        });

        setIsUnstakeModalOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Unstake Failed",
          description: result.message || "Unknown error occurred."
        });
      }
    } catch (error) {
      console.error("Error unstaking:", error);
      toast({
        variant: "destructive",
        title: "Unstake Failed",
        description: "Failed to initiate unstaking due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStake = async (amount, pool) => {
    setIsExecuting(true);
    try {
      // Validate minimum stake
      if (amount < pool.minStake) {
        toast({
          variant: "destructive",
          title: "Invalid Stake Amount",
          description: `Minimum stake for ${pool.token} is ${pool.minStake} ${pool.token}`,
        });
        return;
      }

      // Calculate stake value in USD
      const stakeValue = amount * getTokenPrice(pool.token);
      
      // Check if user has sufficient balance
      const tradingBalance = parseFloat(tradingAccount.USDT?.available.replace(/,/g, '') || '0');
      if (stakeValue > tradingBalance) {
        toast({
          variant: "destructive",
          title: "Insufficient Balance",
          description: "Insufficient Trading Account Balance. Please transfer from Funding Account.",
        });
        return;
      }

      // Deduct from trading account
      updateTradingBalance('USDT', stakeValue, 'subtract');

      // Create new stake
      const newStake = {
        id: `stake-${Date.now()}`,
        poolId: pool.id,
        token: pool.token,
        amount: amount,
        value: stakeValue,
        rewards: 0,
        apy: pool.apy,
        status: "Active",
        startDate: new Date().toISOString().split('T')[0],
        lockPeriod: pool.duration,
        canClaim: false,
        canUnstake: true
      };

      setMyStakes(prev => [newStake, ...prev]);

      // Log activity
      const tradeActivity = {
        type: "trade",
        action: "STAKE INITIATED",
        symbol: `${pool.token} Staking`,
        amount: `${amount} ${pool.token}`,
        price: `Staked`,
        pnl: `-$${stakeValue.toFixed(2)}`,
        status: "completed",
        time: "Just now",
        icon: "🔒"
      };
      addActivity(tradeActivity);
      addTrade({
        pair: `${pool.token} Staking`,
        type: 'stake',
        amount: amount.toString(),
        price: "Staked",
        pnl: `-$${stakeValue.toFixed(2)}`,
        status: "completed"
      });

      toast({
        title: "Stake Initiated Successfully!",
        description: `Staked ${amount} ${pool.token} worth $${stakeValue.toFixed(2)}`,
      });

      setIsStakeModalOpen(false);
      setSelectedPool(null);
    } catch (error) {
      console.error("Error staking:", error);
      toast({
        variant: "destructive",
        title: "Stake Failed",
        description: "Failed to initiate stake due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Helper functions
  const getTokenPrice = (token) => {
    const prices = {
      'ETH': 3890.25,
      'SOL': 185.75,
      'ADA': 0.45,
      'DOT': 125.00,
      'AVAX': 128.00,
      'MATIC': 0.85
    };
    return prices[token] || 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-500/10 text-green-500';
      case 'Limited': return 'bg-yellow-500/10 text-yellow-500';
      case 'Full': return 'bg-red-500/10 text-red-500';
      case 'Pending Unstake': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatTokenAmount = (amount, token) => {
    return `${amount.toLocaleString()} ${token}`;
  };

  // Calculate estimated rewards
  useEffect(() => {
    if (calculatorAmount && calculatorDuration && calculatorToken) {
      const pool = stakingPools.find(p => p.token === calculatorToken);
      if (pool) {
        const amount = parseFloat(calculatorAmount);
        const duration = parseInt(calculatorDuration);
        const apy = pool.apy;
        const estimatedReward = (amount * apy * duration) / (365 * 100);
        setEstimatedRewards(estimatedReward);
      }
    }
  }, [calculatorAmount, calculatorDuration, calculatorToken]);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="kucoin-container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Staking</h1>
          <p className="text-muted-foreground">
            Earn rewards by staking your crypto assets. Flexible and locked staking options available.
          </p>
        </div>

        {/* Staking Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Staked</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(stakingStats.totalStaked)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Rewards</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(stakingStats.totalRewards)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Percent className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg APY</p>
                  <p className="text-xl font-bold text-foreground">{stakingStats.avgApy}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Coins className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Stakes</p>
                  <p className="text-xl font-bold text-foreground">{stakingStats.activeStakes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pools">Staking Pools</TabsTrigger>
            <TabsTrigger value="my-stakes">My Stakes</TabsTrigger>
            <TabsTrigger value="calculator">Reward Calculator</TabsTrigger>
          </TabsList>

          {/* Staking Pools Tab */}
          <TabsContent value="pools" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {stakingPools.map((pool) => (
                <Card key={pool.id} className="border-0 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">{pool.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{pool.name}</h3>
                          <p className="text-sm text-muted-foreground">{pool.description}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(pool.status)}>
                        {pool.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">APY</p>
                        <p className="font-semibold text-green-500">{pool.apy}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Min Stake</p>
                        <p className="font-semibold">{pool.minStake} {pool.token}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-semibold">{pool.duration}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Staked</p>
                        <p className="font-semibold">{formatCurrency(pool.totalStaked)}</p>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        console.log('Stake button clicked for:', pool.token);
                        handleStakeClick(pool);
                      }}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Stake {pool.token}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* My Stakes Tab */}
          <TabsContent value="my-stakes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myStakes.map((stake) => (
                <Card key={stake.id} className="border-0">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-lg">{stakingPools.find(p => p.id === stake.poolId)?.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{stake.token} Staking</h3>
                          <p className="text-sm text-muted-foreground">Started {stake.startDate}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(stake.status)}>
                        {stake.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Staked Amount</p>
                        <p className="font-semibold">{formatTokenAmount(stake.amount, stake.token)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Current Value</p>
                        <p className="font-semibold">{formatCurrency(stake.value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">APY</p>
                        <p className="font-semibold text-green-500">{stake.apy}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rewards</p>
                        <p className="font-semibold text-green-500">{formatTokenAmount(stake.rewards, stake.token)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {stake.canClaim && (
                        <Button 
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleClaim(stake)}
                          disabled={isExecuting}
                        >
                          {isExecuting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Award className="w-4 h-4 mr-2" />
                          )}
                          Claim Rewards
                        </Button>
                      )}
                      {stake.canUnstake && (
                        <Button 
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleUnstakeClick(stake)}
                          disabled={isExecuting}
                        >
                          <Unlock className="w-4 h-4 mr-2" />
                          Unstake
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reward Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Staking Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Token</Label>
                    <Select value={calculatorToken} onValueChange={setCalculatorToken}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stakingPools.map(pool => (
                          <SelectItem key={pool.token} value={pool.token}>
                            {pool.token} - {pool.apy}% APY
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount to Stake</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={calculatorAmount}
                      onChange={(e) => setCalculatorAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Duration (Days)</Label>
                    <Select value={calculatorDuration} onValueChange={setCalculatorDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="60">60 Days</SelectItem>
                        <SelectItem value="90">90 Days</SelectItem>
                        <SelectItem value="180">180 Days</SelectItem>
                        <SelectItem value="365">365 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0">
                <CardHeader>
                  <CardTitle>Estimated Rewards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {calculatorAmount && calculatorDuration && calculatorToken ? (
                    <>
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Estimated Rewards</p>
                          <p className="text-2xl font-bold text-green-500">
                            {estimatedRewards.toFixed(4)} {calculatorToken}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Based on {calculatorDuration} days at {stakingPools.find(p => p.token === calculatorToken)?.apy}% APY
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Stake Amount:</span>
                          <span className="font-medium">{calculatorAmount} {calculatorToken}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Duration:</span>
                          <span className="font-medium">{calculatorDuration} days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>APY:</span>
                          <span className="font-medium text-green-500">
                            {stakingPools.find(p => p.token === calculatorToken)?.apy}%
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Enter stake details to calculate rewards</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Stake Modal */}
      {isStakeModalOpen && selectedPool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{selectedPool.icon}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedPool.name}</h2>
                  <p className="text-sm text-muted-foreground">Configure your stake</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsStakeModalOpen(false)}
              >
                <span className="sr-only">Close</span>
                ×
              </Button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">APY:</span>
                    <p className="font-medium text-green-500">{selectedPool.apy}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min Stake:</span>
                    <p className="font-medium">{selectedPool.minStake} {selectedPool.token}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-medium">{selectedPool.duration}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reward Type:</span>
                    <p className="font-medium">{selectedPool.rewardType}</p>
                  </div>
                </div>
              </div>

                             <div className="space-y-2">
                 <Label>Stake Amount ({selectedPool.token})</Label>
                 <Input
                   type="number"
                   placeholder={`${selectedPool.minStake} ${selectedPool.token}`}
                   min={selectedPool.minStake}
                   value={stakeAmount}
                   onChange={(e) => setStakeAmount(e.target.value)}
                 />
                <p className="text-xs text-muted-foreground">
                  Available: {formatCurrency(parseFloat(tradingAccount.USDT?.available.replace(/,/g, '') || '0'))}
                </p>
              </div>

              <div className="flex gap-3">
                               <Button
                 variant="outline"
                 className="flex-1"
                 onClick={() => {
                   setIsStakeModalOpen(false);
                   setStakeAmount("");
                 }}
                 disabled={isExecuting}
               >
                  Cancel
                </Button>
                                 <Button
                   className="flex-1 bg-blue-600 hover:bg-blue-700"
                   onClick={() => handleStake(parseFloat(stakeAmount) || 0, selectedPool)}
                   disabled={isExecuting}
                 >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Staking...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Stake {selectedPool.token}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unstake Modal */}
      {isUnstakeModalOpen && selectedStake && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center">
                  <Unlock className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Unstake {selectedStake.token}</h2>
                  <p className="text-sm text-muted-foreground">Confirm unstaking</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUnstakeModalOpen(false)}
              >
                <span className="sr-only">Close</span>
                ×
              </Button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-orange-500">Early Unstake Warning</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Unstaking before the lock period may result in reduced rewards or fees.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Staked Amount:</span>
                  <span className="font-medium">{formatTokenAmount(selectedStake.amount, selectedStake.token)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Value:</span>
                  <span className="font-medium">{formatCurrency(selectedStake.value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Accumulated Rewards:</span>
                  <span className="font-medium text-green-500">{formatTokenAmount(selectedStake.rewards, selectedStake.token)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsUnstakeModalOpen(false)}
                  disabled={isExecuting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleUnstake(selectedStake)}
                  disabled={isExecuting}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Unstaking...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Confirm Unstake
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StakingPage;