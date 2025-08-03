import { TrendingUp, Users, DollarSign, Coins, Activity, Globe } from "lucide-react";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import TradingViewTicker from "./TradingViewTicker";

const StatsSection = () => {
  const { prices } = useCryptoPrices();

  const getCryptoData = () => {
    const cryptoMap = {
      'BTC': 'BTC/USDT',
      'ETH': 'ETH/USDT', 
      'BNB': 'BNB/USDT',
      'ADA': 'ADA/USDT',
      'SOL': 'SOL/USDT',
      'AVAX': 'AVAX/USDT',
      'MATIC': 'MATIC/USDT',
      'LINK': 'LINK/USDT'
    };

    return Object.entries(cryptoMap).map(([symbol, pair]) => {
      const crypto = prices.find(p => p.symbol === symbol);
      return {
        symbol: pair,
        price: crypto?.price?.replace('$', '') || '--',
        change: crypto?.change || '--',
        isPositive: crypto?.isPositive ?? true
      };
    }).slice(0, 8);
  };

  const marketData = getCryptoData();
  const stats = [
    {
      icon: DollarSign,
      label: "Total Market Cap",
      value: "$3.8T",
      description: "Global crypto market size",
      color: "gain"
    },
    {
      icon: Activity,
      label: "24h Volume",
      value: "$185B",
      description: "Trading volume today",
      color: "crypto-blue"
    },
    {
      icon: Users,
      label: "Active Users",
      value: "2.1M",
      description: "Daily active traders",
      color: "accent"
    },
    {
      icon: Coins,
      label: "Cryptocurrencies",
      value: "650+",
      description: "Available for trading",
      color: "crypto-purple"
    }
  ];


  return (
    <section className="section-professional relative">
      {/* TradingView Ticker */}
      <div className="bg-background border-y border-border/50">
        <TradingViewTicker />
      </div>
      
      <div className="container-professional py-20">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl heading-professional mb-6">
            Trusted by <span className="text-gradient-crypto">Millions</span> Worldwide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-professional">
            Join the world's most trusted crypto trading platform with industry-leading 
            security, performance, and professional-grade tools for 2025.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="stats-professional group cursor-pointer">
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}/10 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 text-${stat.color}`} />
                </div>
                <div className="space-y-2">
                  <div className={`text-3xl font-bold text-${stat.color} heading-professional`}>
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-foreground text-professional">
                    {stat.label}
                  </div>
                  <div className="text-xs text-muted-foreground text-professional">
                    {stat.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Professional Market Ticker */}
        <div className="card-professional p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold heading-professional">Live Markets - 2025 Prices</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gain rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground font-medium">Real-time</span>
            </div>
          </div>
          
          {/* Market Data Table */}
          <div className="overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {marketData.map((coin, index) => (
                <div key={index} className="text-center space-y-2 p-3 rounded-lg hover:bg-muted/5 transition-colors">
                  <div className="font-medium text-foreground text-sm text-professional">{coin.symbol}</div>
                  <div className="font-semibold text-foreground">${coin.price}</div>
                  <div className={`text-sm font-medium ${coin.isPositive ? 'text-gain' : 'text-loss'}`}>
                    {coin.change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;