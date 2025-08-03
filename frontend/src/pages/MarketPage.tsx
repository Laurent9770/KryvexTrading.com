import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import CryptoNews from "@/components/CryptoNews";
import { TrendingUp, BarChart3, PieChart, Target, DollarSign, Percent, Search, Filter, Globe, Newspaper, Activity, TrendingUp as Up, TrendingDown as Down, Minus, RefreshCw, AlertTriangle } from "lucide-react";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { getAllAssets, getAssetsByCategory } from "@/data/tradingAssets";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { newsService } from "@/services/newsService";
import { useNavigate } from "react-router-dom";

const MarketPage = () => {
  const { prices } = useCryptoPrices();
  const { realTimePrices } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [marketStats, setMarketStats] = useState({
    marketCap: '$3.8T',
    volume24h: '$185B',
    btcDominance: '52.4%',
    activePairs: '650+'
  });
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [sentimentSummary, setSentimentSummary] = useState({
    positive: 0,
    negative: 0,
    neutral: 0
  });
  
  // Update market stats with real-time data
  useEffect(() => {
    const updateMarketStats = () => {
      const totalMarketCap = Object.values(realTimePrices).reduce((sum, asset) => {
        return sum + (asset.price * asset.volume * 0.1); // Simplified market cap calculation
      }, 0);

      const totalVolume = Object.values(realTimePrices).reduce((sum, asset) => {
        return sum + asset.volume;
      }, 0);

      const btcPrice = realTimePrices.BTC?.price || 48500;
      const btcVolume = realTimePrices.BTC?.volume || 0;
      const btcDominance = totalVolume > 0 ? ((btcPrice * btcVolume * 0.1) / totalMarketCap * 100) : 52.4;

      setMarketStats({
        marketCap: `$${(totalMarketCap / 1e12).toFixed(1)}T`,
        volume24h: `$${(totalVolume / 1e9).toFixed(1)}B`,
        btcDominance: `${btcDominance.toFixed(1)}%`,
        activePairs: '650+'
      });
    };

    updateMarketStats();
    const interval = setInterval(updateMarketStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [realTimePrices]);

  // Fetch trending topics and sentiment data
  useEffect(() => {
    const fetchNewsData = async () => {
      try {
        const topics = newsService.getTrendingTopics();
        const sentiment = newsService.getSentimentSummary();
        setTrendingTopics(topics);
        setSentimentSummary(sentiment);
      } catch (error) {
        console.error('Error fetching news data:', error);
      }
    };

    fetchNewsData();
    const interval = setInterval(fetchNewsData, 10 * 60 * 1000); // Update every 10 minutes

    return () => clearInterval(interval);
  }, []);
  
  const getTopGainers = () => {
    return Object.entries(realTimePrices)
      .filter(([symbol, data]) => data.change > 0)
      .sort(([, a], [, b]) => b.change - a.change)
      .slice(0, 4)
      .map(([symbol, data]) => ({
        symbol,
        name: getAssetName(symbol),
        price: `$${data.price.toLocaleString()}`,
        change: `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%`,
        volume: `$${(data.volume / 1e6).toFixed(1)}M`
      }));
  };

  const getMarketData = () => {
    const targetSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
    return targetSymbols.map(symbol => {
      const crypto = prices.find(p => p.symbol === symbol);
      const realTimeData = realTimePrices[symbol];
      
      return {
        symbol: crypto?.symbol || symbol,
        name: crypto?.name || symbol,
        price: realTimeData ? `$${realTimeData.price.toLocaleString()}` : crypto?.price || '--',
        change: realTimeData ? `${realTimeData.change >= 0 ? '+' : ''}${realTimeData.change.toFixed(2)}%` : crypto?.change || '--',
        marketCap: crypto?.marketCap || '--',
        volume: realTimeData ? `$${(realTimeData.volume / 1e6).toFixed(1)}M` : crypto?.volume || '--',
        isPositive: realTimeData ? realTimeData.change >= 0 : (crypto?.isPositive ?? true)
      };
    });
  };

  const getAssetName = (symbol: string): string => {
    const names: { [key: string]: string } = {
      BTC: "Bitcoin",
      ETH: "Ethereum",
      BNB: "BNB",
      SOL: "Solana",
      XRP: "XRP",
      ADA: "Cardano",
      DOT: "Polkadot",
      LINK: "Chainlink"
    };
    return names[symbol] || symbol;
  };

  const topGainers = getTopGainers();
  const marketData = getMarketData();

  const allAssets = getAllAssets();
  const filteredAssets = allAssets.filter(asset => {
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="kucoin-container py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Market Overview</h1>
              <p className="text-muted-foreground">Real-time data across all trading assets</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Globe className="w-4 h-4 mr-2" />
                Global Markets
              </Button>
              <Button variant="outline" size="sm">
                <Activity className="w-4 h-4 mr-2" />
                Market Analysis
              </Button>
            </div>
          </div>
        </div>
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="kucoin-card p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-kucoin-green/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-kucoin-green" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="text-xl font-bold text-foreground">{marketStats.marketCap}</p>
            </div>
          </div>
        </Card>

        <Card className="kucoin-card p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-kucoin-blue/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-kucoin-blue" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="text-xl font-bold text-foreground">{marketStats.volume24h}</p>
            </div>
          </div>
        </Card>

        <Card className="kucoin-card p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-kucoin-yellow/10 rounded-lg flex items-center justify-center">
              <Percent className="w-5 h-5 text-kucoin-yellow" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">BTC Dominance</p>
              <p className="text-xl font-bold text-foreground">{marketStats.btcDominance}</p>
            </div>
          </div>
        </Card>

        <Card className="kucoin-card p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-kucoin-green/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-kucoin-green" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Pairs</p>
              <p className="text-xl font-bold text-foreground">{marketStats.activePairs}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Market Ticker */}
      <Card className="kucoin-card p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Live Market Ticker</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {Object.entries(realTimePrices).slice(0, 8).map(([symbol, data]) => (
            <div key={symbol} className="flex items-center gap-2 min-w-fit">
              <span className="text-sm font-medium text-foreground">{symbol}</span>
              <span className="text-sm text-foreground">${data.price.toLocaleString()}</span>
              <span className={`text-xs ${data.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Trending Topics & Sentiment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Trending Topics */}
        <Card className="kucoin-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Trending Topics</h3>
              <p className="text-sm text-muted-foreground">Live crypto news trends</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map((topic, index) => (
              <Badge 
                key={topic} 
                variant="outline" 
                className="bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
              >
                #{topic}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Sentiment Analysis */}
        <Card className="kucoin-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Market Sentiment</h3>
              <p className="text-sm text-muted-foreground">News sentiment analysis</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Up className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">Positive</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{sentimentSummary.positive}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Down className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-500">Negative</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{sentimentSummary.negative}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Minus className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-500">Neutral</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{sentimentSummary.neutral}</div>
            </div>
          </div>
        </Card>
      </div>

        <Tabs defaultValue="markets" className="mb-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="markets" className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Search assets..." 
                    className="pl-10 w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    <SelectItem value="futures">Futures</SelectItem>
                    <SelectItem value="forex">Forex</SelectItem>
                    <SelectItem value="stocks">Stocks</SelectItem>
                    <SelectItem value="etf">ETF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
                <Button className="kucoin-btn-primary" size="sm">24h</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Market Table */}
              <div className="lg:col-span-3">
                <Card className="kucoin-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">
                      {selectedCategory === 'all' ? 'All Assets' : selectedCategory.toUpperCase()} Markets
                    </h2>
                    <div className="text-sm text-muted-foreground">
                      {filteredAssets.length} assets found
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Asset</th>
                          <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Category</th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Price</th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">24h Change</th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Volume</th>
                          <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssets.slice(0, 20).map((asset, index) => {
                          const cryptoData = prices.find(p => p.symbol === asset.symbol.split('/')[0]);
                          const realTimeData = realTimePrices[asset.symbol.split('/')[0]];
                          
                          const price = realTimeData ? `$${realTimeData.price.toLocaleString()}` : 
                            cryptoData?.price || `$${(Math.random() * 1000 + 10).toFixed(2)}`;
                          const change = realTimeData ? `${realTimeData.change >= 0 ? '+' : ''}${realTimeData.change.toFixed(2)}%` : 
                            cryptoData?.change || `${(Math.random() * 10 - 5).toFixed(2)}%`;
                          const isPositive = realTimeData ? realTimeData.change >= 0 : 
                            (cryptoData?.isPositive ?? Math.random() > 0.5);
                          
                          return (
                            <tr key={index} className="border-b border-border hover:bg-muted/50">
                              <td className="py-4 px-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-kucoin-green/10 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-kucoin-green">
                                      {asset.symbol.charAt(0)}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium">{asset.symbol}</p>
                                    <p className="text-sm text-muted-foreground">{asset.name}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="text-center py-4 px-2">
                                <span className="text-xs bg-muted px-2 py-1 rounded">
                                  {asset.category.toUpperCase()}
                                </span>
                              </td>
                              <td className="text-right py-4 px-2 font-semibold">{price}</td>
                              <td className={`text-right py-4 px-2 font-medium ${isPositive ? 'text-kucoin-green' : 'text-kucoin-red'}`}>
                                {change}
                              </td>
                              <td className="text-right py-4 px-2 text-muted-foreground">
                                {realTimeData ? `$${(realTimeData.volume / 1e6).toFixed(1)}M` : `$${(Math.random() * 100).toFixed(1)}M`}
                              </td>
                              <td className="text-right py-4 px-2">
                                <Button 
                                  className="kucoin-btn-primary" 
                                  size="sm"
                                  onClick={() => navigate('/trading')}
                                >
                                  Trade
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Top Gainers Sidebar */}
              <div className="space-y-6">
                <Card className="kucoin-card p-6">
                  <h3 className="text-lg font-semibold mb-4">🚀 Top Gainers</h3>
                  <div className="space-y-3">
                    {topGainers.map((coin, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{coin.symbol}</p>
                          <p className="text-xs text-muted-foreground">{coin.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{coin.price}</p>
                          <p className="text-xs text-kucoin-green">{coin.change}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="kucoin-card p-6">
                  <h3 className="text-lg font-semibold mb-4">Market Insights</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-kucoin-green/10 rounded-lg">
                      <p className="text-sm font-medium text-kucoin-green">Bull Market Signal</p>
                      <p className="text-xs text-muted-foreground mt-1">Strong upward momentum detected</p>
                    </div>
                    <div className="p-3 bg-kucoin-yellow/10 rounded-lg">
                      <p className="text-sm font-medium text-kucoin-yellow">High Volatility</p>
                      <p className="text-xs text-muted-foreground mt-1">Increased trading activity</p>
                    </div>
                    <div className="p-3 bg-kucoin-blue/10 rounded-lg">
                      <p className="text-sm font-medium text-kucoin-blue">Multi-Asset Trading</p>
                      <p className="text-xs text-muted-foreground mt-1">Trade across 5 major categories</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="news">
            <CryptoNews />
          </TabsContent>

          <TabsContent value="analysis">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Market Analysis</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button className="kucoin-btn-primary" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Technical Analysis */}
                <Card className="kucoin-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Technical Analysis</h3>
                      <p className="text-sm text-muted-foreground">Price action & indicators</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Market Trend:</span>
                      <span className="text-green-500 font-medium flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Bullish
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Support Level:</span>
                      <span className="font-medium text-foreground">$67,200</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Resistance:</span>
                      <span className="font-medium text-foreground">$69,800</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">RSI:</span>
                      <span className="font-medium text-foreground">68.5</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">MACD:</span>
                      <span className="text-green-500 font-medium">Bullish</span>
                    </div>
                  </div>
                </Card>
                
                {/* Sentiment Analysis */}
                <Card className="kucoin-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Sentiment Analysis</h3>
                      <p className="text-sm text-muted-foreground">Market psychology</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Fear & Greed:</span>
                      <span className="text-green-500 font-medium flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Greed (72)
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Social Volume:</span>
                      <span className="font-medium text-foreground">High</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">News Sentiment:</span>
                      <span className="text-green-500 font-medium flex items-center gap-1">
                        <Up className="w-4 h-4" />
                        Positive
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Reddit Sentiment:</span>
                      <span className="text-green-500 font-medium">Bullish</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Twitter Sentiment:</span>
                      <span className="text-green-500 font-medium">Positive</span>
                    </div>
                  </div>
                </Card>
                
                {/* On-Chain Metrics */}
                <Card className="kucoin-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <PieChart className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">On-Chain Metrics</h3>
                      <p className="text-sm text-muted-foreground">Blockchain analytics</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Active Addresses:</span>
                      <span className="text-green-500 font-medium flex items-center gap-1">
                        <Up className="w-4 h-4" />
                        ↑ 12.5%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Network Hash Rate:</span>
                      <span className="text-green-500 font-medium flex items-center gap-1">
                        <Up className="w-4 h-4" />
                        ↑ 3.2%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Exchange Inflows:</span>
                      <span className="text-red-500 font-medium flex items-center gap-1">
                        <Down className="w-4 h-4" />
                        ↓ 8.1%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Large Transactions:</span>
                      <span className="text-green-500 font-medium flex items-center gap-1">
                        <Up className="w-4 h-4" />
                        ↑ 15.3%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Whale Activity:</span>
                      <span className="text-green-500 font-medium">High</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Additional Analysis Features */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Market Overview */}
                <Card className="kucoin-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Market Overview</h3>
                      <p className="text-sm text-muted-foreground">Key market indicators</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Volatility Index:</span>
                      <span className="font-medium text-foreground">High (85)</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Market Dominance:</span>
                      <span className="font-medium text-foreground">BTC: 52.4%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">24h Volume:</span>
                      <span className="font-medium text-foreground">$185.2B</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Market Cap:</span>
                      <span className="font-medium text-foreground">$3.8T</span>
                    </div>
                  </div>
                </Card>

                {/* Risk Assessment */}
                <Card className="kucoin-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Risk Assessment</h3>
                      <p className="text-sm text-muted-foreground">Market risk indicators</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Risk Level:</span>
                      <span className="text-yellow-500 font-medium">Medium</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Liquidity:</span>
                      <span className="text-green-500 font-medium">High</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Correlation:</span>
                      <span className="font-medium text-foreground">0.85</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Regulatory Risk:</span>
                      <span className="text-yellow-500 font-medium">Medium</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
};

export default MarketPage;