import { useEffect, useRef } from 'react';

const TradingViewTicker = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear existing widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        {
          "proName": "BINANCE:BTCUSDT",
          "title": "Bitcoin"
        },
        {
          "proName": "BINANCE:ETHUSDT",
          "title": "Ethereum"
        },
        {
          "proName": "BINANCE:BNBUSDT",
          "title": "BNB"
        },
        {
          "proName": "BINANCE:ADAUSDT",
          "title": "Cardano"
        },
        {
          "proName": "BINANCE:SOLUSDT",
          "title": "Solana"
        },
        {
          "proName": "BINANCE:AVAXUSDT",
          "title": "Avalanche"
        },
        {
          "proName": "BINANCE:MATICUSDT",
          "title": "Polygon"
        },
        {
          "proName": "BINANCE:DOTUSDT",
          "title": "Polkadot"
        },
        {
          "proName": "BINANCE:LINKUSDT",
          "title": "Chainlink"
        },
        {
          "proName": "BINANCE:UNIUSDT",
          "title": "Uniswap"
        }
      ],
      "showSymbolLogo": true,
      "colorTheme": "dark",
      "isTransparent": true,
      "displayMode": "adaptive",
      "locale": "en"
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="tradingview-widget-container">
      <div ref={containerRef} className="tradingview-widget-container__widget" />
    </div>
  );
};

export default TradingViewTicker;