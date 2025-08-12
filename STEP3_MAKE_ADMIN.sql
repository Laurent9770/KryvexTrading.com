-- STEP 3: Make kryvextrading@gmail.com an admin user
-- Run this AFTER STEP0_CREATE_TABLES.sql and STEP1_ADD_ADMIN_COLUMN.sql

DO $$
DECLARE
    _user_id uuid;
    _is_admin_column_exists boolean;
    _user_roles_created_at_exists boolean;
BEGIN
    -- Get the user ID for kryvextrading@gmail.com
    SELECT id INTO _user_id 
    FROM auth.users 
    WHERE email = 'kryvextrading@gmail.com';
    
    IF _user_id IS NULL THEN
        RAISE NOTICE '❌ User kryvextrading@gmail.com not found in auth.users. Please register first.';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Found user: % (ID: %)', 'kryvextrading@gmail.com', _user_id;
    
    -- Check if is_admin column exists in profiles table
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) INTO _is_admin_column_exists;

    -- Check if created_at column exists in user_roles table
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_roles' 
        AND column_name = 'created_at'
    ) INTO _user_roles_created_at_exists;

    -- Step 1: Create/Update profile (using table alias to avoid ambiguity)
    INSERT INTO public.profiles (user_id, email, first_name, last_name, kyc_level1_status, kyc_level2_status, created_at, updated_at)
    VALUES (
        _user_id,
        'kryvextrading@gmail.com',
        'Kryvex',
        'Admin',
        'approved',
        'approved',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        kyc_level1_status = 'approved',
        kyc_level2_status = 'approved',
        updated_at = NOW();
    
    RAISE NOTICE '✅ Profile created/updated for user %', _user_id;

    -- Step 2: Update is_admin column if it exists
    IF _is_admin_column_exists THEN
        UPDATE public.profiles
        SET is_admin = TRUE, updated_at = NOW()
        WHERE user_id = _user_id;
        RAISE NOTICE '✅ is_admin column set to TRUE for user %', _user_id;
    ELSE
        RAISE NOTICE '⚠️ is_admin column does not exist in public.profiles. Skipping update for this column.';
    END IF;

    -- Step 3: Assign 'admin' role in user_roles table (using table alias)
    IF _user_roles_created_at_exists THEN
        INSERT INTO public.user_roles (user_id, role, created_at)
        VALUES (_user_id, 'admin', NOW())
        ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
        INSERT INTO public.user_roles (user_id, role)
        VALUES (_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RAISE NOTICE '✅ Admin role assigned to user %', _user_id;

    -- Step 4: Create user_wallets entry if it doesn't exist (using table alias)
    INSERT INTO public.user_wallets (user_id, trading_account, funding_account, created_at, updated_at)
    VALUES (
        _user_id,
        '{"USDT": {"balance": "0.00", "usdValue": "0.00", "available": "0.00"}, "BTC": {"balance": "0.00", "usdValue": "0.00", "available": "0.00"}, "ETH": {"balance": "0.00", "usdValue": "0.00", "available": "0.00"}}'::jsonb,
        '{"USDT": {"balance": "0.00", "usdValue": "0.00", "available": "0.00"}}'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE '✅ User wallet ensured for user %', _user_id;

    -- Step 5: Log admin action (if log_admin_action function exists)
    BEGIN
        PERFORM log_admin_action(
            _user_id, 
            'admin_promotion', 
            'User kryvextrading@gmail.com promoted to admin', 
            _user_id
        );
        RAISE NOTICE '✅ Admin action logged for user %', _user_id;
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⚠️ log_admin_action function not found. Skipping logging.';
        WHEN others THEN
            RAISE NOTICE '⚠️ Error logging admin action: %', SQLERRM;
    END;

    RAISE NOTICE '✨ User kryvextrading@gmail.com is now configured as an admin! ✨';
END $$;
