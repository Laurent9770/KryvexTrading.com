import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface LiveChartProps {
  symbol?: string;
  height?: number;
}

const LiveChart = ({ symbol = "BTC", height = 256 }: LiveChartProps) => {
  const { realTimePrices } = useAuth();
  const [chartData, setChartData] = useState([
    { time: '12:00', price: 64200 },
    { time: '12:10', price: 64350 },
    { time: '12:20', price: 64280 },
    { time: '12:30', price: 64450 },
    { time: '12:40', price: 64580 },
    { time: '12:50', price: 64520 },
    { time: '13:00', price: 64680 },
    { time: '13:10', price: 64580 },
  ]);

  // Update chart with real-time data
  useEffect(() => {
    const realTimePrice = realTimePrices[symbol]?.price;
    if (!realTimePrice) return;

    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev];
        const lastPrice = newData[newData.length - 1].price;
        const currentRealTimePrice = realTimePrices[symbol]?.price || lastPrice;
        
        // Add some randomness to simulate real-time fluctuations
        const change = (Math.random() - 0.5) * (currentRealTimePrice * 0.01); // ±0.5% change
        const newPrice = Math.max(currentRealTimePrice * 0.95, Math.min(currentRealTimePrice * 1.05, currentRealTimePrice + change));
        
        newData.push({
          time: new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          price: Math.round(newPrice)
        });
        
        return newData.slice(-8); // Keep last 8 data points
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [realTimePrices, symbol]);

  // Initialize chart with real-time price if available
  useEffect(() => {
    const realTimePrice = realTimePrices[symbol]?.price;
    if (realTimePrice && chartData.length > 0) {
      setChartData(prev => {
        const newData = [...prev];
        newData[newData.length - 1] = {
          ...newData[newData.length - 1],
          price: Math.round(realTimePrice)
        };
        return newData;
      });
    }
  }, [realTimePrices[symbol]?.price, symbol]);

  const maxPrice = Math.max(...chartData.map(d => d.price));
  const minPrice = Math.min(...chartData.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  const currentPrice = chartData[chartData.length - 1]?.price || 0;
  const previousPrice = chartData[chartData.length - 2]?.price || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

  return (
    <div className="w-full relative" style={{ height }}>
      {/* Chart Area */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        {/* Grid Lines */}
        <div className="absolute inset-0">
          {[0, 25, 50, 75, 100].map(percent => (
            <div
              key={percent}
              className="absolute w-full border-t border-border/20"
              style={{ top: `${percent}%` }}
            />
          ))}
          {chartData.map((_, index) => (
            <div
              key={index}
              className="absolute h-full border-l border-border/20"
              style={{ left: `${(index / (chartData.length - 1)) * 100}%` }}
            />
          ))}
        </div>

        {/* Price Line */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id={`priceGradient-${symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={priceChangePercent >= 0 ? "hsl(var(--crypto-green))" : "hsl(var(--crypto-red))"} stopOpacity={0.3} />
              <stop offset="100%" stopColor={priceChangePercent >= 0 ? "hsl(var(--crypto-green))" : "hsl(var(--crypto-red))"} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {/* Area under curve */}
          <path
            d={`M 0 ${height - ((chartData[0].price - minPrice) / priceRange) * height} ${chartData
              .map((point, index) => 
                `L ${(index / (chartData.length - 1)) * 100}% ${height - ((point.price - minPrice) / priceRange) * height}`
              ).join(' ')} L 100% ${height} L 0 ${height} Z`}
            fill={`url(#priceGradient-${symbol})`}
          />
          
          {/* Price line */}
          <path
            d={`M 0 ${height - ((chartData[0].price - minPrice) / priceRange) * height} ${chartData
              .map((point, index) => 
                `L ${(index / (chartData.length - 1)) * 100}% ${height - ((point.price - minPrice) / priceRange) * height}`
              ).join(' ')}`}
            stroke={priceChangePercent >= 0 ? "hsl(var(--crypto-green))" : "hsl(var(--crypto-red))"}
            strokeWidth="2"
            fill="none"
            className="drop-shadow-sm"
          />
          
          {/* Data points */}
          {chartData.map((point, index) => (
            <circle
              key={index}
              cx={`${(index / (chartData.length - 1)) * 100}%`}
              cy={height - ((point.price - minPrice) / priceRange) * height}
              r="3"
              fill={priceChangePercent >= 0 ? "hsl(var(--crypto-green))" : "hsl(var(--crypto-red))"}
              className={priceChangePercent >= 0 ? "pulse-glow-green" : "pulse-glow-red"}
            />
          ))}
        </svg>

        {/* Price Labels */}
        <div className="absolute top-2 left-2 text-xs text-muted-foreground">
          ${maxPrice.toLocaleString()}
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
          ${minPrice.toLocaleString()}
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {chartData[chartData.length - 1]?.time}
        </div>
      </div>

      {/* Current Price Indicator */}
      <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1 border border-border">
        <div className="text-sm font-semibold text-foreground">
          ${currentPrice.toLocaleString()}
        </div>
        <div className={`text-xs ${priceChangePercent >= 0 ? 'text-crypto-green' : 'text-crypto-red'}`}>
          {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
        </div>
      </div>

      {/* Symbol Label */}
      <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1 border border-border">
        <div className="text-sm font-medium text-foreground">
          {symbol}
        </div>
      </div>
    </div>
  );
};

export default LiveChart;