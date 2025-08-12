-- Check Admin Actions Table Structure
-- This migration checks what columns exist in the admin_actions table

DO $$
DECLARE
    col_name TEXT;
    col_type TEXT;
    table_exists BOOLEAN;
BEGIN
    -- Check if admin_actions table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_actions'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '=== ADMIN_ACTIONS TABLE EXISTS ===';
        RAISE NOTICE 'Columns in admin_actions table:';
        
        FOR col_name, col_type IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'admin_actions'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '- % (%%)', col_name, col_type;
        END LOOP;
    ELSE
        RAISE NOTICE '=== ADMIN_ACTIONS TABLE DOES NOT EXIST ===';
    END IF;
END $$;

-- Also check profiles table structure
DO $$
DECLARE
    col_name TEXT;
    col_type TEXT;
BEGIN
    RAISE NOTICE '=== PROFILES TABLE STRUCTURE ===';
    FOR col_name, col_type IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '- % (%%)', col_name, col_type;
    END LOOP;
END $$;
