-- =============================================
-- CREATE NEW ADMIN USER MIGRATION
-- This migration creates a new admin user
-- =============================================

-- Step 1: Check if the new admin user exists in auth.users
-- Note: You need to create the user in Supabase Auth first before running this migration
-- Go to Authentication > Users and create a new user with email: admin@kryvex.com

-- Step 2: Create new admin user in profiles table
INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    role,
    kyc_status,
    account_balance,
    is_verified,
    created_at,
    updated_at
)
SELECT 
    id as user_id,
    'admin@kryvex.com' as email,
    'Kryvex Admin' as full_name,
    'admin' as role,
    'approved' as kyc_status,
    10000 as account_balance,
    true as is_verified,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users 
WHERE email = 'admin@kryvex.com'
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    kyc_status = EXCLUDED.kyc_status,
    account_balance = EXCLUDED.account_balance,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

-- Step 3: Create wallet for the new admin
INSERT INTO public.user_wallets (
    user_id,
    wallet_type,
    asset,
    balance,
    created_at,
    updated_at
)
SELECT 
    id as user_id,
    'trading' as wallet_type,
    'USDT' as asset,
    10000 as balance,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users 
WHERE email = 'admin@kryvex.com'
ON CONFLICT (user_id, wallet_type, asset) DO UPDATE SET
    balance = EXCLUDED.balance,
    updated_at = NOW();

-- Step 4: Verify the new admin user was created
SELECT 
    p.user_id,
    p.email,
    p.full_name,
    p.role,
    p.kyc_status,
    p.account_balance,
    p.is_verified,
    uw.balance as wallet_balance
FROM public.profiles p
LEFT JOIN public.user_wallets uw ON p.user_id = uw.user_id AND uw.wallet_type = 'trading' AND uw.asset = 'USDT'
WHERE p.email = 'admin@kryvex.com';

-- Step 5: Test has_role function for new admin
DO $$
DECLARE
    admin_id UUID;
    is_admin BOOLEAN;
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@kryvex.com';
    IF admin_id IS NOT NULL THEN
        SELECT has_role(admin_id, 'admin') INTO is_admin;
        RAISE NOTICE 'New admin user (admin@kryvex.com) has_role(''admin''): %', is_admin;
        
        IF is_admin THEN
            RAISE NOTICE '✅ New admin user created successfully!';
        ELSE
            RAISE NOTICE '❌ New admin user creation failed!';
        END IF;
    ELSE
        RAISE NOTICE '❌ User admin@kryvex.com not found in auth.users! Please create the user in Supabase Auth first.';
    END IF;
END $$;

-- Step 6: Test admin action insertion for new admin
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@kryvex.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Test inserting an admin action
        BEGIN
            INSERT INTO public.admin_actions (
                admin_email,
                action_type,
                target_user_id,
                details,
                created_at
            ) VALUES (
                'admin@kryvex.com',
                'new_admin_created',
                admin_user_id,
                '{"action": "new_admin_created", "timestamp": "2025-07-31"}'::jsonb,
                NOW()
            );
            
            RAISE NOTICE '✅ New admin action insertion test PASSED';
            
            -- Clean up test data
            DELETE FROM public.admin_actions 
            WHERE action_type = 'new_admin_created' 
            AND admin_email = 'admin@kryvex.com';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ New admin action insertion test FAILED: %', SQLERRM;
        END;
    END IF;
END $$;

-- Step 7: Show all admin users
SELECT 
    email,
    full_name,
    role,
    kyc_status,
    is_verified,
    account_balance
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at;

-- Step 8: Final status
SELECT '🎉 New admin user creation completed! You can now log in with admin@kryvex.com' as status;
