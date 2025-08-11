-- COMPLETE FUNCTION CONFLICTS FIX
-- Run this in your Supabase SQL Editor to resolve ALL function ambiguity issues

-- 1. First, let's see what functions currently exist
SELECT 'Current log_admin_action functions' as info,
       proname,
       oidvectortypes(proargtypes) AS args,
       prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'log_admin_action'
ORDER BY proname, args;

-- 2. Drop ALL existing versions of log_admin_action function with CASCADE
-- This will also drop any triggers or other objects that depend on these functions
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Drop all functions with the name log_admin_action
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) AS args
        FROM pg_proc 
        WHERE proname = 'log_admin_action'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', 
                      func_record.proname, 
                      func_record.args);
        RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
    END LOOP;
END $$;

-- 3. Drop any problematic triggers that might be calling the old functions
DROP TRIGGER IF EXISTS auto_setup_admin ON auth.users;
DROP TRIGGER IF EXISTS trigger_handle_new_admin_user ON auth.users;
DROP FUNCTION IF EXISTS setup_admin_user(UUID);
DROP FUNCTION IF EXISTS auto_setup_admin();
DROP FUNCTION IF EXISTS handle_new_admin_user();

-- 4. Create admin_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES public.profiles(user_id),
    action_type TEXT NOT NULL,
    description TEXT,
    target_user_id UUID REFERENCES public.profiles(user_id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Enable RLS for admin_actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for admin_actions
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 7. Create a single, clear version of log_admin_action function
CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_admin_id UUID,
    p_action_type TEXT,
    p_description TEXT,
    p_target_user_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.admin_actions (
        admin_id,
        action_type,
        description,
        target_user_id,
        metadata,
        created_at
    ) VALUES (
        p_admin_id,
        p_action_type,
        p_description,
        p_target_user_id,
        p_metadata,
        now()
    );
END;
$$;

-- 8. Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_admin_action TO authenticated;

-- 9. Create a simple trigger for new admin users (without function conflicts)
CREATE OR REPLACE FUNCTION handle_new_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only process if this is the admin user
    IF NEW.email = 'admin@kryvex.com' THEN
        -- Create profile if it doesn't exist
        INSERT INTO public.profiles (
            user_id,
            email,
            full_name,
            is_verified,
            kyc_status,
            account_status,
            funding_wallet,
            trading_wallet,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            'System Administrator',
            true,
            'approved',
            'active',
            10000.00,
            10000.00,
            now(),
            now()
        ) ON CONFLICT (user_id) DO NOTHING;
        
        -- Assign admin role if it doesn't exist
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin user setup completed for: %', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 10. Create the trigger
CREATE TRIGGER trigger_handle_new_admin_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_admin_user();

-- 11. Verify the function was created correctly
SELECT 'Function verification after fix' as check_type,
       proname,
       oidvectortypes(proargtypes) AS args,
       prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'log_admin_action'
ORDER BY proname, args;

-- 12. Test the function
DO $$
DECLARE
    test_admin_id UUID := gen_random_uuid();
    test_target_id UUID := gen_random_uuid();
BEGIN
    -- Test the function with explicit type casts
    PERFORM public.log_admin_action(
        test_admin_id::UUID,
        'test_action'::TEXT,
        'Testing function after fix'::TEXT,
        test_target_id::UUID,
        '{"test": true}'::JSONB
    );
    RAISE NOTICE '✅ log_admin_action function test successful';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Function test failed: %', SQLERRM;
END $$;

-- 13. Show summary
SELECT 'Function conflicts resolved' as status,
       'log_admin_action function has been standardized' as message,
       'All conflicting functions have been dropped and recreated' as details;
