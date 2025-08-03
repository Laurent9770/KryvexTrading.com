-- Update trading pairs with realistic 2025 crypto prices
UPDATE public.trading_pairs SET 
  current_price = 95250.75,
  price_change_24h = 3.42,
  volume_24h = 285000000
WHERE symbol = 'BTC/USDT';

UPDATE public.trading_pairs SET 
  current_price = 3890.25,
  price_change_24h = -1.85,
  volume_24h = 195000000
WHERE symbol = 'ETH/USDT';

UPDATE public.trading_pairs SET 
  current_price = 485.50,
  price_change_24h = 5.67,
  volume_24h = 45000000
WHERE symbol = 'BNB/USDT';

UPDATE public.trading_pairs SET 
  current_price = 0.785,
  price_change_24h = 8.23,
  volume_24h = 25000000
WHERE symbol = 'ADA/USDT';

UPDATE public.trading_pairs SET 
  current_price = 185.75,
  price_change_24h = -2.15,
  volume_24h = 35000000
WHERE symbol = 'SOL/USDT';

-- Add more 2025 trending cryptocurrencies
INSERT INTO public.trading_pairs (symbol, base_currency, quote_currency, current_price, price_change_24h, volume_24h) VALUES
('AVAX/USDT', 'AVAX', 'USDT', 42.85, 6.75, 18000000),
('MATIC/USDT', 'MATIC', 'USDT', 1.25, 4.32, 22000000),
('DOT/USDT', 'DOT', 'USDT', 8.95, -0.85, 15000000),
('LINK/USDT', 'LINK', 'USDT', 18.75, 2.45, 12000000),
('UNI/USDT', 'UNI', 'USDT', 12.50, 3.80, 8500000),
('XRP/USDT', 'XRP', 'USDT', 0.68, 1.25, 95000000),
('DOGE/USDT', 'DOGE', 'USDT', 0.095, 15.45, 75000000),
('SHIB/USDT', 'SHIB', 'USDT', 0.000028, 8.90, 45000000),
('PEPE/USDT', 'PEPE', 'USDT', 0.00000185, 25.75, 35000000),
('ARB/USDT', 'ARB', 'USDT', 1.85, 7.25, 20000000);

-- Update stats to reflect 2025 market reality
UPDATE public.trading_pairs SET volume_24h = volume_24h * 1.5;