-- =====================================================
-- MAKE USER DATA TABLES EDITABLE
-- =====================================================
-- This migration makes the user data table editable in Supabase dashboard
-- =====================================================

-- 1. ENSURE PROFILES TABLE IS EDITABLE
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Create relaxed policies for mock environment
CREATE POLICY "Mock environment - Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Mock environment - Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Mock environment - Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mock environment - Admins have full access" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 2. ENSURE USER_ROLES TABLE IS EDITABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create relaxed policies for mock environment
CREATE POLICY "Mock environment - Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Mock environment - Users can insert own roles" ON public.user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mock environment - Admins have full role access" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 3. ENSURE USER_WALLETS TABLE IS EDITABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can update all wallets" ON public.user_wallets;

-- Create relaxed policies for mock environment
CREATE POLICY "Mock environment - Users can view own wallets" ON public.user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Mock environment - Users can update own wallets" ON public.user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Mock environment - Admins have full wallet access" ON public.user_wallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 4. CREATE A COMPREHENSIVE USER VIEW FOR EDITING
-- =====================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.editable_user_data;

-- Create a comprehensive view that combines all user data
CREATE VIEW public.editable_user_data AS
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created_at,
    u.updated_at as user_updated_at,
    p.is_verified,
    p.kyc_status,
    ur.role,
    p.account_balance,
    p.auto_generated,
    COALESCE(funding_wallet.balance, 0) as funding_balance,
    COALESCE(trading_wallet.balance, 0) as trading_balance,
    COALESCE(p.account_balance, 0) as total_balance,
    COALESCE(p.last_activity, u.updated_at) as last_activity
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.user_wallets funding_wallet ON u.id = funding_wallet.user_id 
    AND funding_wallet.wallet_type = 'funding' 
    AND funding_wallet.asset = 'USDT'
LEFT JOIN public.user_wallets trading_wallet ON u.id = trading_wallet.user_id 
    AND trading_wallet.wallet_type = 'trading' 
    AND trading_wallet.asset = 'USDT';

-- Grant permissions on the view
GRANT SELECT, UPDATE ON public.editable_user_data TO authenticated;
GRANT SELECT, UPDATE ON public.editable_user_data TO service_role;

-- Enable RLS on the view
ALTER VIEW public.editable_user_data SET (security_invoker = true);

-- 5. CREATE TRIGGER FUNCTIONS TO UPDATE UNDERLYING TABLES
-- =====================================================

-- Function to update profiles table when view is updated
CREATE OR REPLACE FUNCTION update_profiles_from_view()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profiles table
    UPDATE public.profiles 
    SET 
        is_verified = NEW.is_verified,
        kyc_status = NEW.kyc_status,
        account_balance = NEW.total_balance,
        last_activity = NEW.last_activity,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Update user_roles table
    UPDATE public.user_roles 
    SET 
        role = NEW.role,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Update funding wallet
    UPDATE public.user_wallets 
    SET 
        balance = NEW.funding_balance,
        updated_at = NOW()
    WHERE user_id = NEW.user_id 
    AND wallet_type = 'funding' 
    AND asset = 'USDT';
    
    -- Update trading wallet
    UPDATE public.user_wallets 
    SET 
        balance = NEW.trading_balance,
        updated_at = NOW()
    WHERE user_id = NEW.user_id 
    AND wallet_type = 'trading' 
    AND asset = 'USDT';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on the view
CREATE TRIGGER update_underlying_tables
    INSTEAD OF UPDATE ON public.editable_user_data
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_from_view();

-- 6. CREATE ADMIN FUNCTIONS FOR BULK UPDATES
-- =====================================================

-- Function to update user verification status
CREATE OR REPLACE FUNCTION admin_update_user_verification(
    target_user_email TEXT,
    is_verified_param BOOLEAN,
    kyc_status_param TEXT DEFAULT 'pending'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    target_user_id UUID;
    result JSONB;
BEGIN
    -- Validate admin access
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Find target user by email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Target user not found: %', target_user_email;
    END IF;

    -- Update profile
    UPDATE public.profiles
    SET 
        is_verified = is_verified_param,
        kyc_status = kyc_status_param,
        updated_at = NOW()
    WHERE user_id = target_user_id;

    -- Build result
    result := jsonb_build_object(
        'success', true,
        'target_user_email', target_user_email,
        'target_user_id', target_user_id,
        'is_verified', is_verified_param,
        'kyc_status', kyc_status_param,
        'updated_at', NOW()
    );

    RETURN result;
END;
$$;

-- Function to update user role
CREATE OR REPLACE FUNCTION admin_update_user_role(
    target_user_email TEXT,
    new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    target_user_id UUID;
    result JSONB;
BEGIN
    -- Validate admin access
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Find target user by email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Target user not found: %', target_user_email;
    END IF;

    -- Update or insert user role
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (target_user_id, new_role, NOW(), NOW())
    ON CONFLICT (user_id, role) 
    DO UPDATE SET 
        role = EXCLUDED.role,
        updated_at = NOW();

    -- Build result
    result := jsonb_build_object(
        'success', true,
        'target_user_email', target_user_email,
        'target_user_id', target_user_id,
        'new_role', new_role,
        'updated_at', NOW()
    );

    RETURN result;
END;
$$;

-- Function to update user balances
CREATE OR REPLACE FUNCTION admin_update_user_balances(
    target_user_email TEXT,
    funding_balance_param NUMERIC DEFAULT NULL,
    trading_balance_param NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    target_user_id UUID;
    result JSONB;
BEGIN
    -- Validate admin access
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Find target user by email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Target user not found: %', target_user_email;
    END IF;

    -- Update funding balance if provided
    IF funding_balance_param IS NOT NULL THEN
        UPDATE public.user_wallets
        SET balance = funding_balance_param, updated_at = NOW()
        WHERE user_id = target_user_id 
        AND wallet_type = 'funding' 
        AND asset = 'USDT';
    END IF;

    -- Update trading balance if provided
    IF trading_balance_param IS NOT NULL THEN
        UPDATE public.user_wallets
        SET balance = trading_balance_param, updated_at = NOW()
        WHERE user_id = target_user_id 
        AND wallet_type = 'trading' 
        AND asset = 'USDT';
    END IF;

    -- Update profile account_balance (sum of all wallets)
    UPDATE public.profiles
    SET account_balance = (
        SELECT COALESCE(SUM(balance), 0)
        FROM public.user_wallets
        WHERE user_id = target_user_id
    ), updated_at = NOW()
    WHERE user_id = target_user_id;

    -- Build result
    result := jsonb_build_object(
        'success', true,
        'target_user_email', target_user_email,
        'target_user_id', target_user_id,
        'funding_balance', funding_balance_param,
        'trading_balance', trading_balance_param,
        'updated_at', NOW()
    );

    RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_update_user_verification(TEXT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_role(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_balances(TEXT, NUMERIC, NUMERIC) TO authenticated;

-- 7. VERIFICATION
-- =====================================================

DO $$
DECLARE
    view_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Count views
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'editable_user_data';
    
    RAISE NOTICE '📊 editable_user_data view: %', CASE WHEN view_count > 0 THEN 'EXISTS' ELSE 'MISSING' END;
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('admin_update_user_verification', 'admin_update_user_role', 'admin_update_user_balances');
    
    RAISE NOTICE '📊 Admin update functions: %', function_count;
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
    AND event_object_table = 'editable_user_data';
    
    RAISE NOTICE '📊 View triggers: %', trigger_count;
    
    RAISE NOTICE '✅ User data tables are now editable!';
    RAISE NOTICE '📝 You can now edit the editable_user_data view in Supabase dashboard';
END $$;
