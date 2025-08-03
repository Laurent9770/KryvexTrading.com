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

export class NewsService {
  private news: NewsItem[] = [];
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    // Initialize with empty state - no mock data
    this.loadPersistedData();
  }

  private loadPersistedData() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedNews = localStorage.getItem('cryptoNews');
        if (savedNews) {
          this.news = JSON.parse(savedNews);
        }
      }
    } catch (error) {
      console.warn('Error loading persisted news data:', error);
    }
  }

  private persistData() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('cryptoNews', JSON.stringify(this.news));
      }
    } catch (error) {
      console.warn('Error persisting news data:', error);
    }
  }

  async fetchNews(category: string = 'all'): Promise<NewsItem[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    let filteredNews = this.news;
    
    // Filter by category if not 'all'
    if (category !== 'all') {
      filteredNews = filteredNews.filter(item => item.category === category);
    }
    
    return filteredNews;
  }

  async fetchNewsByCategory(category: string): Promise<NewsItem[]> {
    return this.fetchNews(category);
  }

  async refreshNews(): Promise<NewsItem[]> {
    // Clear cache to force fresh data
    this.persistData(); // Persist empty array to clear cache
    return this.fetchNews();
  }

  // Get trending topics based on news frequency
  getTrendingTopics(): string[] {
    const topicCount: { [key: string]: number } = {};
    
    this.news.forEach(item => {
      topicCount[item.category] = (topicCount[item.category] || 0) + 1;
    });
    
    return Object.entries(topicCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  // Get sentiment analysis summary
  getSentimentSummary(): { positive: number; negative: number; neutral: number } {
    const sentiment = { positive: 0, negative: 0, neutral: 0 };
    
    this.news.forEach(item => {
      sentiment[item.sentiment]++;
    });
    
    return sentiment;
  }
}

export const newsService = new NewsService();
export default newsService; 