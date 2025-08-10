import React, { useState, useEffect } from 'react';
import { 
  getTransactions, 
  getTransactionById, 
  getTransactionsByType, 
  getTransactionsByStatus, 
  getRecentTransactions,
  getTransactionStats,
  createTransaction,
  updateTransactionStatus,
  searchTransactions,
  getAllTransactions,
  Transaction,
  TransactionFilters,
  TransactionStats
} from '../services/transactionService';

const TransactionServiceExample: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [
          transactionsData,
          recentTransactionsData,
          statsData,
          allTransactionsData
        ] = await Promise.all([
          getTransactions(filters),
          getRecentTransactions(),
          getTransactionStats(),
          getAllTransactions({ limit: 20 }) // Admin function
        ]);

        // Set state with safe data
        setTransactions(transactionsData || []);
        setRecentTransactions(recentTransactionsData || []);
        setStats(statsData);
        setAllTransactions(allTransactionsData || []);

        console.log('Successfully loaded all transaction data');

      } catch (err) {
        console.error('Error fetching transaction data:', err);
        setError('Failed to fetch transaction data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleCreateTransaction = async () => {
    try {
      const newTransaction = await createTransaction({
        type: 'deposit',
        amount: Math.random() * 1000,
        currency: 'USDT',
        status: 'pending',
        description: 'Test transaction from UI'
      });

      if (newTransaction) {
        console.log('Created new transaction:', newTransaction);
        // Refresh the data
        const updatedTransactions = await getTransactions(filters);
        setTransactions(updatedTransactions || []);
      }
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError('Failed to create transaction');
    }
  };

  const handleUpdateStatus = async (transactionId: string, newStatus: Transaction['status']) => {
    try {
      const success = await updateTransactionStatus(transactionId, newStatus);
      if (success) {
        console.log(`Updated transaction ${transactionId} to ${newStatus}`);
        // Refresh the data
        const updatedTransactions = await getTransactions(filters);
        setTransactions(updatedTransactions || []);
      }
    } catch (err) {
      console.error('Error updating transaction status:', err);
      setError('Failed to update transaction status');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      const searchResults = await searchTransactions(searchTerm);
      setTransactions(searchResults || []);
    } catch (err) {
      console.error('Error searching transactions:', err);
      setError('Failed to search transactions');
    }
  };

  const handleFilterChange = (newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  if (loading) {
    return <div>Loading transaction data...</div>;
  }

  if (error) {
    return (
      <div>
        <div>Error: {error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Transaction Service Example</h2>
      
      {/* Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={handleCreateTransaction}>Create Test Transaction</button>
        <button onClick={() => setShowAdmin(!showAdmin)}>
          {showAdmin ? 'Hide Admin' : 'Show Admin'}
        </button>
        <button onClick={clearFilters}>Clear Filters</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Filters:</h4>
        <select 
          value={filters.type || ''} 
          onChange={(e) => handleFilterChange({ type: e.target.value as Transaction['type'] || undefined })}
          style={{ marginRight: '10px', padding: '5px' }}
          aria-label="Filter by transaction type"
        >
          <option value="">All Types</option>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="transfer">Transfer</option>
          <option value="trade">Trade</option>
          <option value="fee">Fee</option>
          <option value="bonus">Bonus</option>
        </select>

        <select 
          value={filters.status || ''} 
          onChange={(e) => handleFilterChange({ status: e.target.value as Transaction['status'] || undefined })}
          style={{ marginRight: '10px', padding: '5px' }}
          aria-label="Filter by transaction status"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="number"
          placeholder="Limit"
          value={filters.limit || ''}
          onChange={(e) => handleFilterChange({ limit: e.target.value ? parseInt(e.target.value) : undefined })}
          style={{ marginRight: '10px', padding: '5px', width: '80px' }}
        />
      </div>

      {/* Transaction Statistics */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Transaction Statistics</h3>
        {stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
              <strong>Total:</strong> {stats.totalTransactions}
            </div>
            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
              <strong>Total Amount:</strong> {stats.totalAmount.toFixed(2)}
            </div>
            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
              <strong>Pending:</strong> {stats.pendingTransactions}
            </div>
            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
              <strong>Completed:</strong> {stats.completedTransactions}
            </div>
            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
              <strong>Failed:</strong> {stats.failedTransactions}
            </div>
          </div>
        ) : (
          <p>No statistics available</p>
        )}
      </div>

      {/* Recent Transactions */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Recent Transactions ({recentTransactions.length})</h3>
        {recentTransactions.length > 0 ? (
          <div>
            {recentTransactions.slice(0, 5).map(transaction => (
              <div key={transaction.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px 0' }}>
                <p><strong>Type:</strong> {transaction.type}</p>
                <p><strong>Amount:</strong> {transaction.amount} {transaction.currency}</p>
                <p><strong>Status:</strong> {transaction.status}</p>
                <p><strong>Date:</strong> {new Date(transaction.created_at).toLocaleDateString()}</p>
                {transaction.description && <p><strong>Description:</strong> {transaction.description}</p>}
                                 <div style={{ marginTop: '5px' }}>
                   <select 
                     value={transaction.status}
                     onChange={(e) => handleUpdateStatus(transaction.id, e.target.value as Transaction['status'])}
                     style={{ marginRight: '10px' }}
                     aria-label={`Update status for transaction ${transaction.id}`}
                   >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No recent transactions found</p>
        )}
      </div>

      {/* All Transactions */}
      <div style={{ marginBottom: '20px' }}>
        <h3>All Transactions ({transactions.length})</h3>
        {transactions.length > 0 ? (
          <div>
            {transactions.slice(0, 10).map(transaction => (
              <div key={transaction.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px 0' }}>
                <p><strong>ID:</strong> {transaction.id}</p>
                <p><strong>Type:</strong> {transaction.type}</p>
                <p><strong>Amount:</strong> {transaction.amount} {transaction.currency}</p>
                <p><strong>Status:</strong> {transaction.status}</p>
                <p><strong>Date:</strong> {new Date(transaction.created_at).toLocaleDateString()}</p>
                {transaction.description && <p><strong>Description:</strong> {transaction.description}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p>No transactions found</p>
        )}
      </div>

      {/* Admin Section */}
      {showAdmin && (
        <div style={{ marginBottom: '20px' }}>
          <h3>All Transactions (Admin View) ({allTransactions.length})</h3>
          {allTransactions.length > 0 ? (
            <div>
              {allTransactions.slice(0, 5).map(transaction => (
                <div key={transaction.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px 0' }}>
                  <p><strong>User ID:</strong> {transaction.user_id}</p>
                  <p><strong>Type:</strong> {transaction.type}</p>
                  <p><strong>Amount:</strong> {transaction.amount} {transaction.currency}</p>
                  <p><strong>Status:</strong> {transaction.status}</p>
                  <p><strong>Date:</strong> {new Date(transaction.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No admin transactions found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionServiceExample;
