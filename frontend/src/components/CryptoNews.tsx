import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ExternalLink,
  RefreshCw,
  TrendingUp as Up,
  TrendingDown as Down,
  Minus
} from "lucide-react";
import { newsService, NewsItem } from "@/services/newsService";

const CryptoNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch news on component mount and category change
  useEffect(() => {
    fetchNews();
  }, [selectedCategory]);

  // Auto-refresh news every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNews();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [selectedCategory]);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const newsData = await newsService.fetchNews(selectedCategory);
      setNews(newsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const freshNews = await newsService.refreshNews();
      setNews(freshNews);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All News' },
    { id: 'bitcoin', name: 'Bitcoin' },
    { id: 'ethereum', name: 'Ethereum' },
    { id: 'defi', name: 'DeFi' },
    { id: 'regulation', name: 'Regulation' }
  ];

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Crypto News</h3>
            <p className="text-sm text-slate-400">Latest market updates and insights</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className={`whitespace-nowrap ${
              selectedCategory === category.id
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "border-slate-600 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* News Content */}
      {news.length === 0 ? (
        <div className="text-center py-12">
          <Newspaper className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-slate-300 mb-2">Loading News...</h4>
          <p className="text-slate-400 mb-4">
            Fetching latest crypto news and market updates...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Last Updated Info */}
          <div className="text-xs text-slate-500 mb-4">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          
          {news.map((item) => (
            <div key={item.id} className="border border-slate-700 rounded-lg p-4 hover:bg-slate-700/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-white">{item.title}</h4>
                    <div className="flex items-center gap-1">
                      {item.sentiment === 'positive' && <Up className="w-4 h-4 text-green-400" />}
                      {item.sentiment === 'negative' && <Down className="w-4 h-4 text-red-400" />}
                      {item.sentiment === 'neutral' && <Minus className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{item.summary}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.publishedAt).toLocaleString()}
                    </span>
                    <span className="bg-slate-700 px-2 py-1 rounded">{item.source}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        item.sentiment === 'positive' ? 'border-green-500 text-green-400' :
                        item.sentiment === 'negative' ? 'border-red-500 text-red-400' :
                        'border-slate-500 text-slate-400'
                      }`}
                    >
                      {item.sentiment}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                      {item.category}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(item.url, '_blank')}
                  className="text-slate-400 hover:text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default CryptoNews;