-- =============================================
-- FIX ADMIN_ACTIONS TABLE SCHEMA
-- =============================================

-- Step 1: Check current admin_actions table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_actions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add missing details column if it doesn't exist
DO $$
BEGIN
    -- Check if details column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_actions' 
        AND column_name = 'details' 
        AND table_schema = 'public'
    ) THEN
        -- Add the details column
        ALTER TABLE public.admin_actions 
        ADD COLUMN details JSONB;
        
        RAISE NOTICE '✅ Added details column to admin_actions table';
    ELSE
        RAISE NOTICE 'ℹ️ details column already exists in admin_actions table';
    END IF;
END $$;

-- Step 3: Verify the table structure after fix
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_actions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Test admin action insertion
DO $$
DECLARE
    admin_user_id UUID;
    test_result BOOLEAN;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'kryvextrading@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Test inserting an admin action
        BEGIN
            INSERT INTO public.admin_actions (
                admin_email,
                action_type,
                target_user_id,
                details,
                created_at
            ) VALUES (
                'kryvextrading@gmail.com',
                'test_action',
                admin_user_id,
                '{"test": "data", "amount": 1000, "currency": "USDT"}'::jsonb,
                NOW()
            );
            
            RAISE NOTICE '✅ Admin action insertion test PASSED';
            
            -- Clean up test data
            DELETE FROM public.admin_actions 
            WHERE action_type = 'test_action' 
            AND admin_email = 'kryvextrading@gmail.com';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Admin action insertion test FAILED: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '❌ Cannot test admin action - admin user not found';
    END IF;
END $$;

-- Step 5: Check if there are any other missing columns in related tables
DO $$
BEGIN
    RAISE NOTICE 'Checking for missing columns in related tables...';
    
    -- Check user_wallets table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_wallets' 
        AND column_name = 'asset' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '❌ user_wallets table is missing asset column';
    ELSE
        RAISE NOTICE '✅ user_wallets table has asset column';
    END IF;
    
    -- Check profiles table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '❌ profiles table is missing role column';
    ELSE
        RAISE NOTICE '✅ profiles table has role column';
    END IF;
END $$;

-- Step 6: Show current grants for admin_actions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'admin_actions' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;
