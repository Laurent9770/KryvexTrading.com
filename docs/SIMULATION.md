# Simulation Trading Platform

## Overview

Kryvex is a **simulation trading platform** designed for educational purposes. All money, balances, and transactions are **mock/simulation only** and have no real financial value.

## Key Design Principles

### 1. Simulation-First Architecture

- **All money is simulation**: No real financial transactions occur
- **Educational focus**: Platform designed for learning trading strategies
- **Risk-free environment**: Users can experiment without financial risk
- **Clear disclaimers**: Multiple UI indicators that this is simulation only

### 2. Database Schema

All tables and functions are designed with simulation in mind:

```sql
-- All monetary values are simulation only
balance numeric(18,8) -- Simulation balance
amount numeric(18,8)  -- Simulation transaction amount

-- Meta field explicitly marks simulation
meta jsonb default '{"simulation": true}'

-- Admin actions are logged with simulation flag
details jsonb_build_object('simulation', true)
```

### 3. API Design

- **Single RPC**: `admin_adjust_balance()` handles all balance changes
- **Audit trail**: All admin actions are logged
- **Real-time updates**: Changes propagate immediately via Supabase Realtime
- **Simulation metadata**: All responses include `simulation: true`

### 4. Frontend Implementation

- **SimulationDisclaimer component**: Clear UI indicators
- **No real payment processing**: Stripe integration is for demo only
- **Mock data**: All charts and analytics use simulated data
- **Educational messaging**: UI emphasizes learning and practice

## Admin Functions

### Balance Management

Admins can adjust user balances using the single RPC:

```typescript
// Credit user wallet
await adminCreditBalance(userId, 'funding', 'USDT', 1000, 'Demo credit');

// Debit user wallet  
await adminDebitBalance(userId, 'trading', 'BTC', 0.1, 'Demo debit');
```

### Audit Trail

All admin actions are logged:

- **admin_actions table**: Records all admin operations
- **wallet_transactions table**: Records all balance changes
- **Real-time notifications**: Changes appear immediately in UI

## Security Model

### Row Level Security (RLS)

- **Users**: Can only see their own wallets and transactions
- **Admins**: Can see all data via SECURITY DEFINER functions
- **Public**: No direct access to sensitive tables

### Admin Authentication

- **is_admin() function**: Single source of truth for admin status
- **user_roles view**: Frontend uses this for role checks
- **SECURITY DEFINER**: Admin functions bypass RLS safely

## Development Guidelines

### Adding New Features

1. **Always mark as simulation**: Include simulation metadata
2. **Use existing RPCs**: Leverage `admin_adjust_balance()` for balance changes
3. **Add audit logging**: Log all admin actions
4. **Include disclaimers**: Use SimulationDisclaimer component

### Database Changes

1. **Include simulation flags**: Add `simulation: true` to meta fields
2. **Update RLS policies**: Ensure proper access control
3. **Add indexes**: For performance on large datasets
4. **Enable realtime**: For immediate UI updates

### Frontend Changes

1. **Use simulation service**: Import from `adminWalletService.ts`
2. **Add disclaimers**: Include SimulationDisclaimer where appropriate
3. **Handle real-time updates**: Subscribe to relevant channels
4. **Clear messaging**: Always indicate simulation status

## Testing

### Admin Functions

```sql
-- Test admin status
SELECT public.is_admin('your-uuid');

-- Test balance adjustment
SELECT * FROM public.admin_adjust_balance(
  'user-uuid', 'funding', 'USDT', 1000, 'test'
);

-- Verify audit trail
SELECT * FROM public.admin_actions ORDER BY created_at DESC LIMIT 5;
```

### Frontend Integration

```typescript
// Test admin service
const result = await adminCreditBalance(userId, 'funding', 'USDT', 1000);
console.log(result.simulation); // Should be true

// Test real-time subscription
const unsubscribe = subscribeToWalletUpdates(userId, () => {
  console.log('Wallet updated');
});
```

## Deployment

### Environment Variables

Ensure these are set in production:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
NODE_ENV=production
```

### Database Migration

1. Run the admin-wallet-system migration
2. Seed admin users using the seed script
3. Verify RLS policies are active
4. Test admin functions

### Production Checklist

- [ ] All simulation disclaimers visible
- [ ] No real payment processing enabled
- [ ] Admin functions working correctly
- [ ] Real-time updates functioning
- [ ] Audit trail logging properly
- [ ] RLS policies enforced
- [ ] No import.meta errors in console
- [ ] CSP violations resolved

## Support

For questions about the simulation platform:

1. Check the audit logs for admin actions
2. Verify user roles in the user_roles view
3. Test admin functions directly in Supabase
4. Review real-time subscriptions
5. Check browser console for errors

Remember: This is a **simulation platform only**. No real money is involved in any transactions.
