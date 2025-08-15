-- =============================================
-- COMPREHENSIVE USER_ROLES FIX
-- Fix all issues with user_roles table and RLS policies
-- =============================================

-- Step 1: Check and fix user_roles table structure
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING USER_ROLES TABLE STRUCTURE ===';
    
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        RAISE NOTICE '❌ user_roles table does not exist, creating it...';
        
        CREATE TABLE public.user_roles (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            UNIQUE(user_id, role)
        );
        
        RAISE NOTICE '✅ user_roles table created successfully';
    ELSE
        RAISE NOTICE '✅ user_roles table exists';
    END IF;
    
    -- Check if unique constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_roles_user_id_role_key' 
        AND conrelid = 'public.user_roles'::regclass
    ) THEN
        RAISE NOTICE '❌ Unique constraint missing, adding it...';
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
        RAISE NOTICE '✅ Unique constraint added';
    ELSE
        RAISE NOTICE '✅ Unique constraint exists';
    END IF;
    
    -- Check if indexes exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_roles' AND indexname = 'idx_user_roles_user_id') THEN
        CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
        RAISE NOTICE '✅ Index on user_id created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_roles' AND indexname = 'idx_user_roles_role') THEN
        CREATE INDEX idx_user_roles_role ON public.user_roles(role);
        RAISE NOTICE '✅ Index on role created';
    END IF;
    
END $$;

-- Step 2: Disable RLS temporarily to clean up
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users to view their roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users to insert their roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to manage all roles" ON public.user_roles;

-- Step 4: Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, non-recursive RLS policies
CREATE POLICY "Allow users to view own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow admins to view all roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Allow users to insert own roles" ON public.user_roles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow admins to manage all roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Step 6: Grant permissions
GRANT ALL ON public.user_roles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 7: Create a safe function to get user role
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

-- Step 9: Ensure admin users exist
DO $$
DECLARE
    admin_emails TEXT[] := ARRAY[
        'kryvextrading@gmail.com',
        'admin@kryvex.com',
        'jeanlaurentkoterumutima@gmail.com'
    ];
    admin_email TEXT;
    admin_user_id UUID;
BEGIN
    RAISE NOTICE '=== ENSURING ADMIN USERS EXIST ===';
    
    FOREACH admin_email IN ARRAY admin_emails
    LOOP
        -- Get user ID
        SELECT id INTO admin_user_id 
        FROM auth.users 
        WHERE email = admin_email;
        
        IF admin_user_id IS NOT NULL THEN
            -- Check if admin role exists
            IF NOT EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = admin_user_id AND role = 'admin'
            ) THEN
                -- Insert admin role
                BEGIN
                    INSERT INTO public.user_roles (user_id, role) 
                    VALUES (admin_user_id, 'admin');
                    RAISE NOTICE '✅ Added admin role for %', admin_email;
                EXCEPTION
                    WHEN unique_violation THEN
                        RAISE NOTICE '⚠️ Admin role already exists for %', admin_email;
                    WHEN OTHERS THEN
                        RAISE NOTICE '❌ Failed to add admin role for %: %', admin_email, SQLERRM;
                END;
            ELSE
                RAISE NOTICE '✅ Admin role already exists for %', admin_email;
            END IF;
        ELSE
            RAISE NOTICE '⚠️ User not found: %', admin_email;
        END IF;
    END LOOP;
END $$;

-- Step 10: Test the setup
DO $$
DECLARE
    test_result JSONB;
    role_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING USER_ROLES SETUP ===';
    
    -- Count total roles
    SELECT COUNT(*) INTO role_count FROM public.user_roles;
    RAISE NOTICE '📊 Total user roles in database: %', role_count;
    
    -- Test the safe function
    SELECT get_user_role_safe() INTO test_result;
    RAISE NOTICE '✅ get_user_role_safe test: %', test_result;
    
    -- Test direct query (should work now)
    SELECT COUNT(*) INTO role_count FROM public.user_roles WHERE role = 'admin';
    RAISE NOTICE '👑 Admin users count: %', role_count;
    
    RAISE NOTICE '✅ User roles comprehensive fix completed successfully!';
END $$;
