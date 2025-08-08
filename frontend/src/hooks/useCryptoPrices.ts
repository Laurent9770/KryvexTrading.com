import { useState, useEffect } from 'react';
import { cryptoPriceService, CryptoPriceFormatted } from '@/services/cryptoPriceService';

export const useCryptoPrices = () => {
  const [prices, setPrices] = useState<Map<string, CryptoPriceFormatted>>(new Map());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = cryptoPriceService.subscribe((newPrices) => {
      setPrices(newPrices);
      setLastUpdate(cryptoPriceService.getLastUpdateTime());
      setLoading(false);
    });

    // Start auto-updating if not already started
    if (cryptoPriceService.shouldUpdate()) {
      cryptoPriceService.startAutoUpdate();
    } else {
      // If we have recent data, use it immediately
      setPrices(cryptoPriceService.getPrices());
      setLastUpdate(cryptoPriceService.getLastUpdateTime());
      setLoading(false);
    }

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing from crypto price service:', error);
        }
      }
    };
  }, []);

  const getPrice = (symbol: string): CryptoPriceFormatted | null => {
    return prices.get(symbol.toUpperCase()) || null;
  };

  const getPriceArray = (): CryptoPriceFormatted[] => {
    return Array.from(prices.values());
  };

  return {
    prices: getPriceArray(),
    pricesMap: prices,
    getPrice,
    loading,
    lastUpdate,
    refresh: () => cryptoPriceService.fetchPrices()
  };
};

export const useCryptoPrice = (symbol: string) => {
  const { getPrice, loading, lastUpdate } = useCryptoPrices();
  
  return {
    price: getPrice(symbol),
    loading,
    lastUpdate
  };
};