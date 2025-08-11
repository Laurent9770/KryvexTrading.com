import { useState, useEffect } from 'react';
import { forexPriceService, ForexPriceFormatted } from '@/services/forexPriceService';

export const useForexPrices = () => {
  const [prices, setPrices] = useState<Map<string, ForexPriceFormatted>>(new Map());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = forexPriceService.subscribe((newPrices) => {
      setPrices(newPrices);
      setLastUpdate(forexPriceService.getLastUpdateTime());
      setLoading(false);
    });

    // Start auto-updating if not already started
    if (forexPriceService.shouldUpdate()) {
      forexPriceService.startAutoUpdate();
    } else {
      // If we have recent data, use it immediately
      setPrices(forexPriceService.getPrices());
      setLastUpdate(forexPriceService.getLastUpdateTime());
      setLoading(false);
    }

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing from forex price service:', error);
        }
      }
    };
  }, []);

  const getPrice = (symbol: string): ForexPriceFormatted | null => {
    return prices.get(symbol.toUpperCase()) || null;
  };

  const getPriceArray = (): ForexPriceFormatted[] => {
    return Array.from(prices.values());
  };

  return {
    prices: getPriceArray(),
    pricesMap: prices,
    getPrice,
    loading,
    lastUpdate,
    refresh: () => forexPriceService.refresh()
  };
};

export const useForexPrice = (symbol: string) => {
  const { getPrice, loading, lastUpdate } = useForexPrices();
  
  return {
    price: getPrice(symbol),
    loading,
    lastUpdate
  };
};
