import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Star, Eye } from "lucide-react";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useAuth } from "@/contexts/AuthContext";

const MarketOverview = () => {
  const [activeTab, setActiveTab] = useState<'hot' | 'new' | 'gainers'>('hot');
  const { getPrice } = useCryptoPrices();
  const { realTimePrices } = useAuth();
  const [marketData, setMarketData] = useState({
    hotCoins: [],
    newCoins: [],
    gainers: []
  });

  // Update market data with real-time prices
  useEffect(() => {
    const updateMarketData = () => {
      const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'LINK'];
      
      const hotCoins = symbols.slice(0, 5).map(symbol => {
        const realTimeData = realTimePrices[symbol];
        const price = realTimeData ? `$${realTimeData.price.toLocaleString()}` : `$${(Math.random() * 1000 + 10).toFixed(2)}`;
        const change = realTimeData ? `${realTimeData.change >= 0 ? '+' : ''}${realTimeData.change.toFixed(2)}%` : `${(Math.random() * 10 - 5).toFixed(2)}%`;
        const isPositive = realTimeData ? realTimeData.change >= 0 : Math.random() > 0.5;
        
        return {
          symbol,
          name: getAssetName(symbol),
          price,
          change,
          isPositive
        };
      });

      const newCoins = [
        { symbol: 'UNITE', name: 'Unite', price: '$0.002001', change: '+100.2%', isPositive: true },
        { symbol: 'GAIA', name: 'Gaia', price: '$0.098160', change: '+96.36%', isPositive: true },
        { symbol: 'TREE', name: 'Treehouse', price: '$0.574585', change: '+474.7%', isPositive: true },
        { symbol: 'IKA', name: 'Ika', price: '$0.029194', change: '+11.07%', isPositive: true },
        { symbol: 'URANUS', name: 'Uranus', price: '$0.523495', change: '+8.29%', isPositive: true },
      ];

      const gainers = Object.entries(realTimePrices)
        .filter(([symbol, data]) => data.change > 0)
        .sort(([, a], [, b]) => b.change - a.change)
        .slice(0, 5)
        .map(([symbol, data]) => ({
          symbol,
          name: getAssetName(symbol),
          price: `$${data.price.toLocaleString()}`,
          change: `+${data.change.toFixed(2)}%`,
          isPositive: true
        }));

      setMarketData({ hotCoins, newCoins, gainers });
    };

    updateMarketData();
    const interval = setInterval(updateMarketData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [realTimePrices]);

  const getAssetName = (symbol: string): string => {
    const names: { [key: string]: string } = {
      BTC: "Bitcoin",
      ETH: "Ethereum",
      BNB: "BNB",
      SOL: "Solana",
      ADA: "Cardano",
      XRP: "XRP",
      DOT: "Polkadot",
      LINK: "Chainlink"
    };
    return names[symbol] || symbol;
  };

  const getCurrentList = () => {
    switch (activeTab) {
      case 'hot': return marketData.hotCoins;
      case 'new': return marketData.newCoins;
      case 'gainers': return marketData.gainers;
      default: return marketData.hotCoins;
    }
  };

  const tabs = [
    { key: 'hot', label: 'Hot List', icon: Star },
    { key: 'new', label: 'New Coins', icon: Eye },
    { key: 'gainers', label: 'Top Gainers', icon: TrendingUp },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 gradient-text">
            Crypto Market Today
          </h2>
          <p className="text-muted-foreground text-lg">
            Discover trending cryptocurrencies and market opportunities
          </p>
        </div>

        <Card className="kucoin-card-professional border-0">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex space-x-2">
                {tabs.map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={activeTab === key ? "default" : "ghost"}
                    onClick={() => setActiveTab(key as any)}
                    className={`kucoin-btn-tab ${activeTab === key ? 'kucoin-btn-primary' : 'kucoin-btn-secondary'}`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
              <Button variant="ghost" className="kucoin-btn-secondary text-sm">
                View all 900+ coins →
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {getCurrentList().map((coin, index) => (
                <Card key={coin.symbol} className="kucoin-card-glass hover:scale-105 transition-all duration-300 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-kucoin-green/20 to-kucoin-blue/20 flex items-center justify-center">
                        <span className="text-sm font-semibold text-kucoin-green">
                          {coin.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{coin.symbol}</div>
                        <div className="text-xs text-muted-foreground">{coin.name}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-lg font-bold text-foreground">{coin.price}</div>
                      <div className="flex items-center space-x-1">
                        {coin.isPositive ? (
                          <TrendingUp className="w-3 h-3 text-kucoin-green" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-kucoin-red" />
                        )}
                        <span className={`text-sm font-medium ${
                          coin.isPositive ? 'text-kucoin-green' : 'text-kucoin-red'
                        }`}>
                          {coin.change}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default MarketOverview;