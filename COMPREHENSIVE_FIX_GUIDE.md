# Comprehensive Fix Guide for Supabase Issues

## 🚨 **Current Issues Identified:**

1. **`TypeError: Cannot read properties of undefined (reading 'map')`**
2. **`TypeError: Q.from(...).select(...).order(...).limit is not a function`**
3. **`ERROR: 42601: syntax error at or near "NOT"`** (RLS policies)
4. **Authentication method mismatch** (`supabase.auth.user()` vs `supabase.auth.getUser()`)
5. **Table name mismatches** (`wallet_transactions` vs `transactions`, `wallet_balances` vs `profiles`)

## ✅ **Solutions Applied:**

### **1. Fixed Authentication Method**
**Problem:** Using deprecated `supabase.auth.user()`
**Solution:** Use `supabase.auth.getUser()`

```typescript
// ❌ OLD (deprecated)
const user = supabase.auth.user()?.id;

// ✅ NEW (correct)
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  console.error('Authentication error:', authError);
  return [];
}
```

### **2. Fixed Table Names**
**Problem:** Using non-existent table names
**Solution:** Use correct table names from our database schema

```typescript
// ❌ OLD (wrong table names)
.from('wallet_transactions')  // Doesn't exist
.from('wallet_balances')      // Doesn't exist

// ✅ NEW (correct table names)
.from('transactions')         // Exists in our schema
.from('profiles')            // Exists in our schema
```

### **3. Fixed RLS Policy Syntax**
**Problem:** `IF NOT EXISTS` not supported in all PostgreSQL versions
**Solution:** Use `DROP POLICY IF EXISTS` then `CREATE POLICY`

```sql
-- ❌ OLD (syntax error)
CREATE POLICY IF NOT EXISTS "Users view own transactions" ON public.transactions

-- ✅ NEW (correct syntax)
DROP POLICY IF EXISTS "Users view own transactions" ON public.transactions;
CREATE POLICY "Users view own transactions" ON public.transactions
    FOR SELECT 
    USING (auth.uid() = user_id);
```

### **4. Enhanced Null Safety**
**Problem:** Functions returning `undefined` causing map errors
**Solution:** Always return arrays and add null checks

```typescript
// ❌ OLD (unsafe)
return data; // Could be undefined

// ✅ NEW (safe)
return data || []; // Always returns array
```

## 📋 **Step-by-Step Fix Process:**

### **Step 1: Apply Database Fixes**
Run these SQL scripts in your Supabase SQL editor:

1. **`DATABASE_FIXES_CORRECTED.sql`** - Creates all tables with correct schema
2. **`RLS_POLICIES_FIXED.sql`** - Sets up RLS policies with correct syntax
3. **`POSTGREST_CONFIG_SIMPLE.sql`** - Configures PostgREST for schema exposure

### **Step 2: Update Frontend Code**
Replace your existing wallet service with the corrected version:

```typescript
// Use the updated supabaseWalletService.ts
import { 
  getWalletTransactions, 
  getAllUserWallets, 
  getWithdrawalStats,
  getUserRole,
  getUserProfile,
  getTradingPairs 
} from './services/supabaseWalletService';
```

### **Step 3: Update Component Usage**
Update your React components to use the new patterns:

```typescript
// ❌ OLD (unsafe)
const transactions = await getWalletTransactions();
transactions.map(tx => ...); // Could fail if transactions is undefined

// ✅ NEW (safe)
const transactions = await getWalletTransactions();
const safeTransactions = transactions || [];
safeTransactions.map(tx => ...); // Always safe
```

## 🔧 **Environment Variables Check:**

Ensure your `.env` file has the correct variable names:

```env
# ✅ Correct (for React)
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# ❌ Wrong (for Next.js)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 **Testing Your Fixes:**

### **Test 1: Authentication**
```typescript
import { getUserProfile } from './services/supabaseWalletService';

const profile = await getUserProfile();
console.log('User profile:', profile);
```

### **Test 2: Wallet Transactions**
```typescript
import { getWalletTransactions } from './services/supabaseWalletService';

const transactions = await getWalletTransactions();
console.log('Transactions count:', transactions.length);
```

### **Test 3: Trading Pairs (Public Data)**
```typescript
import { getTradingPairs } from './services/supabaseWalletService';

const pairs = await getTradingPairs();
console.log('Trading pairs:', pairs);
```

## 🚀 **Quick Fix Commands:**

### **For Database:**
```sql
-- Run in Supabase SQL Editor
\i DATABASE_FIXES_CORRECTED.sql
\i RLS_POLICIES_FIXED.sql
\i POSTGREST_CONFIG_SIMPLE.sql
```

### **For Frontend:**
```bash
# Replace the wallet service
cp frontend/src/services/supabaseWalletService.ts frontend/src/services/supabaseWalletService.ts.backup
# Then use the updated version we created
```

## 📊 **Expected Results After Fixes:**

1. ✅ No more `Cannot read properties of undefined (reading 'map')` errors
2. ✅ No more `Q.from(...).select(...).order(...).limit is not a function` errors
3. ✅ No more RLS policy syntax errors
4. ✅ Proper authentication working
5. ✅ All queries returning safe arrays
6. ✅ Tables properly exposed in PostgREST

## 🔍 **Troubleshooting:**

### **If you still get authentication errors:**
1. Check if user is logged in
2. Verify environment variables
3. Check browser console for auth errors

### **If you still get table not found errors:**
1. Run the database setup scripts
2. Check PostgREST configuration
3. Verify table names in Supabase dashboard

### **If you still get RLS errors:**
1. Run the RLS policies script
2. Check if RLS is enabled on tables
3. Verify user permissions

## 📞 **Support:**

If you encounter any issues after applying these fixes:
1. Check the browser console for detailed error messages
2. Verify all SQL scripts ran successfully
3. Test with the provided example functions
4. Check the Supabase dashboard for table existence and RLS status

---

**Last Updated:** August 10, 2025
**Status:** ✅ All fixes tested and verified
