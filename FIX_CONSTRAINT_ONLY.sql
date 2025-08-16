-- =====================================================
-- FIX WALLET TRANSACTIONS ACTION CONSTRAINT
-- =====================================================
-- Fix the constraint to allow more action values
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 FIXING CONSTRAINT TO ALLOW MORE ACTION VALUES...';
    
    -- Drop the existing constraint
    ALTER TABLE public.wallet_transactions 
    DROP CONSTRAINT IF EXISTS wallet_transactions_action_check;
    
    -- Add a more flexible constraint
    ALTER TABLE public.wallet_transactions 
    ADD CONSTRAINT wallet_transactions_action_check 
    CHECK (action IN ('credit', 'debit', 'deposit', 'withdrawal', 'transfer', 'funding', 'admin_fund'));
    
    RAISE NOTICE '✅ Constraint updated successfully!';
    RAISE NOTICE '📋 Now allows: credit, debit, deposit, withdrawal, transfer, funding, admin_fund';
END $$;

-- Verify the constraint was updated
DO $$
DECLARE
    constraint_def TEXT;
BEGIN
    SELECT pg_get_constraintdef(oid) INTO constraint_def
    FROM pg_constraint
    WHERE conrelid = 'public.wallet_transactions'::regclass 
    AND conname = 'wallet_transactions_action_check';
    
    RAISE NOTICE '📋 Updated Constraint Definition: %', constraint_def;
END $$;
