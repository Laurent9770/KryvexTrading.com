-- =============================================
-- MAKE KRYVEX TRADING USER AN ADMIN
-- This migration promotes kryvextrading@gmail.com to admin role
-- =============================================

-- Step 1: Get the user ID for kryvextrading@gmail.com
DO $$
DECLARE
    target_user_id UUID;
    current_role app_role;
BEGIN
    -- Find the user ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'kryvextrading@gmail.com'
    LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE '❌ User kryvextrading@gmail.com not found in auth.users';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Found user: % (ID: %)', 'kryvextrading@gmail.com', target_user_id;
    
    -- Check current role
    SELECT role INTO current_role
    FROM public.user_roles
    WHERE user_id = target_user_id
    LIMIT 1;
    
    RAISE NOTICE 'Current role: %', COALESCE(current_role, 'none');
    
    -- Remove any existing roles
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    
    -- Add admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin');
    
    RAISE NOTICE '✅ Successfully promoted % to admin role', 'kryvextrading@gmail.com';
END $$;

-- Step 2: Update profile to ensure admin status is reflected
UPDATE public.profiles 
SET 
    full_name = 'Kryvex Trading Admin',
    is_verified = true,
    kyc_status = 'approved',
    account_balance = 10000
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'kryvextrading@gmail.com'
);

-- Step 3: Verify the admin promotion
DO $$
DECLARE
    target_user_id UUID;
    admin_role_exists BOOLEAN;
    profile_updated BOOLEAN;
BEGIN
    -- Get user ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'kryvextrading@gmail.com'
    LIMIT 1;
    
    -- Check if admin role exists
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = target_user_id AND role = 'admin'
    ) INTO admin_role_exists;
    
    -- Check if profile was updated
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = target_user_id AND is_verified = true
    ) INTO profile_updated;
    
    RAISE NOTICE '=== ADMIN PROMOTION VERIFICATION ===';
    RAISE NOTICE 'User ID: %', target_user_id;
    RAISE NOTICE 'Admin role exists: %', admin_role_exists;
    RAISE NOTICE 'Profile verified: %', profile_updated;
    
    IF admin_role_exists AND profile_updated THEN
        RAISE NOTICE '✅ kryvextrading@gmail.com successfully promoted to admin!';
    ELSE
        RAISE NOTICE '❌ Admin promotion may have failed!';
    END IF;
END $$;

-- Step 4: Show current admin users
SELECT 
    u.email,
    ur.role,
    p.full_name,
    p.is_verified,
    p.kyc_status
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE ur.role = 'admin'
ORDER BY u.email;
