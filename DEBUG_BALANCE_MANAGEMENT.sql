-- =============================================
-- DEBUG BALANCE MANAGEMENT SYSTEM
-- Comprehensive debugging script to check all tables and relationships
-- =============================================

-- Step 1: Check if all required tables exist
DO $$
DECLARE
    table_exists BOOLEAN;
    missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    RAISE NOTICE '=== CHECKING TABLE EXISTENCE ===';
    
    -- Check auth.users
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) INTO table_exists;
    IF NOT table_exists THEN
        missing_tables := array_append(missing_tables, 'auth.users');
    END IF;
    
    -- Check public.profiles
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) INTO table_exists;
    IF NOT table_exists THEN
        missing_tables := array_append(missing_tables, 'public.profiles');
    END IF;
    
    -- Check public.user_roles
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_roles'
    ) INTO table_exists;
    IF NOT table_exists THEN
        missing_tables := array_append(missing_tables, 'public.user_roles');
    END IF;
    
    -- Check public.user_wallets
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_wallets'
    ) INTO table_exists;
    IF NOT table_exists THEN
        missing_tables := array_append(missing_tables, 'public.user_wallets');
    END IF;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE '❌ Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ All required tables exist';
    END IF;
END $$;

-- Step 2: Check table structures
DO $$
DECLARE
    column_info RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING TABLE STRUCTURES ===';
    
    -- Check profiles table structure
    RAISE NOTICE 'Profiles table columns:';
    FOR column_info IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %: % (nullable: %, default: %)', 
            column_info.column_name, 
            column_info.data_type, 
            column_info.is_nullable, 
            column_info.column_default;
    END LOOP;
    
    -- Check user_wallets table structure
    RAISE NOTICE 'User_wallets table columns:';
    FOR column_info IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_wallets'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %: % (nullable: %, default: %)', 
            column_info.column_name, 
            column_info.data_type, 
            column_info.is_nullable, 
            column_info.column_default;
    END LOOP;
END $$;

-- Step 3: Check sample data from each table
SELECT '=== SAMPLE AUTH USERS ===' as info;
SELECT 
    id, 
    email, 
    created_at 
FROM auth.users 
LIMIT 5;

SELECT '=== SAMPLE PROFILES ===' as info;
SELECT 
    user_id, 
    email, 
    full_name, 
    is_verified, 
    kyc_status,
    CASE 
        WHEN column_exists('public', 'profiles', 'account_status') 
        THEN account_status::text 
        ELSE 'column_not_exists' 
    END as account_status
FROM public.profiles 
LIMIT 5;

SELECT '=== SAMPLE USER ROLES ===' as info;
SELECT 
    user_id, 
    role 
FROM public.user_roles 
LIMIT 5;

SELECT '=== SAMPLE USER WALLETS ===' as info;
SELECT 
    user_id, 
    wallet_type, 
    asset, 
    balance,
    created_at,
    updated_at
FROM public.user_wallets 
LIMIT 5;

-- Step 4: Check data relationships
SELECT '=== DATA RELATIONSHIP ANALYSIS ===' as info;

-- Check users without profiles
SELECT 
    'Users without profiles' as check_type,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- Check users without roles
SELECT 
    'Users without roles' as check_type,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL;

-- Check users without wallets
SELECT 
    'Users without wallets' as check_type,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN public.user_wallets uw ON u.id = uw.user_id
WHERE uw.user_id IS NULL;

-- Check profiles without users
SELECT 
    'Profiles without users' as check_type,
    COUNT(*) as count
FROM public.profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- Step 5: Test the view creation with simplified queries
DO $$
BEGIN
    RAISE NOTICE '=== TESTING VIEW CREATION ===';
    
    -- Test basic join without problematic columns
    BEGIN
        CREATE TEMP TABLE test_view AS
        SELECT 
            u.id as user_id,
            u.email,
            p.full_name,
            p.is_verified,
            p.kyc_status,
            ur.role,
            uw.wallet_type,
            uw.asset,
            uw.balance,
            u.created_at as user_created_at
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.user_id
        LEFT JOIN public.user_roles ur ON u.id = ur.user_id
        LEFT JOIN public.user_wallets uw ON u.id = uw.user_id
        LIMIT 1;
        
        DROP TABLE test_view;
        RAISE NOTICE '✅ Basic view query works';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Basic view query failed: %', SQLERRM;
    END;
    
    -- Test with account_status column
    BEGIN
        CREATE TEMP TABLE test_view_with_status AS
        SELECT 
            u.id as user_id,
            u.email,
            p.full_name,
            p.is_verified,
            p.kyc_status,
            COALESCE(p.account_status, 'active') as account_status,
            ur.role,
            uw.wallet_type,
            uw.asset,
            uw.balance,
            u.created_at as user_created_at
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.user_id
        LEFT JOIN public.user_roles ur ON u.id = ur.user_id
        LEFT JOIN public.user_wallets uw ON u.id = uw.user_id
        LIMIT 1;
        
        DROP TABLE test_view_with_status;
        RAISE NOTICE '✅ View query with account_status works';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ View query with account_status failed: %', SQLERRM;
    END;
END $$;

-- Step 6: Check for any existing balance management objects
SELECT '=== EXISTING BALANCE MANAGEMENT OBJECTS ===' as info;

-- Check for existing balance_history table
SELECT 
    'balance_history table' as object_type,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'balance_history'
    ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status;

-- Check for existing admin views
SELECT 
    'admin_user_balances view' as object_type,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' AND view_name = 'admin_user_balances'
    ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status;

SELECT 
    'admin_balance_summary view' as object_type,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' AND view_name = 'admin_balance_summary'
    ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status;

-- Check for existing functions
SELECT 
    'update_user_balance function' as object_type,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'update_user_balance'
    ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status;

SELECT 
    'get_system_balance_stats function' as object_type,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'get_system_balance_stats'
    ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status;

-- Step 7: Summary and recommendations
DO $$
BEGIN
    RAISE NOTICE '=== SUMMARY AND RECOMMENDATIONS ===';
    RAISE NOTICE '';
    RAISE NOTICE 'If all tables exist and have data:';
    RAISE NOTICE '1. Run the account_status migration first';
    RAISE NOTICE '2. Then run the balance management migration';
    RAISE NOTICE '3. Test with the TEST_BALANCE_MANAGEMENT.sql script';
    RAISE NOTICE '';
    RAISE NOTICE 'If there are missing tables or data:';
    RAISE NOTICE '1. Ensure all required tables are created';
    RAISE NOTICE '2. Populate tables with sample data';
    RAISE NOTICE '3. Then run the balance management migrations';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Debugging complete!';
END $$;
