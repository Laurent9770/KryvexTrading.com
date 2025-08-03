export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  image?: string;
}

export interface NewsResponse {
  articles: NewsItem[];
  totalResults: number;
  status: string;
}

class NewsService {
  private static instance: NewsService;
  private cache: Map<string, { data: NewsItem[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  // Simulate live crypto news data
  private generateMockNews(): NewsItem[] {
    const mockNews: NewsItem[] = [
      {
        id: '1',
        title: 'Bitcoin Surges Past $50,000 as Institutional Adoption Grows',
        summary: 'Bitcoin has reached a new milestone, crossing the $50,000 mark for the first time in months. Analysts attribute this surge to increased institutional adoption and positive regulatory developments.',
        source: 'CryptoNews',
        publishedAt: new Date().toISOString(),
        url: 'https://cryptonews.com/bitcoin-surges-past-50000',
        sentiment: 'positive',
        category: 'bitcoin'
      },
      {
        id: '2',
        title: 'Ethereum Layer 2 Solutions See Record Growth in TVL',
        summary: 'Ethereum Layer 2 scaling solutions have achieved record-breaking Total Value Locked (TVL), with Arbitrum and Optimism leading the charge in DeFi innovation.',
        source: 'DeFi Pulse',
        publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        url: 'https://defipulse.com/ethereum-layer2-growth',
        sentiment: 'positive',
        category: 'ethereum'
      },
      {
        id: '3',
        title: 'SEC Approves New Crypto ETF Framework',
        summary: 'The Securities and Exchange Commission has approved a new framework for cryptocurrency ETFs, potentially opening the door for more institutional investment in digital assets.',
        source: 'Financial Times',
        publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        url: 'https://ft.com/sec-crypto-etf-approval',
        sentiment: 'positive',
        category: 'regulation'
      },
      {
        id: '4',
        title: 'DeFi Protocol Suffers $10M Exploit',
        summary: 'A major DeFi protocol has been exploited for approximately $10 million, highlighting the ongoing security challenges in the decentralized finance space.',
        source: 'Blockchain Security',
        publishedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        url: 'https://blockchainsecurity.com/defi-exploit',
        sentiment: 'negative',
        category: 'defi'
      },
      {
        id: '5',
        title: 'Solana Network Achieves 100,000 TPS Milestone',
        summary: 'Solana blockchain has successfully processed 100,000 transactions per second in a recent stress test, demonstrating its scalability capabilities.',
        source: 'Solana Foundation',
        publishedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        url: 'https://solana.com/100k-tps-milestone',
        sentiment: 'positive',
        category: 'ethereum'
      },
      {
        id: '6',
        title: 'Central Bank Digital Currency Pilot Expands',
        summary: 'Major central banks worldwide are expanding their CBDC pilot programs, with China and the European Central Bank leading the charge in digital currency innovation.',
        source: 'Central Banking',
        publishedAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
        url: 'https://centralbanking.com/cbdc-pilot-expansion',
        sentiment: 'neutral',
        category: 'regulation'
      },
      {
        id: '7',
        title: 'NFT Market Shows Signs of Recovery',
        summary: 'The NFT market is showing signs of recovery with increased trading volume and new high-profile collections launching successfully.',
        source: 'NFT Insider',
        publishedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        url: 'https://nftinsider.com/market-recovery',
        sentiment: 'positive',
        category: 'ethereum'
      },
      {
        id: '8',
        title: 'Crypto Mining Difficulty Reaches All-Time High',
        summary: 'Bitcoin mining difficulty has reached an all-time high, indicating increased competition and network security but also higher energy consumption.',
        source: 'Mining Weekly',
        publishedAt: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
        url: 'https://miningweekly.com/difficulty-all-time-high',
        sentiment: 'neutral',
        category: 'bitcoin'
      }
    ];

    // Add some real-time variations with more dynamic content
    const variations = [
      {
        title: 'Bitcoin reaches $51,000 as institutional demand surges',
        summary: 'Bitcoin has surged past $51,000, driven by strong institutional demand and positive regulatory developments. Analysts predict continued growth as more traditional financial institutions enter the crypto space.',
        category: 'bitcoin',
        sentiment: 'positive' as const
      },
      {
        title: 'Ethereum gas fees drop to lowest levels in months',
        summary: 'Ethereum network gas fees have dropped to their lowest levels in months, making DeFi transactions more affordable for users. This is attributed to improved Layer 2 adoption and network optimizations.',
        category: 'ethereum',
        sentiment: 'positive' as const
      },
      {
        title: 'DeFi protocols see $2B in new TVL this week',
        summary: 'Decentralized Finance protocols have attracted $2 billion in new Total Value Locked this week, with yield farming and liquidity mining driving the growth.',
        category: 'defi',
        sentiment: 'positive' as const
      },
      {
        title: 'Crypto market cap approaches $4 trillion milestone',
        summary: 'The total cryptocurrency market capitalization is approaching the $4 trillion milestone, with Bitcoin and Ethereum leading the charge in market dominance.',
        category: 'bitcoin',
        sentiment: 'positive' as const
      },
      {
        title: 'Layer 2 solutions gain 50% more users this quarter',
        summary: 'Ethereum Layer 2 scaling solutions have seen a 50% increase in active users this quarter, with Arbitrum and Optimism leading the adoption.',
        category: 'ethereum',
        sentiment: 'positive' as const
      },
      {
        title: 'Regulatory clarity boosts institutional crypto adoption',
        summary: 'Recent regulatory clarity from major financial authorities has boosted institutional adoption of cryptocurrencies, with more traditional banks offering crypto services.',
        category: 'regulation',
        sentiment: 'positive' as const
      },
      {
        title: 'Crypto exchange reports record trading volume',
        summary: 'Major cryptocurrency exchanges are reporting record trading volumes as market volatility increases and new institutional players enter the space.',
        category: 'bitcoin',
        sentiment: 'neutral' as const
      },
      {
        title: 'NFT market shows signs of recovery',
        summary: 'The NFT market is showing signs of recovery with increased trading volume and new high-profile collections launching successfully.',
        category: 'ethereum',
        sentiment: 'positive' as const
      }
    ];

    // Create additional news items with variations
    for (let i = 9; i <= 20; i++) {
      const variation = variations[i % variations.length];
      const sources = ['CryptoNews', 'DeFi Pulse', 'Blockchain Weekly', 'Crypto Insider', 'CoinDesk', 'The Block'];
      
      mockNews.push({
        id: i.toString(),
        title: variation.title,
        summary: variation.summary,
        source: sources[i % sources.length],
        publishedAt: new Date(Date.now() - (i * 15) * 60 * 1000).toISOString(),
        url: `https://example.com/news/${i}`,
        sentiment: variation.sentiment,
        category: variation.category
      });
    }

    return mockNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  async fetchNews(category: string = 'all'): Promise<NewsItem[]> {
    const cacheKey = `news_${category}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      let news = this.generateMockNews();
      
      // Filter by category if not 'all'
      if (category !== 'all') {
        news = news.filter(item => item.category === category);
      }
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: news,
        timestamp: Date.now()
      });
      
      return news;
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }

  async fetchNewsByCategory(category: string): Promise<NewsItem[]> {
    return this.fetchNews(category);
  }

  async refreshNews(): Promise<NewsItem[]> {
    // Clear cache to force fresh data
    this.cache.clear();
    return this.fetchNews();
  }

  // Get trending topics based on news frequency
  getTrendingTopics(): string[] {
    const news = this.generateMockNews();
    const topicCount: { [key: string]: number } = {};
    
    news.forEach(item => {
      topicCount[item.category] = (topicCount[item.category] || 0) + 1;
    });
    
    return Object.entries(topicCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  // Get sentiment analysis summary
  getSentimentSummary(): { positive: number; negative: number; neutral: number } {
    const news = this.generateMockNews();
    const sentiment = { positive: 0, negative: 0, neutral: 0 };
    
    news.forEach(item => {
      sentiment[item.sentiment]++;
    });
    
    return sentiment;
  }
}

export const newsService = NewsService.getInstance();
export default newsService; 