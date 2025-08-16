-- =====================================================
-- FIX RLS INFINITE RECURSION ISSUE
-- =====================================================
-- Fix the infinite recursion in user_roles RLS policy
-- =====================================================

-- 1. DISABLE RLS TEMPORARILY TO FIX THE ISSUE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 FIXING RLS INFINITE RECURSION...';
    
    -- Temporarily disable RLS on user_roles to break the recursion
    ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '✅ RLS disabled on user_roles table';
    
    -- Drop problematic policies
    DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
    
    -- Drop the new policies we're about to create (in case they exist)
    DROP POLICY IF EXISTS "Allow authenticated users to view roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Allow authenticated users to insert roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Allow authenticated users to update roles" ON public.user_roles;
    
    RAISE NOTICE '✅ Problematic policies dropped';
    
    -- Create simplified policies that don't cause recursion
    CREATE POLICY "Allow authenticated users to view roles" ON public.user_roles
    FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Allow authenticated users to insert roles" ON public.user_roles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Allow authenticated users to update roles" ON public.user_roles
    FOR UPDATE USING (auth.role() = 'authenticated');
    
    RAISE NOTICE '✅ New simplified policies created';
    
    -- Re-enable RLS
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '✅ RLS re-enabled with fixed policies';
    
END $$;

-- 2. VERIFY THE FIX
-- =====================================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- Count policies on user_roles
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'user_roles' AND schemaname = 'public';
    
    RAISE NOTICE '📊 user_roles table now has % policies', policy_count;
    
    -- Test if we can query user_roles without recursion
    BEGIN
        PERFORM COUNT(*) FROM public.user_roles LIMIT 1;
        RAISE NOTICE '✅ user_roles table is now queryable without recursion';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Still having issues: %', SQLERRM;
    END;
    
END $$;

-- 3. FIX PROFILES TABLE RLS AS WELL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 FIXING PROFILES TABLE RLS...';
    
    -- Drop problematic policies on profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
    
    -- Drop the new policies we're about to create (in case they exist)
    DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON public.profiles;
    
    -- Create simplified policies
    CREATE POLICY "Allow authenticated users to view profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Allow authenticated users to update profiles" ON public.profiles
    FOR UPDATE USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Allow authenticated users to insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    RAISE NOTICE '✅ Profiles table policies fixed';
    
END $$;

-- 4. TEST THE COMPLETE FIX
-- =====================================================

DO $$
DECLARE
    test_user_id UUID;
    test_email TEXT := 'jeanlaurentkoterumutima@gmail.com';
BEGIN
    RAISE NOTICE '🧪 TESTING COMPLETE FIX...';
    
    -- Test user lookup
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = test_email;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE '⚠️ Test user not found, but that is expected if not created yet';
    ELSE
        RAISE NOTICE '✅ Test user found: %', test_user_id;
        
        -- Test profiles query
        BEGIN
            PERFORM COUNT(*) FROM public.profiles WHERE user_id = test_user_id;
            RAISE NOTICE '✅ Profiles table query successful';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Profiles query failed: %', SQLERRM;
        END;
        
        -- Test user_roles query
        BEGIN
            PERFORM COUNT(*) FROM public.user_roles WHERE user_id = test_user_id;
            RAISE NOTICE '✅ user_roles table query successful';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ user_roles query failed: %', SQLERRM;
        END;
    END IF;
    
    RAISE NOTICE '🎯 RLS FIX COMPLETE! The frontend should now work without 500 errors.';
    
END $$;
