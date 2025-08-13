-- =============================================
-- FIX USER ROLES RLS POLICIES
-- This migration fixes the 403 Forbidden error when accessing user_roles table
-- =============================================

-- Step 1: Check current user_roles table structure and policies
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING USER ROLES TABLE ===';
    
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ user_roles table exists';
    ELSE
        RAISE NOTICE '❌ user_roles table does not exist';
    END IF;
    
    -- Check RLS status
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'user_roles' 
        AND schemaname = 'public' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✅ RLS is enabled on user_roles table';
    ELSE
        RAISE NOTICE '❌ RLS is not enabled on user_roles table';
    END IF;
END $$;

-- Step 2: Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Step 3: Create proper RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user roles" ON public.user_roles
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all user roles" ON public.user_roles
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Step 4: Grant proper permissions
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Step 5: Ensure has_role function works properly
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 6: Create a simpler role check function that doesn't require RLS
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Step 7: Verify the fixes
DO $$
DECLARE
    policies_count INTEGER;
    grants_count INTEGER;
    test_user_id UUID;
    test_role app_role;
BEGIN
    -- Count policies
    SELECT COUNT(*) INTO policies_count
    FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND schemaname = 'public';
    
    -- Count grants
    SELECT COUNT(*) INTO grants_count
    FROM information_schema.role_table_grants 
    WHERE table_name = 'user_roles' 
    AND table_schema = 'public'
    AND grantee = 'authenticated';
    
    RAISE NOTICE '=== FIX VERIFICATION ===';
    RAISE NOTICE 'RLS policies count: %', policies_count;
    RAISE NOTICE 'Grants count for authenticated: %', grants_count;
    
    -- Test with a sample user
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    IF test_user_id IS NOT NULL THEN
        SELECT get_user_role(test_user_id) INTO test_role;
        RAISE NOTICE 'Test user role: %', test_role;
    END IF;
    
    IF policies_count >= 3 AND grants_count >= 1 THEN
        RAISE NOTICE '✅ User roles RLS policies fixed successfully!';
    ELSE
        RAISE NOTICE '❌ Some fixes may be missing!';
    END IF;
END $$;

-- Step 8: Show current policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_roles'
AND schemaname = 'public'
ORDER BY policyname;

-- Step 9: Show current grants for verification
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'user_roles' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;
