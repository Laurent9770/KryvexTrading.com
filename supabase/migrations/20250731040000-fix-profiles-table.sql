-- Fix Profiles Table Migration
-- This migration ensures the profiles table has all required columns

-- 1. Add missing columns to profiles table if they don't exist
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if role column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));
        RAISE NOTICE 'Added role column to profiles table';
    END IF;
    
    -- Check if kyc_status column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'kyc_status'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected'));
        RAISE NOTICE 'Added kyc_status column to profiles table';
    END IF;
    
    -- Check if account_balance column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'account_balance'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN account_balance DECIMAL(20, 8) DEFAULT 0;
        RAISE NOTICE 'Added account_balance column to profiles table';
    END IF;
    
    -- Check if is_verified column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_verified'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_verified column to profiles table';
    END IF;
    
    -- Check if updated_at column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'updated_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
        RAISE NOTICE 'Added updated_at column to profiles table';
    END IF;
END $$;

-- 2. Verify the profiles table structure
DO $$
DECLARE
    col_name TEXT;
BEGIN
    RAISE NOTICE '=== PROFILES TABLE COLUMNS ===';
    FOR col_name IN 
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '- %', col_name;
    END LOOP;
END $$;
