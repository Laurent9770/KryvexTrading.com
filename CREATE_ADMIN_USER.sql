-- CREATE ADMIN USER SCRIPT
-- This script creates the admin user account with the specified password

-- 1. Create the admin user in auth.users (if it doesn't exist)
-- Note: This will create the user with the specified password
DO $$
DECLARE
    admin_user_id UUID;
    user_exists BOOLEAN;
BEGIN
    -- Check if user already exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'jeanlaurentkoterumutima@gmail.com') INTO user_exists;
    
    IF NOT user_exists THEN
        -- Create user in auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', -- default instance_id
            gen_random_uuid(), -- generate new UUID
            'authenticated',
            'authenticated',
            'jeanlaurentkoterumutima@gmail.com',
            crypt('Kotera@123', gen_salt('bf')), -- encrypt the password
            NOW(), -- email confirmed
            NULL,
            NULL,
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Jean Laurent Koterumutima", "first_name": "Jean Laurent", "last_name": "Koterumutima"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO admin_user_id;
        
        RAISE NOTICE '✅ New admin user created with ID: %', admin_user_id;
    ELSE
        -- User already exists, get the ID
        SELECT id INTO admin_user_id FROM auth.users WHERE email = 'jeanlaurentkoterumutima@gmail.com';
        RAISE NOTICE 'ℹ️ Admin user already exists with ID: %', admin_user_id;
    END IF;
    
    -- Set up profile and role for the user
    IF admin_user_id IS NOT NULL THEN
        -- Create user profile
        INSERT INTO public.profiles (
            id,
            user_id,
            email,
            full_name,
            phone,
            country,
            kyc_status,
            account_status,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            admin_user_id,
            'jeanlaurentkoterumutima@gmail.com',
            'Jean Laurent Koterumutima',
            NULL,
            NULL,
            'approved',
            'active',
            NOW(),
            NOW()
        ) ON CONFLICT (user_id) DO NOTHING;
        
        -- Create admin role
        INSERT INTO public.user_roles (
            user_id,
            role,
            created_at
        ) VALUES (
            admin_user_id,
            'admin',
            NOW()
        ) ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Create initial wallet balance
        INSERT INTO public.wallet_balances (
            user_id,
            currency,
            balance,
            available_balance,
            locked_balance,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            'USDT',
            10000.00, -- Starting balance
            10000.00,
            0.00,
            NOW(),
            NOW()
        ) ON CONFLICT (user_id, currency) DO NOTHING;
        
        RAISE NOTICE '✅ Admin user setup completed!';
        RAISE NOTICE '📧 Email: jeanlaurentkoterumutima@gmail.com';
        RAISE NOTICE '🔑 Password: Kotera@123';
        RAISE NOTICE '👑 Role: admin';
        RAISE NOTICE '💰 Initial USDT: 10,000';
    ELSE
        RAISE NOTICE '❌ Failed to create admin user';
    END IF;
END $$;

-- 2. Verify the user was created
SELECT 
    'Admin user verification' as status,
    u.email,
    u.email_confirmed_at,
    p.kyc_status,
    ur.role,
    wb.balance as usdt_balance
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.wallet_balances wb ON u.id = wb.user_id AND wb.currency = 'USDT'
WHERE u.email = 'jeanlaurentkoterumutima@gmail.com';
