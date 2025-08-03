// Comprehensive trading assets across all categories
export interface TradingAsset {
  symbol: string;
  name: string;
  category: 'crypto' | 'futures' | 'forex' | 'stocks' | 'etf';
  price?: number;
  change?: number;
  volume?: string;
  marketCap?: string;
  description?: string;
}

export const cryptoAssets: TradingAsset[] = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', category: 'crypto' },
  { symbol: 'ETH/USDT', name: 'Ethereum', category: 'crypto' },
  { symbol: 'BNB/USDT', name: 'BNB', category: 'crypto' },
  { symbol: 'SOL/USDT', name: 'Solana', category: 'crypto' },
  { symbol: 'ADA/USDT', name: 'Cardano', category: 'crypto' },
  { symbol: 'XRP/USDT', name: 'Ripple', category: 'crypto' },
  { symbol: 'DOT/USDT', name: 'Polkadot', category: 'crypto' },
  { symbol: 'LINK/USDT', name: 'Chainlink', category: 'crypto' },
  { symbol: 'MATIC/USDT', name: 'Polygon', category: 'crypto' },
  { symbol: 'AVAX/USDT', name: 'Avalanche', category: 'crypto' },
  { symbol: 'SHIB/USDT', name: 'Shiba Inu', category: 'crypto' },
  { symbol: 'DOGE/USDT', name: 'Dogecoin', category: 'crypto' },
];

export const futuresAssets: TradingAsset[] = [
  { symbol: 'VPU', name: 'Vanguard Utilities ETF', category: 'futures', description: 'Utilities sector exposure' },
  { symbol: 'RYU', name: 'Invesco RYDEX', category: 'futures', description: 'Technology leveraged fund' },
  { symbol: 'XLU', name: 'Utilities Select Sector', category: 'futures', description: 'Utilities sector SPDR' },
  { symbol: 'FUTY', name: 'Fidelity MSCI Utilities', category: 'futures', description: 'Global utilities exposure' },
  { symbol: 'ICF', name: 'iShares Cohen & Steers', category: 'futures', description: 'Real estate infrastructure' },
  { symbol: 'QLD', name: 'ProShares Ultra QQQ', category: 'futures', description: 'Leveraged NASDAQ exposure' },
  { symbol: 'ITB', name: 'iShares US Home Construction', category: 'futures', description: 'Homebuilding sector' },
  { symbol: 'RZV', name: 'Invesco Small Cap Value', category: 'futures', description: 'Small cap value stocks' },
  { symbol: 'FDIS', name: 'Fidelity Consumer Discretionary', category: 'futures', description: 'Consumer discretionary sector' },
  { symbol: 'XAU', name: 'Gold Futures', category: 'futures', description: 'Precious metals trading' },
  { symbol: 'XAG', name: 'Silver Futures', category: 'futures', description: 'Silver commodity futures' },
  { symbol: 'NG', name: 'Natural Gas Futures', category: 'futures', description: 'Energy commodity' },
  { symbol: 'CAD', name: 'Canadian Dollar Futures', category: 'futures', description: 'Currency futures' },
  { symbol: 'HO', name: 'Heating Oil Futures', category: 'futures', description: 'Energy derivatives' },
  { symbol: 'RBOB', name: 'RBOB Gasoline Futures', category: 'futures', description: 'Gasoline commodity' },
  { symbol: 'GC', name: 'Gold Futures Contract', category: 'futures', description: 'Standard gold contract' },
  { symbol: 'XPT', name: 'Platinum Futures', category: 'futures', description: 'Platinum commodity' },
  { symbol: 'HG', name: 'High Grade Copper', category: 'futures', description: 'Copper commodity futures' },
];

export const forexAssets: TradingAsset[] = [
  { symbol: 'USD/CNH', name: 'US Dollar / Chinese Yuan', category: 'forex', description: 'Major currency pair' },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', category: 'forex', description: 'Major currency pair' },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'forex', description: 'Most traded currency pair' },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', category: 'forex', description: 'Safe haven currency' },
  { symbol: 'USD/HKD', name: 'US Dollar / Hong Kong Dollar', category: 'forex', description: 'Asian currency pair' },
  { symbol: 'USD/SGD', name: 'US Dollar / Singapore Dollar', category: 'forex', description: 'Asian financial hub' },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', category: 'forex', description: 'Cable currency pair' },
  { symbol: 'HKD/CNY', name: 'Hong Kong Dollar / Chinese Yuan', category: 'forex', description: 'Regional pair' },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', category: 'forex', description: 'Commodity currency' },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', category: 'forex', description: 'North American pair' },
  { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', category: 'forex', description: 'Kiwi dollar' },
  { symbol: 'EUR/GBP', name: 'Euro / British Pound', category: 'forex', description: 'European cross pair' },
  { symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen', category: 'forex', description: 'Volatile cross pair' },
  { symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', category: 'forex', description: 'European-Asian pair' },
];

export const stockAssets: TradingAsset[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'stocks', description: 'Technology giant' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', category: 'stocks', description: 'Software and cloud services' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'stocks', description: 'Search and advertising' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'stocks', description: 'E-commerce and cloud' },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stocks', description: 'Electric vehicles' },
  { symbol: 'META', name: 'Meta Platforms Inc.', category: 'stocks', description: 'Social media platform' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', category: 'stocks', description: 'Graphics and AI chips' },
  { symbol: 'NFLX', name: 'Netflix Inc.', category: 'stocks', description: 'Streaming entertainment' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', category: 'stocks', description: 'Investment banking' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', category: 'stocks', description: 'Healthcare and pharmaceuticals' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', category: 'stocks', description: 'Consumer goods' },
  { symbol: 'V', name: 'Visa Inc.', category: 'stocks', description: 'Payment processing' },
  { symbol: 'MA', name: 'Mastercard Inc.', category: 'stocks', description: 'Payment technology' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', category: 'stocks', description: 'Healthcare services' },
  { symbol: 'HD', name: 'The Home Depot Inc.', category: 'stocks', description: 'Home improvement retail' },
  { symbol: 'BAC', name: 'Bank of America Corp.', category: 'stocks', description: 'Commercial banking' },
];

export const etfAssets: TradingAsset[] = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'etf', description: 'Tracks S&P 500 index' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'etf', description: 'NASDAQ-100 tracking' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', category: 'etf', description: 'Small-cap stocks' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market', category: 'etf', description: 'Total US stock market' },
  { symbol: 'EFA', name: 'iShares MSCI EAFE ETF', category: 'etf', description: 'International developed markets' },
  { symbol: 'EEM', name: 'iShares MSCI Emerging Markets', category: 'etf', description: 'Emerging markets exposure' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond', category: 'etf', description: 'Long-term US treasuries' },
  { symbol: 'GLD', name: 'SPDR Gold Shares', category: 'etf', description: 'Gold commodity exposure' },
  { symbol: 'SLV', name: 'iShares Silver Trust', category: 'etf', description: 'Silver precious metal' },
  { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', category: 'etf', description: 'Real estate investment' },
  { symbol: 'XLE', name: 'Energy Select Sector SPDR', category: 'etf', description: 'Energy sector exposure' },
  { symbol: 'XLF', name: 'Financial Select Sector SPDR', category: 'etf', description: 'Financial sector' },
  { symbol: 'XLK', name: 'Technology Select Sector SPDR', category: 'etf', description: 'Technology sector' },
  { symbol: 'XLV', name: 'Health Care Select Sector SPDR', category: 'etf', description: 'Healthcare sector' },
  { symbol: 'XLI', name: 'Industrial Select Sector SPDR', category: 'etf', description: 'Industrial sector' },
  { symbol: 'XLP', name: 'Consumer Staples Select Sector', category: 'etf', description: 'Consumer staples' },
];

export const getAllAssets = (): TradingAsset[] => {
  return [
    ...cryptoAssets,
    ...futuresAssets,
    ...forexAssets,
    ...stockAssets,
    ...etfAssets
  ];
};

export const getAssetsByCategory = (category: string): TradingAsset[] => {
  switch (category) {
    case 'crypto':
      return cryptoAssets;
    case 'futures':
      return futuresAssets;
    case 'forex':
      return forexAssets;
    case 'stocks':
      return stockAssets;
    case 'etf':
      return etfAssets;
    default:
      return getAllAssets();
  }
};