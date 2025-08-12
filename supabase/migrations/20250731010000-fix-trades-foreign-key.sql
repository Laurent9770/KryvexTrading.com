-- Fix Trades Foreign Key Relationship
-- This migration ensures the trades table has proper foreign key relationship with profiles

-- 1. Check if foreign key constraint exists
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trades_user_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'trades'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        -- Add foreign key constraint
        ALTER TABLE public.trades 
        ADD CONSTRAINT trades_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint trades_user_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint trades_user_id_fkey already exists';
    END IF;
END $$;

-- 2. Verify the trades table structure
DO $$
DECLARE
    col_name TEXT;
    col_type TEXT;
    nullable_status TEXT;
BEGIN
    RAISE NOTICE '=== TRADES TABLE STRUCTURE ===';
    FOR col_name, col_type, nullable_status IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trades'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '- % (%) %', col_name, col_type, 
            CASE WHEN nullable_status = 'YES' THEN 'NULL' ELSE 'NOT NULL' END;
    END LOOP;
END $$;

-- 3. Check foreign key constraints
DO $$
DECLARE
    constraint_name TEXT;
    column_name TEXT;
    referenced_table TEXT;
    referenced_column TEXT;
BEGIN
    RAISE NOTICE '=== FOREIGN KEY CONSTRAINTS ===';
    FOR constraint_name, column_name, referenced_table, referenced_column IN 
        SELECT 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name,
            ccu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'trades'
        AND tc.table_schema = 'public'
    LOOP
        RAISE NOTICE '- %: %.% -> %.%', constraint_name, 'trades', column_name, referenced_table, referenced_column;
    END LOOP;
END $$;
