-- ADMIN SETUP SCRIPT
-- This script ensures all admin features work properly

-- 1. Ensure user_roles table exists and has proper structure
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'moderator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- 2. Create user_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;

-- 5. Create proper RLS policies
CREATE POLICY "Users can view own role" ON public.user_roles 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 6. Create function to check if user has admin role
CREATE OR REPLACE FUNCTION has_admin_role(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is admin
    IF NOT has_admin_role() THEN
        RAISE EXCEPTION 'Only admins can promote users to admin';
    END IF;
    
    -- Remove existing user role and add admin role
    DELETE FROM public.user_roles WHERE user_id = target_user_id AND role = 'user';
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to demote admin to user
CREATE OR REPLACE FUNCTION demote_from_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is admin
    IF NOT has_admin_role() THEN
        RAISE EXCEPTION 'Only admins can demote users from admin';
    END IF;
    
    -- Remove admin role and add user role
    DELETE FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin';
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (target_user_id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger to automatically assign user role to new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default user role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 11. Create admin_actions table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Enable RLS on admin_actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- 13. Create policies for admin_actions
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Users can view actions affecting them" ON public.admin_actions;

CREATE POLICY "Admins can view all admin actions" ON public.admin_actions 
    FOR SELECT USING (has_admin_role());

CREATE POLICY "Users can view actions affecting them" ON public.admin_actions 
    FOR SELECT USING (target_user_id = auth.uid());

-- 14. Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action_type TEXT,
    p_target_user_id UUID DEFAULT NULL,
    p_target_table TEXT DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    action_id UUID;
BEGIN
    INSERT INTO public.admin_actions (
        admin_id,
        target_user_id,
        action_type,
        target_table,
        target_id,
        old_values,
        new_values,
        description
    ) VALUES (
        auth.uid(),
        p_target_user_id,
        p_action_type,
        p_target_table,
        p_target_id,
        p_old_values,
        p_new_values,
        p_description
    ) RETURNING id INTO action_id;
    
    RETURN action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON public.admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at);

-- 16. Insert default admin user (replace with actual admin email)
-- IMPORTANT: Replace 'admin@kryvex.com' with the actual admin email
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Find the admin user by email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@kryvex.com' 
    LIMIT 1;
    
    -- If admin user exists, promote to admin
    IF admin_user_id IS NOT NULL THEN
        -- Remove existing roles
        DELETE FROM public.user_roles WHERE user_id = admin_user_id;
        
        -- Add admin role
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin user promoted: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user not found. Please create admin user manually.';
    END IF;
END $$;

-- 17. Create view for admin dashboard data
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') as admin_users,
    (SELECT COUNT(*) FROM public.profiles WHERE kyc_status = 'verified') as verified_users,
    (SELECT COUNT(*) FROM public.profiles WHERE kyc_status = 'pending') as pending_kyc,
    (SELECT COUNT(*) FROM public.trades WHERE status = 'pending') as pending_trades,
    (SELECT COALESCE(SUM(balance), 0) FROM public.wallet_balances WHERE asset = 'USDT') as total_usdt_balance,
    (SELECT COUNT(*) FROM public.admin_actions WHERE created_at >= NOW() - INTERVAL '24 hours') as admin_actions_24h;

-- 18. Grant necessary permissions
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.admin_actions TO authenticated;
GRANT SELECT ON admin_dashboard_stats TO authenticated;

-- 19. Create function to get user's role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role 
    FROM public.user_roles 
    WHERE user_id = user_uuid 
    ORDER BY 
        CASE role 
            WHEN 'admin' THEN 1 
            WHEN 'moderator' THEN 2 
            WHEN 'user' THEN 3 
        END
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. Final verification
SELECT 
    'Admin setup completed successfully' as status,
    (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') as admin_count,
    (SELECT COUNT(*) FROM public.user_roles WHERE role = 'user') as user_count;

-- Instructions for manual admin setup:
-- 1. Replace 'admin@kryvex.com' with the actual admin email in step 16
-- 2. Run this script in your Supabase SQL editor
-- 3. Test admin access by logging in with the admin account
-- 4. Verify admin features are working in the admin dashboard
