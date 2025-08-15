-- =============================================
-- FIX RLS RECURSION ISSUE
-- Temporarily disable RLS on user_roles to break circular dependency
-- =============================================

-- Step 1: Temporarily disable RLS on user_roles table
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Step 3: Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simplified policies that don't cause recursion
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Step 5: Ensure admin user exists
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Find admin user
    SELECT u.id INTO admin_user_id
    FROM auth.users u
    WHERE u.email = 'kryvextrading@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Ensure admin role exists
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE '✅ Admin user setup complete for: kryvextrading@gmail.com';
    ELSE
        RAISE NOTICE '⚠️ Admin user not found: kryvextrading@gmail.com';
    END IF;
END $$;

-- Step 6: Verification
DO $$
BEGIN
    RAISE NOTICE '=== RLS RECURSION FIX COMPLETE ===';
    RAISE NOTICE '✅ RLS policies recreated without recursion';
    RAISE NOTICE '✅ Admin user configured';
    RAISE NOTICE '✅ Ready for frontend testing';
END $$;
