-- =============================================
-- FIX RLS POLICIES FOR USER WALLETS
-- =============================================

-- Step 1: Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can update all wallets" ON public.user_wallets;

-- Step 2: Create more permissive policies for admin operations
CREATE POLICY "Users can view own wallets" ON public.user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.user_wallets
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert wallets" ON public.user_wallets
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all wallets" ON public.user_wallets
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete wallets" ON public.user_wallets
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Step 3: Also fix RLS policies for other tables that might have similar issues

-- Fix deposit_requests policies
DROP POLICY IF EXISTS "Users can view own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can view all deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can update all deposit requests" ON public.deposit_requests;

CREATE POLICY "Users can view own deposit requests" ON public.deposit_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposit requests" ON public.deposit_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposit requests" ON public.deposit_requests
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all deposit requests" ON public.deposit_requests
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Fix withdrawal_requests policies
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update all withdrawal requests" ON public.withdrawal_requests;

CREATE POLICY "Users can view own withdrawal requests" ON public.withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawal requests" ON public.withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests" ON public.withdrawal_requests
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all withdrawal requests" ON public.withdrawal_requests
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Fix admin_actions policies
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;

CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert admin actions" ON public.admin_actions
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Fix user_trading_modes policies
DROP POLICY IF EXISTS "Users can view own trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can view all trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can update all trading modes" ON public.user_trading_modes;

CREATE POLICY "Users can view own trading modes" ON public.user_trading_modes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trading modes" ON public.user_trading_modes
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert trading modes" ON public.user_trading_modes
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all trading modes" ON public.user_trading_modes
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trading modes" ON public.user_trading_modes
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Step 4: Ensure all tables have proper grants
GRANT ALL ON public.user_wallets TO authenticated;
GRANT ALL ON public.deposit_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.admin_actions TO authenticated;
GRANT ALL ON public.user_trading_modes TO authenticated;
GRANT ALL ON public.kyc_documents TO authenticated;
