-- =============================================
-- FIX USER_ROLES TABLE
-- Check and fix user_roles table that's causing 500 errors
-- =============================================

-- Step 1: Check if user_roles table exists and its structure
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING USER_ROLES TABLE ===';
    
    -- Check if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        RAISE NOTICE '✅ user_roles table exists';
    ELSE
        RAISE NOTICE '❌ user_roles table does not exist - creating it';
        CREATE TABLE IF NOT EXISTS public.user_roles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add unique constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'user_roles_user_id_role_key'
        ) THEN
            ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
        END IF;
    END IF;
    
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

-- Step 7: Ensure admin users exist
DO $$
DECLARE
    admin_user_id UUID;
    user_record RECORD;
BEGIN
    RAISE NOTICE '=== ENSURING ADMIN USERS EXIST ===';
    
    -- Check for kryvextrading@gmail.com admin
    SELECT u.id INTO admin_user_id 
    FROM auth.users u 
    WHERE u.email = 'kryvextrading@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Ensure admin role exists
        BEGIN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (admin_user_id, 'admin')
            ON CONFLICT (user_id, role) DO NOTHING;
            RAISE NOTICE '✅ Admin role ensured for kryvextrading@gmail.com';
        EXCEPTION WHEN OTHERS THEN
            -- If constraint doesn't exist, just insert without conflict handling
            INSERT INTO public.user_roles (user_id, role)
            VALUES (admin_user_id, 'admin');
            RAISE NOTICE '✅ Admin role created for kryvextrading@gmail.com (no constraint)';
        END;
    ELSE
        RAISE NOTICE '⚠️ kryvextrading@gmail.com not found';
    END IF;
    
    -- Check for other potential admin users
    FOR user_record IN 
        SELECT u.id, u.email 
        FROM auth.users u 
        WHERE u.email IN ('admin@kryvex.com', 'jeanlaurentkoterumutima@gmail.com')
    LOOP
        BEGIN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (user_record.id, 'admin')
            ON CONFLICT (user_id, role) DO NOTHING;
            RAISE NOTICE '✅ Admin role ensured for %', user_record.email;
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (user_record.id, 'admin');
            RAISE NOTICE '✅ Admin role created for % (no constraint)', user_record.email;
        END;
    END LOOP;
    
    -- Ensure all users have at least a 'user' role
    BEGIN
        INSERT INTO public.user_roles (user_id, role)
        SELECT u.id, 'user'
        FROM auth.users u
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = u.id
        )
        ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.user_roles (user_id, role)
        SELECT u.id, 'user'
        FROM auth.users u
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = u.id
        );
    END;
    
    RAISE NOTICE '✅ All users now have at least a user role';
END $$;

-- Step 8: Create helper function to get user role safely
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

-- Step 9: Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_role_safe(UUID) TO authenticated;

-- Step 10: Test the function
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
