-- RESET ADMIN PASSWORD
-- This script resets the admin user's password using Supabase's auth functions

-- First, let's check if the user exists
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'jeanlaurentkoterumutima@gmail.com';

-- If the user exists, we need to update the password
-- Note: In Supabase, you typically use the auth.resetPasswordForEmail() function
-- But for admin setup, we can use this approach:

DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'jeanlaurentkoterumutima@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Update the password using bcrypt
        UPDATE auth.users 
        SET encrypted_password = crypt('Kotera@123', gen_salt('bf')),
            updated_at = NOW()
        WHERE id = admin_user_id;
        
        RAISE NOTICE '✅ Password reset successfully for user: %', admin_user_id;
        RAISE NOTICE '📧 Email: jeanlaurentkoterumutima@gmail.com';
        RAISE NOTICE '🔑 New Password: Kotera@123';
    ELSE
        RAISE NOTICE '❌ User not found: jeanlaurentkoterumutima@gmail.com';
    END IF;
END $$;

-- Verify the password was updated
SELECT 
    'Password Reset Complete' as status,
    u.email,
    CASE WHEN u.encrypted_password IS NOT NULL THEN '✅ Password Set' ELSE '❌ No Password' END as password_status,
    u.email_confirmed_at,
    ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'jeanlaurentkoterumutima@gmail.com';
