# Transaction Service Guide

## 📁 **New Transaction Service Created:**

### **`frontend/src/services/transactionService.ts`** ⭐ **NEW**
- **Type**: Class-based with static methods
- **Authentication**: Uses `supabase.auth.getUser()` (correct)
- **Table Names**: Uses `transactions` table
- **Null Safety**: ✅ `data || []` patterns
- **Features**: 
  - ✅ Proper authentication
  - ✅ Advanced filtering and search
  - ✅ Transaction statistics
  - ✅ Admin functions
  - ✅ TypeScript interfaces
  - ✅ CRUD operations

### **`frontend/src/components/TransactionServiceExample.tsx`** 📖 **EXAMPLE**
- **Purpose**: Demonstrates all transaction service features
- **Features**:
  - ✅ Real-time data fetching
  - ✅ Filtering and search
  - ✅ Statistics display
  - ✅ Admin view toggle
  - ✅ Status updates
  - ✅ Error handling

## 🚀 **How to Use the Transaction Service:**

### **Basic Import:**
```typescript
import { 
  getTransactions, 
  getTransactionById, 
  getRecentTransactions,
  getTransactionStats,
  createTransaction,
  updateTransactionStatus,
  searchTransactions
} from './services/transactionService';
```

### **Get All Transactions:**
```typescript
// Get all user transactions
const transactions = await getTransactions();

// Get with filters
const deposits = await getTransactions({ 
  type: 'deposit', 
  status: 'completed',
  limit: 10 
});
```

### **Get Recent Transactions:**
```typescript
const recentTransactions = await getRecentTransactions();
```

### **Get Transaction Statistics:**
```typescript
const stats = await getTransactionStats();
console.log('Total transactions:', stats.totalTransactions);
console.log('Total amount:', stats.totalAmount);
```

### **Create a New Transaction:**
```typescript
const newTransaction = await createTransaction({
  type: 'deposit',
  amount: 100,
  currency: 'USDT',
  status: 'pending',
  description: 'User deposit'
});
```

### **Update Transaction Status:**
```typescript
const success = await updateTransactionStatus(transactionId, 'completed');
```

### **Search Transactions:**
```typescript
const searchResults = await searchTransactions('deposit');
```

## 🔍 **Advanced Filtering:**

### **Filter Options:**
```typescript
interface TransactionFilters {
  type?: 'deposit' | 'withdrawal' | 'transfer' | 'trade' | 'fee' | 'bonus';
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  currency?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
```

### **Filter Examples:**
```typescript
// Get completed deposits in USDT
const deposits = await getTransactions({
  type: 'deposit',
  status: 'completed',
  currency: 'USDT'
});

// Get transactions from last 30 days
const recent = await getTransactions({
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date().toISOString()
});

// Pagination
const page1 = await getTransactions({ limit: 20, offset: 0 });
const page2 = await getTransactions({ limit: 20, offset: 20 });
```

## 📊 **Transaction Statistics:**

### **Available Stats:**
```typescript
interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  byType: { [key: string]: number };
  byCurrency: { [key: string]: number };
}
```

### **Usage Example:**
```typescript
const stats = await getTransactionStats();

// Display stats
console.log(`Total: ${stats.totalTransactions}`);
console.log(`Amount: ${stats.totalAmount}`);
console.log(`Pending: ${stats.pendingTransactions}`);
console.log(`Completed: ${stats.completedTransactions}`);

// Group by type
Object.entries(stats.byType).forEach(([type, count]) => {
  console.log(`${type}: ${count}`);
});
```

## 👨‍💼 **Admin Functions:**

### **Get All Transactions (Admin):**
```typescript
import { getAllTransactions } from './services/transactionService';

const allTransactions = await getAllTransactions({ limit: 100 });
```

### **Get User Transactions (Admin):**
```typescript
import { getUserTransactions } from './services/transactionService';

const userTransactions = await getUserTransactions(userId, {
  type: 'deposit',
  status: 'pending'
});
```

### **Update Any Transaction (Admin):**
```typescript
import { updateTransaction } from './services/transactionService';

const success = await updateTransaction(transactionId, {
  status: 'completed',
  description: 'Updated by admin'
});
```

## 🧪 **Testing with Example Component:**

### **Import and Use:**
```typescript
import TransactionServiceExample from './components/TransactionServiceExample';

// In your app
<TransactionServiceExample />
```

### **Features to Test:**
- ✅ **Create Test Transaction**: Creates a random transaction
- ✅ **Search**: Search transactions by description
- ✅ **Filters**: Filter by type, status, and limit
- ✅ **Statistics**: View transaction statistics
- ✅ **Status Updates**: Change transaction status
- ✅ **Admin View**: Toggle admin view for all transactions

## 🔧 **React Component Integration:**

### **Basic Component Example:**
```typescript
import React, { useState, useEffect } from 'react';
import { getTransactions, getTransactionStats } from './services/transactionService';

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transactionsData, statsData] = await Promise.all([
          getTransactions(),
          getTransactionStats()
        ]);
        
        setTransactions(transactionsData || []);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Transactions ({transactions.length})</h2>
      {transactions.map(transaction => (
        <div key={transaction.id}>
          {transaction.amount} {transaction.currency} - {transaction.type}
        </div>
      ))}
    </div>
  );
};
```

## 🚨 **Error Handling:**

### **Safe Usage Pattern:**
```typescript
// Always safe - returns arrays
const transactions = await getTransactions();
const safeTransactions = transactions || [];
safeTransactions.map(tx => ...); // Always safe

// Handle errors gracefully
try {
  const stats = await getTransactionStats();
  // Use stats
} catch (error) {
  console.error('Failed to get stats:', error);
  // Handle error (show message, retry, etc.)
}
```

## 📋 **Database Requirements:**

### **Required Table: `transactions`**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'trade', 'fee', 'bonus')),
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);
```

### **RLS Policies:**
```sql
-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own transactions
CREATE POLICY "Users update own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);
```

## 🎯 **Key Benefits:**

- ✅ **Type Safety**: Full TypeScript support
- ✅ **Null Safety**: Always returns arrays, never undefined
- ✅ **Authentication**: Proper user authentication
- ✅ **Filtering**: Advanced filtering and search
- ✅ **Statistics**: Built-in transaction statistics
- ✅ **Admin Support**: Admin functions for management
- ✅ **Error Handling**: Comprehensive error handling
- ✅ **Performance**: Efficient queries with pagination

## 🔄 **Migration from Old Services:**

### **If you were using wallet transactions:**
```typescript
// ❌ OLD
import { getWalletTransactions } from './walletService';
const walletTransactions = await getWalletTransactions();

// ✅ NEW
import { getTransactions } from './transactionService';
const transactions = await getTransactions({ type: 'transfer' });
```

---

**Ready to use!** The transaction service is now available and follows the same patterns as your wallet service for consistency.
