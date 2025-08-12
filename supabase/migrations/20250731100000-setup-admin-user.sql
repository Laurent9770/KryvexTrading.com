-- Setup Admin User Migration
-- Run this after creating the admin user in Supabase Auth

-- 1. Function to promote a user to admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the user's role to admin
    UPDATE public.profiles 
    SET 
        role = 'admin',
        is_verified = true,
        kyc_status = 'approved',
        updated_at = now()
    WHERE email = user_email;
    
    IF FOUND THEN
        RAISE NOTICE 'User % has been promoted to admin', user_email;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'User % not found in profiles table', user_email;
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to demote an admin to regular user
CREATE OR REPLACE FUNCTION public.demote_from_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the user's role to user
    UPDATE public.profiles 
    SET 
        role = 'user',
        updated_at = now()
    WHERE email = user_email AND role = 'admin';
    
    IF FOUND THEN
        RAISE NOTICE 'User % has been demoted from admin', user_email;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'User % not found or is not an admin', user_email;
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions for admin management functions
GRANT EXECUTE ON FUNCTION public.promote_to_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demote_from_admin(TEXT) TO authenticated;

-- 4. Example: Promote a specific user to admin (replace with actual email)
-- SELECT public.promote_to_admin('your-admin-email@example.com');

-- 5. Create a view to see all admin users
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
    user_id,
    email,
    full_name,
    role,
    is_verified,
    kyc_status,
    created_at,
    updated_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- 6. Grant permissions for admin users view
GRANT SELECT ON public.admin_users_view TO authenticated;

-- 7. Verification query
DO $$
DECLARE
    admin_count INTEGER;
    admin_emails TEXT[];
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    SELECT ARRAY_AGG(email) INTO admin_emails FROM public.profiles WHERE role = 'admin';
    
    RAISE NOTICE 'Current admin users: %', admin_count;
    IF admin_count > 0 THEN
        RAISE NOTICE 'Admin emails: %', admin_emails;
    ELSE
        RAISE NOTICE 'No admin users found. Use SELECT public.promote_to_admin(''email@example.com''); to create one.';
    END IF;
END $$;
