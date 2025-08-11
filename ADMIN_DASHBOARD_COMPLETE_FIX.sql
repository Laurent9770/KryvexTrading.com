-- ADMIN DASHBOARD COMPLETE FIX
-- Run this in your Supabase SQL editor to fix all admin dashboard issues

-- 1. First, let's check what columns actually exist in our tables
SELECT 'profiles columns' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'user_roles columns' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_roles' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'trades columns' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trades' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Create trading_pairs table if it doesn't exist
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

-- 3. Add trading_pair_id column to trades table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trades' 
    AND column_name = 'trading_pair_id' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.trades ADD COLUMN trading_pair_id UUID;
  END IF;
END $$;

-- 4. Add foreign key relationship between trades and trading_pairs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'trades_trading_pair_id_fkey' 
    AND table_name = 'trades' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.trades 
    ADD CONSTRAINT trades_trading_pair_id_fkey 
    FOREIGN KEY (trading_pair_id) 
    REFERENCES public.trading_pairs(id);
  END IF;
END $$;

-- 5. Create index on the foreign key
CREATE INDEX IF NOT EXISTS idx_trades_trading_pair_id ON public.trades(trading_pair_id);

-- 6. Insert default trading pairs
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

-- 7. Update existing trades to reference valid trading pairs
UPDATE public.trades 
SET trading_pair_id = (
  SELECT id FROM public.trading_pairs 
  WHERE symbol = 'BTC/USDT' 
  LIMIT 1
)
WHERE trading_pair_id IS NULL;

-- 8. Enable RLS and create policies for trading_pairs
ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view trading pairs" ON public.trading_pairs;
CREATE POLICY "Anyone can view trading pairs" ON public.trading_pairs 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage trading pairs" ON public.trading_pairs;
CREATE POLICY "Admins can manage trading pairs" ON public.trading_pairs 
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 9. Grant permissions
GRANT SELECT ON public.trading_pairs TO authenticated;
GRANT SELECT ON public.trading_pairs TO anon;

-- 10. Fix admin role for your user
DELETE FROM public.user_roles 
WHERE user_id = '26123553-2931-4ed5-950e-2919ae8470ee';

INSERT INTO public.user_roles (user_id, role)
VALUES ('26123553-2931-4ed5-950e-2919ae8470ee', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 11. Update profile to ensure admin status
UPDATE public.profiles 
SET 
    full_name = COALESCE(full_name, 'Admin User'),
    is_verified = true,
    kyc_status = 'approved',
    account_status = 'active'
WHERE user_id = '26123553-2931-4ed5-950e-2919ae8470ee';

-- 12. Create kyc_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id),
  document_type TEXT NOT NULL,
  document_number TEXT,
  document_url TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(user_id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 13. Enable RLS for kyc_documents
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own KYC documents" ON public.kyc_documents;
CREATE POLICY "Users can view own KYC documents" ON public.kyc_documents 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all KYC documents" ON public.kyc_documents;
CREATE POLICY "Admins can view all KYC documents" ON public.kyc_documents 
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 14. Verify the setup
SELECT 'Setup verification' as check_type,
       (SELECT COUNT(*) FROM public.trading_pairs) as trading_pairs_count,
       (SELECT COUNT(*) FROM public.profiles) as profiles_count,
       (SELECT COUNT(*) FROM public.trades) as trades_count,
       (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') as admin_count;

-- 15. Test the has_role function
SELECT 'has_role test' as check_type,
       public.has_role('26123553-2931-4ed5-950e-2919ae8470ee', 'admin') as is_admin;

-- 16. Show sample data
SELECT 'Sample trading pairs' as data_type, symbol, base_currency, current_price FROM public.trading_pairs LIMIT 5;
SELECT 'Sample profiles' as data_type, user_id, full_name, email FROM public.profiles LIMIT 5;
SELECT 'Sample user roles' as data_type, user_id, role FROM public.user_roles LIMIT 5;
