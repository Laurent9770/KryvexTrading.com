-- FINAL ADMIN USER CREATION - CLEAN AND SIMPLE
-- Run this in your Supabase SQL Editor

-- 1. Create admin user in auth.users (if not exists)
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
    
    -- 2. Create profile for admin user with proper JSONB wallet structure
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
    
    -- 3. Assign admin role (if not exists)
    DELETE FROM public.user_roles
    WHERE user_id = admin_user_id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin profile and role created successfully';
    
END $$;

-- 4. Verify the setup
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

-- 5. Test the has_role function
SELECT 'has_role function test' as test_type,
       public.has_role(
           (SELECT id FROM auth.users WHERE email = 'admin@kryvex.com'),
           'admin'
       ) as is_admin;

-- 6. Final verification
SELECT 'Final Setup Summary' as summary,
       (SELECT COUNT(*) FROM auth.users WHERE email = 'admin@kryvex.com') as admin_users_count,
       (SELECT COUNT(*) FROM public.profiles WHERE email = 'admin@kryvex.com') as admin_profiles_count,
       (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') as admin_roles_count;

-- 7. Show admin credentials
SELECT 'Admin Login Credentials' as info,
       'admin@kryvex.com' as email,
       'Kryvex.@123' as password;
