-- =============================================
-- ADD MISSING RLS POLICIES FOR ALL TABLES
-- =============================================
-- This migration adds RLS policies for all tables that have RLS enabled but no policies

-- =============================================
-- 1. ACTIVITY LOGS TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow users to insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow users to update own activity logs" ON public.activity_logs;

-- Create policies for activity_logs table
CREATE POLICY "Allow authenticated users to view activity logs" ON public.activity_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update own activity logs" ON public.activity_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 2. ADMIN NOTIFICATIONS TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view admin notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Allow users to insert admin notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Allow users to update own admin notifications" ON public.admin_notifications;

-- Create policies for admin_notifications table
CREATE POLICY "Allow authenticated users to view admin notifications" ON public.admin_notifications
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert admin notifications" ON public.admin_notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update own admin notifications" ON public.admin_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 3. KYC SUBMISSIONS TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view KYC submissions" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Allow users to insert own KYC submissions" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Allow users to update own KYC submissions" ON public.kyc_submissions;

-- Create policies for kyc_submissions table
CREATE POLICY "Allow authenticated users to view KYC submissions" ON public.kyc_submissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert own KYC submissions" ON public.kyc_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own KYC submissions" ON public.kyc_submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 4. KYC VERIFICATIONS TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view KYC verifications" ON public.kyc_verifications;
DROP POLICY IF EXISTS "Allow users to insert own KYC verifications" ON public.kyc_verifications;
DROP POLICY IF EXISTS "Allow users to update own KYC verifications" ON public.kyc_verifications;

-- Create policies for kyc_verifications table
CREATE POLICY "Allow authenticated users to view KYC verifications" ON public.kyc_verifications
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert own KYC verifications" ON public.kyc_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own KYC verifications" ON public.kyc_verifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 5. PRICE HISTORY TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view price history" ON public.price_history;
DROP POLICY IF EXISTS "Allow users to insert price history" ON public.price_history;

-- Create policies for price_history table
CREATE POLICY "Allow authenticated users to view price history" ON public.price_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert price history" ON public.price_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 6. STAKING TABLES POLICIES
-- =============================================

-- Staking pools policies
DROP POLICY IF EXISTS "Allow authenticated users to view staking pools" ON public.staking_pools;
DROP POLICY IF EXISTS "Allow users to insert staking pools" ON public.staking_pools;
DROP POLICY IF EXISTS "Allow users to update staking pools" ON public.staking_pools;

CREATE POLICY "Allow authenticated users to view staking pools" ON public.staking_pools
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert staking pools" ON public.staking_pools
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update staking pools" ON public.staking_pools
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Staking positions policies
DROP POLICY IF EXISTS "Allow authenticated users to view staking positions" ON public.staking_positions;
DROP POLICY IF EXISTS "Allow users to insert own staking positions" ON public.staking_positions;
DROP POLICY IF EXISTS "Allow users to update own staking positions" ON public.staking_positions;

CREATE POLICY "Allow authenticated users to view staking positions" ON public.staking_positions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert own staking positions" ON public.staking_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own staking positions" ON public.staking_positions
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 7. SUPPORT TABLES POLICIES
-- =============================================

-- Support messages policies
DROP POLICY IF EXISTS "Allow authenticated users to view support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Allow users to insert own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Allow users to update own support messages" ON public.support_messages;

CREATE POLICY "Allow authenticated users to view support messages" ON public.support_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert own support messages" ON public.support_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own support messages" ON public.support_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- Support tickets policies
DROP POLICY IF EXISTS "Allow authenticated users to view support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow users to insert own support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow users to update own support tickets" ON public.support_tickets;

CREATE POLICY "Allow authenticated users to view support tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert own support tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own support tickets" ON public.support_tickets
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 8. TRADE OUTCOME LOGS TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view trade outcome logs" ON public.trade_outcome_logs;
DROP POLICY IF EXISTS "Allow users to insert trade outcome logs" ON public.trade_outcome_logs;
DROP POLICY IF EXISTS "Allow users to update trade outcome logs" ON public.trade_outcome_logs;

-- Create policies for trade_outcome_logs table
CREATE POLICY "Allow authenticated users to view trade outcome logs" ON public.trade_outcome_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert trade outcome logs" ON public.trade_outcome_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update trade outcome logs" ON public.trade_outcome_logs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- =============================================
-- 9. TRADING PAIRS TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view trading pairs" ON public.trading_pairs;
DROP POLICY IF EXISTS "Allow users to insert trading pairs" ON public.trading_pairs;
DROP POLICY IF EXISTS "Allow users to update trading pairs" ON public.trading_pairs;

-- Create policies for trading_pairs table
CREATE POLICY "Allow authenticated users to view trading pairs" ON public.trading_pairs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert trading pairs" ON public.trading_pairs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update trading pairs" ON public.trading_pairs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- =============================================
-- 10. TRANSACTIONS TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow users to insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow users to update own transactions" ON public.transactions;

-- Create policies for transactions table
CREATE POLICY "Allow authenticated users to view transactions" ON public.transactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 11. USER ACTIVITIES TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view user activities" ON public.user_activities;
DROP POLICY IF EXISTS "Allow users to insert own user activities" ON public.user_activities;
DROP POLICY IF EXISTS "Allow users to update own user activities" ON public.user_activities;

-- Create policies for user_activities table
CREATE POLICY "Allow authenticated users to view user activities" ON public.user_activities
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert own user activities" ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own user activities" ON public.user_activities
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 12. USER KYC TABLE POLICIES (ENABLE RLS FIRST)
-- =============================================

-- Enable RLS for user_kyc table
ALTER TABLE public.user_kyc ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view user KYC" ON public.user_kyc;
DROP POLICY IF EXISTS "Allow users to insert own user KYC" ON public.user_kyc;
DROP POLICY IF EXISTS "Allow users to update own user KYC" ON public.user_kyc;

-- Create policies for user_kyc table
CREATE POLICY "Allow authenticated users to view user KYC" ON public.user_kyc
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert own user KYC" ON public.user_kyc
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own user KYC" ON public.user_kyc
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 13. USER SESSIONS TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Allow users to insert own user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Allow users to update own user sessions" ON public.user_sessions;

-- Create policies for user_sessions table
CREATE POLICY "Allow authenticated users to view user sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert own user sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own user sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 14. USERS TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view users" ON public.users;
DROP POLICY IF EXISTS "Allow users to insert own user record" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own user record" ON public.users;

-- Create policies for users table
CREATE POLICY "Allow authenticated users to view users" ON public.users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert own user record" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own user record" ON public.users
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 15. WALLET ADJUSTMENTS TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view wallet adjustments" ON public.wallet_adjustments;
DROP POLICY IF EXISTS "Allow users to insert wallet adjustments" ON public.wallet_adjustments;
DROP POLICY IF EXISTS "Allow users to update wallet adjustments" ON public.wallet_adjustments;

-- Create policies for wallet_adjustments table
CREATE POLICY "Allow authenticated users to view wallet adjustments" ON public.wallet_adjustments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert wallet adjustments" ON public.wallet_adjustments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update wallet adjustments" ON public.wallet_adjustments
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- =============================================
-- 16. WALLET BALANCES TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view wallet balances" ON public.wallet_balances;
DROP POLICY IF EXISTS "Allow users to insert own wallet balances" ON public.wallet_balances;
DROP POLICY IF EXISTS "Allow users to update own wallet balances" ON public.wallet_balances;

-- Create policies for wallet_balances table
CREATE POLICY "Allow authenticated users to view wallet balances" ON public.wallet_balances
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert own wallet balances" ON public.wallet_balances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own wallet balances" ON public.wallet_balances
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 17. WITHDRAWALS TABLE POLICIES
-- =============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Allow users to insert own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Allow users to update own withdrawals" ON public.withdrawals;

-- Create policies for withdrawals table
CREATE POLICY "Allow authenticated users to view withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert own withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own withdrawals" ON public.withdrawals
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 18. VERIFICATION AND LOGGING
-- =============================================

-- Log completion
DO $$
DECLARE
  table_name TEXT;
  policy_count INTEGER;
BEGIN
  RAISE NOTICE 'RLS policies have been created for all tables';
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
END;
$$;
