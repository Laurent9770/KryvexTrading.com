-- =====================================================
-- FIX TABLE STRUCTURES - USER_ROLES AND ADMINS
-- =====================================================
-- This migration fixes the table structure issues
-- =====================================================

-- 1. FIX USER_ROLES TABLE STRUCTURE
-- =====================================================

-- Drop the table if it exists to recreate with proper structure
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Create user_roles table with proper structure
CREATE TABLE public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_created_at ON public.user_roles(created_at);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create RLS policies
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roles" ON public.user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 2. FIX ADMINS TABLE STRUCTURE
-- =====================================================

-- Drop the table if it exists to recreate with proper structure
DROP TABLE IF EXISTS public.admins CASCADE;

-- Create admins table with proper structure
CREATE TABLE public.admins (
    admin_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_admins_user_id ON public.admins(user_id);
CREATE INDEX idx_admins_email ON public.admins(email);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can manage all admins" ON public.admins;

-- Create RLS policies for admins table
CREATE POLICY "Admins can view all admins" ON public.admins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all admins" ON public.admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 3. ENSURE ADMIN_ACTIONS TABLE EXISTS
-- =====================================================

-- Create admin_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_table TEXT,
    target_id UUID,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON public.admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at);

-- Enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;

-- Create RLS policies for admin_actions table
CREATE POLICY "Admins can view all admin actions" ON public.admin_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert admin actions" ON public.admin_actions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 4. ENSURE WALLET_TRANSACTIONS TABLE EXISTS
-- =====================================================

-- Create wallet_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL,
    amount NUMERIC(20,8) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    wallet_type TEXT NOT NULL,
    description TEXT,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_admin_id ON public.wallet_transactions(admin_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can insert all transactions" ON public.wallet_transactions;

-- Create RLS policies for wallet_transactions table
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert all transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 5. ENSURE USER_WALLETS TABLE EXISTS
-- =====================================================

-- Create user_wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_type TEXT NOT NULL,
    asset TEXT NOT NULL,
    balance NUMERIC(20,8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_type, asset)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_wallet_type ON public.user_wallets(wallet_type);
CREATE INDEX IF NOT EXISTS idx_user_wallets_asset ON public.user_wallets(asset);

-- Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.user_wallets TO authenticated;
GRANT ALL ON public.user_wallets TO service_role;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can update all wallets" ON public.user_wallets;

-- Create RLS policies for user_wallets table
CREATE POLICY "Users can view own wallets" ON public.user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets" ON public.user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.user_wallets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all wallets" ON public.user_wallets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 6. VERIFICATION
-- =====================================================

DO $$
DECLARE
    user_roles_count INTEGER;
    admins_count INTEGER;
    admin_actions_count INTEGER;
    wallet_transactions_count INTEGER;
    user_wallets_count INTEGER;
BEGIN
    -- Count records in each table
    SELECT COUNT(*) INTO user_roles_count FROM public.user_roles;
    SELECT COUNT(*) INTO admins_count FROM public.admins;
    SELECT COUNT(*) INTO admin_actions_count FROM public.admin_actions;
    SELECT COUNT(*) INTO wallet_transactions_count FROM public.wallet_transactions;
    SELECT COUNT(*) INTO user_wallets_count FROM public.user_wallets;
    
    RAISE NOTICE '📊 user_roles table: % records', user_roles_count;
    RAISE NOTICE '📊 admins table: % records', admins_count;
    RAISE NOTICE '📊 admin_actions table: % records', admin_actions_count;
    RAISE NOTICE '📊 wallet_transactions table: % records', wallet_transactions_count;
    RAISE NOTICE '📊 user_wallets table: % records', user_wallets_count;
    
    RAISE NOTICE '✅ All table structures fixed successfully!';
END $$;
