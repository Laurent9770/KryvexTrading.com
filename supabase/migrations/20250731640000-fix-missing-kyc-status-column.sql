-- =============================================
-- FIX MISSING KYC_STATUS COLUMN
-- Add missing columns to profiles table
-- =============================================

-- Step 1: Check current profiles table structure
DO $$
DECLARE
    col RECORD;
BEGIN
    RAISE NOTICE '=== CURRENT PROFILES TABLE STRUCTURE ===';
    
    FOR col IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % | Type: % | Nullable: % | Default: %', 
            col.column_name, col.data_type, col.is_nullable, col.column_default;
    END LOOP;
END $$;

-- Step 2: Add missing kyc_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'kyc_status'
    ) THEN
        RAISE NOTICE '❌ kyc_status column missing, adding it...';
        ALTER TABLE public.profiles 
        ADD COLUMN kyc_status TEXT DEFAULT 'pending' 
        CHECK (kyc_status IN ('pending', 'approved', 'rejected'));
        RAISE NOTICE '✅ kyc_status column added successfully';
    ELSE
        RAISE NOTICE '✅ kyc_status column already exists';
    END IF;
END $$;

-- Step 3: Add other potentially missing columns
DO $$
BEGIN
    -- Add auto_generated column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'auto_generated'
    ) THEN
        RAISE NOTICE '❌ auto_generated column missing, adding it...';
        ALTER TABLE public.profiles 
        ADD COLUMN auto_generated BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ auto_generated column added successfully';
    ELSE
        RAISE NOTICE '✅ auto_generated column already exists';
    END IF;
    
    -- Add role column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        RAISE NOTICE '❌ role column missing, adding it...';
        ALTER TABLE public.profiles 
        ADD COLUMN role TEXT DEFAULT 'user' 
        CHECK (role IN ('admin', 'moderator', 'user'));
        RAISE NOTICE '✅ role column added successfully';
    ELSE
        RAISE NOTICE '✅ role column already exists';
    END IF;
END $$;

-- Step 4: Update existing profiles to have default kyc_status
UPDATE public.profiles 
SET kyc_status = 'pending' 
WHERE kyc_status IS NULL;

-- Step 5: Update existing profiles to have default role
UPDATE public.profiles 
SET role = 'user' 
WHERE role IS NULL;

-- Step 6: Ensure admin users have correct role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email IN ('kryvextrading@gmail.com', 'admin@kryvex.com', 'jeanlaurentkoterumutima@gmail.com');

-- Step 7: Test the profiles table query
DO $$
DECLARE
    user_count INTEGER;
    admin_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING PROFILES TABLE QUERY ===';
    
    -- Test basic select
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    RAISE NOTICE '📊 Total profiles: %', user_count;
    
    -- Test admin count
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    RAISE NOTICE '👑 Admin profiles: %', admin_count;
    
    -- Test the exact query that was failing
    SELECT COUNT(*) INTO user_count 
    FROM public.profiles 
    WHERE kyc_status IS NOT NULL;
    RAISE NOTICE '✅ kyc_status query test successful: % profiles have kyc_status', user_count;
    
    RAISE NOTICE '✅ Profiles table fix completed successfully!';
END $$;

-- Step 8: Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
