-- =====================================================
-- AGGRESSIVE RLS FIX - BREAK INFINITE RECURSION
-- =====================================================
-- Completely disable RLS on problematic tables to fix 500 errors
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🚨 AGGRESSIVE RLS FIX - BREAKING INFINITE RECURSION...';
    
    -- 1. COMPLETELY DISABLE RLS ON PROBLEMATIC TABLES
    -- =====================================================
    
    ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_wallets DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.wallet_transactions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.admin_actions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '✅ RLS DISABLED on all problematic tables';
    
    -- 2. DROP ALL EXISTING POLICIES
    -- =====================================================
    
    -- Drop user_roles policies
    DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Allow authenticated users to view roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Allow authenticated users to insert roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Allow authenticated users to update roles" ON public.user_roles;
    
    -- Drop profiles policies
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON public.profiles;
    
    -- Drop user_wallets policies
    DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_wallets;
    DROP POLICY IF EXISTS "Users can update own wallets" ON public.user_wallets;
    DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
    DROP POLICY IF EXISTS "Admins can manage all wallets" ON public.user_wallets;
    
    -- Drop wallet_transactions policies
    DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
    DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;
    DROP POLICY IF EXISTS "Admins can view all transactions" ON public.wallet_transactions;
    DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.wallet_transactions;
    
    -- Drop admin_actions policies
    DROP POLICY IF EXISTS "Admins can view admin actions" ON public.admin_actions;
    DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;
    DROP POLICY IF EXISTS "Admins can manage admin actions" ON public.admin_actions;
    
    -- Drop admins policies
    DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
    DROP POLICY IF EXISTS "Admins can manage admins" ON public.admins;
    
    RAISE NOTICE '✅ ALL POLICIES DROPPED';
    
    -- 3. VERIFY THE FIX
    -- =====================================================
    
    RAISE NOTICE '🧪 TESTING THE FIX...';
    
    -- Test if we can query user_roles without recursion
    BEGIN
        PERFORM COUNT(*) FROM public.user_roles LIMIT 1;
        RAISE NOTICE '✅ user_roles table is now queryable without recursion';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ user_roles still having issues: %', SQLERRM;
    END;
    
    -- Test if we can query profiles without recursion
    BEGIN
        PERFORM COUNT(*) FROM public.profiles LIMIT 1;
        RAISE NOTICE '✅ profiles table is now queryable without recursion';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ profiles still having issues: %', SQLERRM;
    END;
    
    -- Test if we can query user_wallets
    BEGIN
        PERFORM COUNT(*) FROM public.user_wallets LIMIT 1;
        RAISE NOTICE '✅ user_wallets table is now queryable';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ user_wallets having issues: %', SQLERRM;
    END;
    
    -- Test if we can query wallet_transactions
    BEGIN
        PERFORM COUNT(*) FROM public.wallet_transactions LIMIT 1;
        RAISE NOTICE '✅ wallet_transactions table is now queryable';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ wallet_transactions having issues: %', SQLERRM;
    END;
    
    RAISE NOTICE '🎯 AGGRESSIVE RLS FIX COMPLETE!';
    RAISE NOTICE '📱 The frontend should now work without 500 errors.';
    RAISE NOTICE '⚠️ RLS is disabled - this is for mock environment only!';
    
END $$;

-- 4. SHOW CURRENT RLS STATUS
-- =====================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_roles', 'profiles', 'user_wallets', 'wallet_transactions', 'admin_actions', 'admins')
ORDER BY tablename;
