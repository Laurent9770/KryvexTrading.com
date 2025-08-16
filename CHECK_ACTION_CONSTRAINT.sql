-- =====================================================
-- CHECK ACTION CONSTRAINT
-- =====================================================

-- Check the check constraint on the action column
SELECT 
    conname,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.wallet_transactions'::regclass 
AND conname = 'wallet_transactions_action_check';

-- Also check what action values currently exist in the table
SELECT DISTINCT action, COUNT(*) as count
FROM public.wallet_transactions
GROUP BY action
ORDER BY action;

-- Check if there are any existing transactions to see what actions are used
SELECT action, transaction_type, COUNT(*) as count
FROM public.wallet_transactions
GROUP BY action, transaction_type
ORDER BY action, transaction_type;
