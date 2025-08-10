-- =====================================================
-- SUPABASE POLICIES FIX FOR KRYVEX TRADING
-- =====================================================
-- This script fixes all policy issues and adds missing policies

-- =====================================================
-- 1. FIX EXISTING POLICY ISSUES
-- =====================================================

-- Drop problematic policies that reference non-existent columns
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all KYC submissions" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;

-- =====================================================
-- 2. FIX PROFILES TABLE POLICIES
-- =====================================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own profile (for registration)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all profiles (FIXED - removed role column reference)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admins can update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- 3. FIX USER_ROLES TABLE POLICIES
-- =====================================================

-- Users can view their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all user roles
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
CREATE POLICY "Admins can manage all user roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- 4. FIX KYC_DOCUMENTS TABLE POLICIES
-- =====================================================

-- Users can view their own KYC documents
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON public.kyc_documents;
CREATE POLICY "Users can view their own KYC documents" ON public.kyc_documents
  FOR SELECT USING (auth.uid() = user_id);

-- Users can submit their own KYC documents
DROP POLICY IF EXISTS "Users can submit their own KYC documents" ON public.kyc_documents;
CREATE POLICY "Users can submit their own KYC documents" ON public.kyc_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending KYC documents
DROP POLICY IF EXISTS "Users can update their own pending KYC documents" ON public.kyc_documents;
CREATE POLICY "Users can update their own pending KYC documents" ON public.kyc_documents
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admins can manage all KYC documents
DROP POLICY IF EXISTS "Admins can manage all KYC documents" ON public.kyc_documents;
CREATE POLICY "Admins can manage all KYC documents" ON public.kyc_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- 5. FIX TRADING PAIRS POLICIES
-- =====================================================

-- Everyone can view trading pairs
DROP POLICY IF EXISTS "Everyone can view trading pairs" ON public.trading_pairs;
CREATE POLICY "Everyone can view trading pairs" ON public.trading_pairs
  FOR SELECT USING (true);

-- Only admins can modify trading pairs
DROP POLICY IF EXISTS "Only admins can modify trading pairs" ON public.trading_pairs;
CREATE POLICY "Only admins can modify trading pairs" ON public.trading_pairs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- 6. FIX TRADES TABLE POLICIES
-- =====================================================

-- Users can view their own trades
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
CREATE POLICY "Users can view their own trades" ON public.trades
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own trades
DROP POLICY IF EXISTS "Users can create their own trades" ON public.trades;
CREATE POLICY "Users can create their own trades" ON public.trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view and modify all trades
DROP POLICY IF EXISTS "Admins can view and modify all trades" ON public.trades;
CREATE POLICY "Admins can view and modify all trades" ON public.trades
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- 7. FIX TRANSACTIONS TABLE POLICIES
-- =====================================================

-- Users can view their own transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create deposit/withdrawal requests
DROP POLICY IF EXISTS "Users can create deposit/withdrawal requests" ON public.transactions;
CREATE POLICY "Users can create deposit/withdrawal requests" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND transaction_type IN ('deposit', 'withdrawal'));

-- Admins can view and modify all transactions
DROP POLICY IF EXISTS "Admins can view and modify all transactions" ON public.transactions;
CREATE POLICY "Admins can view and modify all transactions" ON public.transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- 8. FIX SUPPORT TICKETS POLICIES
-- =====================================================

-- Users can view their own tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create tickets
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view and modify all tickets
DROP POLICY IF EXISTS "Admins can view and modify all tickets" ON public.support_tickets;
CREATE POLICY "Admins can view and modify all tickets" ON public.support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- 9. FIX SUPPORT MESSAGES POLICIES
-- =====================================================

-- Users can view messages from their tickets
DROP POLICY IF EXISTS "Users can view messages from their tickets" ON public.support_messages;
CREATE POLICY "Users can view messages from their tickets" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE id = ticket_id AND user_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Users can send messages to their tickets
DROP POLICY IF EXISTS "Users can send messages to their tickets" ON public.support_messages;
CREATE POLICY "Users can send messages to their tickets" ON public.support_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE id = ticket_id AND (
        user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() 
          AND role = 'admin'
        )
      )
    )
  );

-- =====================================================
-- 10. FIX NOTIFICATIONS POLICIES
-- =====================================================

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can create notifications for users
DROP POLICY IF EXISTS "Admins can create notifications for users" ON public.notifications;
CREATE POLICY "Admins can create notifications for users" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- 11. FIX ADMIN TABLES POLICIES
-- =====================================================

-- Admin Actions
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;
CREATE POLICY "Admins can insert admin actions" ON public.admin_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    ) AND auth.uid() = admin_id
  );

-- Admin Notifications
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.admin_notifications;
CREATE POLICY "Admins can manage notifications" ON public.admin_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view their notifications" ON public.admin_notifications;
CREATE POLICY "Users can view their notifications" ON public.admin_notifications
  FOR SELECT USING (auth.uid() = target_user_id OR is_broadcast = true);

DROP POLICY IF EXISTS "Users can update their notification read status" ON public.admin_notifications;
CREATE POLICY "Users can update their notification read status" ON public.admin_notifications
  FOR UPDATE USING (auth.uid() = target_user_id)
  WITH CHECK (auth.uid() = target_user_id);

-- Wallet Adjustments
DROP POLICY IF EXISTS "Admins can view all wallet adjustments" ON public.wallet_adjustments;
CREATE POLICY "Admins can view all wallet adjustments" ON public.wallet_adjustments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can create wallet adjustments" ON public.wallet_adjustments;
CREATE POLICY "Admins can create wallet adjustments" ON public.wallet_adjustments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    ) AND auth.uid() = admin_id
  );

DROP POLICY IF EXISTS "Users can view their own wallet adjustments" ON public.wallet_adjustments;
CREATE POLICY "Users can view their own wallet adjustments" ON public.wallet_adjustments
  FOR SELECT USING (auth.uid() = user_id);

-- User Sessions
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 12. FIX DEPOSITS TABLE POLICIES (if table exists)
-- =====================================================

-- Check if deposits table exists and create policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deposits' AND table_schema = 'public') THEN
    -- Users can create their own deposits
    DROP POLICY IF EXISTS "Users can create their own deposits" ON public.deposits;
    EXECUTE 'CREATE POLICY "Users can create their own deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id)';
    
    -- Users can view their own deposits
    DROP POLICY IF EXISTS "Users can view their own deposits" ON public.deposits;
    EXECUTE 'CREATE POLICY "Users can view their own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id)';
    
    -- Admins can manage all deposits
    DROP POLICY IF EXISTS "Admins can manage all deposits" ON public.deposits;
    EXECUTE 'CREATE POLICY "Admins can manage all deposits" ON public.deposits FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = ''admin''))';
  END IF;
END $$;

-- =====================================================
-- 13. FIX STORAGE POLICIES
-- =====================================================

-- Fix KYC documents storage policies
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;
CREATE POLICY "Admins can view all KYC documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =====================================================
-- 14. ADD MISSING POLICIES FOR COMPLETE FUNCTIONALITY
-- =====================================================

-- Add policies for trade outcome logs if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trade_outcome_logs' AND table_schema = 'public') THEN
    -- Admins can view all trade outcome logs
    DROP POLICY IF EXISTS "Admins can view all trade outcome logs" ON public.trade_outcome_logs;
    EXECUTE 'CREATE POLICY "Admins can view all trade outcome logs" ON public.trade_outcome_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = ''admin''))';
    
    -- Admins can insert trade outcome logs
    DROP POLICY IF EXISTS "Admins can insert trade outcome logs" ON public.trade_outcome_logs;
    EXECUTE 'CREATE POLICY "Admins can insert trade outcome logs" ON public.trade_outcome_logs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = ''admin'') AND auth.uid() = admin_id)';
  END IF;
END $$;

-- =====================================================
-- 15. CREATE HELPER FUNCTION FOR ROLE CHECKING
-- =====================================================

-- Create or replace the has_role function with proper error handling
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =====================================================
-- 16. VERIFICATION QUERIES
-- =====================================================

-- Verify all policies are created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Verify storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
ORDER BY tablename, policyname;

-- =====================================================
-- END OF POLICY FIXES
-- =====================================================
