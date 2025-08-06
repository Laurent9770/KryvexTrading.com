# Supabase Integration for Kryvex Trading Platform

This document outlines the comprehensive Supabase integration that has been implemented to replace the custom authentication system with a modern, scalable solution featuring real-time database queries and Row Level Security (RLS).

## Overview

The platform now uses Supabase for:
- **Authentication**: Supabase Auth with email/password
- **Database**: PostgreSQL with real-time subscriptions
- **Security**: Row Level Security (RLS) policies
- **Real-time**: Live updates for trading data, notifications, and user activity

## Architecture

### 1. Database Schema

The Supabase database includes the following tables with RLS enabled:

#### Core Tables
- `profiles` - User profiles and account information
- `user_roles` - Role-based access control (admin/user)
- `trades` - Trading history and results
- `transactions` - Deposit/withdrawal transactions
- `trading_pairs` - Available trading pairs with real-time prices
- `kyc_documents` - KYC verification documents
- `notifications` - User notifications
- `support_tickets` & `support_messages` - Customer support system

#### Admin Tables
- `admin_actions` - Audit trail for admin actions
- `admin_notifications` - Admin-to-user notifications
- `wallet_adjustments` - Manual balance adjustments
- `user_sessions` - Session tracking
- `trade_outcome_logs` - Trade outcome control audit trail

### 2. Row Level Security (RLS)

All tables have RLS policies that ensure:
- Users can only access their own data
- Admins can access all data
- Public read access for trading pairs
- Secure write operations with proper validation

#### Example RLS Policies:
```sql
-- Users can view their own trades
CREATE POLICY "Users can view their own trades" ON public.trades
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view and modify all trades
CREATE POLICY "Admins can view and modify all trades" ON public.trades
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
```

### 3. Real-time Subscriptions

The platform uses Supabase's real-time capabilities for:
- **Price Updates**: Live trading pair price changes
- **Trade Updates**: Real-time trade status updates
- **Notifications**: Instant user notifications
- **Profile Changes**: Live user profile updates

## Frontend Integration

### 1. Supabase Client Configuration

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

### 2. Authentication Service

The `supabaseAuthService.ts` provides:
- User registration and login
- Session management
- Profile updates
- Admin role management
- Real-time auth state changes

### 3. Trading Service

The `supabaseTradingService.ts` handles:
- Trade creation and management
- Trading statistics calculation
- Portfolio data aggregation
- Real-time price subscriptions
- Transaction history

### 4. Updated AuthContext

The AuthContext has been updated to:
- Use Supabase authentication
- Handle real-time user state changes
- Manage trading data subscriptions
- Provide loading states
- Support admin access control

## Key Features

### 1. Real-time Dashboard

The dashboard now shows:
- Live account balance updates
- Real-time trading statistics
- Live price feeds
- Instant trade notifications
- KYC status updates

### 2. Secure Data Access

- **User Data**: Users can only access their own trades, transactions, and profile data
- **Admin Access**: Admins can view and manage all user data
- **Public Data**: Trading pairs and market data are publicly readable
- **Audit Trail**: All admin actions are logged for security

### 3. Modern React Patterns

- **TypeScript**: Full type safety with generated types
- **Hooks**: Custom hooks for data fetching and state management
- **Context**: Centralized state management with AuthContext
- **Real-time**: Live updates without polling

## Database Functions

### 1. Role Management
```sql
-- Check if user has admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### 2. Trade Outcome Control
```sql
-- Apply forced trade outcomes for admin control
CREATE OR REPLACE FUNCTION public.apply_forced_trade_outcome(p_trade_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Implementation for forced trade outcomes
$$;
```

### 3. Admin Action Logging
```sql
-- Log admin actions for audit trail
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_action_type TEXT,
  -- ... other parameters
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Implementation for logging admin actions
$$;
```

## Migration from Custom Auth

### 1. Authentication Flow

**Before (Custom Auth):**
```typescript
// Local storage-based authentication
const login = async (email: string, password: string) => {
  // Check localStorage for user data
  // Simulate API calls
  // Store tokens in localStorage
}
```

**After (Supabase Auth):**
```typescript
// Supabase-based authentication
const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  // Automatic session management
  // Real-time auth state updates
}
```

### 2. Data Management

**Before:**
- Local storage for user data
- Simulated API calls
- Manual state management

**After:**
- Database-driven user profiles
- Real-time subscriptions
- Automatic state synchronization

### 3. Security

**Before:**
- Client-side authentication
- No server-side validation
- Insecure data storage

**After:**
- Server-side authentication
- Row Level Security
- Secure session management

## Environment Setup

### 1. Supabase Configuration

Create a `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup

Run the migration scripts in order:
1. `20250730084907-ceeab4ff-0a68-4f9b-a1dd-a5527b94b8f2.sql` - Core schema
2. `20250730124526-1a951c55-8a4f-45e7-ae9d-61f662dda233.sql` - Admin features
3. `20250730130000-trade-outcome-control.sql` - Trade control features

### 3. RLS Policies

All tables have RLS enabled with appropriate policies for:
- User data isolation
- Admin access control
- Public read access where needed
- Secure write operations

## Real-time Features

### 1. Price Updates
```typescript
// Subscribe to price changes
const unsubscribe = supabaseTradingService.subscribeToPriceUpdates(
  ['BTC/USDT', 'ETH/USDT'],
  (price) => {
    updateRealTimePrice(price.symbol, price.price, price.change24h);
  }
);
```

### 2. Trade Updates
```typescript
// Subscribe to user's trades
const unsubscribe = supabaseTradingService.subscribeToUserTrades(
  userId,
  (trade) => {
    addTrade(trade);
  }
);
```

### 3. Notifications
```typescript
// Subscribe to notifications
const subscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Handle new notification
  })
  .subscribe();
```

## Admin Features

### 1. User Management
- View all user profiles
- Manage user roles (promote/demote admin)
- Control account status (active/suspended/blocked)
- Monitor user sessions

### 2. Trade Control
- Force trade outcomes (win/loss)
- Apply trade controls to specific users
- Audit trail for all trade modifications
- Real-time trade monitoring

### 3. Wallet Management
- Manual balance adjustments
- Transaction approval/rejection
- Deposit/withdrawal management
- Balance audit trail

## Security Considerations

### 1. Row Level Security
- All tables have RLS enabled
- Policies ensure data isolation
- Admin access is properly controlled
- Public data is read-only

### 2. Authentication
- Supabase handles session management
- Automatic token refresh
- Secure password hashing
- Multi-factor authentication support

### 3. Data Validation
- Server-side validation for all operations
- Type safety with TypeScript
- Input sanitization
- SQL injection prevention

## Performance Optimizations

### 1. Real-time Efficiency
- Selective subscriptions based on user needs
- Efficient event filtering
- Connection pooling
- Automatic reconnection

### 2. Database Optimization
- Proper indexing on frequently queried columns
- Efficient RLS policies
- Optimized queries with joins
- Connection pooling

### 3. Frontend Optimization
- Memoized components and hooks
- Efficient state management
- Lazy loading of components
- Optimized re-renders

## Testing

### 1. Authentication Tests
```typescript
// Test user registration
const { success, error } = await supabaseAuthService.signUp({
  email: 'test@example.com',
  password: 'password123',
  fullName: 'Test User'
});

// Test user login
const { success, error } = await supabaseAuthService.signIn({
  email: 'test@example.com',
  password: 'password123'
});
```

### 2. Trading Tests
```typescript
// Test trade creation
const { success, trade } = await supabaseTradingService.createTrade({
  user_id: userId,
  trading_pair_id: pairId,
  trade_type: 'buy',
  amount: 100,
  price: 50000
});

// Test real-time subscriptions
const unsubscribe = supabaseTradingService.subscribeToUserTrades(
  userId,
  (trade) => console.log('New trade:', trade)
);
```

## Deployment

### 1. Supabase Setup
1. Create a new Supabase project
2. Run the migration scripts
3. Configure RLS policies
4. Set up authentication providers
5. Configure real-time features

### 2. Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Frontend Deployment
1. Build the application
2. Deploy to your hosting platform
3. Configure environment variables
4. Test authentication flow

## Troubleshooting

### 1. Common Issues

**Authentication Errors:**
- Check Supabase URL and API key
- Verify email confirmation settings
- Check RLS policies

**Real-time Connection Issues:**
- Verify network connectivity
- Check subscription filters
- Monitor connection status

**Database Errors:**
- Verify migration scripts ran successfully
- Check RLS policies
- Monitor database logs

### 2. Debug Tools

```typescript
// Enable Supabase debug logging
const supabase = createClient(url, key, {
  auth: {
    debug: true
  }
});

// Monitor real-time connections
supabase.channel('debug').on('system', { event: '*' }, (payload) => {
  console.log('System event:', payload);
});
```

## Conclusion

The Supabase integration provides a robust, scalable foundation for the Kryvex Trading Platform with:

- **Security**: Row Level Security and proper authentication
- **Real-time**: Live updates for all trading data
- **Scalability**: PostgreSQL database with efficient queries
- **Modern Development**: TypeScript, React hooks, and real-time subscriptions
- **Admin Features**: Comprehensive admin panel with audit trails
- **Performance**: Optimized queries and efficient state management

This integration ensures the platform is production-ready with enterprise-grade security and real-time capabilities. 