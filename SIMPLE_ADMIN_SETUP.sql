-- SIMPLE ADMIN USER SETUP
-- This script creates the admin user using Supabase's built-in functions

-- 1. First, run the ADMIN_SETUP.sql script to set up the admin system
-- (This should be run first if not already done)

-- 2. Create admin user using Supabase's auth.users table
-- Note: This approach directly inserts into auth.users with encrypted password
DO $$
DECLARE
    admin_user_id UUID;
    encrypted_password TEXT;
    user_exists BOOLEAN;
BEGIN
    -- Check if user already exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'jeanlaurentkoterumutima@gmail.com') INTO user_exists;
    
    IF NOT user_exists THEN
        -- Generate encrypted password using bcrypt
        encrypted_password := crypt('Kotera@123', gen_salt('bf'));
        
        -- Create user in auth.users
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
            'jeanlaurentkoterumutima@gmail.com',
            encrypted_password,
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Jean Laurent Koterumutima"}',
            NOW(),
            NOW()
        ) RETURNING id INTO admin_user_id;
        
        RAISE NOTICE '✅ New admin user created with ID: %', admin_user_id;
    ELSE
        -- User already exists, get the ID
        SELECT id INTO admin_user_id FROM auth.users WHERE email = 'jeanlaurentkoterumutima@gmail.com';
        RAISE NOTICE 'ℹ️ Admin user already exists with ID: %', admin_user_id;
    END IF;
    
    -- Set up profile and role for the user
    IF admin_user_id IS NOT NULL THEN
        -- Create profile
        INSERT INTO public.profiles (
            id,
            user_id,
            email,
            full_name,
            kyc_status,
            account_status,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            admin_user_id,
            'jeanlaurentkoterumutima@gmail.com',
            'Jean Laurent Koterumutima',
            'approved',
            'active',
            NOW(),
            NOW()
        ) ON CONFLICT (user_id) DO NOTHING;
        
        -- Create admin role
        INSERT INTO public.user_roles (
            user_id,
            role,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            'admin',
            NOW(),
            NOW()
        ) ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Create wallet balance
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
            10000.00,
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

-- 3. Verify the setup
SELECT 
    'Admin User Created Successfully' as status,
    u.email,
    CASE WHEN u.email_confirmed_at IS NOT NULL THEN '✅ Confirmed' ELSE '❌ Not Confirmed' END as email_status,
    COALESCE(p.kyc_status, 'Not Set') as kyc_status,
    COALESCE(ur.role, 'No Role') as user_role,
    COALESCE(wb.balance, 0) as usdt_balance
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.wallet_balances wb ON u.id = wb.user_id AND wb.currency = 'USDT'
WHERE u.email = 'jeanlaurentkoterumutima@gmail.com';
