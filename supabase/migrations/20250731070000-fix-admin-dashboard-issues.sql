-- Fix Admin Dashboard Issues Migration
-- This migration fixes the admin dashboard query issues

-- 1. Create trading_pairs table if it doesn't exist
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

-- 2. Create trigger for trading_pairs updated_at
DROP TRIGGER IF EXISTS update_trading_pairs_updated_at ON public.trading_pairs;
CREATE TRIGGER update_trading_pairs_updated_at
  BEFORE UPDATE ON public.trading_pairs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Enable RLS on trading_pairs
ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for trading_pairs
DROP POLICY IF EXISTS "Anyone can view trading pairs" ON public.trading_pairs;
CREATE POLICY "Anyone can view trading pairs" ON public.trading_pairs 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage trading pairs" ON public.trading_pairs;
CREATE POLICY "Admins can manage trading pairs" ON public.trading_pairs 
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. Insert default trading pairs
INSERT INTO public.trading_pairs (symbol, base_currency, quote_currency, current_price, price_change_24h, volume_24h, is_active) VALUES
  ('BTC/USDT', 'BTC', 'USDT', 50000.00, 2.5, 1000000.00, true),
  ('ETH/USDT', 'ETH', 'USDT', 3000.00, 1.8, 500000.00, true),
  ('ADA/USDT', 'ADA', 'USDT', 0.50, -1.2, 100000.00, true),
  ('DOT/USDT', 'DOT', 'USDT', 20.00, 3.1, 200000.00, true),
  ('LINK/USDT', 'LINK', 'USDT', 15.00, 0.8, 150000.00, true),
  ('LTC/USDT', 'LTC', 'USDT', 150.00, 1.5, 80000.00, true),
  ('BCH/USDT', 'BCH', 'USDT', 300.00, -0.5, 60000.00, true),
  ('XRP/USDT', 'XRP', 'USDT', 0.80, 2.0, 300000.00, true),
  ('BNB/USDT', 'BNB', 'USDT', 400.00, 1.2, 250000.00, true),
  ('SOL/USDT', 'SOL', 'USDT', 100.00, 4.2, 180000.00, true)
ON CONFLICT (symbol) DO UPDATE SET
  current_price = EXCLUDED.current_price,
  price_change_24h = EXCLUDED.price_change_24h,
  volume_24h = EXCLUDED.volume_24h,
  updated_at = NOW();

-- 6. Grant permissions
GRANT SELECT ON public.trading_pairs TO authenticated;
GRANT SELECT ON public.trading_pairs TO anon;

-- 7. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON public.trading_pairs(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_active ON public.trading_pairs(is_active);

-- 8. Fix any existing trades that might reference non-existent trading pairs
-- First, let's check if trades table has trading_pair_id column
DO $$
DECLARE
    has_trading_pair_id BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trades' 
        AND column_name = 'trading_pair_id'
    ) INTO has_trading_pair_id;
    
    IF has_trading_pair_id THEN
        -- Update trades to reference valid trading pairs
        UPDATE public.trades 
        SET trading_pair_id = (
            SELECT id FROM public.trading_pairs 
            WHERE symbol = 'BTC/USDT' 
            LIMIT 1
        )
        WHERE trading_pair_id IS NULL OR trading_pair_id NOT IN (
            SELECT id FROM public.trading_pairs
        );
        
        RAISE NOTICE 'Updated trades with valid trading_pair_id references';
    ELSE
        RAISE NOTICE 'Trades table does not have trading_pair_id column';
    END IF;
END $$;

-- 9. Verify the setup
DO $$
DECLARE
    trading_pairs_count INTEGER;
    profiles_count INTEGER;
    trades_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trading_pairs_count FROM public.trading_pairs;
    SELECT COUNT(*) INTO profiles_count FROM public.profiles;
    SELECT COUNT(*) INTO trades_count FROM public.trades;
    
    RAISE NOTICE 'Setup verification:';
    RAISE NOTICE '- Trading pairs: %', trading_pairs_count;
    RAISE NOTICE '- Profiles: %', profiles_count;
    RAISE NOTICE '- Trades: %', trades_count;
END $$;
