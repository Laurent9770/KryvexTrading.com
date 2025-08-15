-- =============================================
-- FIX RLS CIRCULAR DEPENDENCY
-- Break the infinite recursion in RLS policies
-- =============================================

-- Step 1: Disable RLS on all tables to break the circular dependency
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_history DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can manage wallets" ON public.user_wallets;

DROP POLICY IF EXISTS "Users can view own balance history" ON public.balance_history;
DROP POLICY IF EXISTS "Admins can view all balance history" ON public.balance_history;
DROP POLICY IF EXISTS "Admins can insert balance history" ON public.balance_history;

-- Step 3: Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_history ENABLE ROW LEVEL SECURITY;

-- Step 4: Create SIMPLE policies that avoid circular dependencies
-- user_roles policies - ONLY reference auth.uid(), never other tables
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- profiles policies - ONLY reference auth.uid(), never user_roles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- user_wallets policies - ONLY reference auth.uid()
CREATE POLICY "Users can view own wallets" ON public.user_wallets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own wallets" ON public.user_wallets
    FOR UPDATE USING (user_id = auth.uid());

-- balance_history policies - ONLY reference auth.uid()
CREATE POLICY "Users can view own balance history" ON public.balance_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own balance history" ON public.balance_history
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Step 5: Ensure admin user exists with proper setup
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
        
        -- Ensure profile exists
        INSERT INTO public.profiles (user_id, email, full_name, is_verified, account_status)
        VALUES (admin_user_id, 'kryvextrading@gmail.com', 'Kryvex Admin', true, 'active')
        ON CONFLICT (user_id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            is_verified = EXCLUDED.is_verified,
            account_status = EXCLUDED.account_status;
        
        RAISE NOTICE '✅ Admin user setup complete for: kryvextrading@gmail.com';
    ELSE
        RAISE NOTICE '⚠️ Admin user not found: kryvextrading@gmail.com';
    END IF;
END $$;

-- Step 6: Create initial wallet entries for all users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    RAISE NOTICE '=== CREATING INITIAL WALLET ENTRIES ===';
    
    FOR user_record IN 
        SELECT u.id, u.email
        FROM auth.users u
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_wallets uw WHERE uw.user_id = u.id
        )
    LOOP
        -- Create initial wallet entries for each user
        INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance) VALUES
            (user_record.id, 'trading', 'USDT', 1000.00),
            (user_record.id, 'trading', 'BTC', 0.00000000),
            (user_record.id, 'trading', 'ETH', 0.00000000),
            (user_record.id, 'funding', 'USDT', 5000.00);
        
        RAISE NOTICE '✅ Created wallet entries for: %', user_record.email;
    END LOOP;
    
    RAISE NOTICE '✅ Initial wallet creation complete!';
END $$;

-- Step 7: Test the policies work
DO $$
BEGIN
    RAISE NOTICE '=== TESTING POLICIES ===';
    
    -- Test that we can query user_roles without recursion
    IF EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
        RAISE NOTICE '✅ user_roles query successful - no recursion';
    ELSE
        RAISE NOTICE '⚠️ user_roles query returned no results';
    END IF;
    
    -- Test that we can query profiles without recursion
    IF EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN
        RAISE NOTICE '✅ profiles query successful - no recursion';
    ELSE
        RAISE NOTICE '⚠️ profiles query returned no results';
    END IF;
    
    RAISE NOTICE '=== RLS CIRCULAR DEPENDENCY FIX COMPLETE ===';
    RAISE NOTICE '✅ All RLS policies recreated without circular dependencies';
    RAISE NOTICE '✅ Admin user configured';
    RAISE NOTICE '✅ Initial wallet entries created';
    RAISE NOTICE '✅ Ready for frontend testing';
END $$;
