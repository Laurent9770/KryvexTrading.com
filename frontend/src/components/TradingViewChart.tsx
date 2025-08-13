import { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  height?: number;
  interval?: string;
}

const TradingViewChart = ({ 
  symbol = "BINANCE:BTCUSDT", 
  theme = "dark",
  height = 400,
  interval = "1D"
}: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear existing widget and error
    containerRef.current.innerHTML = '';
    setWidgetError(null);

    // Add global error handler for iframe issues
    const handleIframeError = (event: ErrorEvent) => {
      if (event.message.includes('contentWindow') || event.message.includes('iframe')) {
        console.warn('TradingView iframe error (non-critical):', event.message);
        // Don't set error state for iframe issues as they're usually non-critical
        return;
      }
    };

    // Add error listener
    window.addEventListener('error', handleIframeError);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    
    // Enhanced widget configuration with better error handling
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": symbol,
      "interval": interval,
      "timezone": "Etc/UTC",
      "theme": theme,
      "style": "1",
      "locale": "en",
      "withdateranges": true,
      "hide_side_toolbar": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "height": height,
      "studies": [
        "Volume@tv-basicstudies",
        "RSI@tv-basicstudies"
      ],
      "show_popup_button": true,
      "popup_width": "1000",
      "popup_height": "650",
      "container_id": "tradingview_chart",
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "backgroundColor": theme === 'dark' ? '#1e1e1e' : '#ffffff',
      "gridColor": theme === 'dark' ? '#2a2a2a' : '#e1e1e1',
      "enable_publishing": false,
      "hide_volume": false,
      "scalePosition": "right",
      "scaleMode": "Normal",
      "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      "fontSize": "10",
      "noTimeScale": false,
      "valuesTracking": "1",
      "changeMode": "price-and-percent",
      "chartOnly": false,
      "largeChartUrl": ""
    });

    // Add error handling for script loading
    script.onerror = () => {
      console.error('❌ Failed to load TradingView widget script');
      setWidgetError('Failed to load chart widget. Please refresh the page.');
    };

    script.onload = () => {
      console.log('✅ TradingView widget script loaded successfully');
      
      // Add a timeout to check if widget loaded properly
      setTimeout(() => {
        if (containerRef.current && containerRef.current.children.length === 0) {
          console.warn('⚠️ TradingView widget may not have loaded properly');
        }
      }, 3000);
    };

    containerRef.current.appendChild(script);

    return () => {
      // Cleanup
      window.removeEventListener('error', handleIframeError);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme, height, interval]);

  if (widgetError) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-800 rounded-lg border border-slate-700">
        <div className="text-center">
          <p className="text-red-400 mb-2">Chart Loading Error</p>
          <p className="text-slate-400 text-sm">{widgetError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Fallback chart component
  const FallbackChart = () => (
    <div className="flex items-center justify-center h-full bg-slate-800 rounded-lg border border-slate-700">
      <div className="text-center">
        <div className="text-4xl mb-4">📈</div>
        <p className="text-slate-300 mb-2">Live Trading Chart</p>
        <p className="text-slate-400 text-sm mb-4">Symbol: {symbol}</p>
        <div className="flex justify-center space-x-4 text-sm">
          <div className="text-green-400">▲ +2.34%</div>
          <div className="text-slate-400">Volume: 1.2M</div>
          <div className="text-slate-400">24h: $45,250</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="tradingview-widget-container" style={{ height: `${height}px`, width: '100%' }}>
      <div 
        ref={containerRef}
        id="tradingview_chart" 
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};

export default TradingViewChart;