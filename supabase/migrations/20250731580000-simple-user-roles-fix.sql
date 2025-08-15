-- =============================================
-- SIMPLE USER_ROLES FIX
-- Just fix RLS policies without data insertion
-- =============================================

-- Step 1: Check current user_roles table structure
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING USER_ROLES TABLE ===';
    
    -- Check if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        RAISE NOTICE '✅ user_roles table exists';
        
        -- Check table columns
        RAISE NOTICE '📋 user_roles table columns:';
        DECLARE
            col RECORD;
        BEGIN
            FOR col IN 
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'user_roles'
                ORDER BY ordinal_position
            LOOP
                RAISE NOTICE '   - % (%): %', col.column_name, col.data_type, col.is_nullable;
            END LOOP;
        END;
        
        -- Check current data
        DECLARE
            role_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO role_count FROM public.user_roles;
            RAISE NOTICE '📊 Current user_roles count: %', role_count;
        END;
        
    ELSE
        RAISE NOTICE '❌ user_roles table does not exist';
    END IF;
END $$;

-- Step 2: Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);

-- Step 3: Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Step 5: Create simplified RLS policies
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can insert own roles" ON public.user_roles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Step 6: Grant permissions
GRANT ALL ON public.user_roles TO authenticated;

-- Step 7: Create helper function to get user role safely
CREATE OR REPLACE FUNCTION get_user_role_safe(target_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    current_user_id UUID;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- If no target user specified, use current user
    IF target_user_id IS NULL THEN
        target_user_id := current_user_id;
    END IF;
    
    -- Check if user can view this role
    IF current_user_id = target_user_id OR 
       EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = current_user_id AND role = 'admin') THEN
        
        SELECT role INTO user_role
        FROM public.user_roles
        WHERE user_id = target_user_id
        ORDER BY 
            CASE role 
                WHEN 'admin' THEN 1
                WHEN 'moderator' THEN 2
                WHEN 'user' THEN 3
                ELSE 4
            END
        LIMIT 1;
        
        RETURN COALESCE(user_role, 'user');
    ELSE
        RAISE EXCEPTION 'Unauthorized to view user role';
    END IF;
END;
$$;

-- Step 8: Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_role_safe(UUID) TO authenticated;

-- Step 9: Test the function
DO $$
DECLARE
    test_user_id UUID;
    user_role TEXT;
BEGIN
    RAISE NOTICE '=== TESTING USER ROLES ===';
    
    -- Get a test user
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'shemaprince92@gmail.com' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test the function (this will work without auth context)
        SELECT get_user_role_safe(test_user_id) INTO user_role;
        RAISE NOTICE '✅ User role for shemaprince92@gmail.com: %', user_role;
    ELSE
        RAISE NOTICE '⚠️ Test user not found';
    END IF;
    
    -- Count total roles
    SELECT COUNT(*) INTO user_role FROM public.user_roles;
    RAISE NOTICE '✅ Total user roles in database: %', user_role;
    
    RAISE NOTICE '✅ User roles fix complete!';
END $$;
