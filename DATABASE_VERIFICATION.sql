-- =====================================================
-- DATABASE VERIFICATION FOR KRYVEX TRADING PLATFORM
-- =====================================================

-- Check if all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('profiles', 'wallet_transactions', 'transactions', 'withdrawals', 'trading_pairs', 'user_roles') 
        THEN '✓ Required table exists'
        ELSE '⚠ Unexpected table'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'wallet_transactions', 'transactions', 'withdrawals', 'trading_pairs', 'user_roles')
ORDER BY table_name;

-- Check if all RLS policies were created properly
SELECT 
    tablename, 
    policyname,
    CASE 
        WHEN policyname IS NOT NULL THEN '✓ Policy exists'
        ELSE '✗ Missing policy'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check if RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✓ RLS enabled'
        ELSE '✗ RLS disabled'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'wallet_transactions', 'transactions', 'withdrawals', 'trading_pairs', 'user_roles')
ORDER BY tablename;

-- Check if functions exist
SELECT 
    routine_name,
    CASE 
        WHEN routine_name IN ('handle_new_user', 'update_modified_column') 
        THEN '✓ Function exists'
        ELSE '⚠ Unexpected function'
    END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('handle_new_user', 'update_modified_column')
ORDER BY routine_name;

-- Check if triggers exist
SELECT 
    trigger_name,
    event_object_table,
    CASE 
        WHEN trigger_name IN ('on_auth_user_created', 'update_profiles_updated_at', 'update_transactions_updated_at', 'update_withdrawals_updated_at', 'update_trading_pairs_updated_at') 
        THEN '✓ Trigger exists'
        ELSE '⚠ Unexpected trigger'
    END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN ('on_auth_user_created', 'update_profiles_updated_at', 'update_transactions_updated_at', 'update_withdrawals_updated_at', 'update_trading_pairs_updated_at')
ORDER BY trigger_name;

-- Check if indexes exist
SELECT 
    indexname,
    tablename,
    CASE 
        WHEN indexname LIKE 'idx_%' THEN '✓ Index exists'
        ELSE '⚠ Unexpected index'
    END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check sample data in trading_pairs
SELECT 
    symbol,
    base_currency,
    quote_currency,
    current_price,
    CASE 
        WHEN symbol IN ('BTC/USDT', 'ETH/USDT', 'ADA/USDT') THEN '✓ Sample data exists'
        ELSE '⚠ Unexpected data'
    END as status
FROM public.trading_pairs
ORDER BY symbol;

-- Summary count
SELECT 
    'Tables' as category,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'wallet_transactions', 'transactions', 'withdrawals', 'trading_pairs', 'user_roles')

UNION ALL

SELECT 
    'Policies' as category,
    COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Functions' as category,
    COUNT(*) as count
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('handle_new_user', 'update_modified_column')

UNION ALL

SELECT 
    'Triggers' as category,
    COUNT(*) as count
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN ('on_auth_user_created', 'update_profiles_updated_at', 'update_transactions_updated_at', 'update_withdrawals_updated_at', 'update_trading_pairs_updated_at')

UNION ALL

SELECT 
    'Indexes' as category,
    COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'

UNION ALL

SELECT 
    'Trading Pairs' as category,
    COUNT(*) as count
FROM public.trading_pairs;
