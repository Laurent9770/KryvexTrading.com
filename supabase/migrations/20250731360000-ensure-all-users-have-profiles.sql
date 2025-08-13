-- =============================================
-- ENSURE ALL USERS HAVE PROFILES
-- This migration creates missing profiles for users in auth.users
-- =============================================

-- Step 1: Check for users without profiles
DO $$
DECLARE
    users_without_profiles_count INTEGER;
    total_auth_users INTEGER;
    total_profiles INTEGER;
BEGIN
    -- Count users in auth.users
    SELECT COUNT(*) INTO total_auth_users FROM auth.users;
    
    -- Count profiles
    SELECT COUNT(*) INTO total_profiles FROM public.profiles;
    
    -- Count users without profiles
    SELECT COUNT(*) INTO users_without_profiles_count
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.user_id
    WHERE p.user_id IS NULL;
    
    RAISE NOTICE '=== USER PROFILE ANALYSIS ===';
    RAISE NOTICE 'Total auth.users: %', total_auth_users;
    RAISE NOTICE 'Total profiles: %', total_profiles;
    RAISE NOTICE 'Users without profiles: %', users_without_profiles_count;
    
    IF users_without_profiles_count > 0 THEN
        RAISE NOTICE '⚠️ Found % users without profiles - will create them', users_without_profiles_count;
    ELSE
        RAISE NOTICE '✅ All users have profiles';
    END IF;
END $$;

-- Step 2: Create missing profiles for users in auth.users
INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    is_verified,
    kyc_status,
    account_balance,
    created_at,
    updated_at
)
SELECT 
    au.id as user_id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    COALESCE(au.email_confirmed_at IS NOT NULL, false) as is_verified,
    'pending' as kyc_status,
    0 as account_balance,
    au.created_at,
    au.updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Create missing user roles for users without roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
    au.id as user_id,
    'user' as role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Create missing wallet entries for users
INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance)
SELECT 
    au.id as user_id,
    'funding' as wallet_type,
    'USD' as asset,
    0 as balance
FROM auth.users au
LEFT JOIN public.user_wallets uw ON au.id = uw.user_id AND uw.wallet_type = 'funding'
WHERE uw.user_id IS NULL
ON CONFLICT (user_id, wallet_type, asset) DO NOTHING;

INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance)
SELECT 
    au.id as user_id,
    'trading' as wallet_type,
    'USDT' as asset,
    0 as balance
FROM auth.users au
LEFT JOIN public.user_wallets uw ON au.id = uw.user_id AND uw.wallet_type = 'trading'
WHERE uw.user_id IS NULL
ON CONFLICT (user_id, wallet_type, asset) DO NOTHING;

-- Step 5: Verify the fixes
DO $$
DECLARE
    final_auth_users INTEGER;
    final_profiles INTEGER;
    final_roles INTEGER;
    final_wallets INTEGER;
    users_still_missing_profiles INTEGER;
BEGIN
    -- Count final numbers
    SELECT COUNT(*) INTO final_auth_users FROM auth.users;
    SELECT COUNT(*) INTO final_profiles FROM public.profiles;
    SELECT COUNT(*) INTO final_roles FROM public.user_roles;
    SELECT COUNT(*) INTO final_wallets FROM public.user_wallets;
    
    -- Check for any remaining users without profiles
    SELECT COUNT(*) INTO users_still_missing_profiles
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.user_id
    WHERE p.user_id IS NULL;
    
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    RAISE NOTICE 'Auth users: %', final_auth_users;
    RAISE NOTICE 'Profiles: %', final_profiles;
    RAISE NOTICE 'User roles: %', final_roles;
    RAISE NOTICE 'User wallets: %', final_wallets;
    RAISE NOTICE 'Users still missing profiles: %', users_still_missing_profiles;
    
    IF users_still_missing_profiles = 0 THEN
        RAISE NOTICE '✅ All users now have profiles, roles, and wallets!';
    ELSE
        RAISE NOTICE '❌ Some users still missing profiles!';
    END IF;
END $$;

-- Step 6: Show all users with their details
SELECT 
    au.id as user_id,
    au.email,
    au.created_at as auth_created,
    p.full_name,
    p.is_verified,
    p.kyc_status,
    ur.role,
    p.created_at as profile_created
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
ORDER BY au.created_at DESC;
