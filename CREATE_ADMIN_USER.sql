-- CREATE ADMIN USER AND FIX ALL ISSUES
-- Run this in your Supabase SQL Editor

-- 1. First, let's check if the admin user already exists
SELECT 'Checking existing users' as step, 
       COUNT(*) as user_count 
FROM auth.users 
WHERE email = 'admin@kryvex.com';

-- 2. Create the admin user in auth.users table
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
    
    -- 3. Create profile for admin user
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
        10000.00,
        10000.00,
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
    
    -- 4. Assign admin role
    DELETE FROM public.user_roles
    WHERE user_id = admin_user_id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin profile and role created successfully';
    
END $$;

-- 5. Verify the setup
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

-- 6. Test the has_role function
SELECT 'has_role function test' as test_type,
       public.has_role(
           (SELECT id FROM auth.users WHERE email = 'admin@kryvex.com'),
           'admin'
       ) as is_admin;

-- 7. Create some sample data for testing
INSERT INTO public.trading_pairs (symbol, base_currency, quote_currency, current_price, price_change_24h, volume_24h, is_active) VALUES
  ('BTC/USDT', 'BTC', 'USDT', 50000.00, 2.5, 1000000.00, true),
  ('ETH/USDT', 'ETH', 'USDT', 3000.00, 1.8, 500000.00, true),
  ('ADA/USDT', 'ADA', 'USDT', 0.50, -1.2, 100000.00, true),
  ('DOT/USDT', 'DOT', 'USDT', 20.00, 3.1, 200000.00, true),
  ('LINK/USDT', 'LINK', 'USDT', 15.00, 0.8, 150000.00, true)
ON CONFLICT (symbol) DO UPDATE SET
  current_price = EXCLUDED.current_price,
  price_change_24h = EXCLUDED.price_change_24h,
  volume_24h = EXCLUDED.volume_24h,
  updated_at = NOW();

-- 8. Final verification
SELECT 'Final Setup Summary' as summary,
       (SELECT COUNT(*) FROM auth.users WHERE email = 'admin@kryvex.com') as admin_users_count,
       (SELECT COUNT(*) FROM public.profiles WHERE email = 'admin@kryvex.com') as admin_profiles_count,
       (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') as admin_roles_count,
       (SELECT COUNT(*) FROM public.trading_pairs) as trading_pairs_count;

-- 9. Show admin credentials
SELECT 'Admin Login Credentials' as info,
       'admin@kryvex.com' as email,
       'Kryvex.@123' as password;
