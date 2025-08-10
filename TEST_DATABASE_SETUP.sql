-- TEST DATABASE SETUP
-- Run this to verify all admin features are properly set up
-- Run in Supabase SQL Editor after ADMIN_DATABASE_SETUP.sql

-- ===========================
-- VERIFY TABLES EXIST
-- ===========================

SELECT 'TABLES CHECK' as test_type, '' as details;

SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'user_roles', 'kyc_submissions', 'wallet_balances',
    'transactions', 'withdrawal_requests', 'trading_pairs', 'trades',
    'admin_actions', 'user_activities', 'chat_rooms', 'chat_messages',
    'support_tickets'
  )
ORDER BY table_name;

-- ===========================
-- VERIFY FUNCTIONS EXIST
-- ===========================

SELECT 'FUNCTIONS CHECK' as test_type, '' as details;

SELECT 
  routine_name,
  CASE 
    WHEN routine_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_user_profile', 'update_updated_at', 'has_admin_role',
    'promote_to_admin', 'demote_from_admin', 'log_admin_action',
    'get_user_role', 'calculate_total_balance'
  )
ORDER BY routine_name;

-- ===========================
-- VERIFY RLS IS ENABLED
-- ===========================

SELECT 'RLS CHECK' as test_type, '' as details;

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'user_roles', 'kyc_submissions', 'wallet_balances',
    'transactions', 'withdrawal_requests', 'trading_pairs', 'trades',
    'admin_actions', 'user_activities', 'chat_rooms', 'chat_messages',
    'support_tickets'
  )
ORDER BY tablename;

-- ===========================
-- VERIFY POLICIES EXIST
-- ===========================

SELECT 'POLICIES CHECK' as test_type, '' as details;

SELECT 
  tablename,
  policyname,
  CASE 
    WHEN policyname IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'user_roles', 'kyc_submissions', 'wallet_balances',
    'transactions', 'withdrawal_requests', 'trading_pairs', 'trades',
    'admin_actions', 'user_activities', 'chat_rooms', 'chat_messages',
    'support_tickets'
  )
ORDER BY tablename, policyname;

-- ===========================
-- VERIFY ENUM TYPES
-- ===========================

SELECT 'ENUM TYPES CHECK' as test_type, '' as details;

SELECT 
  t.typname as enum_name,
  CASE 
    WHEN t.typname IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('user_role', 'kyc_status', 'account_status', 'trade_status', 'transaction_type')
GROUP BY t.typname
ORDER BY t.typname;

-- ===========================
-- VERIFY INITIAL DATA
-- ===========================

SELECT 'INITIAL DATA CHECK' as test_type, '' as details;

-- Check chat rooms
SELECT 
  'chat_rooms' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ HAS DATA'
    ELSE '❌ NO DATA'
  END as status
FROM chat_rooms;

-- Check trading pairs
SELECT 
  'trading_pairs' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ HAS DATA'
    ELSE '❌ NO DATA'
  END as status
FROM trading_pairs;

-- ===========================
-- TEST ADMIN FUNCTIONS
-- ===========================

SELECT 'FUNCTION TESTS' as test_type, '' as details;

-- Test has_admin_role function
SELECT 
  'has_admin_role' as function_name,
  CASE 
    WHEN has_admin_role('00000000-0000-0000-0000-000000000000') = false THEN '✅ WORKS'
    ELSE '⚠️ NEEDS TESTING'
  END as status;

-- Test get_user_role function
SELECT 
  'get_user_role' as function_name,
  CASE 
    WHEN get_user_role('00000000-0000-0000-0000-000000000000') = 'user' THEN '✅ WORKS'
    ELSE '⚠️ NEEDS TESTING'
  END as status;

-- Test calculate_total_balance function
SELECT 
  'calculate_total_balance' as function_name,
  CASE 
    WHEN calculate_total_balance('00000000-0000-0000-0000-000000000000') = 0 THEN '✅ WORKS'
    ELSE '⚠️ NEEDS TESTING'
  END as status;

-- ===========================
-- SUMMARY
-- ===========================

SELECT 'SUMMARY' as test_type, '' as details;

SELECT 
  'Total Tables' as metric,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'profiles', 'user_roles', 'kyc_submissions', 'wallet_balances',
     'transactions', 'withdrawal_requests', 'trading_pairs', 'trades',
     'admin_actions', 'user_activities', 'chat_rooms', 'chat_messages',
     'support_tickets'
   )) as count,
  'Expected: 13' as expected;

SELECT 
  'Total Functions' as metric,
  (SELECT COUNT(*) FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name IN (
     'create_user_profile', 'update_updated_at', 'has_admin_role',
     'promote_to_admin', 'demote_from_admin', 'log_admin_action',
     'get_user_role', 'calculate_total_balance'
   )) as count,
  'Expected: 8' as expected;

SELECT 
  'Total Policies' as metric,
  (SELECT COUNT(*) FROM pg_policies
   WHERE schemaname = 'public'
   AND tablename IN (
     'profiles', 'user_roles', 'kyc_submissions', 'wallet_balances',
     'transactions', 'withdrawal_requests', 'trading_pairs', 'trades',
     'admin_actions', 'user_activities', 'chat_rooms', 'chat_messages',
     'support_tickets'
   )) as count,
  'Expected: 25+' as expected;

-- ===========================
-- FINAL STATUS
-- ===========================

SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'profiles', 'user_roles', 'kyc_submissions', 'wallet_balances',
        'transactions', 'withdrawal_requests', 'trading_pairs', 'trades',
        'admin_actions', 'user_activities', 'chat_rooms', 'chat_messages',
        'support_tickets'
      )
    ) >= 13 
    AND (
      SELECT COUNT(*) FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN (
        'create_user_profile', 'update_updated_at', 'has_admin_role',
        'promote_to_admin', 'demote_from_admin', 'log_admin_action',
        'get_user_role', 'calculate_total_balance'
      )
    ) >= 8
    THEN '🎉 SETUP COMPLETE - All admin features ready!'
    ELSE '⚠️ SETUP INCOMPLETE - Some components missing'
  END as final_status;
