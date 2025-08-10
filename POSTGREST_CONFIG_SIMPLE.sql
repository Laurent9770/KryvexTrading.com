-- =====================================================
-- SIMPLIFIED POSTGREST CONFIGURATION
-- =====================================================
-- This script configures PostgREST without relying on the postgrest role

-- 1. Set the search path to include public schema
ALTER DATABASE postgres SET search_path TO public, auth, extensions;

-- 2. Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 3. Grant necessary permissions to anon users (for public data)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.trading_pairs TO anon;

-- 4. Ensure all sequences are accessible
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 5. Grant function execution permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- 6. Verify configuration
SELECT 
    'Schema permissions' as check_type,
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY grantee, privilege_type;

-- 7. Test basic access
SELECT 'Configuration test' as status, 
       COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'transactions', 'withdrawals', 'trading_pairs');
