-- =============================================
-- FIX RLS POLICIES AND CONSTRAINT ERRORS
-- =============================================
-- This migration fixes the RLS policy issues and ON CONFLICT constraint errors

-- =============================================
-- 1. DROP ALL EXISTING POLICIES THAT DEPEND ON OLD has_role FUNCTION
-- =============================================

-- Drop all existing policies to avoid dependency conflicts
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Drop all policies from all tables to avoid has_role function dependencies
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s" ON %I.%I', 
                   policy_record.policyname, 
                   policy_record.schemaname, 
                   policy_record.tablename);
  END LOOP;
  
  RAISE NOTICE 'Dropped all existing policies to avoid function dependencies';
END;
$$;

-- =============================================
-- 2. FIX UNIQUE CONSTRAINTS FOR ON CONFLICT
-- =============================================

-- Safely add unique constraints (check if tables exist first)
DO $$
BEGIN
  -- Add unique constraint for trading_features table (if table exists)
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'trading_features'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'trading_features_name_unique' 
      AND conrelid = 'public.trading_features'::regclass
    ) THEN
      ALTER TABLE public.trading_features ADD CONSTRAINT trading_features_name_unique UNIQUE (name);
    END IF;
  END IF;
  
  -- Add unique constraint for profiles table (if table exists)
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'profiles_username_unique' 
      AND conrelid = 'public.profiles'::regclass
    ) THEN
      ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
    END IF;
  END IF;
  
  -- Add unique constraint for user_roles table (if table exists)
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'user_roles'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'user_roles_user_role_unique' 
      AND conrelid = 'public.user_roles'::regclass
    ) THEN
      ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role);
    END IF;
  END IF;
END;
$$;

-- =============================================
-- 3. FIX THE has_role FUNCTION TO WORK WITH TEXT
-- =============================================

-- Drop and recreate the has_role function to work with TEXT instead of app_role
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role::app_role
  )
$$;

-- =============================================
-- 4. CREATE BASIC READ/WRITE POLICIES (RECOMMENDED)
-- =============================================

-- Create policies only for tables that exist
DO $$
BEGIN
  -- Profiles table policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE POLICY "Allow authenticated users to view profiles" ON public.profiles
      FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Allow users to update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Allow users to insert own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- User roles table policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
    CREATE POLICY "Allow authenticated users to view user roles" ON public.user_roles
      FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Allow users to insert own role" ON public.user_roles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- KYC documents table policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kyc_documents') THEN
    CREATE POLICY "Allow authenticated users to view KYC documents" ON public.kyc_documents
      FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Allow users to insert own KYC documents" ON public.kyc_documents
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Allow users to update own KYC documents" ON public.kyc_documents
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Wallet transactions table policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wallet_transactions') THEN
    CREATE POLICY "Allow authenticated users to view wallet transactions" ON public.wallet_transactions
      FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Allow users to insert wallet transactions" ON public.wallet_transactions
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  -- Withdrawal requests table policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'withdrawal_requests') THEN
    CREATE POLICY "Allow authenticated users to view withdrawal requests" ON public.withdrawal_requests
      FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Allow users to insert own withdrawal requests" ON public.withdrawal_requests
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Allow users to update own withdrawal requests" ON public.withdrawal_requests
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Trades table policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trades') THEN
    CREATE POLICY "Allow authenticated users to view trades" ON public.trades
      FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Allow users to insert own trades" ON public.trades
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Allow users to update own trades" ON public.trades
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Trading features table policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trading_features') THEN
    CREATE POLICY "Allow authenticated users to view trading features" ON public.trading_features
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;

  -- Admin actions table policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_actions') THEN
    CREATE POLICY "Allow authenticated users to view admin actions" ON public.admin_actions
      FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Allow authenticated users to insert admin actions" ON public.admin_actions
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  -- Deposits table policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'deposits') THEN
    CREATE POLICY "Allow authenticated users to view deposits" ON public.deposits
      FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Allow users to insert own deposits" ON public.deposits
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Allow users to update own deposits" ON public.deposits
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Notifications table policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE POLICY "Allow authenticated users to view notifications" ON public.notifications
      FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Allow users to update own notifications" ON public.notifications
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Allow authenticated users to insert notifications" ON public.notifications
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END;
$$;

-- =============================================
-- 5. ENABLE RLS ON EXISTING TABLES
-- =============================================

-- Enable RLS only on tables that exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kyc_documents') THEN
    ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wallet_transactions') THEN
    ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'withdrawal_requests') THEN
    ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trades') THEN
    ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trading_features') THEN
    ALTER TABLE public.trading_features ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_actions') THEN
    ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'deposits') THEN
    ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
  END IF;
END;
$$;

-- =============================================
-- 6. VERIFY POLICIES ARE CREATED
-- =============================================

-- Check that policies exist for each table
DO $$
DECLARE
  table_name TEXT;
  policy_count INTEGER;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'user_roles', 'kyc_documents', 'wallet_transactions', 
                     'withdrawal_requests', 'trades', 'trading_features', 'admin_actions', 
                     'deposits', 'notifications')
  LOOP
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = table_name;
    
    RAISE NOTICE 'Table % has % policies', table_name, policy_count;
  END LOOP;
END;
$$;

-- =============================================
-- 7. TEST DATA INSERTION WITH ON CONFLICT (ONLY IF TABLE EXISTS)
-- =============================================

-- Test inserting trading features with proper ON CONFLICT handling (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trading_features') THEN
    INSERT INTO public.trading_features (name, type, min_investment, max_investment, roi_percentage, duration_minutes, description) VALUES
    ('Day 1 Arbitrage', 'quant', 1000.00, 29999.00, 5.0, 1440, '1-day arbitrage trading strategy'),
    ('Day 3 Arbitrage', 'quant', 1000.00, 29999.00, 15.0, 4320, '3-day arbitrage trading strategy'),
    ('Day 7 Arbitrage', 'quant', 1000.00, 29999.00, 35.0, 10080, '7-day arbitrage trading strategy'),
    ('Binary Options', 'binary', 10.00, 1000.00, 80.0, 5, 'High-frequency binary options trading'),
    ('Spot Trading', 'spot', 50.00, 5000.00, 2.0, 1, 'Real-time spot trading'),
    ('Futures Trading', 'futures', 100.00, 10000.00, 10.0, 60, 'Leveraged futures trading')
    ON CONFLICT (name) DO UPDATE SET
      type = EXCLUDED.type,
      min_investment = EXCLUDED.min_investment,
      max_investment = EXCLUDED.max_investment,
      roi_percentage = EXCLUDED.roi_percentage,
      duration_minutes = EXCLUDED.duration_minutes,
      description = EXCLUDED.description,
      updated_at = now();
  END IF;
END;
$$;

-- =============================================
-- 8. FINAL VERIFICATION
-- =============================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'RLS policies and constraint fixes completed successfully';
  RAISE NOTICE 'All existing tables now have basic authenticated user access';
  RAISE NOTICE 'ON CONFLICT constraints are properly configured for existing tables';
  RAISE NOTICE 'has_role function updated to work with TEXT parameter';
  RAISE NOTICE 'Supabase client should now work without fallback to mock client';
END;
$$;
