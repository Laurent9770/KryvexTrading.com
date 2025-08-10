# Kryvex Trading Platform - Troubleshooting Guide

## Overview

This guide addresses the database and frontend issues you're experiencing with the Kryvex trading platform.

## Issues Identified

1. **PostgREST Schema Exposure**: `pg_pgrst_no_exposed_schemas.profiles` error
2. **Missing Wallet Tables**: Frontend expects wallet-related tables that don't exist
3. **Query Method Errors**: `.order(...).limit is not a function` errors
4. **Frontend Map/Length Errors**: Trying to iterate over undefined data

## Step-by-Step Fix Process

### Step 1: Apply Database Fixes

1. **Run the Database Fix Script**
   ```bash
   # In your Supabase SQL editor, run:
   # Copy and paste the contents of DATABASE_FIXES.sql
   ```

2. **Verify Tables Created**
   ```sql
   -- Check if all tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('profiles', 'transactions', 'withdrawals', 'wallet_transactions');
   ```

### Step 2: Configure PostgREST

1. **Supabase Dashboard Configuration**
   - Go to your Supabase project dashboard
   - Navigate to **Settings** → **API**
   - Under **PostgREST Configuration**:
     - Set **Schema** to `public`
     - Ensure **Exposed schemas** includes `public`
     - Add `public` to **Extra search path**

2. **Manual Configuration (if needed)**
   ```sql
   -- Run in SQL editor if dashboard config doesn't work
   ALTER DATABASE postgres SET search_path TO public, auth, extensions;
   
   GRANT USAGE ON SCHEMA public TO postgrest;
   GRANT USAGE ON SCHEMA public TO authenticated;
   GRANT USAGE ON SCHEMA public TO anon;
   
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO postgrest;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
   ```

### Step 3: Test Database Connectivity

1. **Test Basic Query**
   ```sql
   -- Test if profiles table is accessible
   SELECT * FROM public.profiles LIMIT 1;
   ```

2. **Test API Endpoint**
   ```bash
   # Replace with your actual project URL and keys
   curl "https://your-project.supabase.co/rest/v1/profiles?select=*&limit=1" \
     -H "apikey: your-anon-key" \
     -H "Authorization: Bearer your-anon-key"
   ```

### Step 4: Update Frontend Code

1. **Apply the updated wallet service** (already done in `supabaseWalletService.ts`)

2. **Add Error Handling to Components**
   ```typescript
   // Example error handling pattern
   const [data, setData] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   useEffect(() => {
     const fetchData = async () => {
       try {
         setLoading(true);
         const result = await supabaseWalletService.getWalletTransactions();
         
         if (result && Array.isArray(result)) {
           setData(result);
         } else {
           console.warn('Invalid data format received:', result);
           setData([]);
         }
       } catch (err) {
         console.error('Error fetching data:', err);
         setError(err);
         setData([]);
       } finally {
         setLoading(false);
       }
     };

     fetchData();
   }, []);
   ```

### Step 5: Verify Authentication

1. **Check User Authentication**
   ```typescript
   // Add this to your components to verify auth
   const { user, error: authError } = await supabase.auth.getUser();
   
   if (authError) {
     console.error('Authentication error:', authError);
     return;
   }
   
   if (!user) {
     console.error('No authenticated user');
     return;
   }
   ```

2. **Verify RLS Policies**
   ```sql
   -- Check if RLS policies are working
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename = 'profiles';
   ```

## Common Error Solutions

### Error: `pg_pgrst_no_exposed_schemas.profiles`

**Cause**: PostgREST can't find the profiles table in exposed schemas

**Solution**:
1. Run the database fix script
2. Configure PostgREST in Supabase dashboard
3. Ensure `public` schema is exposed

### Error: `Cannot read properties of undefined (reading 'map')`

**Cause**: API returns `null` or `undefined` instead of an array

**Solution**:
1. Add null checks in frontend code
2. Ensure database queries return proper data
3. Add error handling for empty results

### Error: `.order(...).limit is not a function`

**Cause**: Query builder is undefined due to table not existing or access denied

**Solution**:
1. Verify table exists in database
2. Check RLS policies
3. Ensure proper authentication
4. Add table existence checks

### Error: `relation "profiles" does not exist`

**Cause**: Table doesn't exist or is in wrong schema

**Solution**:
1. Run the database fix script
2. Verify table creation
3. Check schema permissions

## Verification Checklist

After applying fixes, verify:

- [ ] All tables exist in `public` schema
- [ ] RLS policies are properly configured
- [ ] PostgREST configuration includes `public` schema
- [ ] Frontend queries include proper error handling
- [ ] Authentication is working correctly
- [ ] API endpoints return expected data

## Testing Commands

```sql
-- Test table existence
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'transactions', 'withdrawals');

-- Test RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Test data access
SELECT COUNT(*) FROM public.profiles;
SELECT COUNT(*) FROM public.transactions;
```

## Next Steps

1. Apply all database fixes
2. Configure PostgREST properly
3. Update frontend error handling
4. Test all functionality
5. Monitor for any remaining issues

## Support

If issues persist after following this guide:

1. Check browser console for detailed error messages
2. Verify Supabase project settings
3. Test with a fresh database setup
4. Review authentication flow
