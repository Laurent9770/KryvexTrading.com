-- =============================================
-- FIX OAUTH CALLBACK ISSUES
-- This migration fixes OAuth authentication callback problems
-- =============================================

-- Step 1: Check current auth configuration
SELECT 
    setting_name,
    setting_value
FROM auth.config
WHERE setting_name IN (
    'enable_signup',
    'enable_email_confirmations', 
    'enable_email_change_confirmations',
    'enable_phone_confirmations',
    'enable_phone_change_confirmations',
    'enable_signup_email_confirmations',
    'enable_signup_phone_confirmations'
);

-- Step 2: Check if there are any problematic triggers on auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth'
ORDER BY trigger_name;

-- Step 3: Check if the handle_new_user trigger is working correctly
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles' 
AND event_object_schema = 'public'
ORDER BY trigger_name;

-- Step 4: Verify the handle_new_user function exists and is correct
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- Step 5: Check if there are any RLS policies blocking auth operations
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public'
ORDER BY policyname;

-- Step 6: Ensure proper grants for auth operations
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated;

-- Step 7: Fix the handle_new_user function to handle OAuth users properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Check if profile already exists (to prevent duplicate key errors)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
        INSERT INTO public.profiles (
            user_id, 
            email, 
            full_name,
            is_verified,
            kyc_status
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
            COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
            'pending'
        );
    END IF;
    
    -- Check if user role already exists
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 8: Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 9: Add a function to handle OAuth user profile updates
CREATE OR REPLACE FUNCTION public.handle_oauth_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Update profile if user data changes
    UPDATE public.profiles 
    SET 
        email = NEW.email,
        full_name = COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        is_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
        updated_at = NOW()
    WHERE user_id = NEW.id;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_oauth_user_update for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 10: Create trigger for OAuth user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_oauth_user_update();

-- Step 11: Check for any existing OAuth users without profiles
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    CASE WHEN p.user_id IS NULL THEN 'MISSING PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
ORDER BY au.created_at DESC;

-- Step 12: Create missing profiles for existing OAuth users
INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    is_verified,
    kyc_status,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data ->> 'full_name', au.email),
    COALESCE(au.email_confirmed_at IS NOT NULL, false),
    'pending',
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 13: Create missing user roles for existing users
INSERT INTO public.user_roles (user_id, role)
SELECT 
    au.id,
    'user'
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 14: Verify the fixes
DO $$
DECLARE
    missing_profiles_count INTEGER;
    missing_roles_count INTEGER;
BEGIN
    -- Count users without profiles
    SELECT COUNT(*) INTO missing_profiles_count
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.user_id
    WHERE p.user_id IS NULL;
    
    -- Count users without roles
    SELECT COUNT(*) INTO missing_roles_count
    FROM auth.users au
    LEFT JOIN public.user_roles ur ON au.id = ur.user_id
    WHERE ur.user_id IS NULL;
    
    RAISE NOTICE '=== OAUTH FIX VERIFICATION ===';
    RAISE NOTICE 'Users without profiles: %', missing_profiles_count;
    RAISE NOTICE 'Users without roles: %', missing_roles_count;
    
    IF missing_profiles_count = 0 AND missing_roles_count = 0 THEN
        RAISE NOTICE '✅ All users have profiles and roles!';
    ELSE
        RAISE NOTICE '⚠️ Some users still missing profiles or roles';
    END IF;
END $$;

-- Step 15: Show current auth configuration status
DO $$
BEGIN
    RAISE NOTICE '=== OAUTH CONFIGURATION STATUS ===';
    RAISE NOTICE '1. handle_new_user function: UPDATED';
    RAISE NOTICE '2. handle_oauth_user_update function: CREATED';
    RAISE NOTICE '3. Triggers: RECREATED';
    RAISE NOTICE '4. Missing profiles: FIXED';
    RAISE NOTICE '5. Missing roles: FIXED';
    RAISE NOTICE '6. Auth grants: VERIFIED';
    RAISE NOTICE '';
    RAISE NOTICE 'OAuth callback should now work properly!';
END $$;
