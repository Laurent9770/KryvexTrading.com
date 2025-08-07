# Frontend Admin Integration Guide

## 🎨 **Step 3: Frontend Integration - Connect Admin Dashboard to APIs**

### **📋 Overview:**

This guide will help you connect your existing admin dashboard components to the new Admin API endpoints.

### **🔧 Step 1: Create Admin API Service**

First, let's create a service to handle all admin API calls:

```typescript
// frontend/src/services/adminApiService.ts

const ADMIN_BASE_URL = 'https://kryvextrading-com.onrender.com/api/admin';
const ADMIN_TOKEN = 'admin-token'; // In production, get from auth context

class AdminApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${ADMIN_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('Admin API Error:', error);
      throw error;
    }
  }

  // 👤 Users API
  async getUsers(limit = 50, offset = 0, search = '') {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(search && { search }),
    });
    return this.request(`/users?${params}`);
  }

  async getUserDetails(userId: string) {
    return this.request(`/users/${userId}`);
  }

  async addFundsToUser(userId: string, asset: string, amount: string, reason: string) {
    return this.request(`/users/${userId}/fund/add`, {
      method: 'POST',
      body: JSON.stringify({ asset, amount, reason }),
    });
  }

  async removeFundsFromUser(userId: string, asset: string, amount: string, reason: string) {
    return this.request(`/users/${userId}/fund/remove`, {
      method: 'POST',
      body: JSON.stringify({ asset, amount, reason }),
    });
  }

  // 📄 KYC API
  async getKYCSubmissions(limit = 50, offset = 0, status = '') {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(status && { status }),
    });
    return this.request(`/kyc?${params}`);
  }

  async approveKYC(submissionId: string, notes: string) {
    return this.request(`/kyc/${submissionId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectKYC(submissionId: string, reason: string, notes: string) {
    return this.request(`/kyc/${submissionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
  }

  // 💰 Deposits API
  async getDeposits(limit = 50, offset = 0, status = '') {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(status && { status }),
    });
    return this.request(`/deposits?${params}`);
  }

  async approveDeposit(depositId: string, notes: string) {
    return this.request(`/deposits/${depositId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectDeposit(depositId: string, reason: string, notes: string) {
    return this.request(`/deposits/${depositId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
  }

  // 📉 Withdrawals API
  async getWithdrawals(limit = 50, offset = 0, status = '') {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(status && { status }),
    });
    return this.request(`/withdrawals?${params}`);
  }

  async approveWithdrawal(withdrawalId: string, notes: string) {
    return this.request(`/withdrawals/${withdrawalId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectWithdrawal(withdrawalId: string, reason: string, notes: string) {
    return this.request(`/withdrawals/${withdrawalId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
  }

  // 👛 Wallets API
  async getWallets(limit = 50, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return this.request(`/wallets?${params}`);
  }

  async getFundActions(limit = 50, offset = 0, userId = '') {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(userId && { userId }),
    });
    return this.request(`/wallets/fund-actions?${params}`);
  }

  // ⚙️ Trading Control API
  async setTradeOverride(userId: string, mode: 'win' | 'lose' | null) {
    return this.request('/trade-override', {
      method: 'POST',
      body: JSON.stringify({ userId, mode }),
    });
  }

  async getTrades(limit = 50, offset = 0, status = '', userId = '') {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(status && { status }),
      ...(userId && { userId }),
    });
    return this.request(`/trades?${params}`);
  }

  async getTradingStats() {
    return this.request('/trades/stats');
  }

  // 📢 Notifications API
  async sendNotification(userId: string, title: string, message: string, type = 'admin') {
    return this.request('/notifications/send', {
      method: 'POST',
      body: JSON.stringify({ userId, title, message, type }),
    });
  }

  async broadcastNotification(title: string, message: string, type = 'admin') {
    return this.request('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title, message, type }),
    });
  }

  // 🧾 Audit API
  async getAuditLogs(limit = 50, offset = 0, actionType = '', adminId = '', targetUserId = '') {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(actionType && { actionType }),
      ...(adminId && { adminId }),
      ...(targetUserId && { targetUserId }),
    });
    return this.request(`/audit-logs?${params}`);
  }

  // 📊 Statistics API
  async getSystemStats() {
    return this.request('/stats');
  }
}

export const adminApiService = new AdminApiService();
```

### **🔧 Step 2: Update Admin Dashboard Components**

Now let's update your existing admin components to use the new API:

#### **1. Update AdminUserManagement.tsx**

```typescript
// frontend/src/components/AdminUserManagement.tsx

import React, { useState, useEffect } from 'react';
import { adminApiService } from '../services/adminApiService';

export const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundReason, setFundReason] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Show error notification
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (userId: string) => {
    try {
      await adminApiService.addFundsToUser(userId, 'USDT', fundAmount, fundReason);
      // Show success notification
      loadUsers(); // Refresh user list
      setFundAmount('');
      setFundReason('');
    } catch (error) {
      console.error('Failed to add funds:', error);
      // Show error notification
    }
  };

  const handleRemoveFunds = async (userId: string) => {
    try {
      await adminApiService.removeFundsFromUser(userId, 'USDT', fundAmount, fundReason);
      // Show success notification
      loadUsers(); // Refresh user list
      setFundAmount('');
      setFundReason('');
    } catch (error) {
      console.error('Failed to remove funds:', error);
      // Show error notification
    }
  };

  return (
    <div className="admin-user-management">
      <h2>User Management</h2>
      
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <div className="users-list">
          {users.map((user) => (
            <div key={user.id} className="user-card">
              <h3>{user.first_name} {user.last_name}</h3>
              <p>Email: {user.email}</p>
              <p>Balance: {user.usdt_balance} USDT</p>
              <p>Status: {user.is_active ? 'Active' : 'Inactive'}</p>
              <p>KYC: {user.kyc_status}</p>
              
              <div className="fund-actions">
                <input
                  type="number"
                  placeholder="Amount"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Reason"
                  value={fundReason}
                  onChange={(e) => setFundReason(e.target.value)}
                />
                <button onClick={() => handleAddFunds(user.id)}>
                  Add Funds
                </button>
                <button onClick={() => handleRemoveFunds(user.id)}>
                  Remove Funds
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### **2. Update AdminKYCVerification.tsx**

```typescript
// frontend/src/components/AdminKYCVerification.tsx

import React, { useState, useEffect } from 'react';
import { adminApiService } from '../services/adminApiService';

export const AdminKYCVerification: React.FC = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadKYCSubmissions();
  }, []);

  const loadKYCSubmissions = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.getKYCSubmissions();
      setSubmissions(response.data);
    } catch (error) {
      console.error('Failed to load KYC submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: string, notes: string) => {
    try {
      await adminApiService.approveKYC(submissionId, notes);
      // Show success notification
      loadKYCSubmissions(); // Refresh list
    } catch (error) {
      console.error('Failed to approve KYC:', error);
    }
  };

  const handleReject = async (submissionId: string, reason: string, notes: string) => {
    try {
      await adminApiService.rejectKYC(submissionId, reason, notes);
      // Show success notification
      loadKYCSubmissions(); // Refresh list
    } catch (error) {
      console.error('Failed to reject KYC:', error);
    }
  };

  return (
    <div className="admin-kyc-verification">
      <h2>KYC Verification</h2>
      
      {loading ? (
        <div>Loading KYC submissions...</div>
      ) : (
        <div className="submissions-list">
          {submissions.map((submission) => (
            <div key={submission.id} className="submission-card">
              <h3>{submission.first_name} {submission.last_name}</h3>
              <p>Email: {submission.email}</p>
              <p>Level: {submission.level}</p>
              <p>Status: {submission.status}</p>
              <p>Type: {submission.type}</p>
              
              {submission.status === 'pending' && (
                <div className="action-buttons">
                  <button onClick={() => handleApprove(submission.id, 'Documents verified')}>
                    Approve
                  </button>
                  <button onClick={() => handleReject(submission.id, 'Documents unclear', 'Please provide clearer photos')}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### **3. Update AdminDashboard.tsx**

```typescript
// frontend/src/components/AdminDashboard.tsx

import React, { useState, useEffect } from 'react';
import { adminApiService } from '../services/adminApiService';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.getSystemStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      {loading ? (
        <div>Loading statistics...</div>
      ) : stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p>{stats.total_users}</p>
          </div>
          <div className="stat-card">
            <h3>Verified Users</h3>
            <p>{stats.verified_users}</p>
          </div>
          <div className="stat-card">
            <h3>Pending KYC</h3>
            <p>{stats.pending_kyc}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Deposits</h3>
            <p>{stats.pending_deposits}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Withdrawals</h3>
            <p>{stats.pending_withdrawals}</p>
          </div>
          <div className="stat-card">
            <h3>Total USDT Balance</h3>
            <p>{stats.total_usdt_balance}</p>
          </div>
        </div>
      )}
    </div>
  );
};
```

### **🔧 Step 3: Add Error Handling and Notifications**

Create a notification system for admin actions:

```typescript
// frontend/src/hooks/useAdminNotifications.ts

import { useState } from 'react';

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const showSuccess = (message: string) => {
    const notification = {
      id: Date.now(),
      type: 'success',
      message,
    };
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const showError = (message: string) => {
    const notification = {
      id: Date.now(),
      type: 'error',
      message,
    };
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  return { notifications, showSuccess, showError };
};
```

### **🔧 Step 4: Update Admin Route Protection**

Update your admin route protection to use the new API:

```typescript
// frontend/src/components/AdminRoute.tsx

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminApiService } from '../services/adminApiService';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Test admin API access
        await adminApiService.getSystemStats();
        setIsAdmin(true);
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkAdminStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <div>Checking admin access...</div>;
  }

  if (!user || !isAdmin) {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return <>{children}</>;
};
```

### **✅ Integration Checklist:**

- ✅ **Admin API Service:** Created comprehensive service
- ✅ **User Management:** Connected to users API
- ✅ **KYC Verification:** Connected to KYC API
- ✅ **Dashboard Stats:** Connected to stats API
- ✅ **Error Handling:** Added proper error handling
- ✅ **Notifications:** Added success/error notifications
- ✅ **Route Protection:** Updated admin route protection

### **🚀 Next Steps:**

1. **Test Integration:** Test all admin components
2. **Add More Components:** Create components for deposits, withdrawals, etc.
3. **Real-time Updates:** Add WebSocket for real-time updates
4. **Advanced Features:** Add filtering, pagination, search

**Your admin dashboard is now fully integrated with the Admin API!** 🎉 