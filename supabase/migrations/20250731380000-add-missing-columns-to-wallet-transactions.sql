-- =============================================
-- ADD MISSING COLUMNS TO WALLET TRANSACTIONS
-- This migration adds missing columns to the existing wallet_transactions table
-- =============================================

-- Step 1: Check current table structure
DO $$
BEGIN
    RAISE NOTICE '=== CURRENT WALLET TRANSACTIONS STRUCTURE ===';
END $$;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'wallet_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add missing columns if they don't exist
DO $$
BEGIN
    -- Add transaction_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'transaction_type' AND table_schema = 'public') THEN
        ALTER TABLE public.wallet_transactions ADD COLUMN transaction_type TEXT;
        RAISE NOTICE '✅ Added transaction_type column to wallet_transactions';
    ELSE
        RAISE NOTICE 'ℹ️ transaction_type column already exists';
    END IF;
    
    -- Add wallet_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'wallet_type' AND table_schema = 'public') THEN
        ALTER TABLE public.wallet_transactions ADD COLUMN wallet_type TEXT DEFAULT 'funding';
        RAISE NOTICE '✅ Added wallet_type column to wallet_transactions';
    ELSE
        RAISE NOTICE 'ℹ️ wallet_type column already exists';
    END IF;
    
    -- Add reference_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'reference_id' AND table_schema = 'public') THEN
        ALTER TABLE public.wallet_transactions ADD COLUMN reference_id UUID;
        RAISE NOTICE '✅ Added reference_id column to wallet_transactions';
    ELSE
        RAISE NOTICE 'ℹ️ reference_id column already exists';
    END IF;
    
    -- Add reference_table column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'reference_table' AND table_schema = 'public') THEN
        ALTER TABLE public.wallet_transactions ADD COLUMN reference_table TEXT;
        RAISE NOTICE '✅ Added reference_table column to wallet_transactions';
    ELSE
        RAISE NOTICE 'ℹ️ reference_table column already exists';
    END IF;
    
    -- Add admin_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'admin_id' AND table_schema = 'public') THEN
        ALTER TABLE public.wallet_transactions ADD COLUMN admin_id UUID REFERENCES auth.users(id);
        RAISE NOTICE '✅ Added admin_id column to wallet_transactions';
    ELSE
        RAISE NOTICE 'ℹ️ admin_id column already exists';
    END IF;
    
    -- Add processed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'processed_at' AND table_schema = 'public') THEN
        ALTER TABLE public.wallet_transactions ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added processed_at column to wallet_transactions';
    ELSE
        RAISE NOTICE 'ℹ️ processed_at column already exists';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'updated_at' AND table_schema = 'public') THEN
        ALTER TABLE public.wallet_transactions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column to wallet_transactions';
    ELSE
        RAISE NOTICE 'ℹ️ updated_at column already exists';
    END IF;
END $$;

-- Step 3: Update existing records to have proper transaction_type
DO $$
BEGIN
    -- Update existing records that don't have transaction_type
    UPDATE public.wallet_transactions 
    SET transaction_type = CASE 
        WHEN type = 'deposit' THEN 'deposit'
        WHEN type = 'withdrawal' THEN 'withdrawal'
        WHEN type = 'transfer' THEN 'transfer'
        WHEN type = 'fee' THEN 'fee'
        WHEN type = 'bonus' THEN 'bonus'
        WHEN type = 'refund' THEN 'refund'
        ELSE 'deposit' -- Default fallback
    END
    WHERE transaction_type IS NULL;
    
    RAISE NOTICE '✅ Updated existing records with transaction_type';
END $$;

-- Step 4: Add constraints if they don't exist
DO $$
BEGIN
    -- Add check constraint for transaction_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%transaction_type%' 
        AND table_name = 'wallet_transactions'
    ) THEN
        ALTER TABLE public.wallet_transactions 
        ADD CONSTRAINT wallet_transactions_transaction_type_check 
        CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'fee', 'bonus', 'refund'));
        RAISE NOTICE '✅ Added transaction_type check constraint';
    ELSE
        RAISE NOTICE 'ℹ️ transaction_type check constraint already exists';
    END IF;
    
    -- Add check constraint for wallet_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%wallet_type%' 
        AND table_name = 'wallet_transactions'
    ) THEN
        ALTER TABLE public.wallet_transactions 
        ADD CONSTRAINT wallet_transactions_wallet_type_check 
        CHECK (wallet_type IN ('funding', 'trading'));
        RAISE NOTICE '✅ Added wallet_type check constraint';
    ELSE
        RAISE NOTICE 'ℹ️ wallet_type check constraint already exists';
    END IF;
END $$;

-- Step 5: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON public.wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_type ON public.wallet_transactions(wallet_type);

-- Step 6: Ensure RLS is enabled
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop and recreate policies to ensure they work with new columns
DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can create own wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can view all wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can manage all wallet transactions" ON public.wallet_transactions;

CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wallet transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all wallet transactions" ON public.wallet_transactions
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Step 8: Ensure permissions are granted
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;

-- Step 9: Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_wallet_transactions_updated_at ON public.wallet_transactions;
CREATE TRIGGER update_wallet_transactions_updated_at
    BEFORE UPDATE ON public.wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Migrate data from other tables if not already done
DO $$
DECLARE
    deposit_count INTEGER;
    withdrawal_count INTEGER;
BEGIN
    -- Check if we already have data from deposit_requests
    SELECT COUNT(*) INTO deposit_count
    FROM public.wallet_transactions 
    WHERE reference_table = 'deposit_requests';
    
    IF deposit_count = 0 THEN
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
        RAISE NOTICE '✅ Migrated % deposit requests to wallet_transactions', deposit_count;
    ELSE
        RAISE NOTICE 'ℹ️ Deposit data already migrated (% records found)', deposit_count;
    END IF;
    
    -- Check if we already have data from withdrawal_requests
    SELECT COUNT(*) INTO withdrawal_count
    FROM public.wallet_transactions 
    WHERE reference_table = 'withdrawal_requests';
    
    IF withdrawal_count = 0 THEN
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
        RAISE NOTICE '✅ Migrated % withdrawal requests to wallet_transactions', withdrawal_count;
    ELSE
        RAISE NOTICE 'ℹ️ Withdrawal data already migrated (% records found)', withdrawal_count;
    END IF;
END $$;

-- Step 11: Final verification
DO $$
DECLARE
    table_exists BOOLEAN;
    policies_count INTEGER;
    grants_count INTEGER;
    transactions_count INTEGER;
    columns_count INTEGER;
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
    
    -- Count columns
    SELECT COUNT(*) INTO columns_count
    FROM information_schema.columns 
    WHERE table_name = 'wallet_transactions' 
    AND table_schema = 'public';
    
    RAISE NOTICE '=== FINAL WALLET TRANSACTIONS VERIFICATION ===';
    RAISE NOTICE 'Table exists: %', table_exists;
    RAISE NOTICE 'Columns count: %', columns_count;
    RAISE NOTICE 'RLS policies count: %', policies_count;
    RAISE NOTICE 'Grants count for authenticated: %', grants_count;
    RAISE NOTICE 'Transactions count: %', transactions_count;
    
    IF table_exists AND columns_count >= 12 AND policies_count >= 4 AND grants_count >= 1 THEN
        RAISE NOTICE '✅ Wallet transactions table fully fixed and operational!';
    ELSE
        RAISE NOTICE '❌ Some fixes may be missing!';
    END IF;
END $$;

-- Step 12: Show final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'wallet_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;
