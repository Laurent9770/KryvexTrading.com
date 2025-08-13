-- =============================================
-- FIX MISSING PROFILES FOR EXISTING USERS
-- This migration creates profiles for users that are missing them
-- =============================================

-- Step 1: Create profiles for the specific users shown in the results
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
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data ->> 'full_name', au.email) as full_name,
    COALESCE(au.email_confirmed_at IS NOT NULL, false) as is_verified,
    'pending' as kyc_status,
    0 as account_balance,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

-- Step 2: Verify the profiles were created
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    CASE WHEN p.user_id IS NULL THEN 'MISSING PROFILE' ELSE 'HAS PROFILE' END as profile_status,
    p.full_name,
    p.is_verified,
    p.kyc_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE au.email IN (
    'bonnieking645@gmail.com',
    'profitpulse676@gmail.com', 
    'jeanlaurentkoterumutima@gmail.com',
    'kizzolaurent@gmail.com',
    'test@kryvex.com'
)
ORDER BY au.created_at DESC;

-- Step 3: Check if the trigger is working properly
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth'
AND trigger_name = 'on_auth_user_created';

-- Step 4: Verify the handle_new_user function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- Step 5: Test the trigger by creating a test user (will be cleaned up)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Create a test user to verify trigger works
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'test-trigger@example.com',
        crypt('testpassword', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW()
    ) RETURNING id INTO test_user_id;
    
    -- Check if profile was created
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = test_user_id) THEN
        RAISE NOTICE '✅ Trigger test PASSED - profile created for test user';
    ELSE
        RAISE NOTICE '❌ Trigger test FAILED - no profile created for test user';
    END IF;
    
    -- Clean up test user
    DELETE FROM auth.users WHERE id = test_user_id;
    DELETE FROM public.profiles WHERE user_id = test_user_id;
    
END $$;

-- Step 6: Show final status
DO $$
DECLARE
    total_users INTEGER;
    users_with_profiles INTEGER;
    missing_profiles INTEGER;
BEGIN
    -- Count total users
    SELECT COUNT(*) INTO total_users FROM auth.users;
    
    -- Count users with profiles
    SELECT COUNT(*) INTO users_with_profiles 
    FROM auth.users au
    JOIN public.profiles p ON au.id = p.user_id;
    
    -- Calculate missing profiles
    missing_profiles := total_users - users_with_profiles;
    
    RAISE NOTICE '=== PROFILE FIX STATUS ===';
    RAISE NOTICE 'Total users: %', total_users;
    RAISE NOTICE 'Users with profiles: %', users_with_profiles;
    RAISE NOTICE 'Missing profiles: %', missing_profiles;
    
    IF missing_profiles = 0 THEN
        RAISE NOTICE '✅ All users now have profiles!';
    ELSE
        RAISE NOTICE '⚠️ Still have % users without profiles', missing_profiles;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'The trigger should now work for new user registrations.';
END $$;
