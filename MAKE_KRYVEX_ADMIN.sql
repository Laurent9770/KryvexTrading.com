-- Make kryvextrading@gmail.com an admin user
-- Run this AFTER the user registers with kryvextrading@gmail.com

-- Step 1: Check if the user exists in auth.users
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Get the user ID for kryvextrading@gmail.com
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'kryvextrading@gmail.com';
    
    IF user_id IS NULL THEN
        RAISE NOTICE '❌ User kryvextrading@gmail.com not found in auth.users. Please register first.';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Found user: % (ID: %)', 'kryvextrading@gmail.com', user_id;
    
    -- Step 2: Create profile if it doesn't exist
    INSERT INTO public.profiles (user_id, email, first_name, last_name, is_admin, kyc_level1_status, kyc_level2_status, created_at, updated_at)
    VALUES (
        user_id,
        'kryvextrading@gmail.com',
        'Kryvex',
        'Admin',
        true,
        'approved',
        'approved',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        is_admin = true,
        kyc_level1_status = 'approved',
        kyc_level2_status = 'approved',
        updated_at = NOW();
    
    RAISE NOTICE '✅ Profile created/updated for user %', user_id;
    
    -- Step 3: Create user role entry
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE '✅ Admin role assigned to user %', user_id;
    
    -- Step 4: Create wallet with admin privileges
    INSERT INTO public.user_wallets (user_id, trading_account, funding_account, created_at, updated_at)
    VALUES (
        user_id,
        '{"BTC": {"balance": "0.00000000", "usdValue": "0.00", "available": "0.00000000"}, "ETH": {"balance": "0.00000000", "usdValue": "0.00", "available": "0.00000000"}, "USDT": {"balance": "0.00000000", "usdValue": "0.00", "available": "0.00000000"}, "BNB": {"balance": "0.00000000", "usdValue": "0.00", "available": "0.00000000"}, "ADA": {"balance": "0.00000000", "usdValue": "0.00", "available": "0.00000000"}, "DOT": {"balance": "0.00000000", "usdValue": "0.00", "available": "0.00000000"}, "LINK": {"balance": "0.00000000", "usdValue": "0.00", "available": "0.00000000"}, "LTC": {"balance": "0.00000000", "usdValue": "0.00", "available": "0.00000000"}, "BCH": {"balance": "0.00000000", "usdValue": "0.00", "available": "0.00000000"}, "XRP": {"balance": "0.00000000", "usdValue": "0.00", "available": "0.00000000"}}'::jsonb,
        '{"USDT": {"balance": "0.00000000", "usdValue": "0.00", "available": "0.00000000"}}'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        updated_at = NOW();
    
    RAISE NOTICE '✅ Wallet created for user %', user_id;
    
    -- Step 5: Log the admin action
    INSERT INTO public.admin_actions (admin_user_id, action_type, action_details, target_user_id, created_at)
    VALUES (
        user_id,
        'user_promoted_to_admin',
        'User kryvextrading@gmail.com promoted to admin via SQL script',
        user_id,
        NOW()
    );
    
    RAISE NOTICE '✅ Admin action logged';
    
    -- Step 6: Verify the setup
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICATION RESULTS:';
    RAISE NOTICE '=======================';
    
    -- Check profile
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = user_id AND is_admin = true) THEN
        RAISE NOTICE '✅ Profile: Admin status confirmed';
    ELSE
        RAISE NOTICE '❌ Profile: Admin status NOT found';
    END IF;
    
    -- Check user role
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = user_id AND role = 'admin') THEN
        RAISE NOTICE '✅ User Role: Admin role confirmed';
    ELSE
        RAISE NOTICE '❌ User Role: Admin role NOT found';
    END IF;
    
    -- Check wallet
    IF EXISTS (SELECT 1 FROM public.user_wallets WHERE user_id = user_id) THEN
        RAISE NOTICE '✅ Wallet: User wallet confirmed';
    ELSE
        RAISE NOTICE '❌ Wallet: User wallet NOT found';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ADMIN SETUP COMPLETE!';
    RAISE NOTICE 'User kryvextrading@gmail.com is now an admin.';
    RAISE NOTICE 'You can now access the admin dashboard at /admin';
    
END $$;
