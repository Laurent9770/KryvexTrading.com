-- =============================================
-- FIX SQL SYNTAX ERROR AND ADD MISSING COLUMNS
-- Clean solution for profiles table issues
-- =============================================

-- Step 1: Add missing kyc_status column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'kyc_status'
    ) THEN
        RAISE NOTICE 'Adding kyc_status column...';
        ALTER TABLE public.profiles 
        ADD COLUMN kyc_status TEXT DEFAULT 'pending';
        
        -- Add constraint
        ALTER TABLE public.profiles
        ADD CONSTRAINT kyc_status_check
        CHECK (kyc_status IN ('pending', 'verified', 'rejected'));
        
        RAISE NOTICE 'kyc_status column added successfully';
    ELSE
        RAISE NOTICE 'kyc_status column already exists';
    END IF;
END $$;

-- Step 2: Add missing account_balance column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'account_balance'
    ) THEN
        RAISE NOTICE 'Adding account_balance column...';
        ALTER TABLE public.profiles 
        ADD COLUMN account_balance DECIMAL(20, 8) DEFAULT 0;
        RAISE NOTICE 'account_balance column added successfully';
    ELSE
        RAISE NOTICE 'account_balance column already exists';
    END IF;
END $$;

-- Step 3: Add missing auto_generated column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'auto_generated'
    ) THEN
        RAISE NOTICE 'Adding auto_generated column...';
        ALTER TABLE public.profiles 
        ADD COLUMN auto_generated BOOLEAN DEFAULT false;
        RAISE NOTICE 'auto_generated column added successfully';
    ELSE
        RAISE NOTICE 'auto_generated column already exists';
    END IF;
END $$;

-- Step 4: Add missing role column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        RAISE NOTICE 'Adding role column...';
        ALTER TABLE public.profiles 
        ADD COLUMN role TEXT DEFAULT 'user';
        RAISE NOTICE 'role column added successfully';
    ELSE
        RAISE NOTICE 'role column already exists';
    END IF;
END $$;

-- Step 5: Update existing profiles with default values
UPDATE public.profiles 
SET kyc_status = 'pending' 
WHERE kyc_status IS NULL;

UPDATE public.profiles 
SET account_balance = 0 
WHERE account_balance IS NULL;

UPDATE public.profiles 
SET auto_generated = false 
WHERE auto_generated IS NULL;

UPDATE public.profiles 
SET role = 'user' 
WHERE role IS NULL;

-- Step 6: Ensure admin users have correct role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email IN ('kryvextrading@gmail.com', 'admin@kryvex.com', 'jeanlaurentkoterumutima@gmail.com');

-- Step 7: Test the fix
DO $$
DECLARE
    user_count INTEGER;
    admin_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING PROFILES TABLE FIX ===';
    
    -- Test basic select
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    RAISE NOTICE 'Total profiles: %', user_count;
    
    -- Test admin count
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    RAISE NOTICE 'Admin profiles: %', admin_count;
    
    -- Test kyc_status query
    SELECT COUNT(*) INTO user_count 
    FROM public.profiles 
    WHERE kyc_status IS NOT NULL;
    RAISE NOTICE 'Profiles with kyc_status: %', user_count;
    
    -- Test account_balance query
    SELECT COUNT(*) INTO user_count 
    FROM public.profiles 
    WHERE account_balance IS NOT NULL;
    RAISE NOTICE 'Profiles with account_balance: %', user_count;
    
    RAISE NOTICE 'Profiles table fix completed successfully!';
END $$;

-- Step 8: Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
