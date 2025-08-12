-- URGENT AUTHENTICATION FIX
-- Run this in your Supabase SQL Editor to enable email authentication

-- 1. Check current authentication status
SELECT 'Current authentication status' as info,
       (SELECT COUNT(*) FROM auth.users) as total_users,
       (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
       (SELECT COUNT(*) FROM auth.users WHERE email = 'admin@kryvex.com') as admin_users;

-- 2. Create a test user to verify email authentication works
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Create test user
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
        'test@kryvex.com',
        crypt('Test123!', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Test User"}',
        false,
        '',
        '',
        '',
        ''
    );
    
    -- Get the test user ID
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = 'test@kryvex.com';
    
    -- Create profile for test user
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
        test_user_id,
        'test@kryvex.com',
        'Test User',
        '+1234567890',
        'United States',
        1000.00,
        true,
        'approved',
        'active',
        '{"USDT": {"balance": "1000.00", "usdValue": "$1000.00", "available": "1000.00"}}'::jsonb,
        '{"USDT": {"balance": "1000.00000000", "usdValue": "$1000.00", "available": "1000.00000000"}, "BTC": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}, "ETH": {"balance": "0.00000000", "usdValue": "$0.00", "available": "0.00000000"}}'::jsonb,
        now(),
        now()
    );
    
    RAISE NOTICE 'Test user created with ID: %', test_user_id;
END $$;

-- 3. Ensure admin user is properly configured
UPDATE auth.users
SET email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'admin@kryvex.com';

-- 4. Verify all users are properly configured
SELECT 'User verification' as info,
       u.id,
       u.email,
       u.email_confirmed_at,
       u.created_at,
       p.full_name,
       p.kyc_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
ORDER BY u.created_at;

-- 5. Test password verification for both users
SELECT 'Password verification test' as test_type,
       'admin@kryvex.com' as email,
       CASE 
           WHEN crypt('Kryvex.@123', (SELECT encrypted_password FROM auth.users WHERE email = 'admin@kryvex.com')) = (SELECT encrypted_password FROM auth.users WHERE email = 'admin@kryvex.com')
           THEN 'Password is correct'
           ELSE 'Password is incorrect'
       END as password_status;

SELECT 'Password verification test' as test_type,
       'test@kryvex.com' as email,
       CASE 
           WHEN crypt('Test123!', (SELECT encrypted_password FROM auth.users WHERE email = 'test@kryvex.com')) = (SELECT encrypted_password FROM auth.users WHERE email = 'test@kryvex.com')
           THEN 'Password is correct'
           ELSE 'Password is incorrect'
       END as password_status;

-- 6. Final verification
SELECT 'Authentication fix complete' as status,
       'Email authentication should now work' as message,
       'Test credentials created' as note;

-- 7. Show all available login credentials
SELECT 'Available Login Credentials' as info,
       'admin@kryvex.com' as admin_email,
       'Kryvex.@123' as admin_password,
       'test@kryvex.com' as test_email,
       'Test123!' as test_password;
