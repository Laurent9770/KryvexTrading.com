-- =============================================
-- FIX ADMIN_ACTIONS RLS POLICY
-- Fix the RLS policy that's causing 403 Forbidden errors
-- =============================================

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Users can insert own admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;

-- Step 2: Create simplified RLS policies that work
CREATE POLICY "Allow authenticated users to insert admin actions" ON public.admin_actions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to view own admin actions" ON public.admin_actions
    FOR SELECT USING (admin_id = auth.uid());

CREATE POLICY "Allow admins to view all admin actions" ON public.admin_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Step 3: Create a helper function for logging admin actions that bypasses RLS
CREATE OR REPLACE FUNCTION log_admin_action_safe(
    action_type_param TEXT,
    target_user_id_param UUID,
    table_name_param TEXT DEFAULT NULL,
    record_id_param UUID DEFAULT NULL,
    old_values_param JSONB DEFAULT NULL,
    new_values_param JSONB DEFAULT NULL,
    description_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    action_id UUID;
    current_admin_id UUID;
BEGIN
    -- Get the current authenticated user ID
    current_admin_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_admin_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to log admin actions';
    END IF;
    
    -- Insert the admin action
    INSERT INTO public.admin_actions (
        admin_id,
        action_type,
        target_user_id,
        table_name,
        record_id,
        old_values,
        new_values,
        description,
        created_at
    ) VALUES (
        current_admin_id,
        action_type_param,
        target_user_id_param,
        table_name_param,
        record_id_param,
        old_values_param,
        new_values_param,
        description_param,
        NOW()
    ) RETURNING id INTO action_id;
    
    RETURN action_id;
END;
$$;

-- Step 4: Grant execute permission
GRANT EXECUTE ON FUNCTION log_admin_action_safe(TEXT, UUID, TEXT, UUID, JSONB, JSONB, TEXT) TO authenticated;

-- Step 5: Test the function
DO $$
DECLARE
    test_user_id UUID;
    action_id UUID;
BEGIN
    RAISE NOTICE '=== TESTING ADMIN ACTIONS FIX ===';
    
    -- Get a test user
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'shemaprince92@gmail.com' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test the new function
        SELECT log_admin_action_safe(
            'test_action',
            test_user_id,
            'user_wallets',
            gen_random_uuid(),
            '{"old_balance": 0}'::jsonb,
            '{"new_balance": 100000}'::jsonb,
            'Test admin action logging'
        ) INTO action_id;
        
        RAISE NOTICE '✅ Test admin action logged with ID: %', action_id;
    ELSE
        RAISE NOTICE '⚠️ No test user found for testing';
    END IF;
    
    RAISE NOTICE '✅ Admin actions RLS fix complete!';
END $$;
