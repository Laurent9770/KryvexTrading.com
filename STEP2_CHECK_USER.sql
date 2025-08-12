-- STEP 2: Check kryvextrading@gmail.com user status
-- Run this AFTER STEP1_ADD_ADMIN_COLUMN.sql

DO $$
DECLARE
    _user_id uuid;
    _user_email text;
    _user_created_at timestamp;
    _profile_exists boolean;
    _is_admin_exists boolean;
    _is_admin_value boolean;
    _role_exists boolean;
    _wallet_exists boolean;
BEGIN
    -- Check if user exists in auth.users
    SELECT id, email, created_at INTO _user_id, _user_email, _user_created_at
    FROM auth.users 
    WHERE email = 'kryvextrading@gmail.com';
    
    IF _user_id IS NULL THEN
        RAISE NOTICE '❌ User kryvextrading@gmail.com NOT FOUND in auth.users';
        RAISE NOTICE 'Please register with this email first, then run the admin script.';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ User Found:';
    RAISE NOTICE '   Email: %', _user_email;
    RAISE NOTICE '   ID: %', _user_id;
    RAISE NOTICE '   Created At: %', _user_created_at;
    
    -- Check if profile exists (using table alias to avoid ambiguity)
    SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id = _user_id) INTO _profile_exists;
    RAISE NOTICE '   Profile Exists: %', _profile_exists;

    -- Check if is_admin column exists in profiles table
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) INTO _is_admin_exists;
    RAISE NOTICE '   is_admin column exists in profiles: %', _is_admin_exists;

    IF _profile_exists AND _is_admin_exists THEN
        SELECT p.is_admin INTO _is_admin_value FROM public.profiles p WHERE p.user_id = _user_id;
        RAISE NOTICE '   Is Admin (from profiles): %', _is_admin_value;
    END IF;

    -- Check if user_roles entry exists (using table alias)
    SELECT EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'admin') INTO _role_exists;
    RAISE NOTICE '   Admin Role Assigned (user_roles): %', _role_exists;

    -- Check if user_wallets entry exists (using table alias)
    SELECT EXISTS(SELECT 1 FROM public.user_wallets uw WHERE uw.user_id = _user_id) INTO _wallet_exists;
    RAISE NOTICE '   Wallet Exists: %', _wallet_exists;

    RAISE NOTICE '===============================================';
    RAISE NOTICE 'Summary:';
    IF _profile_exists AND _role_exists AND _wallet_exists AND _is_admin_exists AND _is_admin_value THEN
        RAISE NOTICE '✨ User is fully configured as ADMIN! ✨';
    ELSE
        RAISE NOTICE '⚠️ User is NOT fully configured as ADMIN. Please run STEP3_MAKE_ADMIN.sql.';
    END IF;
END $$;
