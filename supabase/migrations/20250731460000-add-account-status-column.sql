-- =============================================
-- ADD ACCOUNT STATUS COLUMN
-- Add account_status column to profiles table if it doesn't exist
-- =============================================

-- Step 1: Add account_status column if it doesn't exist
DO $$
BEGIN
    -- Check if account_status column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'account_status'
    ) THEN
        -- Add the column
        ALTER TABLE public.profiles 
        ADD COLUMN account_status TEXT DEFAULT 'active' 
        CHECK (account_status IN ('active', 'suspended', 'banned', 'pending'));
        
        RAISE NOTICE '✅ Added account_status column to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ account_status column already exists in profiles table';
    END IF;
END $$;

-- Step 2: Update existing profiles to have 'active' status if account_status is NULL
UPDATE public.profiles 
SET account_status = 'active' 
WHERE account_status IS NULL;

-- Step 3: Create index on account_status for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);

-- Step 4: Verify the column was added
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'account_status'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ account_status column is ready for use!';
    ELSE
        RAISE NOTICE '❌ Failed to add account_status column';
    END IF;
END $$;
