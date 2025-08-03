# 🗄️ PostgreSQL Database Setup Guide

This guide will help you set up PostgreSQL database for the Kryvex Trading Platform.

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ installed
- npm or yarn package manager

## 🚀 Quick Setup

### 1. Install PostgreSQL

#### Windows
```bash
# Download and install from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

#### macOS
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE kryvex_trading;
CREATE USER kryvex_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE kryvex_trading TO kryvex_user;
ALTER USER kryvex_user CREATEDB;

# Exit PostgreSQL
\q
```

### 3. Install Dependencies

```bash
# Install project dependencies
npm install

# Install additional database dependencies
npm install pg sequelize sequelize-typescript dotenv tsx
npm install --save-dev @types/pg
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=kryvex_user
DB_PASSWORD=your_secure_password
DB_NAME=kryvex_trading

# Application Configuration
NODE_ENV=development
VITE_APP_NAME=Kryvex Trading Platform

# Supabase Configuration (for authentication)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# TradingView Configuration
VITE_TradingView_WIDGET_URL=your_tradingview_url
```

### 5. Initialize Database

```bash
# Test database connection
npm run db:test

# Sync database schema
npm run db:sync

# Initialize with sample data
npm run db:init
```

## 📊 Database Schema

The Kryvex Trading Platform uses the following database tables:

### Core Tables

#### `users`
- Primary user accounts
- Authentication and basic user info
- Admin privileges

#### `profiles`
- Extended user information
- KYC documents
- Trading preferences
- Notification settings

#### `trades`
- Trading history
- Order details
- Profit/loss tracking
- Trade outcomes

#### `transactions`
- Financial transactions
- Deposits/withdrawals
- Fees and bonuses
- Transaction status

#### `wallets`
- User wallet balances
- Multiple currencies
- Locked balances

### Admin Tables

#### `admin_actions`
- Admin activity logging
- Audit trail
- Security monitoring

#### `trade_outcome_logs`
- Trade outcome control logs
- Admin override tracking
- Compliance records

## 🔧 Database Models

### User Model
```typescript
interface UserAttributes {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  is_verified: boolean;
  kyc_status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}
```

### Trade Model
```typescript
interface TradeAttributes {
  id: string;
  user_id: string;
  trading_pair: string;
  trade_type: 'buy' | 'sell';
  order_type: 'market' | 'limit' | 'stop_loss' | 'take_profit';
  amount: number;
  price: number;
  total_value: number;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  outcome?: 'win' | 'loss' | 'draw';
  profit_loss?: number;
  forced_outcome?: boolean;
  created_at: Date;
  updated_at: Date;
}
```

## 🛠️ Database Services

The platform includes comprehensive database services:

### UserService
- User CRUD operations
- Search and filtering
- Admin user management

### TradingService
- Trade creation and management
- Trade statistics
- Performance analytics

### WalletService
- Wallet balance management
- Multi-currency support
- Balance updates

### AdminService
- Admin action logging
- Trade outcome control
- Audit trail management

### AnalyticsService
- Platform statistics
- User analytics
- Performance metrics

## 🔍 Database Queries

### Get User with Profile and Wallets
```typescript
const user = await User.findByPk(userId, {
  include: [
    { model: Profile, as: 'profile' },
    { model: Wallet, as: 'wallets' }
  ]
});
```

### Get User Trades with Pagination
```typescript
const { trades, total } = await TradingService.getUserTrades(
  userId, 
  page, 
  limit
);
```

### Get Platform Statistics
```typescript
const stats = await AnalyticsService.getPlatformStats();
```

## 🔐 Security Features

### Row Level Security (RLS)
- User data isolation
- Admin access controls
- Secure data access

### Connection Pooling
- Optimized database connections
- Performance monitoring
- Resource management

### Data Validation
- Input sanitization
- Type checking
- Constraint enforcement

## 📈 Performance Optimization

### Indexes
```sql
-- User email index
CREATE INDEX idx_users_email ON users(email);

-- Trade user_id index
CREATE INDEX idx_trades_user_id ON trades(user_id);

-- Transaction user_id index
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- Created_at indexes for sorting
CREATE INDEX idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
```

### Query Optimization
- Efficient joins
- Pagination support
- Caching strategies

## 🚨 Troubleshooting

### Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U kryvex_user -d kryvex_trading

# Reset password if needed
sudo -u postgres psql
ALTER USER kryvex_user PASSWORD 'new_password';
```

### Permission Issues
```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kryvex_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kryvex_user;
```

### Database Reset
```bash
# Drop and recreate database
sudo -u postgres psql
DROP DATABASE kryvex_trading;
CREATE DATABASE kryvex_trading;
GRANT ALL PRIVILEGES ON DATABASE kryvex_trading TO kryvex_user;
\q

# Reinitialize
npm run db:sync
npm run db:init
```

## 📊 Monitoring

### Database Health Check
```bash
# Test connection
npm run db:test

# Check table counts
psql -h localhost -U kryvex_user -d kryvex_trading -c "
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'trades', COUNT(*) FROM trades
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'wallets', COUNT(*) FROM wallets;
"
```

### Performance Monitoring
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🔄 Migration Strategy

### Schema Changes
1. Update model definitions in `src/config/database.ts`
2. Run database sync: `npm run db:sync`
3. Test with sample data: `npm run db:init`

### Data Migration
```typescript
// Example migration script
export const migrateData = async () => {
  // Add new columns
  await sequelize.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS new_field VARCHAR(255);
  `);
  
  // Update existing data
  await User.update(
    { new_field: 'default_value' },
    { where: { new_field: null } }
  );
};
```

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Sequelize Documentation](https://sequelize.org/)
- [Node.js PostgreSQL](https://node-postgres.com/)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify environment variables
3. Test database connection
4. Check PostgreSQL logs
5. Review error messages in console

For additional help, please refer to the main README.md file or create an issue in the repository. 