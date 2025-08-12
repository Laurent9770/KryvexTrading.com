-- =============================================
-- ULTIMATE FORCE FIX MIGRATION
-- This migration drops and recreates all relevant tables, functions,
-- RLS policies, and grants to ensure a clean and correct database setup.
-- =============================================

-- Set search path for convenience
SET search_path TO public;

-- =============================================
-- Step 0: Drop existing functions (CASCADE to remove dependencies)
-- =============================================
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS has_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS promote_to_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS demote_from_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_admin_user(TEXT, TEXT) CASCADE;

-- =============================================
-- Step 1: Drop existing tables (CASCADE to remove dependencies)
-- Order matters due to foreign key constraints
-- =============================================
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS deposit_requests CASCADE;
DROP TABLE IF EXISTS withdrawal_requests CASCADE;
DROP TABLE IF EXISTS user_wallets CASCADE;
DROP TABLE IF EXISTS user_trading_modes CASCADE;
DROP TABLE IF EXISTS kyc_documents CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =============================================
-- Step 2: Recreate common utility functions
-- =============================================

-- Function to update 'updated_at' column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check user role
CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE user_id = user_uuid;
    RETURN user_role = role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote user from admin
CREATE OR REPLACE FUNCTION demote_from_admin(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET role = 'user'
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create/update admin user in profiles table
CREATE OR REPLACE FUNCTION create_admin_user(admin_email TEXT, admin_full_name TEXT DEFAULT 'Admin User')
RETURNS BOOLEAN AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if user exists in auth.users
    SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;

    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % does not exist in auth.users. Please create the user via authentication first.', admin_email;
    END IF;

    INSERT INTO public.profiles (user_id, email, full_name, role, kyc_status, account_balance, is_verified)
    VALUES
        (admin_user_id, admin_email, admin_full_name, 'admin', 'approved', 10000, true)
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        kyc_status = EXCLUDED.kyc_status,
        account_balance = EXCLUDED.account_balance,
        is_verified = EXCLUDED.is_verified,
        updated_at = NOW();

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Step 3: Recreate Tables with Correct Schemas
-- =============================================

-- profiles table
CREATE TABLE public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
    kyc_status TEXT DEFAULT 'pending' NOT NULL CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    account_balance DECIMAL(20,8) DEFAULT 0 NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- user_wallets table
CREATE TABLE public.user_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('funding', 'trading')),
    asset TEXT NOT NULL,
    balance DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_type, asset)
);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_wallet_type ON public.user_wallets(wallet_type);
CREATE INDEX IF NOT EXISTS idx_user_wallets_asset ON public.user_wallets(asset);
CREATE TRIGGER update_user_wallets_updated_at
    BEFORE UPDATE ON public.user_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- deposit_requests table
CREATE TABLE public.deposit_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    proof_file TEXT, -- URL to uploaded proof
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Redundant but kept for consistency with some frontend
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TRIGGER update_deposit_requests_updated_at
    BEFORE UPDATE ON public.deposit_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Redundant but kept for consistency with some frontend
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TRIGGER update_withdrawal_requests_updated_at
    BEFORE UPDATE ON public.withdrawal_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- admin_actions table
CREATE TABLE public.admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_email TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    details JSONB, -- Store structured details about the action
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TRIGGER update_admin_actions_updated_at
    BEFORE UPDATE ON public.admin_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- user_trading_modes table
CREATE TABLE public.user_trading_modes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode_type TEXT NOT NULL CHECK (mode_type IN ('normal', 'override_win', 'override_loss')),
    is_active BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, mode_type)
);
CREATE TRIGGER update_user_trading_modes_updated_at
    BEFORE UPDATE ON public.user_trading_modes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- kyc_documents table
CREATE TABLE public.kyc_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TRIGGER update_kyc_documents_updated_at
    BEFORE UPDATE ON public.kyc_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Step 4: Enable RLS and Drop ALL existing policies
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trading_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Drop all policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Drop all policies for user_wallets
DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can insert own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can delete own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can insert any wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can update any wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can delete any wallet" ON public.user_wallets;

-- Drop all policies for deposit_requests
DROP POLICY IF EXISTS "Users can view own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Users can insert own deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can view all deposit requests" ON public.deposit_requests;
DROP POLICY IF EXISTS "Admins can update all deposit requests" ON public.deposit_requests;

-- Drop all policies for withdrawal_requests
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can create withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can insert own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can view their own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can manage all withdrawal requests" ON public.withdrawal_requests;

-- Drop all policies for admin_actions
DROP POLICY IF EXISTS "Admins can view admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can create admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;

-- Drop all policies for user_trading_modes
DROP POLICY IF EXISTS "Users can view own trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Users can insert own trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Users can update own trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can view all trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can insert any trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can update any trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can delete any trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can insert trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can update trading modes" ON public.user_trading_modes;
DROP POLICY IF EXISTS "Admins can delete trading modes" ON public.user_trading_modes;

-- Drop all policies for kyc_documents
DROP POLICY IF EXISTS "Users can view own KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Users can insert own KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can update all KYC documents" ON public.kyc_documents;

-- =============================================
-- Step 5: Recreate RLS Policies
-- =============================================

-- profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- user_wallets policies
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

-- deposit_requests policies
CREATE POLICY "Users can view own deposit requests" ON public.deposit_requests
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deposit requests" ON public.deposit_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all deposit requests" ON public.deposit_requests
    FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all deposit requests" ON public.deposit_requests
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- withdrawal_requests policies
CREATE POLICY "Users can view own withdrawal requests" ON public.withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own withdrawal requests" ON public.withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all withdrawal requests" ON public.withdrawal_requests
    FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all withdrawal requests" ON public.withdrawal_requests
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- admin_actions policies
CREATE POLICY "Admins can view admin actions" ON public.admin_actions
    FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert admin actions" ON public.admin_actions
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- user_trading_modes policies
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

-- kyc_documents policies
CREATE POLICY "Users can view own KYC documents" ON public.kyc_documents
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own KYC documents" ON public.kyc_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all KYC documents" ON public.kyc_documents
    FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all KYC documents" ON public.kyc_documents
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- Step 6: Grant Permissions
-- =============================================

-- Revoke all existing grants to ensure a clean slate
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated, service_role;

-- Grant permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deposit_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.withdrawal_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_trading_modes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_documents TO authenticated;

-- Grant permissions to anon role (typically read-only for public data)
GRANT SELECT ON public.profiles TO anon;
-- Add other tables if they need public read access
-- GRANT SELECT ON public.some_public_table TO anon;

-- Grant permissions to service_role (full access for backend operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role; -- For sequence-generated IDs

-- =============================================
-- Step 7: Insert/Update Admin User and Sample Data
-- =============================================

-- Ensure the admin user exists in auth.users before running this
-- Example: SELECT id FROM auth.users WHERE email = 'kryvextrading@gmail.com';
-- If it doesn't exist, create it via Supabase Auth first.
SELECT create_admin_user('kryvextrading@gmail.com', 'Kryvex Admin');

-- Insert sample wallet data for existing users (if any)
INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance)
SELECT
    p.user_id,
    'trading' as wallet_type,
    'USDT' as asset,
    COALESCE(p.account_balance, 0) as balance
FROM public.profiles p
WHERE p.user_id IS NOT NULL
ON CONFLICT (user_id, wallet_type, asset) DO UPDATE SET
    balance = EXCLUDED.balance,
    updated_at = NOW();

-- =============================================
-- Step 8: Final Verification Checks
-- =============================================

-- Verify grants for user_wallets
SELECT
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'user_wallets'
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Verify RLS policies for all tables
SELECT
    tablename,
    COUNT(policyname) AS policy_count,
    string_agg(policyname, ', ') AS policies
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'user_wallets', 'deposit_requests', 'withdrawal_requests', 'admin_actions', 'user_trading_modes', 'kyc_documents')
GROUP BY tablename
ORDER BY tablename;

-- Test has_role function for admin and provide final status
DO $$
DECLARE
    admin_id UUID;
    is_admin BOOLEAN;
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = 'kryvextrading@gmail.com';
    IF admin_id IS NOT NULL THEN
        SELECT has_role(admin_id, 'admin') INTO is_admin;
        RAISE NOTICE 'Admin user (kryvextrading@gmail.com) has_role(''admin''): %', is_admin;
    ELSE
        RAISE NOTICE 'Admin user kryvextrading@gmail.com not found in auth.users.';
    END IF;
    
    RAISE NOTICE 'Ultimate force fix migration completed. Please check the output above for verification.';
END $$;
