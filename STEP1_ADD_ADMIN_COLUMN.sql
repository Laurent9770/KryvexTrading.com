-- STEP 1: Add is_admin column to profiles table
-- Run this FIRST in Supabase SQL Editor

-- Check if is_admin column exists and add it if missing
DO $$
DECLARE
    col record;
BEGIN
    -- Check if is_admin column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) THEN
        -- Add is_admin column
        ALTER TABLE public.profiles 
        ADD COLUMN is_admin BOOLEAN DEFAULT false;
        
        RAISE NOTICE '✅ Added is_admin column to profiles table';
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);
        RAISE NOTICE '✅ Created index on is_admin column';
        
    ELSE
        RAISE NOTICE '✅ is_admin column already exists in profiles table';
    END IF;
    
    -- Show current profiles table structure
    RAISE NOTICE '';
    RAISE NOTICE '📋 PROFILES TABLE STRUCTURE:';
    RAISE NOTICE '==========================';
    
    FOR col IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % | Type: % | Nullable: % | Default: %', 
            col.column_name, col.data_type, col.is_nullable, 
            COALESCE(col.column_default, 'NULL');
    END LOOP;
    
END $$;
