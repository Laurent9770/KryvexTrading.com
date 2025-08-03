import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Zap, Shield, Star, Users } from "lucide-react";
import { useCryptoPrice } from "@/hooks/useCryptoPrices";
import TradingViewChart from "./TradingViewChart";

const HeroSection = () => {
  const { price: btcPrice } = useCryptoPrice('BTC');

  return (
    <section className="section-professional pt-20 pb-24 relative overflow-hidden">
      {/* Professional Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-secondary/10"></div>
      <div className="absolute top-1/3 left-1/5 w-[500px] h-[500px] bg-gradient-to-br from-kucoin-green/5 to-kucoin-yellow/5 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/3 right-1/5 w-[400px] h-[400px] bg-gradient-to-br from-crypto-blue/5 to-accent/5 rounded-full blur-3xl animate-float-delayed"></div>
      
      {/* Geometric Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2318ffff' fill-opacity='0.1'%3E%3Cpath d='M30 30l15-15v30l-15-15zm-15 0l15 15v-30l-15 15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="container-professional relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Professional Trust Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-kucoin-green/10 text-gain border-kucoin-green/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                <Star className="w-4 h-4 mr-2 fill-current" />
                20M+ Active Traders
              </Badge>
              <Badge className="bg-crypto-blue/10 text-crypto-blue border-crypto-blue/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                <Shield className="w-4 h-4 mr-2" />
                SOC2 Certified
              </Badge>
              <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                <Zap className="w-4 h-4 mr-2" />
                0.1% Fees
              </Badge>
            </div>

            {/* Professional Main Heading */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-7xl heading-professional leading-[0.9] tracking-tight">
                <span className="block hero-title-3d bg-gradient-to-r from-kucoin-green via-kucoin-yellow to-kucoin-green bg-clip-text">
                  World's Leading
                </span>
                <span className="block text-foreground font-semibold mt-2">
                  Crypto Exchange
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl text-professional font-light">
                Trade 650+ cryptocurrencies with industry-leading security, lightning-fast execution, 
                and professional-grade tools trusted by millions of traders worldwide.
              </p>
              
              {/* Key Value Props */}
              <div className="flex flex-wrap gap-6 text-sm font-medium">
                <div className="flex items-center text-gain">
                  <div className="w-2 h-2 bg-gain rounded-full mr-2 animate-pulse"></div>
                  Lowest Fees in Industry
                </div>
                <div className="flex items-center text-crypto-blue">
                  <div className="w-2 h-2 bg-crypto-blue rounded-full mr-2 animate-pulse"></div>
                  Advanced Trading Tools
                </div>
                <div className="flex items-center text-accent">
                  <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse"></div>
                  24/7 Customer Support
                </div>
              </div>
            </div>

            {/* Professional CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="btn-professional-primary px-10 py-5 text-lg font-semibold group">
                <TrendingUp className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                Start Trading Now
                <div className="ml-2 text-xs opacity-80">No KYC Required</div>
              </Button>
              <Button size="lg" variant="outline" className="btn-professional-secondary px-10 py-5 text-lg font-semibold group border-2">
                <BarChart3 className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                View Live Demo
              </Button>
            </div>
            
            {/* Quick Stats Banner */}
            <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mt-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-kucoin-green">$2.1T+</div>
                  <div className="text-sm text-muted-foreground">Total Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-crypto-blue">650+</div>
                  <div className="text-sm text-muted-foreground">Cryptocurrencies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-accent">20M+</div>
                  <div className="text-sm text-muted-foreground">Global Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-crypto-gold">0.1%</div>
                  <div className="text-sm text-muted-foreground">Trading Fees</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Content - Professional Trading Interface */}
          <div className="relative lg:pl-8">
            {/* Main Trading Card */}
            <div className="card-professional p-8 relative overflow-hidden">
              {/* Card Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-card/80"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-kucoin-green/10 to-transparent rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                {/* Header with Live Price */}
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-2xl font-bold text-foreground heading-professional">BTC/USDT</h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gain rounded-full animate-pulse"></div>
                        <span className="text-xs text-muted-foreground font-medium">LIVE</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`text-4xl font-bold ${btcPrice?.isPositive ? 'text-gain' : 'text-loss'}`}>
                        {btcPrice?.price || '$67,423.50'}
                      </span>
                      <Badge className={`text-sm px-3 py-1 ${btcPrice?.isPositive ? 'bg-gain/10 text-gain border-gain/20' : 'bg-loss/10 text-loss border-loss/20'}`}>
                        {btcPrice?.change || '+2.45%'}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-gain/10 hover:bg-gain/20 text-gain border-gain/20">Buy</Button>
                    <Button size="sm" variant="outline" className="border-loss/20 text-loss hover:bg-loss/10">Sell</Button>
                  </div>
                </div>

                {/* Enhanced Chart */}
                <div className="rounded-xl overflow-hidden border border-border/50">
                  <TradingViewChart symbol="BINANCE:BTCUSDT" height={350} />
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-card/50 rounded-lg p-4 border border-border/30">
                    <div className="text-sm text-muted-foreground">24h High</div>
                    <div className="text-lg font-semibold text-gain">$68,234.12</div>
                  </div>
                  <div className="bg-card/50 rounded-lg p-4 border border-border/30">
                    <div className="text-sm text-muted-foreground">24h Low</div>
                    <div className="text-lg font-semibold text-loss">$65,890.45</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Professional Stats */}
            <div className="absolute -top-4 -left-4 hidden xl:block z-20">
              <div className="card-professional p-4 text-center min-w-[120px] shadow-glow">
                <div className="text-xs text-muted-foreground mb-1">24h Volume</div>
                <div className="text-xl font-bold text-accent">$2.8B</div>
                <div className="text-xs text-gain">+12.3%</div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 hidden xl:block z-20">
              <div className="card-professional p-4 text-center min-w-[120px] shadow-glow">
                <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
                <div className="text-xl font-bold text-crypto-blue">$1.3T</div>
                <div className="text-xs text-gain">+5.67%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;