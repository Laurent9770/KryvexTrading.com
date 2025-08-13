-- =============================================
-- VERIFY PROFILES EXIST FOR ALL USERS
-- This migration ensures all users in auth.users have corresponding profiles
-- =============================================

-- Check current state
DO $$
DECLARE
    auth_users_count INTEGER;
    profiles_count INTEGER;
    missing_profiles_count INTEGER;
BEGIN
    -- Count users in auth.users
    SELECT COUNT(*) INTO auth_users_count FROM auth.users;
    
    -- Count profiles
    SELECT COUNT(*) INTO profiles_count FROM public.profiles;
    
    -- Count users without profiles
    SELECT COUNT(*) INTO missing_profiles_count
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.user_id
    WHERE p.user_id IS NULL;
    
    RAISE NOTICE '=== CURRENT STATE ===';
    RAISE NOTICE 'Auth users: %', auth_users_count;
    RAISE NOTICE 'Profiles: %', profiles_count;
    RAISE NOTICE 'Users missing profiles: %', missing_profiles_count;
END $$;

-- Create missing profiles for users in auth.users
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

-- Create missing user roles for users without roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
    au.id as user_id,
    'user' as role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Create missing wallet entries for users
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

-- Final verification
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

-- Show all users with their details
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
