import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Zap, 
  Target, 
  Layers, 
  Bot, 
  BarChart3,
  Wallet,
  Shield,
  Clock,
  Award
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const TradingTypes = () => {
  const navigate = useNavigate();

  const tradingTypes = [
    {
      title: "Spot Trading",
      description: "Trade cryptocurrencies directly with advanced order types and professional charting tools",
      features: ["Market & Limit Orders", "Stop-Loss & Take-Profit", "Technical Analysis", "DCA Automation"],
      icon: TrendingUp,
      color: "text-kucoin-green",
      bgColor: "bg-kucoin-green/10",
      route: "/trading",
      badge: "Popular",
      badgeColor: "bg-kucoin-green"
    },
    {
      title: "Futures Trading",
      description: "Leverage up to 125x with perpetual and delivery contracts for maximum profit potential",
      features: ["Up to 125x Leverage", "Perpetual Contracts", "Margin Management", "Risk Controls"],
      icon: Zap,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      route: "/futures",
      badge: "High Leverage",
      badgeColor: "bg-yellow-500"
    },
    {
      title: "Options Trading",
      description: "Advanced options strategies with Greeks analysis and sophisticated risk management",
      features: ["Call & Put Options", "Greeks Analysis", "Strategy Builder", "Volatility Trading"],
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      route: "/options",
      badge: "Advanced",
      badgeColor: "bg-purple-500"
    },
    {
      title: "Binary Options",
      description: "Fixed-risk trading with predetermined payouts and timeframes from 1 minute to 1 year",
      features: ["Fixed Payouts", "1min-1year Terms", "60-95% Returns", "Simple Predictions"],
      icon: Layers,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      route: "/binary",
      badge: "Fixed Risk",
      badgeColor: "bg-blue-500"
    },
    {
      title: "Trading Bots",
      description: "Automated trading with AI-powered strategies and 24/7 market monitoring",
      features: ["Grid Trading", "DCA Bots", "AI Strategies", "24/7 Automation"],
      icon: Bot,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      route: "/bots",
      badge: "Automated",
      badgeColor: "bg-cyan-500"
    },
    {
      title: "Quantitative Trading",
      description: "Professional-grade mathematical models and high-frequency trading capabilities",
      features: ["Statistical Models", "ML Algorithms", "HFT Execution", "Risk Analytics"],
      icon: BarChart3,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      route: "/quant",
      badge: "Professional",
      badgeColor: "bg-orange-500"
    }
  ];

  const additionalFeatures = [
    {
      icon: Wallet,
      title: "Multi-Asset Wallet",
      description: "Secure storage for 356+ cryptocurrencies with staking and DeFi integration"
    },
    {
      icon: Shield,
      title: "Advanced Security",
      description: "Bank-grade security with 2FA, multi-sig, and hardware wallet support"
    },
    {
      icon: Clock,
      title: "24/7 Trading",
      description: "Round-the-clock trading with global market access and instant execution"
    },
    {
      icon: Award,
      title: "Professional Tools",
      description: "Institutional-grade analytics, research, and risk management tools"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 gradient-text">
            Complete Trading Ecosystem
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            From spot trading to advanced derivatives, our platform offers every trading type 
            you need to maximize your cryptocurrency investment potential
          </p>
        </div>

        {/* Trading Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {tradingTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <Card 
                key={type.title} 
                className="kucoin-card-professional group hover:scale-105 transition-all duration-300 cursor-pointer border-0"
                onClick={() => navigate(type.route)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-lg ${type.bgColor}`}>
                      <Icon className={`w-6 h-6 ${type.color}`} />
                    </div>
                    <Badge className={`${type.badgeColor} text-white border-0`}>
                      {type.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-foreground group-hover:text-kucoin-green transition-colors">
                    {type.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {type.description}
                  </p>
                  
                  <div className="space-y-2">
                    {type.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-kucoin-green" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className="w-full kucoin-btn-primary group-hover:bg-kucoin-green/90 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(type.route);
                    }}
                  >
                    Start Trading
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {additionalFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="kucoin-card-glass text-center border-0">
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-full bg-kucoin-green/10 mb-4">
                    <Icon className="w-6 h-6 text-kucoin-green" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TradingTypes;