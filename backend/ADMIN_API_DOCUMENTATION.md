# Admin API Documentation

## 🌍 **Production Endpoints**

### **Base URL**: `https://kryvextrading-com.onrender.com/api/admin`

### **WebSocket**: `wss://kryvextrading-com.onrender.com`

## Overview

This document describes the complete admin control system for the Kryvex Trading Platform. The admin system provides full control over users, funds, KYC, deposits, withdrawals, trading, and notifications.

## Authentication

All admin endpoints require authentication with an admin user. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

**Default Admin Credentials:**
- Email: `admin@kryvex.com`
- Password: `Kryvex.@123`

## Base URL

```
http://localhost:3001/api/admin
```

## API Endpoints

### 👤 Users Tab

#### Get All Users
```http
GET /users?limit=50&offset=0&search=john
```

**Query Parameters:**
- `limit` (optional): Number of users to return (default: 50)
- `offset` (optional): Number of users to skip (default: 0)
- `search` (optional): Search term for email, first name, or last name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_verified": true,
      "is_active": true,
      "force_mode": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "usdt_balance": "1000.00",
      "btc_balance": "0.05",
      "eth_balance": "2.5",
      "kyc_status": "approved"
    }
  ]
}
```

#### Get User Details
```http
GET /users/{userId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_verified": true,
    "is_active": true,
    "force_mode": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "usdt_balance": "1000.00",
    "btc_balance": "0.05",
    "eth_balance": "2.5",
    "kyc_status": "approved",
    "kyc_level": 1
  }
}
```

#### Add Funds to User
```http
POST /users/{userId}/fund/add
```

**Request Body:**
```json
{
  "asset": "USDT",
  "amount": "100.00",
  "reason": "Bonus for new user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Added 100.00 USDT to user"
}
```

#### Remove Funds from User
```http
POST /users/{userId}/fund/remove
```

**Request Body:**
```json
{
  "asset": "USDT",
  "amount": "50.00",
  "reason": "Adjustment for incorrect deposit"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Removed 50.00 USDT from user"
}
```

### 📄 KYC Tab

#### Get All KYC Submissions
```http
GET /kyc?limit=50&offset=0&status=pending
```

**Query Parameters:**
- `limit` (optional): Number of submissions to return (default: 50)
- `offset` (optional): Number of submissions to skip (default: 0)
- `status` (optional): Filter by status (pending, approved, rejected)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "level": 1,
      "status": "pending",
      "admin_notes": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "user_id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "type": "passport",
      "file_url": "https://example.com/file.pdf"
    }
  ]
}
```

#### Approve KYC Submission
```http
POST /kyc/{submissionId}/approve
```

**Request Body:**
```json
{
  "notes": "Documents verified successfully"
}
```

**Response:**
```json
{
  "success": true,
  "message": "KYC approved successfully"
}
```

#### Reject KYC Submission
```http
POST /kyc/{submissionId}/reject
```

**Request Body:**
```json
{
  "reason": "Documents unclear",
  "notes": "Please provide clearer photos"
}
```

**Response:**
```json
{
  "success": true,
  "message": "KYC rejected successfully"
}
```

### 💰 Deposits Tab

#### Get All Deposits
```http
GET /deposits?limit=50&offset=0&status=pending
```

**Query Parameters:**
- `limit` (optional): Number of deposits to return (default: 50)
- `offset` (optional): Number of deposits to skip (default: 0)
- `status` (optional): Filter by status (pending, approved, rejected)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "amount": "500.00",
      "asset": "USDT",
      "status": "pending",
      "tx_hash": "0x123...",
      "network": "ETH",
      "address": "0xabc...",
      "admin_notes": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  ]
}
```

#### Approve Deposit
```http
POST /deposits/{depositId}/approve
```

**Request Body:**
```json
{
  "notes": "Transaction confirmed on blockchain"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deposit approved successfully"
}
```

#### Reject Deposit
```http
POST /deposits/{depositId}/reject
```

**Request Body:**
```json
{
  "reason": "Insufficient funds",
  "notes": "Transaction not found on blockchain"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deposit rejected successfully"
}
```

### 📉 Withdrawals Tab

#### Get All Withdrawals
```http
GET /withdrawals?limit=50&offset=0&status=pending
```

**Query Parameters:**
- `limit` (optional): Number of withdrawals to return (default: 50)
- `offset` (optional): Number of withdrawals to skip (default: 0)
- `status` (optional): Filter by status (pending, approved, rejected, processing)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "amount": "200.00",
      "asset": "USDT",
      "address": "0xabc...",
      "network": "ETH",
      "status": "pending",
      "admin_notes": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  ]
}
```

#### Approve Withdrawal
```http
POST /withdrawals/{withdrawalId}/approve
```

**Request Body:**
```json
{
  "notes": "Withdrawal processed successfully"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal approved successfully"
}
```

#### Reject Withdrawal
```http
POST /withdrawals/{withdrawalId}/reject
```

**Request Body:**
```json
{
  "reason": "Insufficient balance",
  "notes": "User balance is lower than withdrawal amount"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal rejected successfully"
}
```

### 👛 Wallets Tab

#### Get All Wallets (User Balances)
```http
GET /wallets?limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "usdt_balance": "1000.00",
      "btc_balance": "0.05",
      "eth_balance": "2.5"
    }
  ]
}
```

#### Get Admin Fund Actions History
```http
GET /wallets/fund-actions?limit=50&offset=0&userId=uuid
```

**Query Parameters:**
- `limit` (optional): Number of actions to return (default: 50)
- `offset` (optional): Number of actions to skip (default: 0)
- `userId` (optional): Filter by specific user

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "admin_id": "uuid",
      "user_id": "uuid",
      "asset": "USDT",
      "amount": "100.00",
      "action_type": "add",
      "reason": "Bonus for new user",
      "created_at": "2024-01-01T00:00:00Z",
      "admin_email": "admin@kryvex.com",
      "admin_first_name": "Admin",
      "admin_last_name": "Kryvex",
      "user_email": "user@example.com",
      "user_first_name": "John",
      "user_last_name": "Doe"
    }
  ]
}
```

### ⚙️ Trading Control Tab

#### Set Trade Override Mode
```http
POST /trade-override
```

**Request Body:**
```json
{
  "userId": "uuid",
  "mode": "win"
}
```

**Mode Options:**
- `"win"`: All trades will result in wins
- `"lose"`: All trades will result in losses
- `null`: Normal trading (no override)

**Response:**
```json
{
  "success": true,
  "message": "Trade mode set to win for user"
}
```

#### Get All Trades (Admin View)
```http
GET /trades?limit=50&offset=0&status=completed&userId=uuid
```

**Query Parameters:**
- `limit` (optional): Number of trades to return (default: 50)
- `offset` (optional): Number of trades to skip (default: 0)
- `status` (optional): Filter by status (pending, completed, cancelled)
- `userId` (optional): Filter by specific user

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "symbol": "BTC/USDT",
      "side": "buy",
      "type": "spot",
      "amount": "0.01",
      "price": "50000.00",
      "status": "completed",
      "result": "win",
      "profit_loss": "50.00",
      "entry_time": "2024-01-01T00:00:00Z",
      "exit_time": "2024-01-01T00:01:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:01:00Z",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  ]
}
```

#### Get Trading Statistics
```http
GET /trades/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTrades": 1000,
    "completedTrades": 950,
    "pendingTrades": 50,
    "winningTrades": 600,
    "losingTrades": 350,
    "totalProfit": "50000.00",
    "totalLoss": "25000.00",
    "avgTradeValue": "750.00",
    "activeTraders": 150,
    "winRate": "63.16"
  }
}
```

### 📢 Rooms Tab (Notifications)

#### Send Notification to Specific User
```http
POST /notifications/send
```

**Request Body:**
```json
{
  "userId": "uuid",
  "title": "Welcome to Kryvex!",
  "message": "Your account has been activated successfully.",
  "type": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent successfully"
}
```

#### Broadcast Notification to All Users
```http
POST /notifications/broadcast
```

**Request Body:**
```json
{
  "title": "System Maintenance",
  "message": "Scheduled maintenance on Sunday 2-4 AM UTC",
  "type": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification broadcasted to 150 users"
}
```

### 🧾 Audit Tab

#### Get Audit Logs
```http
GET /audit-logs?limit=50&offset=0&actionType=fund_add&adminId=uuid&targetUserId=uuid
```

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 50)
- `offset` (optional): Number of logs to skip (default: 0)
- `actionType` (optional): Filter by action type
- `adminId` (optional): Filter by admin user
- `targetUserId` (optional): Filter by target user

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "admin_id": "uuid",
      "action_type": "fund_add",
      "target_user_id": "uuid",
      "details": {
        "asset": "USDT",
        "amount": "100.00",
        "reason": "Bonus for new user",
        "userEmail": "user@example.com"
      },
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-01T00:00:00Z",
      "admin_email": "admin@kryvex.com",
      "admin_first_name": "Admin",
      "admin_last_name": "Kryvex",
      "target_email": "user@example.com",
      "target_first_name": "John",
      "target_last_name": "Doe"
    }
  ]
}
```

### 📊 System Statistics

#### Get System Statistics
```http
GET /stats
```

**Response:**
```json
{
  "success": true,
  "data": {
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
}
```

## WebSocket Notifications

The admin system supports real-time notifications via WebSocket on port 3002.

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:3002/ws?token=your-jwt-token');
```

### Notification Types

#### User Notifications
```json
{
  "type": "notification",
  "data": {
    "title": "Welcome to Kryvex!",
    "message": "Your account has been activated.",
    "type": "admin",
    "from": "admin"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Wallet Updates
```json
{
  "type": "wallet_update",
  "data": {
    "asset": "USDT",
    "balance": "100.00",
    "type": "admin_add",
    "reason": "Bonus for new user"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Transaction Updates
```json
{
  "type": "transaction_update",
  "data": {
    "type": "deposit",
    "status": "approved",
    "amount": "500.00",
    "asset": "USDT",
    "notes": "Transaction confirmed"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### KYC Updates
```json
{
  "type": "kyc_update",
  "data": {
    "status": "approved",
    "level": 1,
    "notes": "Documents verified successfully"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing parameters, validation errors)
- `401`: Unauthorized (invalid or missing token)
- `403`: Forbidden (not an admin user)
- `404`: Not Found (user, deposit, etc. not found)
- `500`: Internal Server Error

## Database Schema

### New Tables Added

#### admin_fund_actions
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

#### audit_logs
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

#### Updated users table
```sql
ALTER TABLE users ADD COLUMN force_mode VARCHAR(10) DEFAULT NULL;
-- 'win', 'lose', or NULL for normal trading
```

## Security Features

1. **Admin Authentication**: All endpoints require admin privileges
2. **Audit Logging**: Every admin action is logged with details
3. **Transaction Safety**: All fund operations use database transactions
4. **Input Validation**: All inputs are validated and sanitized
5. **Rate Limiting**: API endpoints are rate-limited to prevent abuse

## Migration

Run the migration script to add admin functionality to existing databases:

```bash
psql -d your_database -f scripts/admin-migration.sql
```

## Testing

Test the admin endpoints using curl or Postman:

```bash
# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kryvex.com","password":"Kryvex.@123"}'

# Use the returned token in subsequent requests
curl -X GET http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Support

For technical support or questions about the admin API, contact the development team. 