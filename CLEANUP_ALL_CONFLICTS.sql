-- COMPREHENSIVE CLEANUP OF ALL CONFLICTS
-- Run this in your Supabase SQL Editor to remove ALL conflicting objects

-- 1. First, let's see what functions and triggers currently exist
SELECT 'Current log_admin_action functions' as info,
       proname,
       oidvectortypes(proargtypes) AS args,
       prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'log_admin_action'
ORDER BY proname, args;

SELECT 'Current triggers on auth.users' as info,
       trigger_name,
       event_manipulation,
       action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';

-- 2. Drop ALL triggers on auth.users table with CASCADE
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'users'
        AND event_object_schema = 'auth'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE', trigger_record.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- 3. Drop ALL existing versions of log_admin_action function with CASCADE
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

-- 4. Drop ALL problematic functions that might be causing conflicts
DROP FUNCTION IF EXISTS setup_admin_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS auto_setup_admin() CASCADE;
DROP FUNCTION IF EXISTS handle_new_admin_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS on_auth_user_admin_setup() CASCADE;

-- 5. Drop any remaining triggers that might exist
DROP TRIGGER IF EXISTS auto_setup_admin ON auth.users CASCADE;
DROP TRIGGER IF EXISTS trigger_handle_new_admin_user ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_admin_setup ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users CASCADE;

-- 6. Create admin_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES public.profiles(user_id),
    action_type TEXT NOT NULL,
    description TEXT,
    target_user_id UUID REFERENCES public.profiles(user_id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Enable RLS for admin_actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for admin_actions
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 9. Create a single, clear version of log_admin_action function
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

-- 10. Grant execute permission
GRANT EXECUTE ON FUNCTION public.log_admin_action TO authenticated;

-- 11. Verify the cleanup
SELECT 'Cleanup verification' as check_type,
       (SELECT COUNT(*) FROM pg_proc WHERE proname = 'log_admin_action') as log_admin_action_functions,
       (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'users' AND event_object_schema = 'auth') as auth_user_triggers;

-- 12. Show summary
SELECT 'All conflicts resolved' as status,
       'All conflicting functions and triggers have been removed' as message,
       'Ready to create admin user' as next_step;
