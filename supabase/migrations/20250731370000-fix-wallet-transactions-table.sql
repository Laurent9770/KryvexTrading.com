-- =============================================
-- FIX WALLET TRANSACTIONS TABLE
-- This migration creates the missing wallet_transactions table and sets up proper permissions
-- =============================================

-- Step 1: Check if wallet_transactions table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ wallet_transactions table already exists';
    ELSE
        RAISE NOTICE '❌ wallet_transactions table does not exist - will create it';
    END IF;
END $$;

-- Step 2: Create wallet_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'fee', 'bonus', 'refund')),
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('funding', 'trading')),
    description TEXT,
    reference_id UUID, -- Reference to related table (deposit_requests, withdrawal_requests, etc.)
    reference_table TEXT, -- Table name for the reference
    admin_id UUID REFERENCES auth.users(id), -- Admin who processed the transaction
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON public.wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_type ON public.wallet_transactions(wallet_type);

-- Step 4: Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can create own wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can view all wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can manage all wallet transactions" ON public.wallet_transactions;

-- Step 6: Create RLS policies
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wallet transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all wallet transactions" ON public.wallet_transactions
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Step 7: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;

-- Step 8: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_wallet_transactions_updated_at ON public.wallet_transactions;
CREATE TRIGGER update_wallet_transactions_updated_at
    BEFORE UPDATE ON public.wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Migrate existing data from other tables to wallet_transactions
DO $$
DECLARE
    deposit_count INTEGER;
    withdrawal_count INTEGER;
BEGIN
    -- Migrate deposit_requests to wallet_transactions
    INSERT INTO public.wallet_transactions (
        user_id,
        transaction_type,
        amount,
        currency,
        status,
        wallet_type,
        description,
        reference_id,
        reference_table,
        processed_at,
        created_at
    )
    SELECT 
        user_id,
        'deposit' as transaction_type,
        amount,
        currency,
        status,
        'funding' as wallet_type,
        COALESCE(remarks, 'Deposit request') as description,
        id as reference_id,
        'deposit_requests' as reference_table,
        processed_at,
        requested_at as created_at
    FROM public.deposit_requests
    ON CONFLICT DO NOTHING;
    
    GET DIAGNOSTICS deposit_count = ROW_COUNT;
    
    -- Migrate withdrawal_requests to wallet_transactions
    INSERT INTO public.wallet_transactions (
        user_id,
        transaction_type,
        amount,
        currency,
        status,
        wallet_type,
        description,
        reference_id,
        reference_table,
        processed_at,
        created_at
    )
    SELECT 
        user_id,
        'withdrawal' as transaction_type,
        amount,
        currency,
        status,
        'funding' as wallet_type,
        COALESCE(remarks, 'Withdrawal request') as description,
        id as reference_id,
        'withdrawal_requests' as reference_table,
        processed_at,
        requested_at as created_at
    FROM public.withdrawal_requests
    ON CONFLICT DO NOTHING;
    
    GET DIAGNOSTICS withdrawal_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Migrated % deposit requests and % withdrawal requests to wallet_transactions', deposit_count, withdrawal_count;
END $$;

-- Step 10: Verify the fixes
DO $$
DECLARE
    table_exists BOOLEAN;
    policies_count INTEGER;
    grants_count INTEGER;
    transactions_count INTEGER;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'wallet_transactions' 
        AND table_schema = 'public'
    ) INTO table_exists;
    
    -- Count policies
    SELECT COUNT(*) INTO policies_count
    FROM pg_policies 
    WHERE tablename = 'wallet_transactions' 
    AND schemaname = 'public';
    
    -- Count grants
    SELECT COUNT(*) INTO grants_count
    FROM information_schema.role_table_grants 
    WHERE table_name = 'wallet_transactions' 
    AND table_schema = 'public'
    AND grantee = 'authenticated';
    
    -- Count transactions
    SELECT COUNT(*) INTO transactions_count FROM public.wallet_transactions;
    
    RAISE NOTICE '=== WALLET TRANSACTIONS VERIFICATION ===';
    RAISE NOTICE 'Table exists: %', table_exists;
    RAISE NOTICE 'RLS policies count: %', policies_count;
    RAISE NOTICE 'Grants count for authenticated: %', grants_count;
    RAISE NOTICE 'Transactions count: %', transactions_count;
    
    IF table_exists AND policies_count >= 4 AND grants_count >= 1 THEN
        RAISE NOTICE '✅ Wallet transactions table fixed successfully!';
    ELSE
        RAISE NOTICE '❌ Some fixes may be missing!';
    END IF;
END $$;

-- Step 11: Show current policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'wallet_transactions'
AND schemaname = 'public'
ORDER BY policyname;
