-- FIXED ADMIN USER CREATION FOR JSONB WALLETS
-- Run this in your Supabase SQL Editor after running the cleanup script

-- 1. First, let's check the current profiles table structure
SELECT 'Profiles table structure' as info,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Create admin user in auth.users (if not exists)
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@kryvex.com';
    
    -- If admin user doesn't exist, create it
    IF admin_user_id IS NULL THEN
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            gen_random_uuid(),
            'admin@kryvex.com',
            crypt('Kryvex.@123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "System Administrator"}',
            false,
            '',
            '',
            '',
            ''
        );
        
        -- Get the newly created user ID
        SELECT id INTO admin_user_id
        FROM auth.users
        WHERE email = 'admin@kryvex.com';
        
        RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
    END IF;
    
    -- 3. Create profile for admin user with proper JSONB wallet structure matching frontend
    INSERT INTO public.profiles (
        user_id,
        email,
        full_name,
        phone,
        country,
        account_balance,
        is_verified,
        kyc_status,
        account_status,
        funding_wallet,
        trading_wallet,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'admin@kryvex.com',
        'System Administrator',
        '+1234567890',
        'United States',
        10000.00,
        true,
        'approved',
        'active',
        '{"USDT": {"balance": "10000.00", "usdValue": "$10000.00", "available": "10000.00"}}'::jsonb,
        '{"USDT": {"balance": "10000.00000000", "usdValue": "$10000.00", "available": "10000.00000000"}, "BTC": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}, "ETH": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}}'::jsonb,
        now(),
        now()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        is_verified = EXCLUDED.is_verified,
        kyc_status = EXCLUDED.kyc_status,
        account_status = EXCLUDED.account_status,
        funding_wallet = EXCLUDED.funding_wallet,
        trading_wallet = EXCLUDED.trading_wallet,
        updated_at = now();
    
    -- 4. Assign admin role (if not exists)
    DELETE FROM public.user_roles
    WHERE user_id = admin_user_id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin profile and role created successfully';
    
END $$;

-- 5. Create trading_pairs table if it doesn't exist
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

-- 7. Enable RLS and create policies for trading_pairs
ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view trading pairs" ON public.trading_pairs;
CREATE POLICY "Anyone can view trading pairs" ON public.trading_pairs
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage trading pairs" ON public.trading_pairs;
CREATE POLICY "Admins can manage trading pairs" ON public.trading_pairs
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 8. Grant permissions
GRANT SELECT ON public.trading_pairs TO authenticated;
GRANT SELECT ON public.trading_pairs TO anon;

-- 9. Verify the setup
SELECT 'Verification Results' as check_type;

SELECT 'Admin user in auth.users' as table_name,
       id,
       email,
       created_at
FROM auth.users
WHERE email = 'admin@kryvex.com';

SELECT 'Admin profile in public.profiles' as table_name,
       user_id,
       email,
       full_name,
       kyc_status,
       account_status,
       funding_wallet,
       trading_wallet
FROM public.profiles
WHERE email = 'admin@kryvex.com';

SELECT 'Admin role in public.user_roles' as table_name,
       user_id,
       role
FROM public.user_roles
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'admin@kryvex.com'
);

-- 10. Test the has_role function
SELECT 'has_role function test' as test_type,
       public.has_role(
           (SELECT id FROM auth.users WHERE email = 'admin@kryvex.com'),
           'admin'
       ) as is_admin;

-- 11. Final verification
SELECT 'Final Setup Summary' as summary,
       (SELECT COUNT(*) FROM auth.users WHERE email = 'admin@kryvex.com') as admin_users_count,
       (SELECT COUNT(*) FROM public.profiles WHERE email = 'admin@kryvex.com') as admin_profiles_count,
       (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') as admin_roles_count,
       (SELECT COUNT(*) FROM public.trading_pairs) as trading_pairs_count;

-- 12. Show admin credentials
SELECT 'Admin Login Credentials' as info,
       'admin@kryvex.com' as email,
       'Kryvex.@123' as password;

-- 13. Show wallet structure example
SELECT 'Wallet Structure Example' as info,
       '{"USDT": {"balance": "10000.00", "usdValue": "$10000.00", "available": "10000.00"}}'::jsonb as funding_wallet_example,
       '{"USDT": {"balance": "10000.00000000", "usdValue": "$10000.00", "available": "10000.00000000"}, "BTC": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}, "ETH": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}}'::jsonb as trading_wallet_example;
