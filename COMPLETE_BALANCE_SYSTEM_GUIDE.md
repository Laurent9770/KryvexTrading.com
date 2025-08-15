# Complete Balance Management System Guide

## 🎯 Overview

This guide covers the complete balance management system that allows admins to add and remove balances from user wallets, with full tracking and security.

## 📋 System Components

### Tables Created
1. **`user_roles`** - Manages user roles (admin, user, moderator)
2. **`user_wallets`** - Stores user wallet balances by type and asset
3. **`balance_history`** - Tracks all balance changes with audit trail
4. **`profiles`** - User profile information

### Functions Available
1. **`add_balance_to_user()`** - Add balance to user wallet
2. **`remove_balance_from_user()`** - Remove balance from user wallet
3. **`update_user_balance()`** - General balance update function
4. **`get_user_wallet_summary()`** - Get user wallet data
5. **`sync_user_wallet_from_database()`** - Sync wallet from database
6. **`get_system_balance_stats()`** - Get system statistics
7. **`is_admin()`** - Check if user is admin

### Views Available
1. **`admin_user_balances`** - Detailed view of all user balances
2. **`admin_balance_summary`** - Summary view of user balances

## 🚀 Setup Instructions

### Step 1: Run the Migration
```sql
-- Run the complete system migration
-- This creates all tables, functions, views, and initial data
```

### Step 2: Verify Setup
```sql
-- Run the test script to verify everything is working
\i TEST_COMPLETE_SYSTEM.sql
```

### Step 3: Configure Admin User
The system automatically configures `kryvextrading@gmail.com` as an admin user.

## 🔧 Admin Functions Usage

### Adding Balance to User
```sql
-- Add 1000 USDT to user's trading account
SELECT add_balance_to_user(
    'user_id_here', 
    'trading', 
    'USDT', 
    1000.00, 
    'Bonus for new user'
);
```

### Removing Balance from User
```sql
-- Remove 500 USDT from user's trading account
SELECT remove_balance_from_user(
    'user_id_here', 
    'trading', 
    'USDT', 
    500.00, 
    'Fee deduction'
);
```

### General Balance Update
```sql
-- Add or subtract any amount
SELECT update_user_balance(
    'user_id_here',
    'funding',
    'USDT',
    2500.00,  -- Positive for addition, negative for removal
    'admin_adjustment',
    'Manual adjustment'
);
```

### Get User Wallet Summary
```sql
-- Get complete wallet data for a user
SELECT get_user_wallet_summary('user_id_here');
```

### Get System Statistics
```sql
-- Get overall system statistics
SELECT get_system_balance_stats();
```

## 📊 Admin Views Usage

### View All User Balances
```sql
-- See detailed balance information for all users
SELECT * FROM admin_user_balances;
```

### View Balance Summary
```sql
-- See summary of user balances
SELECT * FROM admin_balance_summary;
```

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only see their own wallet data
- Admins can see and manage all wallet data
- All balance changes are logged in `balance_history`

### Admin Verification
- All admin functions check if the current user has admin role
- Functions use `SECURITY DEFINER` for proper permissions

### Balance Protection
- Cannot reduce balance below 0
- All changes are tracked with timestamps and admin IDs

## 📱 Frontend Integration

### Wallet Sync Service
The frontend uses `walletSyncService.ts` to sync wallet data from the database:

```typescript
// Sync wallet from database
const walletData = await walletSyncService.syncAndUpdateWallet(userId);

// Force refresh wallet
await walletSyncService.forceRefreshWallet(userId);
```

### Admin Dashboard
The admin dashboard includes a balance management interface that allows:
- Viewing all user balances
- Adding/removing balances
- Viewing system statistics
- Tracking balance history

## 🎯 Common Operations

### Adding Balance to Specific User
1. Go to Admin Dashboard → Balance tab
2. Enter user email
3. Select wallet type (trading/funding)
4. Select asset (USDT, BTC, ETH)
5. Enter amount
6. Add reason
7. Click "Add Balance"

### Removing Balance from User
1. Go to Admin Dashboard → Balance tab
2. Enter user email
3. Select wallet type and asset
4. Enter amount to remove
5. Add reason
6. Click "Remove Balance"

### Viewing Balance History
1. Go to Admin Dashboard → Balance tab
2. View the "Balance History" section
3. See all balance changes with timestamps and reasons

## 🔍 Troubleshooting

### Balance Not Updating in Frontend
1. Check if user has wallet entries in database
2. Verify sync functions are working
3. Check browser console for errors
4. Try manual refresh on wallet page

### Admin Functions Not Working
1. Verify user has admin role in `user_roles` table
2. Check if functions exist in database
3. Verify RLS policies are correct
4. Check Supabase security warnings

### Missing Wallet Data
1. Run the migration to create initial wallet entries
2. Check if user exists in `auth.users`
3. Verify wallet entries exist in `user_wallets`

## 📈 Monitoring

### System Statistics
Use `get_system_balance_stats()` to monitor:
- Total users and active users
- Total balances by asset
- Trading vs funding balances
- Wallet and history counts

### Balance History
Monitor `balance_history` table for:
- All balance changes
- Admin actions
- User activity patterns
- Suspicious transactions

## 🛡️ Best Practices

### For Admins
1. Always provide a reason when changing balances
2. Double-check amounts before confirming
3. Monitor balance history regularly
4. Use appropriate wallet types (trading vs funding)

### For Developers
1. Test functions in development first
2. Monitor function performance
3. Keep backup of important data
4. Document all balance changes

## 🎉 System Status

The complete balance management system provides:
- ✅ Secure admin balance management
- ✅ Real-time wallet synchronization
- ✅ Complete audit trail
- ✅ User-friendly admin interface
- ✅ Robust error handling
- ✅ Performance optimization

## 📞 Support

If you encounter issues:
1. Check the test script output
2. Verify all tables and functions exist
3. Check user permissions and roles
4. Review balance history for recent changes
5. Test functions manually in Supabase SQL editor
