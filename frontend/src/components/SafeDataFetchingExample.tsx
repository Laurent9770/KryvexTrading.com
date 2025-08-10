import React, { useState, useEffect } from 'react';
import supabaseSafeQueries from '../services/supabaseSafeQueries';

// Example component showing safer data fetching patterns
const SafeDataFetchingExample: React.FC = () => {
  const [userWallets, setUserWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tradingPairs, setTradingPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user wallets safely
        const { data: wallets, error: walletsError, success: walletsSuccess } = 
          await supabaseSafeQueries.getAllUserWallets();

        if (!walletsSuccess) {
          console.error('Failed to fetch user wallets:', walletsError);
          setError('Failed to fetch user wallets');
          setUserWallets([]);
        } else {
          setUserWallets(wallets);
        }

        // Fetch wallet transactions safely
        const { data: txData, error: txError, success: txSuccess } = 
          await supabaseSafeQueries.getWalletTransactions();

        if (!txSuccess) {
          console.error('Failed to fetch transactions:', txError);
          setError('Failed to fetch transactions');
          setTransactions([]);
        } else {
          setTransactions(txData);
        }

        // Fetch trading pairs safely (public data)
        const { data: pairs, error: pairsError, success: pairsSuccess } = 
          await supabaseSafeQueries.getTradingPairs();

        if (!pairsSuccess) {
          console.error('Failed to fetch trading pairs:', pairsError);
          setError('Failed to fetch trading pairs');
          setTradingPairs([]);
        } else {
          setTradingPairs(pairs);
        }

        console.log(`Successfully loaded ${wallets.length} wallets, ${txData.length} transactions, ${pairs.length} trading pairs`);

      } catch (err) {
        console.error('Exception in fetchData:', err);
        setError('An unexpected error occurred');
        setUserWallets([]);
        setTransactions([]);
        setTradingPairs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Example of safer data fetching function
  const handleRefreshData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Example of safer data fetching
      const { data, error, success } = await supabaseSafeQueries.getWalletTransactions();

      if (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to refresh transactions');
        return;
      }

      if (!success) {
        console.error('Failed to fetch transactions');
        setError('Failed to refresh transactions');
        return;
      }

      // Ensure array is always returned
      const safeData = data || [];
      setTransactions(safeData);
      
      console.log(`Successfully refreshed ${safeData.length} transactions`);

    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Example of safe insert
  const handleCreateTransaction = async () => {
    try {
      const transactionData = {
        user_id: 'example-user-id',
        type: 'deposit',
        amount: 100.00,
        currency: 'USDT',
        status: 'completed',
        description: 'Test transaction'
      };

      const { data, error, success } = await supabaseSafeQueries.safeInsert('transactions', transactionData);

      if (error) {
        console.error('Error creating transaction:', error);
        setError('Failed to create transaction');
        return;
      }

      if (!success) {
        console.error('Failed to create transaction');
        setError('Failed to create transaction');
        return;
      }

      // Ensure array is always returned
      const safeData = data || [];
      console.log(`Successfully created transaction:`, safeData[0]);

      // Refresh the transactions list
      await handleRefreshData();

    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
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
    <div>
      <h2>Safe Data Fetching Example</h2>
      
      <div>
        <h3>User Wallets ({userWallets.length})</h3>
        {userWallets.map(wallet => (
          <div key={wallet.user_id}>
            <p>Email: {wallet.email}</p>
            <p>Name: {wallet.full_name || 'N/A'}</p>
            <p>Balance: {wallet.account_balance || 0}</p>
          </div>
        ))}
      </div>

      <div>
        <h3>Transactions ({transactions.length})</h3>
        {transactions.map(transaction => (
          <div key={transaction.id}>
            <p>Type: {transaction.type}</p>
            <p>Amount: {transaction.amount}</p>
            <p>Status: {transaction.status}</p>
          </div>
        ))}
      </div>

      <div>
        <h3>Trading Pairs ({tradingPairs.length})</h3>
        {tradingPairs.map(pair => (
          <div key={pair.id}>
            <p>Symbol: {pair.symbol}</p>
            <p>Price: {pair.current_price}</p>
            <p>Change: {pair.price_change_24h}%</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleRefreshData} style={{ marginRight: '10px' }}>
          Refresh Data
        </button>
        <button onClick={handleCreateTransaction}>
          Create Test Transaction
        </button>
      </div>
    </div>
  );
};

// Example of a custom hook using safer patterns
export const useSafeDataFetching = <T>(
  fetchFunction: () => Promise<{ data: T[]; error: any; success: boolean }>
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: result, error: fetchError, success } = await fetchFunction();

        if (error) {
          console.error('Error in useSafeDataFetching:', fetchError);
          setError(fetchError);
          setData([]);
          return;
        }

        if (!success) {
          console.error('Failed to fetch data');
          setError('Failed to fetch data');
          setData([]);
          return;
        }

        // Ensure array is always returned
        const safeData = result || [];
        setData(safeData);

      } catch (err) {
        console.error('Exception in useSafeDataFetching:', err);
        setError(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchFunction]);

  return { data, loading, error };
};

// Example usage of the custom hook
export const UserWalletsList: React.FC = () => {
  const { data: wallets, loading, error } = useSafeDataFetching(
    () => supabaseSafeQueries.getAllUserWallets()
  );

  if (loading) return <div>Loading wallets...</div>;
  if (error) return <div>Error loading wallets: {error.message || error}</div>;

  return (
    <div>
      <h3>User Wallets ({wallets.length})</h3>
      {wallets.map(wallet => (
        <div key={wallet.user_id}>
          <p>Email: {wallet.email}</p>
          <p>Balance: {wallet.account_balance || 0}</p>
        </div>
      ))}
    </div>
  );
};

export default SafeDataFetchingExample;
