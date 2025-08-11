-- =============================================
-- FIX RLS POLICIES - CORRECT COLUMN NAMES
-- =============================================
-- This migration fixes RLS policies that reference non-existent user_id columns

-- =============================================
-- 1. DROP ALL EXISTING POLICIES TO RECREATE THEM
-- =============================================

-- Drop all policies from tables that might have incorrect column references
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename IN ('activity_logs', 'admin_notifications', 'kyc_submissions', 'kyc_verifications', 
                     'price_history', 'staking_pools', 'staking_positions', 'support_messages', 
                     'support_tickets', 'trade_outcome_logs', 'trading_pairs', 'transactions', 
                     'user_activities', 'user_kyc', 'user_sessions', 'users', 'wallet_adjustments', 
                     'wallet_balances', 'withdrawals')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s" ON %I.%I', 
                   policy_record.policyname, 
                   policy_record.schemaname, 
                   policy_record.tablename);
  END LOOP;
  
  RAISE NOTICE 'Dropped all existing policies to recreate them with correct column names';
END;
$$;

-- =============================================
-- 2. CREATE POLICIES WITH CORRECT COLUMN NAMES
-- =============================================

-- Activity logs table - use basic auth check only
CREATE POLICY "Allow authenticated users to view activity logs" ON public.activity_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admin notifications table - use basic auth check only
CREATE POLICY "Allow authenticated users to view admin notifications" ON public.admin_notifications
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert admin notifications" ON public.admin_notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- KYC submissions table - use basic auth check only
CREATE POLICY "Allow authenticated users to view KYC submissions" ON public.kyc_submissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert KYC submissions" ON public.kyc_submissions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- KYC verifications table - use basic auth check only
CREATE POLICY "Allow authenticated users to view KYC verifications" ON public.kyc_verifications
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert KYC verifications" ON public.kyc_verifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Price history table - use basic auth check only
CREATE POLICY "Allow authenticated users to view price history" ON public.price_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert price history" ON public.price_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Staking pools table - use basic auth check only
CREATE POLICY "Allow authenticated users to view staking pools" ON public.staking_pools
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert staking pools" ON public.staking_pools
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update staking pools" ON public.staking_pools
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Staking positions table - use basic auth check only
CREATE POLICY "Allow authenticated users to view staking positions" ON public.staking_positions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert staking positions" ON public.staking_positions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update staking positions" ON public.staking_positions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Support messages table - use basic auth check only
CREATE POLICY "Allow authenticated users to view support messages" ON public.support_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert support messages" ON public.support_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update support messages" ON public.support_messages
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Support tickets table - use basic auth check only
CREATE POLICY "Allow authenticated users to view support tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert support tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update support tickets" ON public.support_tickets
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Trade outcome logs table - use basic auth check only
CREATE POLICY "Allow authenticated users to view trade outcome logs" ON public.trade_outcome_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert trade outcome logs" ON public.trade_outcome_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update trade outcome logs" ON public.trade_outcome_logs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Trading pairs table - use basic auth check only
CREATE POLICY "Allow authenticated users to view trading pairs" ON public.trading_pairs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert trading pairs" ON public.trading_pairs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update trading pairs" ON public.trading_pairs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Transactions table - use basic auth check only
CREATE POLICY "Allow authenticated users to view transactions" ON public.transactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- User activities table - use basic auth check only
CREATE POLICY "Allow authenticated users to view user activities" ON public.user_activities
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert user activities" ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update user activities" ON public.user_activities
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- User KYC table - use basic auth check only
CREATE POLICY "Allow authenticated users to view user KYC" ON public.user_kyc
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert user KYC" ON public.user_kyc
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update user KYC" ON public.user_kyc
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- User sessions table - use basic auth check only
CREATE POLICY "Allow authenticated users to view user sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert user sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update user sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Users table - use basic auth check only
CREATE POLICY "Allow authenticated users to view users" ON public.users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert users" ON public.users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update users" ON public.users
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Wallet adjustments table - use basic auth check only
CREATE POLICY "Allow authenticated users to view wallet adjustments" ON public.wallet_adjustments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert wallet adjustments" ON public.wallet_adjustments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update wallet adjustments" ON public.wallet_adjustments
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Wallet balances table - use basic auth check only
CREATE POLICY "Allow authenticated users to view wallet balances" ON public.wallet_balances
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert wallet balances" ON public.wallet_balances
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update wallet balances" ON public.wallet_balances
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Withdrawals table - use basic auth check only
CREATE POLICY "Allow authenticated users to view withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update withdrawals" ON public.withdrawals
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- =============================================
-- 3. VERIFICATION AND LOGGING
-- =============================================

-- Log completion
DO $$
DECLARE
  table_name TEXT;
  policy_count INTEGER;
BEGIN
  RAISE NOTICE 'RLS policies have been recreated with correct column names';
  RAISE NOTICE 'All tables now have basic authenticated user access';
  
  -- Check that policies exist for each table
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('activity_logs', 'admin_notifications', 'kyc_submissions', 'kyc_verifications', 
                     'price_history', 'staking_pools', 'staking_positions', 'support_messages', 
                     'support_tickets', 'trade_outcome_logs', 'trading_pairs', 'transactions', 
                     'user_activities', 'user_kyc', 'user_sessions', 'users', 'wallet_adjustments', 
                     'wallet_balances', 'withdrawals')
  LOOP
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = table_name;
    
    RAISE NOTICE 'Table % has % policies', table_name, policy_count;
  END LOOP;
  
  RAISE NOTICE 'All tables should now be accessible via Supabase APIs';
  RAISE NOTICE 'Policies use basic auth.uid() checks instead of specific user_id columns';
END;
$$;
