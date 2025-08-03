-- Create a function to automatically assign admin role to admin@kryvex.com
CREATE OR REPLACE FUNCTION public.setup_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Find the user with admin@kryvex.com email from auth.users
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@kryvex.com'
    LIMIT 1;
    
    -- If the admin user exists, set up their profile and admin role
    IF admin_user_id IS NOT NULL THEN
        -- Update their profile to ensure they have admin status
        UPDATE public.profiles 
        SET 
            full_name = 'System Administrator',
            is_verified = true,
            kyc_status = 'approved'
        WHERE user_id = admin_user_id;
        
        -- Remove any existing roles for this user
        DELETE FROM public.user_roles WHERE user_id = admin_user_id;
        
        -- Add admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin');
        
        RAISE NOTICE 'Admin user setup completed for user ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user with email admin@kryvex.com not found. Please sign up first.';
    END IF;
END;
$$;

-- Create a trigger function that automatically makes admin@kryvex.com an admin
CREATE OR REPLACE FUNCTION public.auto_setup_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Check if this is the admin email
    IF NEW.email = 'admin@kryvex.com' THEN
        -- Update the profile that was just created by handle_new_user trigger
        UPDATE public.profiles 
        SET 
            full_name = 'System Administrator',
            is_verified = true,
            kyc_status = 'approved'
        WHERE user_id = NEW.id;
        
        -- Remove the default 'user' role and add 'admin' role
        DELETE FROM public.user_roles WHERE user_id = NEW.id;
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger on auth.users (this will fire after the handle_new_user trigger)
DROP TRIGGER IF EXISTS auto_admin_setup_trigger ON auth.users;
CREATE TRIGGER auto_admin_setup_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_setup_admin();

-- Try to setup admin for existing user (if they already signed up)
SELECT public.setup_admin_user();