# User Balance Management System Guide

## Overview

The User Balance Management System provides comprehensive tools for viewing and editing user balances in your Supabase database. This system includes:

- **Balance History Tracking**: Complete audit trail of all balance changes
- **Admin Views**: Easy-to-use views for viewing all user balances
- **Balance Update Functions**: Secure functions for updating user balances
- **Admin Interface**: React component for managing balances through the web interface

## Database Structure

### Tables

1. **`user_wallets`** (Existing)
   - Stores individual wallet balances for each user
   - Supports multiple wallet types (trading, funding)
   - Supports multiple assets (USDT, USD, BTC, ETH, etc.)

2. **`balance_history`** (New)
   - Tracks all balance changes with full audit trail
   - Records previous balance, new balance, change amount
   - Includes reason and admin who made the change

### Views

1. **`admin_user_balances`**
   - Detailed view of all user balances
   - Includes user info, wallet types, assets, and balances

2. **`admin_balance_summary`**
   - Summary view with aggregated balance data
   - Shows total balances per user across all wallets

### Functions

1. **`update_user_balance()`**
   - Secure function for updating user balances
   - Only admins can use this function
   - Automatically creates balance history records

2. **`get_system_balance_stats()`**
   - Returns system-wide balance statistics
   - Shows totals across all users and wallets

## How to Use

### 1. Running the Migration

First, run the migration to set up the balance management system:

```sql
-- Run this migration in your Supabase SQL editor
-- File: supabase/migrations/20250731450000-user-balance-management-system.sql
```

### 2. Testing the System

Run the test script to verify everything is working:

```sql
-- Run this in your Supabase SQL editor
-- File: TEST_BALANCE_MANAGEMENT.sql
```

### 3. Using the Admin Interface

1. Navigate to your admin dashboard
2. Click on the "Balance" tab
3. You'll see:
   - System statistics (total users, total balances, etc.)
   - Balance update form
   - User balance summary table
   - Detailed balance table

### 4. Updating User Balances

#### Through the Admin Interface:
1. Select a user from the dropdown
2. Choose wallet type (trading/funding)
3. Choose asset (USDT/USD/BTC/ETH)
4. Enter new balance
5. Provide a reason for the change
6. Click "Update Balance"

#### Through SQL:
```sql
-- Update a user's USDT trading balance
SELECT update_user_balance(
    'user-uuid-here',
    'trading',
    'USDT',
    1000.00,
    'admin_adjustment',
    'Bonus for new user'
);
```

### 5. Viewing Balance Data

#### View all user balances:
```sql
SELECT * FROM admin_user_balances ORDER BY user_created_at DESC;
```

#### View balance summaries:
```sql
SELECT * FROM admin_balance_summary ORDER BY total_usdt DESC;
```

#### View balance history:
```sql
SELECT * FROM balance_history ORDER BY created_at DESC LIMIT 20;
```

#### Get system statistics:
```sql
SELECT get_system_balance_stats();
```

## Security Features

### Row Level Security (RLS)
- Users can only view their own balance history
- Admins can view all balance data
- Only admins can update balances

### Audit Trail
- Every balance change is logged with:
  - Previous and new balance
  - Change amount
  - Reason for change
  - Admin who made the change
  - Timestamp

### Input Validation
- Balance updates require a reason
- Only valid wallet types and assets are accepted
- Balance amounts are validated

## Common Operations

### 1. Add Bonus to User
```sql
-- Add 100 USDT bonus to user's trading wallet
SELECT update_user_balance(
    'user-uuid',
    'trading',
    'USDT',
    100.00,
    'bonus',
    'Welcome bonus for new user'
);
```

### 2. Correct Balance Error
```sql
-- Correct a balance that was set incorrectly
SELECT update_user_balance(
    'user-uuid',
    'funding',
    'USD',
    500.00,
    'correction',
    'Fixed incorrect balance entry'
);
```

### 3. Process Deposit
```sql
-- Process a user deposit
SELECT update_user_balance(
    'user-uuid',
    'funding',
    'USDT',
    1000.00,
    'deposit',
    'Bank transfer deposit #12345'
);
```

### 4. Process Withdrawal
```sql
-- Process a user withdrawal (subtract from balance)
SELECT update_user_balance(
    'user-uuid',
    'funding',
    'USDT',
    500.00,
    'withdrawal',
    'Withdrawal to bank account #67890'
);
```

## Monitoring and Reporting

### Daily Balance Report
```sql
-- Get daily balance changes
SELECT 
    DATE(created_at) as date,
    COUNT(*) as changes,
    SUM(change_amount) as total_changes,
    COUNT(DISTINCT user_id) as users_affected
FROM balance_history
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### User Balance Alerts
```sql
-- Find users with high balances
SELECT 
    user_id,
    email,
    full_name,
    total_usdt,
    total_usd
FROM admin_balance_summary
WHERE total_usdt > 10000 OR total_usd > 10000
ORDER BY total_usdt DESC;
```

### Suspicious Activity
```sql
-- Find recent large balance changes
SELECT 
    user_id,
    wallet_type,
    asset,
    change_amount,
    reason,
    created_at
FROM balance_history
WHERE ABS(change_amount) > 1000
AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY ABS(change_amount) DESC;
```

## Troubleshooting

### Common Issues

1. **"Only admins can update user balances"**
   - Make sure you're logged in as an admin user
   - Check that your user has the 'admin' role in user_roles table

2. **"Access denied" when viewing data**
   - Ensure you have admin privileges
   - Check RLS policies are properly set up

3. **Balance not updating**
   - Verify the user_id exists
   - Check that wallet_type and asset are valid
   - Ensure the new_balance is a valid number

### Verification Queries

```sql
-- Check if you're an admin
SELECT has_role(auth.uid(), 'admin');

-- Check user exists
SELECT * FROM auth.users WHERE id = 'user-uuid';

-- Check current balance
SELECT * FROM user_wallets WHERE user_id = 'user-uuid';

-- Check balance history
SELECT * FROM balance_history WHERE user_id = 'user-uuid' ORDER BY created_at DESC;
```

## Best Practices

1. **Always provide a reason** when updating balances
2. **Use appropriate change types** (deposit, withdrawal, bonus, correction, etc.)
3. **Verify balances before and after** making changes
4. **Monitor balance history** regularly for unusual activity
5. **Backup important data** before making bulk changes
6. **Test changes** in a development environment first

## Support

If you encounter issues with the balance management system:

1. Check the test script output for system status
2. Verify all tables, views, and functions exist
3. Check your admin privileges
4. Review the balance history for recent changes
5. Contact your database administrator if needed

---

**Note**: This system is designed for admin use only. Regular users should not have access to balance management functions.
