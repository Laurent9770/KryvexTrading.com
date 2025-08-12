-- =============================================
-- COMPREHENSIVE RLS FIX FOR ADMIN OPERATIONS
-- =============================================

-- Step 1: Temporarily disable RLS to clear any problematic policies
ALTER TABLE public.user_wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trading_modes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to start fresh
-- Drop all policies for user_wallets
DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can insert own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can insert wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can insert any wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can update all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can delete wallets" ON public.user_wallets;

-- Drop all policies for deposit_requests
DROP POLICY IF EXISTS "Users can view own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can insert own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can view all deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can update all deposit requests" ON public.deposit_requests;

-- Drop all policies for withdrawal_requests
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can insert own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update all withdrawal requests" ON public.withdrawal_requests;

-- Drop all policies for admin_actions
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;

-- Drop all policies for user_trading_modes
DROP POLICY IF EXISTS "Users can view own trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Users can insert own trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Users can update own trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can view all trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can insert trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can insert any trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can update all trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can delete trading modes" ON public.user_trading_modes;

-- Drop all policies for kyc_documents
DROP POLICY IF EXISTS "Users can view own KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Users can insert own KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can update all KYC documents" ON public.kyc_documents;

-- Step 3: Re-enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trading_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Step 4: Create comprehensive policies for user_wallets
CREATE POLICY "Users can view own wallets" ON public.user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets" ON public.user_wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets" ON public.user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.user_wallets
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert any wallet" ON public.user_wallets
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any wallet" ON public.user_wallets
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any wallet" ON public.user_wallets
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Step 5: Create comprehensive policies for deposit_requests
CREATE POLICY "Users can view own deposit requests" ON public.deposit_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposit requests" ON public.deposit_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposit requests" ON public.deposit_requests
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all deposit requests" ON public.deposit_requests
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Step 6: Create comprehensive policies for withdrawal_requests
CREATE POLICY "Users can view own withdrawal requests" ON public.withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawal requests" ON public.withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests" ON public.withdrawal_requests
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all withdrawal requests" ON public.withdrawal_requests
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Step 7: Create comprehensive policies for admin_actions
CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert admin actions" ON public.admin_actions
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Step 8: Create comprehensive policies for user_trading_modes
CREATE POLICY "Users can view own trading modes" ON public.user_trading_modes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading modes" ON public.user_trading_modes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trading modes" ON public.user_trading_modes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trading modes" ON public.user_trading_modes
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert any trading modes" ON public.user_trading_modes
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any trading modes" ON public.user_trading_modes
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any trading modes" ON public.user_trading_modes
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Step 9: Create comprehensive policies for kyc_documents
CREATE POLICY "Users can view own KYC documents" ON public.kyc_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC documents" ON public.kyc_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC documents" ON public.kyc_documents
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all KYC documents" ON public.kyc_documents
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Step 10: Ensure all tables have proper grants
GRANT ALL ON public.user_wallets TO authenticated;
GRANT ALL ON public.deposit_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.admin_actions TO authenticated;
GRANT ALL ON public.user_trading_modes TO authenticated;
GRANT ALL ON public.kyc_documents TO authenticated;

-- Step 11: Verify the has_role function exists and works
DO $$
BEGIN
    -- Check if has_role function exists
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
        RAISE EXCEPTION 'has_role function does not exist. Please run the main migration first.';
    END IF;
END $$;

-- Step 12: Test admin access (optional - will show error if admin user doesn't exist)
-- SELECT has_role('your-admin-user-id', 'admin');
