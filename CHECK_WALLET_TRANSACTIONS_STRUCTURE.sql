-- =====================================================
-- CHECK WALLET_TRANSACTIONS TABLE STRUCTURE
-- =====================================================

-- Check the actual columns in wallet_transactions table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'wallet_transactions'
ORDER BY ordinal_position;
