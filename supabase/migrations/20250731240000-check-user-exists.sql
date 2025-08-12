-- =============================================
-- CHECK USER EXISTS AND TROUBLESHOOT USER CREATION
-- =============================================

-- Step 1: Check if sales@kryvex.com already exists in auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'sales@kryvex.com';

-- Step 2: Check if there are any profiles with this email
SELECT 
    user_id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE email = 'sales@kryvex.com';

-- Step 3: Check if there are any wallets for this user
SELECT 
    uw.user_id,
    uw.wallet_type,
    uw.asset,
    uw.balance,
    p.email
FROM public.user_wallets uw
JOIN public.profiles p ON uw.user_id = p.user_id
WHERE p.email = 'sales@kryvex.com';

-- Step 4: Show all admin users currently in the system
SELECT 
    email,
    full_name,
    role,
    kyc_status,
    is_verified,
    account_balance,
    created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at;

-- Step 5: Check auth.users table structure and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY ordinal_position;

-- Step 6: Check for any unique constraints on auth.users
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users' 
AND tc.table_schema = 'auth'
AND tc.constraint_type = 'UNIQUE';

-- Step 7: Show recent auth.users entries to understand the pattern
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
