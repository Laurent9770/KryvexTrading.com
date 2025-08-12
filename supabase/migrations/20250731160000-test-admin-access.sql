-- =============================================
-- TEST ADMIN ACCESS AND VERIFY SETUP
-- =============================================

-- Step 1: Check if admin user exists and has correct role
DO $$
DECLARE
    admin_user_id UUID;
    admin_role TEXT;
BEGIN
    -- Find admin user by email
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'kryvextrading@gmail.com';
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'Admin user with email kryvextrading@gmail.com not found in auth.users';
    ELSE
        RAISE NOTICE 'Admin user found with ID: %', admin_user_id;
        
        -- Check role in profiles table
        SELECT role INTO admin_role FROM public.profiles WHERE user_id = admin_user_id;
        
        IF admin_role IS NULL OR admin_role != 'admin' THEN
            RAISE NOTICE 'Admin user does not have admin role. Current role: %', admin_role;
            
            -- Update role to admin
            UPDATE public.profiles 
            SET role = 'admin', updated_at = NOW()
            WHERE user_id = admin_user_id;
            
            RAISE NOTICE 'Updated user role to admin';
        ELSE
            RAISE NOTICE 'Admin user has correct role: %', admin_role;
        END IF;
        
        -- Test has_role function
        IF has_role(admin_user_id, 'admin') THEN
            RAISE NOTICE 'has_role function works correctly for admin user';
        ELSE
            RAISE NOTICE 'has_role function returned false for admin user - this is a problem!';
        END IF;
    END IF;
END $$;

-- Step 2: Test RLS policies by attempting to insert a test wallet (will be rolled back)
DO $$
DECLARE
    admin_user_id UUID;
    test_result BOOLEAN;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'kryvextrading@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Test if admin can insert into user_wallets (this will be rolled back)
        BEGIN
            INSERT INTO public.user_wallets (user_id, wallet_type, asset, balance)
            VALUES (admin_user_id, 'trading', 'TEST', 0);
            
            -- If we get here, the insert worked
            RAISE NOTICE 'RLS test PASSED: Admin can insert into user_wallets';
            
            -- Rollback the test insert
            ROLLBACK;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'RLS test FAILED: Admin cannot insert into user_wallets. Error: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Cannot test RLS - admin user not found';
    END IF;
END $$;

-- Step 3: Show current RLS policies for user_wallets
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_wallets' 
ORDER BY policyname;

-- Step 4: Show current grants for user_wallets
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'user_wallets' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;
