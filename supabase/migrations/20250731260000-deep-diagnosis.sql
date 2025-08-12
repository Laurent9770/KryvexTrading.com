-- =============================================
-- DEEP DIAGNOSIS FOR USER CREATION FAILURE
-- =============================================

-- Step 1: Check database connection and basic functionality
DO $$
BEGIN
    RAISE NOTICE '=== DATABASE CONNECTION TEST ===';
    RAISE NOTICE 'Database connection: OK';
    RAISE NOTICE 'Current timestamp: %', NOW();
    RAISE NOTICE 'Current user: %', current_user;
    RAISE NOTICE 'Current database: %', current_database();
END $$;

-- Step 2: Check if auth schema exists and is accessible
SELECT 
    schema_name,
    schema_owner
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- Step 3: Check auth.users table permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY grantee, privilege_type;

-- Step 4: Check if there are any triggers on auth.users that might be causing issues
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- Step 5: Check for any foreign key constraints that might be blocking user creation
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'users'
AND tc.table_schema = 'auth';

-- Step 6: Check if there are any RLS policies on auth.users (shouldn't be any)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'auth';

-- Step 7: Check for any database locks or blocking processes
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query
FROM pg_stat_activity 
WHERE state = 'active' 
AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start;

-- Step 8: Check database size and available space
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size,
    pg_size_pretty(pg_total_relation_size('auth.users')) as auth_users_size;

-- Step 9: Check if there are any recent errors in the database logs
-- (This is informational - actual logs are in Supabase dashboard)
DO $$
BEGIN
    RAISE NOTICE '=== CHECK SUPABASE LOGS ===';
    RAISE NOTICE 'Go to Supabase Dashboard > Logs to check for recent errors';
    RAISE NOTICE 'Look for errors around the time you tried to create users';
END $$;

-- Step 10: Test basic INSERT operation on auth.users (this will fail but show the error)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    RAISE NOTICE '=== TESTING BASIC INSERT OPERATION ===';
    
    -- This will likely fail, but it will show us the exact error
    BEGIN
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'test-insert@example.com',
            crypt('testpassword', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Basic INSERT test PASSED';
        
        -- Clean up
        DELETE FROM auth.users WHERE email = 'test-insert@example.com';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Basic INSERT test FAILED: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
    END;
END $$;

-- Step 11: Check if the issue is with the profiles table trigger
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles' 
AND event_object_schema = 'public';

-- Step 12: Check profiles table structure and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 13: Check for any unique constraints that might conflict
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' 
AND tc.table_schema = 'public'
AND tc.constraint_type = 'UNIQUE';

-- Step 14: Final recommendations
DO $$
BEGIN
    RAISE NOTICE '=== RECOMMENDATIONS ===';
    RAISE NOTICE '1. Check Supabase Dashboard > Logs for detailed error messages';
    RAISE NOTICE '2. Verify Supabase project is not paused or in maintenance mode';
    RAISE NOTICE '3. Check if you have reached user limits on your Supabase plan';
    RAISE NOTICE '4. Try creating user via Supabase CLI if available';
    RAISE NOTICE '5. Check if there are any email domain restrictions in Auth settings';
    RAISE NOTICE '6. Verify database connection and API keys are correct';
    RAISE NOTICE '7. Consider contacting Supabase support if issue persists';
END $$;
