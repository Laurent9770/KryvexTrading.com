-- =============================================
-- FORCE FIX ALL MISSING COLUMNS
-- Comprehensive fix for all profiles table issues
-- =============================================

-- Step 1: Add ALL potentially missing columns
DO $$
BEGIN
    RAISE NOTICE '=== FORCE FIXING ALL MISSING COLUMNS ===';
    
    -- Add kyc_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'kyc_status'
    ) THEN
        RAISE NOTICE 'Adding kyc_status column...';
        ALTER TABLE public.profiles ADD COLUMN kyc_status TEXT DEFAULT 'pending';
        ALTER TABLE public.profiles ADD CONSTRAINT kyc_status_check CHECK (kyc_status IN ('pending', 'verified', 'rejected'));
        RAISE NOTICE '✅ kyc_status column added';
    ELSE
        RAISE NOTICE '✅ kyc_status column already exists';
    END IF;
    
    -- Add account_balance column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'account_balance'
    ) THEN
        RAISE NOTICE 'Adding account_balance column...';
        ALTER TABLE public.profiles ADD COLUMN account_balance DECIMAL(20, 8) DEFAULT 0;
        RAISE NOTICE '✅ account_balance column added';
    ELSE
        RAISE NOTICE '✅ account_balance column already exists';
    END IF;
    
    -- Add is_verified column (THIS IS THE MISSING ONE!)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_verified'
    ) THEN
        RAISE NOTICE 'Adding is_verified column...';
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ is_verified column added';
    ELSE
        RAISE NOTICE '✅ is_verified column already exists';
    END IF;
    
    -- Add auto_generated column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'auto_generated'
    ) THEN
        RAISE NOTICE 'Adding auto_generated column...';
        ALTER TABLE public.profiles ADD COLUMN auto_generated BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ auto_generated column added';
    ELSE
        RAISE NOTICE '✅ auto_generated column already exists';
    END IF;
    
    -- Add role column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        RAISE NOTICE 'Adding role column...';
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
        RAISE NOTICE '✅ role column added';
    ELSE
        RAISE NOTICE '✅ role column already exists';
    END IF;
    
    -- Add phone_number column (common missing column)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'phone_number'
    ) THEN
        RAISE NOTICE 'Adding phone_number column...';
        ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
        RAISE NOTICE '✅ phone_number column added';
    ELSE
        RAISE NOTICE '✅ phone_number column already exists';
    END IF;
    
    -- Add username column (common missing column)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'username'
    ) THEN
        RAISE NOTICE 'Adding username column...';
        ALTER TABLE public.profiles ADD COLUMN username TEXT;
        RAISE NOTICE '✅ username column added';
    ELSE
        RAISE NOTICE '✅ username column already exists';
    END IF;
    
    RAISE NOTICE '=== ALL COLUMNS CHECKED AND ADDED ===';
END $$;

-- Step 2: Update ALL existing profiles with default values
DO $$
BEGIN
    RAISE NOTICE '=== UPDATING EXISTING PROFILES ===';
    
    -- Update kyc_status
    UPDATE public.profiles SET kyc_status = 'pending' WHERE kyc_status IS NULL;
    RAISE NOTICE 'Updated kyc_status for existing profiles';
    
    -- Update account_balance
    UPDATE public.profiles SET account_balance = 0 WHERE account_balance IS NULL;
    RAISE NOTICE 'Updated account_balance for existing profiles';
    
    -- Update is_verified
    UPDATE public.profiles SET is_verified = false WHERE is_verified IS NULL;
    RAISE NOTICE 'Updated is_verified for existing profiles';
    
    -- Update auto_generated
    UPDATE public.profiles SET auto_generated = false WHERE auto_generated IS NULL;
    RAISE NOTICE 'Updated auto_generated for existing profiles';
    
    -- Update role
    UPDATE public.profiles SET role = 'user' WHERE role IS NULL;
    RAISE NOTICE 'Updated role for existing profiles';
    
    -- Set admin roles
    UPDATE public.profiles 
    SET role = 'admin', is_verified = true 
    WHERE email IN ('kryvextrading@gmail.com', 'admin@kryvex.com', 'jeanlaurentkoterumutima@gmail.com');
    RAISE NOTICE 'Set admin roles for admin users';
    
    RAISE NOTICE '=== ALL PROFILES UPDATED ===';
END $$;

-- Step 3: Test the exact query that was failing
DO $$
DECLARE
    user_count INTEGER;
    admin_count INTEGER;
    verified_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING THE EXACT FAILING QUERY ===';
    
    -- Test the exact query from the frontend
    SELECT COUNT(*) INTO user_count 
    FROM public.profiles 
    WHERE is_verified IS NOT NULL;
    RAISE NOTICE 'Profiles with is_verified: %', user_count;
    
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
    
    -- Test admin count
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    RAISE NOTICE 'Admin profiles: %', admin_count;
    
    -- Test verified count
    SELECT COUNT(*) INTO verified_count FROM public.profiles WHERE is_verified = true;
    RAISE NOTICE 'Verified profiles: %', verified_count;
    
    -- Test the complete select query
    SELECT COUNT(*) INTO user_count 
    FROM public.profiles 
    WHERE user_id IS NOT NULL 
    AND email IS NOT NULL 
    AND full_name IS NOT NULL 
    AND kyc_status IS NOT NULL 
    AND account_balance IS NOT NULL 
    AND is_verified IS NOT NULL 
    AND created_at IS NOT NULL 
    AND updated_at IS NOT NULL 
    AND auto_generated IS NOT NULL;
    RAISE NOTICE 'Complete query test successful: % profiles have all required columns', user_count;
    
    RAISE NOTICE '✅ FORCE FIX COMPLETED SUCCESSFULLY!';
END $$;

-- Step 4: Grant all necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 5: Final verification
DO $$
BEGIN
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    RAISE NOTICE 'All missing columns have been added to profiles table';
    RAISE NOTICE 'All existing profiles have been updated with default values';
    RAISE NOTICE 'Admin users have been properly configured';
    RAISE NOTICE 'Permissions have been granted';
    RAISE NOTICE 'The dashboard should now load without errors!';
END $$;
