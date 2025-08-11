-- FIX FUNCTION CONFLICTS
-- Run this in your Supabase SQL Editor to resolve function ambiguity issues

-- 1. Drop all existing versions of log_admin_action function
DROP FUNCTION IF EXISTS public.log_admin_action(UUID, TEXT, UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.log_admin_action(UUID, UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.log_admin_action(UUID, TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.log_admin_action(UUID, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS log_admin_action(UUID, TEXT, UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS log_admin_action(UUID, UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS log_admin_action(UUID, TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS log_admin_action(UUID, TEXT, TEXT, TEXT) CASCADE;

-- 2. Create a single, clear version of log_admin_action function
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

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_admin_action TO authenticated;

-- 4. Drop any problematic triggers that might be calling the old function
DROP TRIGGER IF EXISTS auto_setup_admin ON auth.users;
DROP FUNCTION IF EXISTS setup_admin_user(UUID);
DROP FUNCTION IF EXISTS auto_setup_admin();

-- 5. Create a simple trigger for new admin users (without function conflicts)
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

-- 6. Create the trigger
DROP TRIGGER IF EXISTS trigger_handle_new_admin_user ON auth.users;
CREATE TRIGGER trigger_handle_new_admin_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_admin_user();

-- 7. Verify the function was created correctly
SELECT 'Function verification' as check_type,
       routine_name,
       routine_type,
       data_type
FROM information_schema.routines
WHERE routine_name = 'log_admin_action'
AND routine_schema = 'public';

-- 8. Test the function (optional - will only work if admin_actions table exists)
DO $$
BEGIN
    -- Test if admin_actions table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_actions' AND table_schema = 'public') THEN
        -- Test the function with a dummy call
        PERFORM public.log_admin_action(
            gen_random_uuid(),
            'test_action',
            'Testing function after fix',
            gen_random_uuid()
        );
        RAISE NOTICE '✅ log_admin_action function test successful';
    ELSE
        RAISE NOTICE '⚠️ admin_actions table does not exist - function created but not tested';
    END IF;
END $$;

-- 9. Show summary
SELECT 'Function conflicts resolved' as status,
       'log_admin_action function has been standardized' as message;
