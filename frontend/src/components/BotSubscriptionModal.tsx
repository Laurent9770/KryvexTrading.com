import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Bot, Target, Shield, AlertTriangle, Star, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BotSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  botData: {
    id: number;
    name: string;
    description: string;
    creator: string;
    rating: number;
    performance: string;
    price: number;
    category: string;
    riskLevel: string;
    winRate: string;
  };
}

const BotSubscriptionModal = ({ isOpen, onClose, botData }: BotSubscriptionModalProps) => {
  const { toast } = useToast();
  const [stakeAmount, setStakeAmount] = useState("");
  const [tradingPair, setTradingPair] = useState("BTC/USDT");
  const [riskLevel, setRiskLevel] = useState([50]);
  const [autoRestart, setAutoRestart] = useState(true);
  const [maxDrawdown, setMaxDrawdown] = useState("10");
  const [dailyLoss, setDailyLoss] = useState("5");

  const handleSubscribe = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid stake amount.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Bot Activated",
      description: `Successfully subscribed to ${botData.name} with $${stakeAmount} stake.`,
    });
    
    onClose();
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-kucoin-green bg-kucoin-green/10';
      case 'Medium': return 'text-kucoin-yellow bg-kucoin-yellow/10';
      case 'High': return 'text-kucoin-red bg-kucoin-red/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Bot className="w-8 h-8 text-kucoin-blue" />
            Start {botData.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Bot Configuration */}
          <div className="space-y-6">
            <Card className="kucoin-card p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-kucoin-green" />
                Trading Configuration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="stakeAmount">Stake Amount (USD)</Label>
                  <div className="relative mt-1">
                    <Input
                      id="stakeAmount"
                      type="number"
                      placeholder="1000.00"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="pr-12"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                      USD
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum: $100 • Recommended: $1,000+
                  </p>
                </div>

                <div>
                  <Label htmlFor="tradingPair">Trading Pair</Label>
                  <Select value={tradingPair} onValueChange={setTradingPair}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                      <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                      <SelectItem value="BNB/USDT">BNB/USDT</SelectItem>
                      <SelectItem value="ADA/USDT">ADA/USDT</SelectItem>
                      <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                      <SelectItem value="DOT/USDT">DOT/USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
              </div>
            </Card>

            <Card className="kucoin-card p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-kucoin-blue" />
                Risk Management
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="maxDrawdown">Max Drawdown (%)</Label>
                  <Input
                    id="maxDrawdown"
                    type="number"
                    placeholder="10"
                    value={maxDrawdown}
                    onChange={(e) => setMaxDrawdown(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Bot will pause if losses exceed this percentage
                  </p>
                </div>

                <div>
                  <Label htmlFor="dailyLoss">Daily Loss Limit (%)</Label>
                  <Input
                    id="dailyLoss"
                    type="number"
                    placeholder="5"
                    value={dailyLoss}
                    onChange={(e) => setDailyLoss(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum daily loss before bot stops
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoRestart">Auto-Restart</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically restart after stop conditions
                    </p>
                  </div>
                  <Switch
                    id="autoRestart"
                    checked={autoRestart}
                    onCheckedChange={setAutoRestart}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Bot Details and Summary */}
          <div className="space-y-6">
            <Card className="kucoin-card p-4">
              <h3 className="text-lg font-semibold mb-4">Bot Overview</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-kucoin-blue/10 rounded-xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-kucoin-blue" />
                  </div>
                  <div>
                    <h4 className="font-bold">{botData.name}</h4>
                    <p className="text-sm text-muted-foreground">by {botData.creator}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{botData.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-kucoin-green/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Performance</p>
                    <p className="text-lg font-bold text-kucoin-green">{botData.performance}</p>
                  </div>
                  <div className="text-center p-3 bg-kucoin-blue/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-lg font-bold text-kucoin-blue">{botData.winRate}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{botData.rating}/5.0</span>
                  </div>
                  <Badge className={getRiskColor(botData.riskLevel)}>
                    {botData.riskLevel} Risk
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="kucoin-card p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-kucoin-green" />
                Bot Configuration Summary
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Stake Amount:</span>
                    <span className="font-medium">${stakeAmount || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Trading Pair:</span>
                    <span className="font-medium">{tradingPair}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Risk Level:</span>
                    <span className="font-medium">{riskLevel[0]}%</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Max Drawdown:</span>
                    <span className="font-medium text-kucoin-red">{maxDrawdown}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Daily Loss Limit:</span>
                    <span className="font-medium text-kucoin-red">{dailyLoss}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Auto-Restart:</span>
                    <span className="font-medium">{autoRestart ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total Investment:</span>
                  <span>${stakeAmount ? parseFloat(stakeAmount).toLocaleString() : '0'}</span>
                </div>
              </div>
            </Card>

            <Card className="kucoin-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-kucoin-yellow" />
                <h3 className="font-semibold text-kucoin-yellow">Risk Disclaimer</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Trading bots carry significant risk of loss</p>
                <p>• Past performance does not guarantee future results</p>
                <p>• You may lose your entire investment</p>
                <p>• Monitor bot performance regularly</p>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubscribe} className="kucoin-btn-primary flex-1">
                Start Bot
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BotSubscriptionModal;