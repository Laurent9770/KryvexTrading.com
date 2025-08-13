-- =============================================
-- FIX FOREIGN KEYS AND TABLE NAMES
-- This migration fixes the foreign key relationship and creates missing tables
-- =============================================

-- Step 1: Fix foreign key relationship between trades and trading_pairs
DO $$
BEGIN
    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trades_trading_pair_id_fkey' 
        AND table_name = 'trades' 
        AND table_schema = 'public'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE public.trades 
        ADD CONSTRAINT trades_trading_pair_id_fkey 
        FOREIGN KEY (trading_pair_id) REFERENCES public.trading_pairs(id);
        
        RAISE NOTICE '✅ Added foreign key constraint between trades and trading_pairs';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key constraint already exists';
    END IF;
END $$;

-- Step 2: Create transactions table that frontend expects
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
        CREATE TABLE public.transactions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade_profit', 'trade_loss')),
            amount DECIMAL(20,8) NOT NULL,
            currency TEXT NOT NULL DEFAULT 'USD',
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
            payment_method TEXT,
            transaction_hash TEXT,
            admin_notes TEXT,
            processed_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            processed_at TIMESTAMP WITH TIME ZONE
        );
        
        -- Enable RLS
        ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view own transactions" ON public.transactions
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can create transactions" ON public.transactions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Admins can manage all transactions" ON public.transactions
            FOR ALL USING (has_role(auth.uid(), 'admin'));
            
        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
        GRANT ALL ON public.transactions TO service_role;
        
        RAISE NOTICE '✅ Created transactions table with RLS policies';
    ELSE
        RAISE NOTICE 'ℹ️ transactions table already exists';
    END IF;
END $$;

-- Step 3: Migrate data from wallet_transactions to transactions if needed
DO $$
DECLARE
    wallet_transactions_count INTEGER;
    transactions_count INTEGER;
BEGIN
    -- Check if wallet_transactions table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions' AND table_schema = 'public') THEN
        SELECT COUNT(*) INTO wallet_transactions_count FROM public.wallet_transactions;
        
        IF wallet_transactions_count > 0 THEN
            -- Insert data from wallet_transactions to transactions
            INSERT INTO public.transactions (
                user_id,
                type,
                amount,
                currency,
                status,
                payment_method,
                transaction_hash,
                admin_notes,
                processed_by,
                created_at,
                processed_at
            )
            SELECT 
                user_id,
                CASE 
                    WHEN transaction_type = 'deposit' THEN 'deposit'
                    WHEN transaction_type = 'withdrawal' THEN 'withdrawal'
                    ELSE 'deposit' -- default fallback
                END as type,
                amount,
                currency,
                status,
                payment_method,
                transaction_hash,
                admin_notes,
                processed_by,
                created_at,
                processed_at
            FROM public.wallet_transactions
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE '✅ Migrated % records from wallet_transactions to transactions', wallet_transactions_count;
        ELSE
            RAISE NOTICE 'ℹ️ wallet_transactions table is empty, no migration needed';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ wallet_transactions table does not exist';
    END IF;
END $$;

-- Step 4: Verify the fixes
DO $$
DECLARE
    fk_exists BOOLEAN;
    transactions_table_exists BOOLEAN;
    transactions_count INTEGER;
BEGIN
    -- Check foreign key
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trades_trading_pair_id_fkey' 
        AND table_name = 'trades' 
        AND table_schema = 'public'
    ) INTO fk_exists;
    
    -- Check transactions table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'transactions' 
        AND table_schema = 'public'
    ) INTO transactions_table_exists;
    
    -- Count transactions
    IF transactions_table_exists THEN
        SELECT COUNT(*) INTO transactions_count FROM public.transactions;
    ELSE
        transactions_count := 0;
    END IF;
    
    RAISE NOTICE '=== FIX VERIFICATION ===';
    RAISE NOTICE 'Foreign key exists: %', fk_exists;
    RAISE NOTICE 'Transactions table exists: %', transactions_table_exists;
    RAISE NOTICE 'Transactions count: %', transactions_count;
    
    IF fk_exists AND transactions_table_exists THEN
        RAISE NOTICE '✅ All fixes applied successfully!';
    ELSE
        RAISE NOTICE '❌ Some fixes are missing!';
    END IF;
END $$;

-- Step 5: Show current table structure for verification
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('trades', 'trading_pairs', 'transactions')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
