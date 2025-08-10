# PostgREST Configuration Fix

## Issue: `pg_pgrst_no_exposed_schemas.profiles` Error

This error occurs when PostgREST cannot find the `profiles` table in the exposed schemas. Here's how to fix it:

## Step 1: Check Supabase Dashboard Configuration

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Under **PostgREST Configuration**, ensure:
   - **Schema** is set to `public`
   - **Exposed schemas** includes `public`
   - **Extra search path** includes `public`

## Step 2: Verify Database Schema Exposure

Run this SQL query in your Supabase SQL editor:

```sql
-- Check if public schema is properly exposed
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Check PostgREST configuration
SELECT 
    name,
    setting
FROM pg_settings 
WHERE name LIKE '%search_path%';
```

## Step 3: Manual PostgREST Configuration (if needed)

If the dashboard configuration doesn't work, you may need to set this manually:

```sql
-- Set the search path to include public schema
ALTER DATABASE postgres SET search_path TO public, auth, extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgrest;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Ensure all tables are accessible
GRANT SELECT ON ALL TABLES IN SCHEMA public TO postgrest;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
```

## Step 4: Test the Fix

After applying the database fixes and PostgREST configuration:

1. Test a simple query in the Supabase SQL editor:
```sql
SELECT * FROM public.profiles LIMIT 1;
```

2. Test via the API (replace with your project URL):
```bash
curl "https://your-project.supabase.co/rest/v1/profiles?select=*&limit=1" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

## Step 5: Frontend Query Verification

Ensure your frontend queries are using the correct format:

```typescript
// Correct way to query profiles
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId);

// Add error logging
if (error) {
  console.error('Profile query error:', error);
  console.error('Error details:', error.details);
  console.error('Error hint:', error.hint);
}
```

## Common Issues and Solutions

### Issue 1: Table not found
**Solution**: Run the `DATABASE_FIXES.sql` script to recreate the tables with proper structure.

### Issue 2: RLS blocking access
**Solution**: Ensure RLS policies are properly configured and the user is authenticated.

### Issue 3: Schema not exposed
**Solution**: Check PostgREST configuration in Supabase dashboard and ensure `public` schema is exposed.

### Issue 4: Permission denied
**Solution**: Grant proper permissions to the authenticated and anon roles.

## Verification Commands

After applying fixes, run these verification queries:

```sql
-- Check if profiles table exists and is accessible
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
);

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Check permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles' 
AND table_schema = 'public';
```

## Next Steps

1. Apply the `DATABASE_FIXES.sql` script
2. Configure PostgREST settings in Supabase dashboard
3. Test the API endpoints
4. Update frontend error handling to provide better debugging information
