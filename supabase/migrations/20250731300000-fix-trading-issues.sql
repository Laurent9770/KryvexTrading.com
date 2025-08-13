-- =============================================
-- FIX TRADING TABLE ISSUES
-- This migration fixes RLS policies and schema issues for trading functionality
-- =============================================

-- Step 1: Check current trading tables structure
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('trades', 'trading_pairs', 'user_wallets')
AND table_schema = 'public'
ORDER BY table_name;

-- Step 2: Check if trading_pairs table exists and has correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trading_pairs' AND table_schema = 'public') THEN
        -- Create trading_pairs table if it doesn't exist
        CREATE TABLE public.trading_pairs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            base_currency TEXT NOT NULL,
            quote_currency TEXT NOT NULL,
            symbol TEXT NOT NULL UNIQUE,
            is_active BOOLEAN DEFAULT true,
            min_trade_amount DECIMAL(20,8) DEFAULT 0,
            max_trade_amount DECIMAL(20,8) DEFAULT 1000000,
            price_precision INTEGER DEFAULT 8,
            quantity_precision INTEGER DEFAULT 8,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default trading pairs
        INSERT INTO public.trading_pairs (base_currency, quote_currency, symbol) VALUES
            ('BTC', 'USDT', 'BTCUSDT'),
            ('ETH', 'USDT', 'ETHUSDT'),
            ('BNB', 'USDT', 'BNBUSDT'),
            ('ADA', 'USDT', 'ADAUSDT'),
            ('SOL', 'USDT', 'SOLUSDT'),
            ('DOT', 'USDT', 'DOTUSDT'),
            ('LINK', 'USDT', 'LINKUSDT'),
            ('UNI', 'USDT', 'UNIUSDT'),
            ('LTC', 'USDT', 'LTCUSDT'),
            ('BCH', 'USDT', 'BCHUSDT');
            
        RAISE NOTICE '✅ Created trading_pairs table with default pairs';
    ELSE
        RAISE NOTICE 'ℹ️ trading_pairs table already exists';
    END IF;
END $$;

-- Step 3: Check and fix trades table structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trades' AND table_schema = 'public') THEN
        -- Add trading_pair_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'trading_pair_id' AND table_schema = 'public') THEN
            ALTER TABLE public.trades ADD COLUMN trading_pair_id UUID REFERENCES public.trading_pairs(id);
            RAISE NOTICE '✅ Added trading_pair_id column to trades table';
        ELSE
            RAISE NOTICE 'ℹ️ trading_pair_id column already exists in trades table';
        END IF;
        
        -- Add symbol column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'symbol' AND table_schema = 'public') THEN
            ALTER TABLE public.trades ADD COLUMN symbol TEXT;
            RAISE NOTICE '✅ Added symbol column to trades table';
        ELSE
            RAISE NOTICE 'ℹ️ symbol column already exists in trades table';
        END IF;
        
        -- Add trade_category column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'trade_category' AND table_schema = 'public') THEN
            ALTER TABLE public.trades ADD COLUMN trade_category TEXT DEFAULT 'spot';
            RAISE NOTICE '✅ Added trade_category column to trades table';
        ELSE
            RAISE NOTICE 'ℹ️ trade_category column already exists in trades table';
        END IF;
    ELSE
        -- Create trades table if it doesn't exist
        CREATE TABLE public.trades (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            trading_pair_id UUID REFERENCES public.trading_pairs(id),
            symbol TEXT,
            trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
            trade_category TEXT NOT NULL CHECK (trade_category IN ('spot', 'futures', 'options', 'binary')),
            amount DECIMAL(20,8) NOT NULL,
            price DECIMAL(20,8) NOT NULL,
            total_value DECIMAL(20,8) NOT NULL,
            status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
            result TEXT CHECK (result IN ('win', 'loss', 'pending')),
            profit_loss DECIMAL(20,8) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created trades table';
    END IF;
END $$;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_trading_pair_id ON public.trades(trading_pair_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON public.trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at);

-- Step 5: Enable RLS on trading tables
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing RLS policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can insert own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update own trades" ON public.trades;
DROP POLICY IF EXISTS "Admins can view all trades" ON public.trades;
DROP POLICY IF EXISTS "Admins can manage all trades" ON public.trades;

DROP POLICY IF EXISTS "Users can view trading pairs" ON public.trading_pairs;
DROP POLICY IF EXISTS "Admins can manage trading pairs" ON public.trading_pairs;

-- Step 7: Create proper RLS policies for trades table
CREATE POLICY "Users can view own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trades" ON public.trades
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all trades" ON public.trades
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Step 8: Create RLS policies for trading_pairs table
CREATE POLICY "Users can view trading pairs" ON public.trading_pairs
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage trading pairs" ON public.trading_pairs
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Step 9: Grant proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trades TO authenticated;
GRANT SELECT ON public.trading_pairs TO authenticated;
GRANT ALL ON public.trades TO service_role;
GRANT ALL ON public.trading_pairs TO service_role;

-- Step 10: Create trigger for updated_at on trades table
DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Create trigger for updated_at on trading_pairs table
DROP TRIGGER IF EXISTS update_trading_pairs_updated_at ON public.trading_pairs;
CREATE TRIGGER update_trading_pairs_updated_at
    BEFORE UPDATE ON public.trading_pairs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 12: Insert sample trades for testing (if trades table is empty)
DO $$
DECLARE
    sample_user_id UUID;
    sample_pair_id UUID;
    trades_count INTEGER;
BEGIN
    -- Get a sample user
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    -- Get a sample trading pair
    SELECT id INTO sample_pair_id FROM public.trading_pairs LIMIT 1;
    
    -- Count existing trades
    SELECT COUNT(*) INTO trades_count FROM public.trades;
    
    IF sample_user_id IS NOT NULL AND sample_pair_id IS NOT NULL AND trades_count = 0 THEN
        -- Check if trade_category column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'trade_category' AND table_schema = 'public') THEN
            -- Insert sample trades with trade_category
            INSERT INTO public.trades (
                user_id,
                trading_pair_id,
                symbol,
                trade_type,
                trade_category,
                amount,
                price,
                total_value,
                status,
                result,
                profit_loss
            ) VALUES
                (sample_user_id, sample_pair_id, 'BTCUSDT', 'buy', 'spot', 0.001, 50000, 50, 'closed', 'win', 5),
                (sample_user_id, sample_pair_id, 'BTCUSDT', 'sell', 'futures', 0.002, 51000, 102, 'closed', 'loss', -2),
                (sample_user_id, sample_pair_id, 'ETHUSDT', 'buy', 'options', 0.01, 3000, 30, 'open', 'pending', 0);
        ELSE
            -- Insert sample trades without trade_category
            INSERT INTO public.trades (
                user_id,
                trading_pair_id,
                symbol,
                trade_type,
                amount,
                price,
                total_value,
                status,
                result,
                profit_loss
            ) VALUES
                (sample_user_id, sample_pair_id, 'BTCUSDT', 'buy', 0.001, 50000, 50, 'closed', 'win', 5),
                (sample_user_id, sample_pair_id, 'BTCUSDT', 'sell', 0.002, 51000, 102, 'closed', 'loss', -2),
                (sample_user_id, sample_pair_id, 'ETHUSDT', 'buy', 0.01, 3000, 30, 'open', 'pending', 0);
        END IF;
            
        RAISE NOTICE '✅ Inserted sample trades for testing';
    ELSE
        RAISE NOTICE 'ℹ️ Skipped sample trades insertion (user: %, pair: %, existing trades: %)', 
            sample_user_id IS NOT NULL, sample_pair_id IS NOT NULL, trades_count;
    END IF;
END $$;

-- Step 13: Verify the fixes
DO $$
DECLARE
    trades_table_exists BOOLEAN;
    trading_pairs_table_exists BOOLEAN;
    trades_count INTEGER;
    pairs_count INTEGER;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trades' AND table_schema = 'public') INTO trades_table_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trading_pairs' AND table_schema = 'public') INTO trading_pairs_table_exists;
    
    -- Count records
    IF trades_table_exists THEN
        SELECT COUNT(*) INTO trades_count FROM public.trades;
    ELSE
        trades_count := 0;
    END IF;
    
    IF trading_pairs_table_exists THEN
        SELECT COUNT(*) INTO pairs_count FROM public.trading_pairs;
    ELSE
        pairs_count := 0;
    END IF;
    
    RAISE NOTICE '=== TRADING FIX VERIFICATION ===';
    RAISE NOTICE 'Trades table exists: %', trades_table_exists;
    RAISE NOTICE 'Trading pairs table exists: %', trading_pairs_table_exists;
    RAISE NOTICE 'Trades count: %', trades_count;
    RAISE NOTICE 'Trading pairs count: %', pairs_count;
    
    IF trades_table_exists AND trading_pairs_table_exists THEN
        RAISE NOTICE '✅ Trading tables are properly set up!';
    ELSE
        RAISE NOTICE '❌ Some trading tables are missing!';
    END IF;
END $$;

-- Step 14: Show RLS policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('trades', 'trading_pairs')
AND schemaname = 'public'
ORDER BY tablename, policyname;
