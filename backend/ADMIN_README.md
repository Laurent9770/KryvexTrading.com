# Kryvex Trading Platform - Admin Control System

## 🎯 Overview

This implementation provides **complete admin control** over the Kryvex Trading Platform with a comprehensive admin dashboard featuring 8 main tabs:

- 👤 **Users** - Manage user accounts and balances
- 📄 **KYC** - Approve/reject identity verification
- 💰 **Deposits** - Approve/reject deposit requests
- 📉 **Withdrawals** - Approve/reject withdrawal requests
- 👛 **Wallets** - View balances and fund history
- ⚙️ **Trading Control** - Override trade outcomes
- 📢 **Rooms** - Send notifications to users
- 🧾 **Audit** - View all admin actions

## 🚀 Quick Start

### **Production URLs**
- **Backend API**: `https://kryvextrading-com.onrender.com`
- **WebSocket**: `wss://kryvextrading-com.onrender.com`
- **Admin Dashboard**: `https://kryvex-frontend.onrender.com/admin`

### **Development URLs**
- **Backend API**: `http://localhost:3001`
- **WebSocket**: `ws://localhost:3002`
- **Admin Dashboard**: `http://localhost:8080/admin`

### 1. Database Setup

Run the migration script to add admin functionality:

```bash
# For new installations
psql -d kryvex_trading -f database/schema.sql

# For existing installations
psql -d kryvex_trading -f scripts/admin-migration.sql
```

### 2. Admin Login

**Default Admin Credentials:**
- Email: `admin@kryvex.com`
- Password: `Kryvex.@123`

### 3. Start the Server

```bash
cd backend
npm install
npm start
```

Server will run on:
- HTTP API: `http://localhost:3001`
- WebSocket: `ws://localhost:3002`

## 🔧 Features by Tab

### 👤 Users Tab

**Capabilities:**
- ✅ List all users with balances and KYC status
- ✅ Add funds to any user instantly
- ✅ Remove funds from any user
- ✅ Search users by email/name
- ✅ View detailed user information

**API Endpoints:**
```http
GET    /api/admin/users                    # List all users
GET    /api/admin/users/{userId}          # Get user details
POST   /api/admin/users/{userId}/fund/add # Add funds
POST   /api/admin/users/{userId}/fund/remove # Remove funds
```

**Example Usage:**
```bash
# Add 100 USDT to user
curl -X POST http://localhost:3001/api/admin/users/user-id/fund/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"asset":"USDT","amount":"100.00","reason":"Welcome bonus"}'
```

### 📄 KYC Tab

**Capabilities:**
- ✅ View all KYC submissions
- ✅ Approve KYC with notes
- ✅ Reject KYC with reason
- ✅ Filter by status (pending/approved/rejected)

**API Endpoints:**
```http
GET    /api/admin/kyc                           # List KYC submissions
POST   /api/admin/kyc/{submissionId}/approve   # Approve KYC
POST   /api/admin/kyc/{submissionId}/reject    # Reject KYC
```

### 💰 Deposits Tab

**Capabilities:**
- ✅ View all deposit requests
- ✅ Approve deposits → instantly credits user balance
- ✅ Reject deposits with reason
- ✅ Filter by status

**API Endpoints:**
```http
GET    /api/admin/deposits                           # List deposits
POST   /api/admin/deposits/{depositId}/approve      # Approve deposit
POST   /api/admin/deposits/{depositId}/reject       # Reject deposit
```

### 📉 Withdrawals Tab

**Capabilities:**
- ✅ View withdrawal requests
- ✅ Approve withdrawals → immediately deducts from user balance
- ✅ Reject withdrawals → leaves balance unchanged
- ✅ Filter by status

**API Endpoints:**
```http
GET    /api/admin/withdrawals                           # List withdrawals
POST   /api/admin/withdrawals/{withdrawalId}/approve   # Approve withdrawal
POST   /api/admin/withdrawals/{withdrawalId}/reject    # Reject withdrawal
```

### 👛 Wallets Tab

**Capabilities:**
- ✅ View all user balances
- ✅ View manual fund changes history
- ✅ Same add/remove fund functionality as Users tab

**API Endpoints:**
```http
GET    /api/admin/wallets                    # List all wallets
GET    /api/admin/wallets/fund-actions       # Get fund action history
```

### ⚙️ Trading Control Tab

**Capabilities:**
- ✅ **Force Win**: All trades for a user automatically win
- ✅ **Force Lose**: All trades for a user automatically lose
- ✅ Reset to normal trading
- ✅ View all trades with admin details
- ✅ Get trading statistics

**API Endpoints:**
```http
POST   /api/admin/trade-override             # Set trade override mode
GET    /api/admin/trades                     # List all trades
GET    /api/admin/trades/stats               # Get trading statistics
```

**Trade Override Modes:**
```json
{
  "userId": "user-id",
  "mode": "win"    // Force all trades to win
  "mode": "lose"   // Force all trades to lose
  "mode": null     // Normal trading (no override)
}
```

### 📢 Rooms Tab (Notifications)

**Capabilities:**
- ✅ Send targeted notifications to specific users
- ✅ Broadcast messages to all users
- ✅ Real-time delivery via WebSocket
- ✅ Stored in notifications table

**API Endpoints:**
```http
POST   /api/admin/notifications/send         # Send to specific user
POST   /api/admin/notifications/broadcast    # Broadcast to all users
```

**WebSocket Notifications:**
```javascript
const ws = new WebSocket('ws://localhost:3002/ws?token=your-jwt-token');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'notification') {
    console.log('New notification:', data.data);
  }
};
```

### 🧾 Audit Tab

**Capabilities:**
- ✅ Log every admin action with details
- ✅ Filter by action type, admin, or target user
- ✅ Comprehensive audit trail
- ✅ IP address tracking

**API Endpoints:**
```http
GET    /api/admin/audit-logs                 # Get audit logs
```

**Audit Log Entry Example:**
```json
{
  "id": "uuid",
  "admin_id": "admin-uuid",
  "action_type": "fund_add",
  "target_user_id": "user-uuid",
  "details": {
    "asset": "USDT",
    "amount": "100.00",
    "reason": "Welcome bonus",
    "userEmail": "user@example.com"
  },
  "ip_address": "192.168.1.1",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## 🔐 Security Features

### Authentication
- JWT-based authentication
- Admin-only route protection
- Token validation on every request

### Audit Logging
- Every admin action is logged
- Includes admin ID, target user, action details
- IP address tracking
- Timestamp for all actions

### Transaction Safety
- All fund operations use database transactions
- Rollback on errors
- Atomic operations

### Input Validation
- All inputs validated and sanitized
- Type checking for all parameters
- SQL injection prevention

## 📊 Database Schema

### New Tables Added

#### `admin_fund_actions`
Tracks manual fund changes by admins:
```sql
CREATE TABLE admin_fund_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    asset VARCHAR(10) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- 'add', 'remove'
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `audit_logs`
Comprehensive audit trail:
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    target_user_id UUID REFERENCES users(id),
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Updated `users` table
Added force mode for trade control:
```sql
ALTER TABLE users ADD COLUMN force_mode VARCHAR(10) DEFAULT NULL;
-- 'win', 'lose', or NULL for normal trading
```

## 🔄 Real-time Features

### WebSocket Integration
- Real-time notifications to users
- Instant balance updates
- Live trade result notifications
- Admin action notifications

### Notification Types
- User notifications (targeted)
- Broadcast notifications (all users)
- Wallet balance updates
- Transaction status updates
- KYC status updates

## 🧪 Testing

### Test Admin Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kryvex.com","password":"Kryvex.@123"}'
```

### Test User Management
```bash
# Get all users
curl -X GET http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Add funds to user
curl -X POST http://localhost:3001/api/admin/users/user-id/fund/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"asset":"USDT","amount":"100.00","reason":"Test"}'
```

### Test Trade Override
```bash
# Force user to always win
curl -X POST http://localhost:3001/api/admin/trade-override \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-id","mode":"win"}'
```

## 📈 System Statistics

The admin system provides comprehensive statistics:

```json
{
  "total_users": 500,
  "verified_users": 450,
  "pending_kyc": 25,
  "pending_deposits": 15,
  "pending_withdrawals": 10,
  "pending_trades": 5,
  "total_usdt_balance": "50000.00",
  "total_btc_balance": "2.5",
  "total_eth_balance": "25.0"
}
```

## 🛠️ Development

### File Structure
```
backend/
├── services/
│   ├── adminService.js          # Main admin service
│   ├── websocketService.js      # WebSocket notifications
│   └── tradingService.js        # Updated with force mode
├── routes/
│   └── admin.js                 # Admin API routes
├── middleware/
│   └── auth.js                  # Admin authentication
├── scripts/
│   └── admin-migration.sql      # Database migration
└── ADMIN_API_DOCUMENTATION.md   # Complete API docs
```

### Key Components

#### AdminService (`services/adminService.js`)
- User management
- Fund operations
- KYC management
- Deposit/withdrawal approval
- Trade override
- Notifications
- Audit logging

#### WebSocketService (`services/websocketService.js`)
- Real-time notifications
- Client management
- Admin/user separation
- Message broadcasting

#### Admin Routes (`routes/admin.js`)
- RESTful API endpoints
- Input validation
- Error handling
- Admin authentication

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common error scenarios:
- Invalid user ID
- Insufficient balance
- Invalid trade override mode
- Missing required parameters
- Authentication failures

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/kryvex_trading

# JWT
JWT_SECRET=your-secret-key

# Server
PORT=3001
WS_PORT=3002

# CORS
CORS_ORIGIN=http://localhost:8080
```

### Admin User Setup
The default admin user is created automatically:
- Email: `admin@kryvex.com`
- Password: `Kryvex.@123`
- Role: Admin

## 📝 Logging

The system logs all admin actions:

```javascript
// Example audit log entry
{
  "admin_id": "admin-uuid",
  "action_type": "fund_add",
  "target_user_id": "user-uuid",
  "details": {
    "asset": "USDT",
    "amount": "100.00",
    "reason": "Welcome bonus"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🎯 Use Cases

### 1. User Support
- Add funds for customer service
- Remove funds for refunds
- Approve KYC for verified users
- Send targeted notifications

### 2. Trading Control
- Force wins for VIP users
- Force losses for testing
- Monitor all trading activity
- Override trade outcomes

### 3. Financial Management
- Approve legitimate deposits
- Reject suspicious withdrawals
- Monitor platform balances
- Track fund movements

### 4. Compliance
- KYC verification
- Audit trail maintenance
- Transaction monitoring
- Regulatory reporting

## 🔮 Future Enhancements

### Planned Features
- [ ] Bulk operations (approve multiple items)
- [ ] Advanced filtering and search
- [ ] Export functionality (CSV, PDF)
- [ ] Admin role hierarchy
- [ ] Automated approval rules
- [ ] Advanced analytics dashboard

### Integration Possibilities
- [ ] Slack/Discord notifications
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Third-party KYC providers
- [ ] Payment processor integration

## 📞 Support

For technical support or questions about the admin system:

1. Check the API documentation: `ADMIN_API_DOCUMENTATION.md`
2. Review the database schema: `database/schema.sql`
3. Test with the provided examples
4. Check server logs for error details

## 🎉 Conclusion

This admin control system provides **complete administrative control** over the Kryvex Trading Platform with:

✅ **Full user management** with instant fund operations  
✅ **KYC approval/rejection** with detailed tracking  
✅ **Deposit/withdrawal management** with balance control  
✅ **Trade outcome override** for testing and VIP users  
✅ **Real-time notifications** via WebSocket  
✅ **Comprehensive audit logging** for compliance  
✅ **Secure authentication** with admin-only access  
✅ **Database transaction safety** for all operations  

The system is production-ready and provides all the features requested for complete admin control of the trading platform. 