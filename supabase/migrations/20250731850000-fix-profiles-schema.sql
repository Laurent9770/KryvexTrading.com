-- =====================================================
-- FIX PROFILES TABLE SCHEMA
-- =====================================================
-- Add missing columns and fix schema issues
-- =====================================================

-- 1. CHECK CURRENT PROFILES TABLE STRUCTURE
-- =====================================================

DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🔍 CHECKING PROFILES TABLE STRUCTURE...';
    
    -- Check if first_name column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'first_name'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ first_name column already exists';
    ELSE
        RAISE NOTICE '❌ first_name column missing - will add it';
    END IF;
    
    -- Check if last_name column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'last_name'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ last_name column already exists';
    ELSE
        RAISE NOTICE '❌ last_name column missing - will add it';
    END IF;
    
END $$;

-- 2. ADD MISSING COLUMNS TO PROFILES TABLE
-- =====================================================

-- Add first_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'first_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN first_name TEXT;
        RAISE NOTICE '✅ Added first_name column to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ first_name column already exists';
    END IF;
END $$;

-- Add last_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'last_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN last_name TEXT;
        RAISE NOTICE '✅ Added last_name column to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ last_name column already exists';
    END IF;
END $$;

-- Add phone column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
        RAISE NOTICE '✅ Added phone column to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ phone column already exists';
    END IF;
END $$;

-- Add country column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'country'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN country TEXT;
        RAISE NOTICE '✅ Added country column to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ country column already exists';
    END IF;
END $$;

-- Add city column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'city'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN city TEXT;
        RAISE NOTICE '✅ Added city column to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ city column already exists';
    END IF;
END $$;

-- Add address column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
        RAISE NOTICE '✅ Added address column to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ address column already exists';
    END IF;
END $$;

-- Add postal_code column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'postal_code'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN postal_code TEXT;
        RAISE NOTICE '✅ Added postal_code column to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ postal_code column already exists';
    END IF;
END $$;

-- Add date_of_birth column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE;
        RAISE NOTICE '✅ Added date_of_birth column to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ date_of_birth column already exists';
    END IF;
END $$;

-- Add is_verified column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Added is_verified column to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ is_verified column already exists';
    END IF;
END $$;

-- Add kyc_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'kyc_status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN kyc_status TEXT DEFAULT 'pending';
        RAISE NOTICE '✅ Added kyc_status column to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ kyc_status column already exists';
    END IF;
END $$;

-- Add account_balance column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'account_balance'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN account_balance NUMERIC(20, 8) DEFAULT 0;
        RAISE NOTICE '✅ Added account_balance column to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ account_balance column already exists';
    END IF;
END $$;

-- 3. UPDATE EXISTING PROFILES WITH DEFAULT VALUES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 UPDATING EXISTING PROFILES WITH DEFAULT VALUES...';
    
    -- Update profiles that have NULL first_name or last_name
    UPDATE public.profiles 
    SET 
        first_name = COALESCE(first_name, 'User'),
        last_name = COALESCE(last_name, 'User'),
        is_verified = COALESCE(is_verified, false),
        kyc_status = COALESCE(kyc_status, 'pending'),
        account_balance = COALESCE(account_balance, 0)
    WHERE 
        first_name IS NULL 
        OR last_name IS NULL 
        OR is_verified IS NULL 
        OR kyc_status IS NULL 
        OR account_balance IS NULL;
    
    RAISE NOTICE '✅ Updated existing profiles with default values';
END $$;

-- 4. VERIFY THE FIX
-- =====================================================

DO $$
DECLARE
    column_count INTEGER;
    profile_count INTEGER;
    column_record RECORD;
BEGIN
    RAISE NOTICE '🧪 VERIFYING PROFILES TABLE FIX...';
    
    -- Count columns in profiles table
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles';
    
    RAISE NOTICE '📊 Profiles table now has % columns', column_count;
    
    -- Count profiles
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    RAISE NOTICE '📊 Total profiles: %', profile_count;
    
    -- List all columns
    RAISE NOTICE '📋 Profiles table columns:';
    FOR column_record IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '   % (%s, nullable: %)', 
            column_record.column_name, 
            column_record.data_type, 
            column_record.is_nullable;
    END LOOP;
    
    RAISE NOTICE '🎯 PROFILES TABLE SCHEMA FIX COMPLETE!';
    RAISE NOTICE '✅ All required columns are now present.';
    RAISE NOTICE '✅ The INSERT statements should now work without errors.';
    
END $$;
