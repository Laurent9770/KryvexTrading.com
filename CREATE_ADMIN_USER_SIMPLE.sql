-- SIMPLE ADMIN USER CREATION
-- Creates an admin user without complex SQL that might fail
-- Run this in Supabase SQL Editor after running ADMIN_DATABASE_SETUP.sql

-- Step 1: Create the admin user in auth.users (if not exists)
DO $$
DECLARE
    admin_user_id UUID;
    admin_email TEXT := 'jeanlaurentkoterumutima@gmail.com';
    admin_password TEXT := 'Kotera@123';
BEGIN
    -- Check if user already exists
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        -- Create new user
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            admin_email,
            crypt(admin_password, gen_salt('bf')),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Jean Laurent Koterumutima"}',
            NOW(),
            NOW()
        ) RETURNING id INTO admin_user_id;
        
        RAISE NOTICE '✅ Admin user created with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE '⚠️ Admin user already exists with ID: %', admin_user_id;
    END IF;
    
    -- Step 2: Create profile (if not exists)
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = admin_user_id) THEN
        INSERT INTO profiles (
            user_id,
            email,
            full_name,
            is_verified,
            kyc_status,
            account_status,
            account_balance
        ) VALUES (
            admin_user_id,
            admin_email,
            'Jean Laurent Koterumutima',
            true,
            'approved',
            'active',
            10000.00
        );
        RAISE NOTICE '✅ Admin profile created';
    ELSE
        RAISE NOTICE '⚠️ Admin profile already exists';
    END IF;
    
    -- Step 3: Assign admin role (if not exists)
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = admin_user_id AND role = 'admin') THEN
        INSERT INTO user_roles (
            user_id,
            role,
            assigned_by
        ) VALUES (
            admin_user_id,
            'admin',
            admin_user_id
        );
        RAISE NOTICE '✅ Admin role assigned';
    ELSE
        RAISE NOTICE '⚠️ Admin role already assigned';
    END IF;
    
    -- Step 4: Create wallet balance (if not exists)
    IF NOT EXISTS (SELECT 1 FROM wallet_balances WHERE user_id = admin_user_id AND currency = 'USDT') THEN
        INSERT INTO wallet_balances (
            user_id,
            currency,
            balance
        ) VALUES (
            admin_user_id,
            'USDT',
            10000.00
        );
        RAISE NOTICE '✅ Admin wallet balance created';
    ELSE
        RAISE NOTICE '⚠️ Admin wallet balance already exists';
    END IF;
    
    -- Step 5: Log the admin creation
    INSERT INTO admin_actions (
        admin_id,
        action_type,
        description
    ) VALUES (
        admin_user_id,
        'admin_created',
        'Admin user created via SQL script'
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ADMIN USER SETUP COMPLETED!';
    RAISE NOTICE '📧 Email: %', admin_email;
    RAISE NOTICE '🔑 Password: %', admin_password;
    RAISE NOTICE '🆔 User ID: %', admin_user_id;
    RAISE NOTICE '';
    RAISE NOTICE '✅ You can now log in to the admin dashboard';
    RAISE NOTICE '✅ All admin features should be available';
    
END $$;

-- Verify the admin user was created correctly
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.kyc_status,
    p.account_status,
    p.account_balance,
    ur.role,
    wb.balance as wallet_balance
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN wallet_balances wb ON u.id = wb.user_id AND wb.currency = 'USDT'
WHERE u.email = 'jeanlaurentkoterumutima@gmail.com';
