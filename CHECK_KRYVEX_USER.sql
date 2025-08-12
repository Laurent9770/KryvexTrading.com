-- Check if kryvextrading@gmail.com user exists and their status
-- Run this BEFORE making them admin to verify they registered

DO $$
DECLARE
    user_id uuid;
    user_email text;
    user_created_at timestamp;
    profile_exists boolean;
    is_admin boolean;
    role_exists boolean;
    wallet_exists boolean;
BEGIN
    -- Check if user exists in auth.users
    SELECT id, email, created_at INTO user_id, user_email, user_created_at
    FROM auth.users 
    WHERE email = 'kryvextrading@gmail.com';
    
    IF user_id IS NULL THEN
        RAISE NOTICE '❌ User kryvextrading@gmail.com NOT FOUND in auth.users';
        RAISE NOTICE 'Please register with this email first, then run the admin script.';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ User Found:';
    RAISE NOTICE '   Email: %', user_email;
    RAISE NOTICE '   User ID: %', user_id;
    RAISE NOTICE '   Created: %', user_created_at;
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = user_id) INTO profile_exists;
    IF profile_exists THEN
        SELECT is_admin INTO is_admin FROM public.profiles WHERE user_id = user_id;
        RAISE NOTICE '✅ Profile exists (Admin: %)', is_admin;
    ELSE
        RAISE NOTICE '❌ Profile does NOT exist';
    END IF;
    
    -- Check if user role exists
    SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = user_id AND role = 'admin') INTO role_exists;
    IF role_exists THEN
        RAISE NOTICE '✅ Admin role exists';
    ELSE
        RAISE NOTICE '❌ Admin role does NOT exist';
    END IF;
    
    -- Check if wallet exists
    SELECT EXISTS(SELECT 1 FROM public.user_wallets WHERE user_id = user_id) INTO wallet_exists;
    IF wallet_exists THEN
        RAISE NOTICE '✅ Wallet exists';
    ELSE
        RAISE NOTICE '❌ Wallet does NOT exist';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 SUMMARY:';
    RAISE NOTICE '============';
    RAISE NOTICE 'User: %', user_email;
    RAISE NOTICE 'Profile: %', CASE WHEN profile_exists THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE 'Admin Role: %', CASE WHEN role_exists THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE 'Wallet: %', CASE WHEN wallet_exists THEN 'EXISTS' ELSE 'MISSING' END;
    
    IF profile_exists AND role_exists AND wallet_exists THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 User is already fully set up!';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '🔧 Run MAKE_KRYVEX_ADMIN.sql to complete the setup.';
    END IF;
    
END $$;
