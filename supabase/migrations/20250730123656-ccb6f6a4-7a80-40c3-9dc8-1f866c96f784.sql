-- Clean up admin user records properly
DO $$
DECLARE
    admin_user_id uuid;
    duplicate_profile_count integer;
    duplicate_role_count integer;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@kryvex.com'
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Check for duplicate profiles
        SELECT COUNT(*) INTO duplicate_profile_count
        FROM public.profiles 
        WHERE user_id = admin_user_id;
        
        -- If there are duplicates, keep only the most recent one
        IF duplicate_profile_count > 1 THEN
            DELETE FROM public.profiles 
            WHERE user_id = admin_user_id 
            AND id NOT IN (
                SELECT id 
                FROM public.profiles 
                WHERE user_id = admin_user_id 
                ORDER BY created_at DESC 
                LIMIT 1
            );
            RAISE NOTICE 'Removed % duplicate profile(s) for admin user', duplicate_profile_count - 1;
        END IF;
        
        -- Clean up any 'user' role for admin (admin should only have 'admin' role)
        DELETE FROM public.user_roles 
        WHERE user_id = admin_user_id AND role = 'user';
        
        -- Update admin profile to ensure proper settings
        UPDATE public.profiles 
        SET 
            full_name = 'System Administrator',
            is_verified = true,
            kyc_status = 'approved',
            email = 'admin@kryvex.com'
        WHERE user_id = admin_user_id;
        
        -- Ensure admin role exists
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin user cleanup completed for user ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'No admin user found with email admin@kryvex.com';
    END IF;
END;
$$;