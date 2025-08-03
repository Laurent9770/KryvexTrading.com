-- Clean up any potential duplicate or orphaned admin records
-- First, let's check and clean profiles table for any duplicates
DELETE FROM public.profiles 
WHERE user_id IN (
    SELECT user_id 
    FROM public.profiles 
    WHERE user_id IN (
        SELECT id FROM auth.users WHERE email = 'admin@kryvex.com'
    )
    GROUP BY user_id 
    HAVING COUNT(*) > 1
) 
AND id NOT IN (
    SELECT MIN(id) 
    FROM public.profiles 
    WHERE user_id IN (
        SELECT id FROM auth.users WHERE email = 'admin@kryvex.com'
    )
    GROUP BY user_id
);

-- Clean up any duplicate user roles for admin
DELETE FROM public.user_roles 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'admin@kryvex.com'
) 
AND role = 'user';

-- Ensure admin user has proper profile and role setup
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@kryvex.com'
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Ensure profile exists and is properly configured
        INSERT INTO public.profiles (user_id, email, full_name, is_verified, kyc_status)
        VALUES (admin_user_id, 'admin@kryvex.com', 'System Administrator', true, 'approved')
        ON CONFLICT (user_id) DO UPDATE SET
            full_name = 'System Administrator',
            is_verified = true,
            kyc_status = 'approved';
        
        -- Ensure admin role exists and remove any user role
        DELETE FROM public.user_roles WHERE user_id = admin_user_id AND role = 'user';
        
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin user cleanup completed for: %', admin_user_id;
    ELSE
        RAISE NOTICE 'No admin user found with email admin@kryvex.com';
    END IF;
END;
$$;