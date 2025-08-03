import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, TrendingDown, Target, Shield, Clock, DollarSign, Percent, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenData: {
    token: string;
    name: string;
    apy: string;
    minStake: string;
  };
}

const StakeModal = ({ isOpen, onClose, tokenData }: StakeModalProps) => {
  const { toast } = useToast();
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakingPeriod, setStakingPeriod] = useState("30");
  const [autoReinvest, setAutoReinvest] = useState(false);
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [enableStopLoss, setEnableStopLoss] = useState(false);
  const [enableTakeProfit, setEnableTakeProfit] = useState(false);
  const [riskLevel, setRiskLevel] = useState([50]);
  const [stakingStrategy, setStakingStrategy] = useState("conservative");

  const handleStake = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid staking amount.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Staking Successful",
      description: `Successfully staked ${stakeAmount} ${tokenData.token} for ${stakingPeriod} days.`,
    });
    
    onClose();
  };

  const calculateEstimatedRewards = () => {
    if (!stakeAmount) return "0.00";
    const amount = parseFloat(stakeAmount);
    const apy = parseFloat(tokenData.apy.replace('%', ''));
    const days = parseInt(stakingPeriod);
    const rewards = (amount * apy / 100 / 365) * days;
    return rewards.toFixed(6);
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'conservative': return 'text-kucoin-green bg-kucoin-green/10';
      case 'moderate': return 'text-kucoin-yellow bg-kucoin-yellow/10';
      case 'aggressive': return 'text-kucoin-red bg-kucoin-red/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-kucoin-green/10 rounded-full flex items-center justify-center">
              <span className="font-bold text-kucoin-green">{tokenData.token}</span>
            </div>
            Stake {tokenData.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Staking Configuration */}
          <div className="space-y-6">
            <Card className="kucoin-card p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-kucoin-green" />
                Staking Configuration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="stakeAmount">Amount to Stake</Label>
                  <div className="relative mt-1">
                    <Input
                      id="stakeAmount"
                      type="number"
                      placeholder="0.00"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="pr-16"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                      {tokenData.token}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum: {tokenData.minStake}
                  </p>
                </div>

                <div>
                  <Label htmlFor="stakingPeriod">Staking Period</Label>
                  <Select value={stakingPeriod} onValueChange={setStakingPeriod}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="14">14 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="60">60 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                      <SelectItem value="180">180 Days</SelectItem>
                      <SelectItem value="365">365 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stakingStrategy">Staking Strategy</Label>
                  <Select value={stakingStrategy} onValueChange={setStakingStrategy}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge className={`mt-2 ${getStrategyColor(stakingStrategy)}`}>
                    {stakingStrategy.charAt(0).toUpperCase() + stakingStrategy.slice(1)} Strategy
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="kucoin-card p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-kucoin-blue" />
                Risk Management
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Risk Level</Label>
                  <div className="mt-2">
                    <Slider
                      value={riskLevel}
                      onValueChange={setRiskLevel}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Conservative</span>
                      <span>{riskLevel[0]}%</span>
                      <span>Aggressive</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-kucoin-red" />
                      <Label htmlFor="enableStopLoss">Stop Loss</Label>
                    </div>
                    <Switch
                      id="enableStopLoss"
                      checked={enableStopLoss}
                      onCheckedChange={setEnableStopLoss}
                    />
                  </div>
                  
                  {enableStopLoss && (
                    <div className="ml-6">
                      <Input
                        type="number"
                        placeholder="Stop loss percentage"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Automatically unstake if value drops by this percentage
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-kucoin-green" />
                      <Label htmlFor="enableTakeProfit">Take Profit</Label>
                    </div>
                    <Switch
                      id="enableTakeProfit"
                      checked={enableTakeProfit}
                      onCheckedChange={setEnableTakeProfit}
                    />
                  </div>
                  
                  {enableTakeProfit && (
                    <div className="ml-6">
                      <Input
                        type="number"
                        placeholder="Take profit percentage"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Automatically claim rewards when target is reached
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="kucoin-card p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-kucoin-yellow" />
                Advanced Options
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoReinvest">Auto-Reinvest Rewards</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically stake earned rewards
                    </p>
                  </div>
                  <Switch
                    id="autoReinvest"
                    checked={autoReinvest}
                    onCheckedChange={setAutoReinvest}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Summary and Confirmation */}
          <div className="space-y-6">
            <Card className="kucoin-card p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Percent className="w-5 h-5 text-kucoin-green" />
                Staking Summary
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-kucoin-green/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">APY</p>
                    <p className="text-lg font-bold text-kucoin-green">{tokenData.apy}</p>
                  </div>
                  <div className="text-center p-3 bg-kucoin-blue/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-lg font-bold text-kucoin-blue">{stakingPeriod} Days</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Staking Amount:</span>
                    <span className="font-medium">{stakeAmount || '0'} {tokenData.token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Rewards:</span>
                    <span className="font-medium text-kucoin-green">
                      +{calculateEstimatedRewards()} {tokenData.token}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total After Period:</span>
                    <span className="font-bold text-lg">
                      {stakeAmount ? (parseFloat(stakeAmount) + parseFloat(calculateEstimatedRewards())).toFixed(6) : '0.000000'} {tokenData.token}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Risk Level:</span>
                    <span className="font-medium">{riskLevel[0]}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Strategy:</span>
                    <Badge className={getStrategyColor(stakingStrategy)}>
                      {stakingStrategy.charAt(0).toUpperCase() + stakingStrategy.slice(1)}
                    </Badge>
                  </div>
                  {enableStopLoss && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Stop Loss:</span>
                      <span className="font-medium text-kucoin-red">-{stopLoss}%</span>
                    </div>
                  )}
                  {enableTakeProfit && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Take Profit:</span>
                      <span className="font-medium text-kucoin-green">+{takeProfit}%</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="kucoin-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-kucoin-yellow" />
                <h3 className="font-semibold text-kucoin-yellow">Important Notice</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Staked tokens will be locked for the selected period</p>
                <p>• Early unstaking may result in penalty fees</p>
                <p>• Rewards are calculated and distributed automatically</p>
                <p>• APY rates may vary based on network conditions</p>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleStake} className="kucoin-btn-primary flex-1">
                Confirm Stake
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StakeModal;