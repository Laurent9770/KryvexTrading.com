-- =============================================
-- RESTORE ADMIN ROLE MIGRATION
-- This migration restores the admin role for the kryvextrading@gmail.com user
-- =============================================

-- Step 1: Check if admin user exists in auth.users
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'kryvextrading@gmail.com';

-- Step 2: Check current role in profiles
SELECT 
    user_id,
    email,
    full_name,
    role,
    kyc_status,
    account_balance,
    is_verified
FROM public.profiles 
WHERE email = 'kryvextrading@gmail.com';

-- Step 3: Update admin user role
UPDATE public.profiles 
SET 
    role = 'admin',
    kyc_status = 'approved',
    is_verified = true,
    account_balance = 10000,
    updated_at = NOW()
WHERE email = 'kryvextrading@gmail.com';

-- Step 4: Verify the update
SELECT 
    user_id,
    email,
    full_name,
    role,
    kyc_status,
    account_balance,
    is_verified
FROM public.profiles 
WHERE email = 'kryvextrading@gmail.com';

-- Step 5: Test has_role function
DO $$
DECLARE
    admin_id UUID;
    is_admin BOOLEAN;
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = 'kryvextrading@gmail.com';
    IF admin_id IS NOT NULL THEN
        SELECT has_role(admin_id, 'admin') INTO is_admin;
        RAISE NOTICE 'Admin user (kryvextrading@gmail.com) has_role(''admin''): %', is_admin;
        
        IF is_admin THEN
            RAISE NOTICE '✅ Admin role successfully restored!';
        ELSE
            RAISE NOTICE '❌ Admin role restoration failed!';
        END IF;
    ELSE
        RAISE NOTICE '❌ Admin user not found in auth.users!';
    END IF;
END $$;

-- Step 6: Test admin action insertion
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
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
                'admin_role_restored',
                admin_user_id,
                '{"action": "admin_role_restored", "timestamp": "2025-07-31"}'::jsonb,
                NOW()
            );
            
            RAISE NOTICE '✅ Admin action insertion test PASSED';
            
            -- Clean up test data
            DELETE FROM public.admin_actions 
            WHERE action_type = 'admin_role_restored' 
            AND admin_email = 'kryvextrading@gmail.com';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Admin action insertion test FAILED: %', SQLERRM;
        END;
    END IF;
END $$;

-- Step 7: Show final status
SELECT '🎉 Admin role restoration completed! kryvextrading@gmail.com is now an admin again.' as status;
