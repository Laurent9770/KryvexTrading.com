# Supabase Database Setup for Kryvex Trading Platform

This directory contains all the database migrations and setup files for the Kryvex Trading Platform.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Database Schema Overview](#database-schema-overview)
3. [Migration Files](#migration-files)
4. [Admin Trading Control System](#admin-trading-control-system)
5. [Wallet System](#wallet-system)
6. [Security & Policies](#security--policies)
7. [Functions & Triggers](#functions--triggers)
8. [Real-time Features](#real-time-features)
9. [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Prerequisites
- Supabase project created
- Supabase CLI installed
- Database access credentials

### Apply Migrations

1. **Connect to your Supabase project:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

2. **Apply all migrations:**
   ```bash
   supabase db push
   ```

3. **Verify the setup:**
   ```bash
   supabase db diff
   ```

## 🗄️ Database Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `profiles` | User profiles and wallet balances | JSONB wallets, KYC status, account status |
| `trades` | All trading activities | Admin override, multiple trade types |
| `wallet_transactions` | Wallet transaction history | Admin adjustments, user transfers |
| `withdrawal_requests` | Withdrawal workflow | Admin approval process |
| `trading_features` | Trading feature configuration | Admin-controlled settings |
| `admin_actions` | Admin audit trail | Complete action logging |

### Enhanced Features

- **Dual Wallet System**: Separate funding and trading wallets
- **Admin Trading Control**: Force trade outcomes, manage features
- **Comprehensive Audit Trail**: All admin actions logged
- **Real-time Updates**: Live data synchronization
- **Row Level Security**: Granular access control

## 📁 Migration Files

### 1. Initial Setup (`20250730084907-ceeab4ff-0a68-4f9b-a1dd-a5527b94b8f2.sql`)
- Basic user profiles and authentication
- Trading pairs and basic trades
- Support tickets and notifications
- Initial RLS policies

### 2. Deposits System (`20250730100150-7fa59dd3-79d8-4b99-97be-f4adca75bf6c.sql`)
- Deposit management with proof uploads
- Storage bucket configuration
- Deposit approval workflow

### 3. Admin Actions (`20250730124526-1a951c55-8a4f-45e7-ae9d-61f662dda233.sql`)
- Admin action logging
- Wallet adjustments
- User session tracking

### 4. Trade Outcome Control (`20250730130000-trade-outcome-control.sql`)
- User-level trade outcome forcing
- Trade outcome logs
- Automatic outcome application

### 5. Complete Admin System (`20250731000000-admin-trading-control-complete.sql`)
- **NEW**: Complete admin trading control system
- **NEW**: Enhanced wallet system
- **NEW**: Trading features configuration
- **NEW**: Comprehensive audit trail

## 🎛️ Admin Trading Control System

### Features

#### 1. **Active Trades Management**
- View all running trades across users
- Filter by status, type, user
- Force trade outcomes (Win/Loss)
- Real-time monitoring

#### 2. **Trading Features Control**
- Enable/disable trading features
- Adjust investment limits
- Manage ROI percentages
- Control risk levels

#### 3. **Wallet Management**
- Add/remove funds from user wallets
- Support for both funding and trading wallets
- Complete transaction history
- Admin audit trail

### Database Tables

#### `trading_features`
```sql
CREATE TABLE public.trading_features (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('spot', 'futures', 'binary', 'options', 'quant')),
  is_enabled BOOLEAN DEFAULT true,
  min_investment NUMERIC(20, 8),
  max_investment NUMERIC(20, 8),
  roi_percentage NUMERIC(5, 2),
  duration_minutes INTEGER,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high'))
);
```

#### Enhanced `trades` table
```sql
ALTER TABLE public.trades ADD COLUMN:
- trade_type TEXT DEFAULT 'spot'
- direction TEXT
- symbol TEXT
- entry_price NUMERIC(20, 8)
- current_price NUMERIC(20, 8)
- profit_percentage NUMERIC(5, 2)
- duration_minutes INTEGER
- outcome TEXT CHECK (outcome IN ('win', 'lose', 'admin_override', 'pending'))
- admin_override BOOLEAN DEFAULT false
- admin_override_by UUID
- admin_override_at TIMESTAMP
```

## 💰 Wallet System

### Dual Wallet Architecture

#### Funding Wallet
- Used for deposits and withdrawals
- Separate from trading activities
- Admin can add/remove funds

#### Trading Wallet
- Used for all trading activities
- Deducted when placing trades
- Credited with profits/losses

### Wallet Transactions

All wallet activities are tracked in `wallet_transactions`:

```sql
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT CHECK (action IN ('admin_fund', 'admin_deduct', 'trade_profit', 'trade_loss', 'deposit', 'withdrawal', 'transfer_funding_to_trading', 'transfer_trading_to_funding')),
  wallet_type TEXT CHECK (wallet_type IN ('funding', 'trading')),
  amount NUMERIC(20, 8),
  asset TEXT DEFAULT 'USDT',
  balance_before NUMERIC(20, 8),
  balance_after NUMERIC(20, 8),
  admin_email TEXT,
  remarks TEXT
);
```

## 🔒 Security & Policies

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

#### User Access
- Users can only view their own data
- Users can create their own transactions
- Users can update their own pending requests

#### Admin Access
- Admins can view and manage all data
- Admins can perform all operations
- All admin actions are logged

### Example Policies

```sql
-- Users can view their own wallet transactions
CREATE POLICY "Users can view their own wallet transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can manage all wallet transactions
CREATE POLICY "Admins can manage all wallet transactions" 
ON public.wallet_transactions 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));
```

## ⚙️ Functions & Triggers

### Admin Functions

#### `force_trade_outcome(p_trade_id, p_outcome, p_admin_id)`
- Forces a trade to win or lose
- Calculates appropriate payout
- Logs admin action
- Updates trade status

#### `adjust_user_wallet(p_user_id, p_wallet_type, p_asset, p_amount, p_operation, p_admin_id, p_remarks)`
- Adds or removes funds from user wallets
- Creates transaction record
- Logs admin action
- Updates wallet balances

#### `update_trading_feature(p_feature_id, p_updates, p_admin_id)`
- Updates trading feature settings
- Logs changes for audit trail
- Validates input data

### Triggers

#### Automatic Timestamps
- `update_updated_at_column()`: Updates `updated_at` on record changes
- Applied to: `withdrawal_requests`, `trading_features`

#### User Registration
- `handle_new_user()`: Creates profile and role on user signup
- Applied to: `auth.users` INSERT

## 📡 Real-time Features

### Enabled Tables
- `wallet_transactions`
- `withdrawal_requests`
- `trading_features`
- `admin_actions`
- `trades`

### Usage
```javascript
// Subscribe to wallet transactions
const subscription = supabase
  .channel('wallet_transactions')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'wallet_transactions'
  }, (payload) => {
    console.log('Wallet transaction:', payload);
  })
  .subscribe();
```

## 🔧 Troubleshooting

### Common Issues

#### 1. RLS Policy Errors
```sql
-- Check if user has admin role
SELECT public.has_role(auth.uid(), 'admin');

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

#### 2. Function Permission Errors
```sql
-- Grant function execution permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
```

#### 3. Real-time Not Working
```sql
-- Check replica identity
SELECT schemaname, tablename, replica_identity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Performance Optimization

#### Indexes
All tables have appropriate indexes for:
- User ID lookups
- Status filtering
- Date range queries
- Admin action tracking

#### Query Optimization
```sql
-- Use indexes for common queries
EXPLAIN ANALYZE SELECT * FROM wallet_transactions 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC 
LIMIT 10;
```

## 📊 Monitoring & Maintenance

### Audit Trail
All admin actions are automatically logged in `admin_actions` table:
- Wallet adjustments
- Trade outcome forcing
- Feature updates
- User management

### Data Retention
- Admin actions: Permanent retention
- Wallet transactions: 30 days minimum
- Trade history: Permanent retention
- Support tickets: 30 days minimum

### Backup Strategy
- Daily automated backups
- Point-in-time recovery available
- Cross-region replication (if enabled)

## 🚀 Next Steps

1. **Apply the migration** to your Supabase project
2. **Test admin functions** with a test user
3. **Verify real-time subscriptions** work correctly
4. **Monitor admin actions** for security
5. **Set up alerts** for critical admin actions

## 📞 Support

For database-related issues:
1. Check the troubleshooting section
2. Review Supabase logs
3. Verify RLS policies
4. Test with admin user

---

**Last Updated**: July 31, 2025
**Version**: 1.0.0
**Compatibility**: Supabase v2.x
