    # Migration Guide: Update Your Wallet Service Imports

    ## 🎯 **Goal:** Use only `walletService.ts` for all wallet operations

    ## 📝 **Import Changes:**

    ### **Old Imports (Remove These):**
    ```typescript
    // ❌ REMOVE - Old service imports
    import supabaseWalletService from './services/supabaseWalletService';
    import { SupabaseWalletServiceUpdated } from './services/supabaseWalletServiceUpdated';
    import supabaseWalletServiceUpdated from './services/supabaseWalletServiceUpdated';
    ```

    ### **New Imports (Use These):**
    ```typescript
    // ✅ USE - New service imports
    import { 
      getWalletTransactions, 
      getUserProfile, 
      getWithdrawals, 
      getUserRole, 
      getTradingPairs,
      getWithdrawalStats,
      getWalletBalanceSummary,
      getAllUsers,
      getAllTransactions
    } from './services/walletService';
    ```

    ## 🔄 **Function Mapping:**

    ### **Wallet Transactions:**
    ```typescript
    // ❌ OLD
    const transactions = await supabaseWalletService.getWalletTransactions();

    // ✅ NEW
    const transactions = await getWalletTransactions();
    ```

    ### **User Profile:**
    ```typescript
    // ❌ OLD
    const profile = await supabaseWalletService.getUserProfile();

    // ✅ NEW
    const profile = await getUserProfile();
    ```

    ### **Withdrawals:**
    ```typescript
    // ❌ OLD
    const withdrawals = await supabaseWalletService.getWithdrawals();

    // ✅ NEW
    const withdrawals = await getWithdrawals();
    ```

    ### **User Role:**
    ```typescript
    // ❌ OLD
    const role = await supabaseWalletService.getUserRole();

    // ✅ NEW
    const role = await getUserRole();
    ```

    ### **Trading Pairs:**
    ```typescript
    // ❌ OLD
    const pairs = await supabaseWalletService.getTradingPairs();

    // ✅ NEW
    const pairs = await getTradingPairs();
    ```

    ### **Admin Functions:**
    ```typescript
    // ❌ OLD
    const users = await supabaseWalletService.getAllUsers();

    // ✅ NEW
    const users = await getAllUsers();
    ```

    ## 🔍 **Find and Replace Commands:**

    ### **For VS Code:**
    1. Press `Ctrl+Shift+F` (Find in Files)
    2. Search for: `supabaseWalletService`
    3. Replace with: `walletService` (and update imports)

    ### **For Terminal (if using sed):**
    ```bash
    # Find all files using old imports
    find . -name "*.tsx" -o -name "*.ts" | xargs grep -l "supabaseWalletService"

    # Replace imports (example)
    sed -i 's/supabaseWalletService/walletService/g' your-file.tsx
    ```

    ## 📋 **Step-by-Step Migration:**

    ### **Step 1: Update Import Statements**
    ```typescript
    // ❌ OLD
    import supabaseWalletService from '../services/supabaseWalletService';

    // ✅ NEW
    import { 
      getWalletTransactions, 
      getUserProfile, 
      getWithdrawals 
    } from '../services/walletService';
    ```

    ### **Step 2: Update Function Calls**
    ```typescript
    // ❌ OLD
    const transactions = await supabaseWalletService.getWalletTransactions();

    // ✅ NEW
    const transactions = await getWalletTransactions();
    ```

    ### **Step 3: Update Error Handling**
    ```typescript
    // ✅ NEW (always safe)
    const transactions = await getWalletTransactions();
    const safeTransactions = transactions || [];
    safeTransactions.map(tx => ...); // Always safe
    ```

    ## 🧪 **Testing Your Migration:**

    ### **Test Component:**
    ```typescript
    import React, { useEffect } from 'react';
    import { 
      getWalletTransactions, 
      getUserProfile, 
      getWithdrawals 
    } from './services/walletService';

    const TestComponent = () => {
      useEffect(() => {
        const testFunctions = async () => {
          try {
            // Test all functions
            const transactions = await getWalletTransactions();
            const profile = await getUserProfile();
            const withdrawals = await getWithdrawals();
            
            console.log('✅ Migration successful!');
            console.log('Transactions:', transactions);
            console.log('Profile:', profile);
            console.log('Withdrawals:', withdrawals);
          } catch (error) {
            console.error('❌ Migration failed:', error);
          }
        };
        
        testFunctions();
      }, []);

      return <div>Check console for migration test results</div>;
    };
    ```

    ## 🚨 **Common Issues:**

    ### **Issue 1: "Module not found"**
    ```typescript
    // ❌ Wrong path
    import { getWalletTransactions } from './walletService';

    // ✅ Correct path
    import { getWalletTransactions } from './services/walletService';
    ```

    ### **Issue 2: "Function not exported"**
    ```typescript
    // ✅ Make sure you're importing the right functions
    import { 
      getWalletTransactions,  // ✅ Available
      getUserProfile,         // ✅ Available
      getWithdrawals          // ✅ Available
    } from './services/walletService';
    ```

    ### **Issue 3: "TypeScript errors"**
    ```typescript
    // ✅ Use proper typing
    const transactions: any[] = await getWalletTransactions();
    const safeTransactions = transactions || [];
    ```

    ## ✅ **Verification Checklist:**

    - [ ] Updated all import statements
    - [ ] Updated all function calls
    - [ ] Added null safety (`data || []`)
    - [ ] Tested with `WalletServiceExample.tsx`
    - [ ] No TypeScript errors
    - [ ] No runtime errors

    ## 🎉 **After Migration:**

    Your wallet service will be:
    - ✅ **Simplified**: Only one service to maintain
    - ✅ **Consistent**: Same patterns everywhere
    - ✅ **Safe**: Always returns arrays
    - ✅ **Type-safe**: Proper TypeScript support
    - ✅ **Tested**: Works with your database schema

    ---

    **Need Help?** Use the `WalletServiceExample.tsx` component to test all functionality after migration.
