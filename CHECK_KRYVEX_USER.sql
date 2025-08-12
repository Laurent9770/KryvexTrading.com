-- Check if kryvextrading@gmail.com user exists and their status
-- Run this BEFORE making them admin to verify they registered

DO $$
DECLARE
    user_id uuid;
    user_email text;
    user_created_at timestamp;
    profile_exists boolean;
    is_admin_exists boolean;
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
    
    -- Check if profile exists (using table alias to avoid ambiguity)
    SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id = user_id) INTO profile_exists;
    IF profile_exists THEN
        RAISE NOTICE '✅ Profile exists';
        
        -- Check if is_admin column exists in profiles table
        SELECT EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'is_admin'
        ) INTO is_admin_exists;
        
        IF is_admin_exists THEN
            RAISE NOTICE '✅ is_admin column exists in profiles table';
        ELSE
            RAISE NOTICE '❌ is_admin column missing from profiles table';
        END IF;
    ELSE
        RAISE NOTICE '❌ Profile does NOT exist';
    END IF;
    
    -- Check if user role exists (using table alias)
    SELECT EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id = user_id AND ur.role = 'admin') INTO role_exists;
    IF role_exists THEN
        RAISE NOTICE '✅ Admin role exists';
    ELSE
        RAISE NOTICE '❌ Admin role does NOT exist';
    END IF;
    
    -- Check if wallet exists (using table alias)
    SELECT EXISTS(SELECT 1 FROM public.user_wallets uw WHERE uw.user_id = user_id) INTO wallet_exists;
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
    RAISE NOTICE 'is_admin Column: %', CASE WHEN is_admin_exists THEN 'EXISTS' ELSE 'MISSING' END;
    
    IF profile_exists AND role_exists AND wallet_exists THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 User is already fully set up!';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '🔧 Run MAKE_KRYVEX_ADMIN.sql to complete the setup.';
    END IF;
    
END $$;
