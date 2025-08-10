import React, { useState, useEffect } from 'react';
import supabaseQueryHelper from '../services/supabaseQueryHelper';
import supabaseWalletServiceUpdated from '../services/supabaseWalletServiceUpdated';

// Example component showing proper Supabase query patterns
const ExampleUsage: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check authentication first
        const { user, error: authError } = await supabaseQueryHelper.checkAuth();
        
        if (authError) {
          console.error('Authentication error:', authError);
          setError('Authentication failed');
          return;
        }

        if (!user) {
          console.error('No authenticated user');
          setError('No authenticated user');
          return;
        }

        // Fetch profiles using safe query pattern
        const { data: profileData, error: profileError, success: profileSuccess } = 
          await supabaseQueryHelper.getProfiles(user.id);

        if (!profileSuccess || profileError) {
          console.error('Error fetching profiles:', profileError);
          setError('Failed to fetch profiles');
          return;
        }

        // Handle potential undefined results
        const userProfiles = profileData || [];
        setProfiles(userProfiles);

        // Fetch transactions using safe query pattern
        const { data: transactionData, error: transactionError, success: transactionSuccess } = 
          await supabaseQueryHelper.getTransactions(user.id, 50);

        if (!transactionSuccess || transactionError) {
          console.error('Error fetching transactions:', transactionError);
          setError('Failed to fetch transactions');
          return;
        }

        // Handle potential undefined results
        const userTransactions = transactionData || [];
        setTransactions(userTransactions);

        console.log(`Successfully loaded ${userProfiles.length} profiles and ${userTransactions.length} transactions`);

      } catch (err) {
        console.error('Exception in fetchData:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Example of using the updated wallet service
  const handleWalletOperations = async () => {
    try {
      // Fetch wallet transactions
      const walletTransactions = await supabaseWalletServiceUpdated.getWalletTransactions();
      
      // Handle potential undefined results
      const transactions = walletTransactions || [];
      
      console.log(`Fetched ${transactions.length} wallet transactions`);

      // Example of getting user wallet
      const { user } = await supabaseQueryHelper.checkAuth();
      if (user) {
        const userWallet = await supabaseWalletServiceUpdated.getUserWallet(user.id);
        if (userWallet) {
          console.log('User wallet:', userWallet);
        }
      }

    } catch (error) {
      console.error('Error in wallet operations:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Example Usage - Safe Supabase Queries</h2>
      
      <div>
        <h3>Profiles ({profiles.length})</h3>
        {profiles.map(profile => (
          <div key={profile.id}>
            <p>Email: {profile.email}</p>
            <p>Name: {profile.full_name || 'N/A'}</p>
            <p>Balance: {profile.account_balance || 0}</p>
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

      <button onClick={handleWalletOperations}>
        Test Wallet Operations
      </button>
    </div>
  );
};

// Example of a custom hook using safe query patterns
export const useSafeSupabaseQuery = <T>(
  tableName: string,
  selectFields: string = '*',
  filters?: Record<string, any>,
  options?: {
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  }
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: result, error: queryError, success } = 
          await supabaseQueryHelper.safeQuery<T>(tableName, selectFields, filters, options);

        if (!success || queryError) {
          console.error(`Error querying ${tableName}:`, queryError);
          setError(queryError);
          return;
        }

        // Handle potential undefined results
        const safeData = result || [];
        setData(safeData);

      } catch (err) {
        console.error(`Exception in useSafeSupabaseQuery for ${tableName}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableName, selectFields, JSON.stringify(filters), JSON.stringify(options)]);

  return { data, loading, error };
};

// Example usage of the custom hook
export const ProfilesList: React.FC = () => {
  const { data: profiles, loading, error } = useSafeSupabaseQuery(
    'profiles',
    'user_id, email, full_name, account_balance',
    undefined,
    { orderBy: { column: 'created_at', ascending: false }, limit: 10 }
  );

  if (loading) return <div>Loading profiles...</div>;
  if (error) return <div>Error loading profiles: {error.message}</div>;

  return (
    <div>
      <h3>Profiles ({profiles.length})</h3>
      {profiles.map(profile => (
        <div key={profile.user_id}>
          <p>Email: {profile.email}</p>
          <p>Name: {profile.full_name || 'N/A'}</p>
          <p>Balance: {profile.account_balance || 0}</p>
        </div>
      ))}
    </div>
  );
};

export default ExampleUsage;
