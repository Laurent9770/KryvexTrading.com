-- ADMIN DASHBOARD FIX
-- Run this in your Supabase SQL editor to fix admin dashboard issues

-- 1. Create trading_pairs table
CREATE TABLE IF NOT EXISTS public.trading_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL DEFAULT 'USDT',
  current_price NUMERIC(20, 8) DEFAULT 0,
  price_change_24h NUMERIC(10, 4) DEFAULT 0,
  volume_24h NUMERIC(20, 8) DEFAULT 0,
  market_cap NUMERIC(20, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Enable RLS and create policies
ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view trading pairs" ON public.trading_pairs;
CREATE POLICY "Anyone can view trading pairs" ON public.trading_pairs 
FOR SELECT USING (true);

-- 3. Insert default trading pairs
INSERT INTO public.trading_pairs (symbol, base_currency, quote_currency, current_price, price_change_24h, volume_24h, is_active) VALUES
  ('BTC/USDT', 'BTC', 'USDT', 50000.00, 2.5, 1000000.00, true),
  ('ETH/USDT', 'ETH', 'USDT', 3000.00, 1.8, 500000.00, true),
  ('ADA/USDT', 'ADA', 'USDT', 0.50, -1.2, 100000.00, true),
  ('DOT/USDT', 'DOT', 'USDT', 20.00, 3.1, 200000.00, true),
  ('LINK/USDT', 'LINK', 'USDT', 15.00, 0.8, 150000.00, true)
ON CONFLICT (symbol) DO NOTHING;

-- 4. Grant permissions
GRANT SELECT ON public.trading_pairs TO authenticated;
GRANT SELECT ON public.trading_pairs TO anon;

-- 5. Verify the setup
SELECT 'trading_pairs' as table_name, COUNT(*) as count FROM public.trading_pairs
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'trades' as table_name, COUNT(*) as count FROM public.trades;

-- 6. Check if your profile exists
SELECT * FROM public.profiles 
WHERE user_id = '26123553-2931-4ed5-950e-2919ae8470ee';

-- 7. Check if you have admin role
SELECT * FROM public.user_roles 
WHERE user_id = '26123553-2931-4ed5-950e-2919ae8470ee';
