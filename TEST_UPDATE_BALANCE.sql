-- =============================================
-- TEST UPDATE USER BALANCE FUNCTION
-- =============================================

-- Step 1: Check if the function exists
SELECT 
    'update_user_balance function' as check_type,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'update_user_balance'
    ) THEN 'EXISTS' ELSE 'NOT EXISTS' END as status;

-- Step 2: Get a sample user to test with
SELECT '=== SAMPLE USER FOR TESTING ===' as info;
SELECT 
    u.id as user_id,
    u.email,
    p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LIMIT 1;

-- Step 3: Check current wallet balances
SELECT '=== CURRENT WALLET BALANCES ===' as info;
SELECT 
    user_id,
    wallet_type,
    asset,
    balance,
    updated_at
FROM public.user_wallets
ORDER BY updated_at DESC
LIMIT 5;

-- Step 4: Test the function (commented out for safety)
-- Uncomment and modify the user_id below to test
/*
SELECT update_user_balance(
    'USER_ID_HERE'::UUID,  -- Replace with actual user ID
    'trading',
    'USDT',
    1500.00,
    'admin_adjustment',
    'Test balance update'
);
*/

-- Step 5: Check function parameters
SELECT '=== FUNCTION PARAMETERS ===' as info;
SELECT 
    parameter_name,
    parameter_mode,
    data_type,
    parameter_default
FROM information_schema.parameters 
WHERE specific_schema = 'public' 
  AND specific_name = 'update_user_balance'
ORDER BY ordinal_position;

-- Step 6: Verify admin user exists
SELECT '=== ADMIN USERS ===' as info;
SELECT 
    u.id as user_id,
    u.email,
    ur.role
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin';

-- Step 7: Instructions for testing
DO $$
BEGIN
    RAISE NOTICE '=== TESTING INSTRUCTIONS ===';
    RAISE NOTICE '';
    RAISE NOTICE 'To test the function:';
    RAISE NOTICE '1. Copy a user_id from the sample user query above';
    RAISE NOTICE '2. Uncomment the test query in Step 4';
    RAISE NOTICE '3. Replace USER_ID_HERE with the actual user_id';
    RAISE NOTICE '4. Run the query';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected result: JSON with success=true and balance details';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Test script ready!';
END $$;
