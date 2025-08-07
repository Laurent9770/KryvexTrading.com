# Admin API Testing Guide

## 🧪 **Step 2: Test Admin Endpoints with Postman/curl**

### **📋 Prerequisites:**

1. **Admin Token:** Use `admin-token` for testing
2. **Base URL:** `https://kryvextrading-com.onrender.com/api/admin`
3. **Headers:** `Authorization: Bearer admin-token`

### **🔧 Setup Postman Collection:**

#### **1. Create New Collection**
- Open Postman
- Click "New" → "Collection"
- Name: "Kryvex Admin API"

#### **2. Set Collection Variables**
- Click on collection → "Variables" tab
- Add these variables:
  ```
  base_url: https://kryvextrading-com.onrender.com/api/admin
  admin_token: admin-token
  ```

#### **3. Set Collection Headers**
- Click on collection → "Headers" tab
- Add:
  ```
  Authorization: Bearer {{admin_token}}
  Content-Type: application/json
  ```

### **📊 Test All Endpoints:**

#### **👤 Users Tab Tests:**

**1. Get All Users**
```bash
curl -X GET "https://kryvextrading-com.onrender.com/api/admin/users" \
  -H "Authorization: Bearer admin-token"
```

**Postman:**
- Method: `GET`
- URL: `{{base_url}}/users`
- Headers: `Authorization: Bearer {{admin_token}}`

**Expected Response:**
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
      "btc_balance": "0.00",
      "eth_balance": "0.00",
      "kyc_status": "approved"
    }
  ]
}
```

**2. Get User Details**
```bash
curl -X GET "https://kryvextrading-com.onrender.com/api/admin/users/USER_ID" \
  -H "Authorization: Bearer admin-token"
```

**3. Add Funds to User**
```bash
curl -X POST "https://kryvextrading-com.onrender.com/api/admin/users/USER_ID/fund/add" \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "asset": "USDT",
    "amount": "100.00",
    "reason": "Bonus for new user"
  }'
```

**4. Remove Funds from User**
```bash
curl -X POST "https://kryvextrading-com.onrender.com/api/admin/users/USER_ID/fund/remove" \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "asset": "USDT",
    "amount": "50.00",
    "reason": "Adjustment for incorrect deposit"
  }'
```

#### **📄 KYC Tab Tests:**

**1. Get All KYC Submissions**
```bash
curl -X GET "https://kryvextrading-com.onrender.com/api/admin/kyc" \
  -H "Authorization: Bearer admin-token"
```

**2. Approve KYC Submission**
```bash
curl -X POST "https://kryvextrading-com.onrender.com/api/admin/kyc/SUBMISSION_ID/approve" \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Documents verified successfully"
  }'
```

**3. Reject KYC Submission**
```bash
curl -X POST "https://kryvextrading-com.onrender.com/api/admin/kyc/SUBMISSION_ID/reject" \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Documents unclear",
    "notes": "Please provide clearer photos"
  }'
```

#### **💰 Deposits Tab Tests:**

**1. Get All Deposits**
```bash
curl -X GET "https://kryvextrading-com.onrender.com/api/admin/deposits" \
  -H "Authorization: Bearer admin-token"
```

**2. Approve Deposit**
```bash
curl -X POST "https://kryvextrading-com.onrender.com/api/admin/deposits/DEPOSIT_ID/approve" \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Transaction confirmed on blockchain"
  }'
```

**3. Reject Deposit**
```bash
curl -X POST "https://kryvextrading-com.onrender.com/api/admin/deposits/DEPOSIT_ID/reject" \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Insufficient funds",
    "notes": "Transaction not found on blockchain"
  }'
```

#### **📉 Withdrawals Tab Tests:**

**1. Get All Withdrawals**
```bash
curl -X GET "https://kryvextrading-com.onrender.com/api/admin/withdrawals" \
  -H "Authorization: Bearer admin-token"
```

**2. Approve Withdrawal**
```bash
curl -X POST "https://kryvextrading-com.onrender.com/api/admin/withdrawals/WITHDRAWAL_ID/approve" \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Withdrawal processed successfully"
  }'
```

**3. Reject Withdrawal**
```bash
curl -X POST "https://kryvextrading-com.onrender.com/api/admin/withdrawals/WITHDRAWAL_ID/reject" \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Insufficient balance",
    "notes": "User balance is lower than withdrawal amount"
  }'
```

#### **👛 Wallets Tab Tests:**

**1. Get All Wallets**
```bash
curl -X GET "https://kryvextrading-com.onrender.com/api/admin/wallets" \
  -H "Authorization: Bearer admin-token"
```

**2. Get Fund Actions History**
```bash
curl -X GET "https://kryvextrading-com.onrender.com/api/admin/wallets/fund-actions" \
  -H "Authorization: Bearer admin-token"
```

#### **⚙️ Trading Control Tab Tests:**

**1. Set Trade Override Mode**
```bash
curl -X POST "https://kryvextrading-com.onrender.com/api/admin/trade-override" \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "mode": "win"
  }'
```

**2. Get All Trades**
```bash
curl -X GET "https://kryvextrading-com.onrender.com/api/admin/trades" \
  -H "Authorization: Bearer admin-token"
```

**3. Get Trading Statistics**
```bash
curl -X GET "https://kryvextrading-com.onrender.com/api/admin/trades/stats" \
  -H "Authorization: Bearer admin-token"
```

#### **📢 Notifications Tab Tests:**

**1. Send Notification to User**
```bash
curl -X POST "https://kryvextrading-com.onrender.com/api/admin/notifications/send" \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "title": "Welcome to Kryvex!",
    "message": "Your account has been activated successfully.",
    "type": "admin"
  }'
```

**2. Broadcast Notification**
```bash
curl -X POST "https://kryvextrading-com.onrender.com/api/admin/notifications/broadcast" \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Maintenance",
    "message": "Scheduled maintenance on Sunday 2-4 AM UTC",
    "type": "admin"
  }'
```

#### **🧾 Audit Tab Tests:**

**1. Get Audit Logs**
```bash
curl -X GET "https://kryvextrading-com.onrender.com/api/admin/audit-logs" \
  -H "Authorization: Bearer admin-token"
```

#### **📊 System Statistics Tests:**

**1. Get System Statistics**
```bash
curl -X GET "https://kryvextrading-com.onrender.com/api/admin/stats" \
  -H "Authorization: Bearer admin-token"
```

### **✅ Expected Responses:**

All endpoints should return:
```json
{
  "success": true,
  "data": [...],
  "message": "Operation completed successfully"
}
```

### **🚨 Error Responses:**

```json
{
  "success": false,
  "error": "Error message"
}
```

### **📋 Testing Checklist:**

- ✅ **Authentication:** All endpoints require admin token
- ✅ **Users:** Get users, add/remove funds
- ✅ **KYC:** Get submissions, approve/reject
- ✅ **Deposits:** Get deposits, approve/reject
- ✅ **Withdrawals:** Get withdrawals, approve/reject
- ✅ **Wallets:** Get balances, fund actions
- ✅ **Trading:** Set override, get trades, stats
- ✅ **Notifications:** Send individual/broadcast
- ✅ **Audit:** Get audit logs
- ✅ **Stats:** Get system statistics

### **🔧 Troubleshooting:**

**Common Issues:**
1. **401 Unauthorized:** Check admin token
2. **404 Not Found:** Check endpoint URL
3. **500 Server Error:** Check backend logs
4. **CORS Errors:** Check CORS configuration

**Test Data:**
- Use real user IDs from your database
- Create test users if needed
- Use realistic amounts for fund operations 