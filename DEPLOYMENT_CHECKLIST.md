# KRYVEX TRADING DEPLOYMENT CHECKLIST

## 1. ENVIRONMENT VARIABLES FIX
- Ensure your `.env` file contains all required variables:
  ```
  VITE_SUPABASE_URL=https://ftkeczodadvtnxofrwps.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  VITE_WS_URL=wss://kryvextrading-com.onrender.com
  VITE_API_URL=https://kryvextrading-com.onrender.com
  ```
  
- For Render deployment:
  - Add these environment variables in the Render dashboard for your service

## 2. FILE STRUCTURE UPDATES
- Create/update the following files:
  - `src/lib/supabaseClient.ts` (connects to Supabase)
  - `src/services/walletService.ts` (replaces supabaseWalletService.ts)
  
- Update imports in all files:
  - Find: `import supabaseWalletService from '../services/supabaseWalletService'`
  - Replace with: `import { getWalletTransactions, getUserProfile, ... } from '../services/walletService'`

## 3. UPDATE IMPORT STATEMENTS
- In `DepositPage.tsx`, `ProfilePage.tsx`, etc.:
  - Replace all `supabaseWalletService.method()` calls with directly imported functions
  - Example: `supabaseWalletService.getWalletTransactions()` → `getWalletTransactions()`

## 4. DATABASE SETUP
- Execute the SQL script in your Supabase SQL editor to:
  - Create all required tables with correct schema
  - Set up RLS policies for security
  - Create functions and triggers for user management
  - Add sample data for testing

## 5. CODE CLEANUP
- Check console for any remaining errors
- Verify all components are importing from the correct files
- Test authentication flow

## 6. RETRY DEPLOYMENT
- Commit all changes to your repository
- Trigger a new deployment on Render

## 7. VERIFICATION QUERIES
Run these in Supabase SQL editor to verify setup:

```sql
-- Check if all required tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'wallet_transactions', 'transactions', 'withdrawals', 'trading_pairs', 'user_roles')
ORDER BY table_name;

-- Check if all RLS policies were created properly
SELECT 
    tablename, 
    policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 8. COMMON FIXES FOR DEPOSITPAGE.TSX

```typescript
// src/pages/DepositPage.tsx
import React, { useEffect, useState } from 'react';
// REPLACE THIS LINE:
// import supabaseWalletService from '../services/supabaseWalletService';
// WITH THESE IMPORTS:
import { getWalletTransactions, getUserProfile, getWithdrawals } from '../services/walletService';

// Rest of your component code
const DepositPage: React.FC = () => {
  const [transactions, setTransactions] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // REPLACE THESE LINES:
        // const txData = await supabaseWalletService.getWalletTransactions();
        // const profileData = await supabaseWalletService.getUserProfile();
        
        // WITH THESE DIRECT FUNCTION CALLS:
        const txData = await getWalletTransactions();
        const profileData = await getUserProfile();
        
        setTransactions(txData);
        setProfile(profileData);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    
    fetchData();
  }, []);
  
  // Rest of your component...
};

export default DepositPage;
```
