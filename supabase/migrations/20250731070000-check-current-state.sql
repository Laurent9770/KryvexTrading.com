-- Diagnostic Migration - Check Current State
-- This migration checks what exists and what's missing

-- Check what tables exist
DO $$
DECLARE
    tbl_name TEXT;
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== CHECKING TABLES ===';
    
    -- Check profiles table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) INTO table_exists;
    RAISE NOTICE 'profiles table exists: %', table_exists;
    
    -- Check trades table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'trades'
    ) INTO table_exists;
    RAISE NOTICE 'trades table exists: %', table_exists;
    
    -- Check withdrawal_requests table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'withdrawal_requests'
    ) INTO table_exists;
    RAISE NOTICE 'withdrawal_requests table exists: %', table_exists;
    
    -- Check deposits table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'deposits'
    ) INTO table_exists;
    RAISE NOTICE 'deposits table exists: %', table_exists;
    
    -- Check admin_actions table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'admin_actions'
    ) INTO table_exists;
    RAISE NOTICE 'admin_actions table exists: %', table_exists;
    
    -- Check user_wallets table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_wallets'
    ) INTO table_exists;
    RAISE NOTICE 'user_wallets table exists: %', table_exists;
END $$;

-- Check what columns exist in profiles table
DO $$
DECLARE
    col_name TEXT;
    column_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== CHECKING PROFILES COLUMNS ===';
    
    -- Check role column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) INTO column_exists;
    RAISE NOTICE 'role column exists: %', column_exists;
    
    -- Check kyc_status column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'kyc_status'
    ) INTO column_exists;
    RAISE NOTICE 'kyc_status column exists: %', column_exists;
    
    -- Check account_balance column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'account_balance'
    ) INTO column_exists;
    RAISE NOTICE 'account_balance column exists: %', column_exists;
    
    -- Check is_verified column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_verified'
    ) INTO column_exists;
    RAISE NOTICE 'is_verified column exists: %', column_exists;
END $$;

-- Check what columns exist in admin_actions table
DO $$
DECLARE
    col_name TEXT;
    column_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== CHECKING ADMIN_ACTIONS COLUMNS ===';
    
    -- Check admin_email column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'admin_actions' AND column_name = 'admin_email'
    ) INTO column_exists;
    RAISE NOTICE 'admin_email column exists: %', column_exists;
    
    -- List all columns in admin_actions
    RAISE NOTICE 'All columns in admin_actions:';
    FOR col_name IN 
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'admin_actions'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '- %', col_name;
    END LOOP;
END $$;

-- Check what functions exist
DO $$
DECLARE
    func_name TEXT;
    function_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== CHECKING FUNCTIONS ===';
    
    -- Check has_role function
    SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'has_role'
    ) INTO function_exists;
    RAISE NOTICE 'has_role function exists: %', function_exists;
    
    -- Check is_admin function
    SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'is_admin'
    ) INTO function_exists;
    RAISE NOTICE 'is_admin function exists: %', function_exists;
END $$;
