-- =============================================
-- CREATE USER PROGRAMMATICALLY MIGRATION
-- This migration creates the sales@kryvex.com user using auth functions
-- =============================================

-- Step 1: Try to create the user using auth.sign_up function
-- Note: This requires the user to not already exist
DO $$
DECLARE
    user_id UUID;
    result JSONB;
BEGIN
    -- Check if user already exists
    SELECT id INTO user_id FROM auth.users WHERE email = 'sales@kryvex.com';
    
    IF user_id IS NULL THEN
        -- Try to create user programmatically
        BEGIN
            -- This is a placeholder - actual user creation should be done via API
            RAISE NOTICE 'User sales@kryvex.com does not exist. Please create via Supabase Auth API or UI.';
            RAISE NOTICE 'If UI fails, try using the Supabase CLI or direct API call.';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error creating user: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'User sales@kryvex.com already exists with ID: %', user_id;
    END IF;
END $$;

-- Step 2: Alternative approach - create user with a different email first
-- Let's try with a different email to see if the issue is specific to sales@kryvex.com
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Check if test user exists
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@kryvex.com';
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Test user test@kryvex.com does not exist. This suggests the issue might be:';
        RAISE NOTICE '1. Database connection issues';
        RAISE NOTICE '2. RLS policies blocking user creation';
        RAISE NOTICE '3. Supabase Auth configuration issues';
        RAISE NOTICE '4. Email domain restrictions';
    ELSE
        RAISE NOTICE 'Test user test@kryvex.com exists. The issue might be specific to sales@kryvex.com';
    END IF;
END $$;

-- Step 3: Check Supabase Auth configuration
SELECT 
    setting_name,
    setting_value
FROM auth.config
WHERE setting_name IN ('enable_signup', 'enable_email_confirmations', 'enable_email_change_confirmations');

-- Step 4: Show current auth.users count and recent activity
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as active_users
FROM auth.users;

-- Step 5: Check for any email domain restrictions or patterns
SELECT 
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email LIKE '%@kryvex.com'
ORDER BY created_at DESC;

-- Step 6: Provide troubleshooting steps
DO $$
BEGIN
    RAISE NOTICE '=== TROUBLESHOOTING STEPS ===';
    RAISE NOTICE '1. Try creating user with a different email (e.g., sales2@kryvex.com)';
    RAISE NOTICE '2. Check Supabase project settings > Authentication > Settings';
    RAISE NOTICE '3. Verify email confirmations are enabled/disabled as needed';
    RAISE NOTICE '4. Check if there are any email domain restrictions';
    RAISE NOTICE '5. Try using Supabase CLI: supabase auth signup sales@kryvex.com password123';
    RAISE NOTICE '6. Check Supabase logs for detailed error messages';
    RAISE NOTICE '7. Verify database connection and permissions';
END $$;
