import React, { useState, useEffect } from 'react';
import { 
  getWalletTransactions, 
  getUserProfile, 
  getWithdrawals, 
  getUserRole, 
  getTradingPairs,
  getWithdrawalStats,
  getWalletBalanceSummary,
  getAllUsers,
  getAllTransactions
} from '../services/walletService';

const WalletServiceExample: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [tradingPairs, setTradingPairs] = useState<any[]>([]);
  const [withdrawalStats, setWithdrawalStats] = useState<any>(null);
  const [balanceSummary, setBalanceSummary] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [
          transactionsData,
          profileData,
          withdrawalsData,
          userRoleData,
          tradingPairsData,
          withdrawalStatsData,
          balanceSummaryData
        ] = await Promise.all([
          getWalletTransactions(),
          getUserProfile(),
          getWithdrawals(),
          getUserRole(),
          getTradingPairs(),
          getWithdrawalStats(),
          getWalletBalanceSummary()
        ]);

        // Set state with safe data
        setTransactions(transactionsData || []);
        setProfile(profileData);
        setWithdrawals(withdrawalsData || []);
        setUserRole(userRoleData);
        setTradingPairs(tradingPairsData || []);
        setWithdrawalStats(withdrawalStatsData);
        setBalanceSummary(balanceSummaryData);

        // If user is admin, fetch admin data
        if (userRoleData === 'admin') {
          const [allUsersData, allTransactionsData] = await Promise.all([
            getAllUsers(),
            getAllTransactions()
          ]);
          setAllUsers(allUsersData || []);
          setAllTransactions(allTransactionsData || []);
        }

        console.log('Successfully loaded all wallet data');

      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError('Failed to fetch wallet data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading wallet data...</div>;
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
      <h2>Wallet Service Example</h2>
      
      {/* User Profile */}
      <div style={{ marginBottom: '20px' }}>
        <h3>User Profile</h3>
        {profile ? (
          <div>
            <p>Email: {profile.email}</p>
            <p>Name: {profile.full_name}</p>
            <p>Username: {profile.username}</p>
            <p>Account Balance: {profile.account_balance || 0}</p>
          </div>
        ) : (
          <p>No profile data available</p>
        )}
      </div>

      {/* Wallet Balance Summary */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Wallet Balance Summary</h3>
        {balanceSummary ? (
          <div>
            <p>Account Balance: {balanceSummary.accountBalance}</p>
            <p>Funding Wallet: {JSON.stringify(balanceSummary.fundingWallet)}</p>
            <p>Trading Wallet: {JSON.stringify(balanceSummary.tradingWallet)}</p>
          </div>
        ) : (
          <p>No balance data available</p>
        )}
      </div>

      {/* Transactions */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Wallet Transactions ({transactions.length})</h3>
        {transactions.length > 0 ? (
          <div>
            {transactions.slice(0, 5).map(transaction => (
              <div key={transaction.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px 0' }}>
                <p>Action: {transaction.action}</p>
                <p>Amount: {transaction.amount} {transaction.asset}</p>
                <p>Status: {transaction.status}</p>
                <p>Date: {new Date(transaction.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No transactions found</p>
        )}
      </div>

      {/* Withdrawals */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Withdrawals ({withdrawals.length})</h3>
        {withdrawals.length > 0 ? (
          <div>
            {withdrawals.slice(0, 5).map(withdrawal => (
              <div key={withdrawal.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px 0' }}>
                <p>Amount: {withdrawal.amount} {withdrawal.currency}</p>
                <p>Status: {withdrawal.status}</p>
                <p>Date: {new Date(withdrawal.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No withdrawals found</p>
        )}
      </div>

      {/* Withdrawal Stats */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Withdrawal Statistics</h3>
        {withdrawalStats ? (
          <div>
            <p>Total Withdrawals: {withdrawalStats.totalWithdrawals}</p>
            <p>Total Amount: {withdrawalStats.totalAmount}</p>
            <p>Pending: {withdrawalStats.pendingWithdrawals}</p>
            <p>Completed: {withdrawalStats.completedWithdrawals}</p>
          </div>
        ) : (
          <p>No withdrawal stats available</p>
        )}
      </div>

      {/* Trading Pairs */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Trading Pairs ({tradingPairs.length})</h3>
        {tradingPairs.length > 0 ? (
          <div>
            {tradingPairs.slice(0, 5).map(pair => (
              <div key={pair.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px 0' }}>
                <p>Symbol: {pair.symbol}</p>
                <p>Price: {pair.current_price}</p>
                <p>Change: {pair.price_change_24h}%</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No trading pairs found</p>
        )}
      </div>

      {/* User Role */}
      <div style={{ marginBottom: '20px' }}>
        <h3>User Role</h3>
        <p>Role: {userRole || 'No role assigned'}</p>
      </div>

      {/* Admin Data (only shown if user is admin) */}
      {userRole === 'admin' && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <h3>All Users (Admin Only) ({allUsers.length})</h3>
            {allUsers.length > 0 ? (
              <div>
                {allUsers.slice(0, 5).map(user => (
                  <div key={user.user_id} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px 0' }}>
                    <p>Email: {user.email}</p>
                    <p>Name: {user.full_name}</p>
                    <p>Username: {user.username}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No users found</p>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>All Transactions (Admin Only) ({allTransactions.length})</h3>
            {allTransactions.length > 0 ? (
              <div>
                {allTransactions.slice(0, 5).map(transaction => (
                  <div key={transaction.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px 0' }}>
                    <p>User ID: {transaction.user_id}</p>
                    <p>Action: {transaction.action}</p>
                    <p>Amount: {transaction.amount} {transaction.asset}</p>
                    <p>Status: {transaction.status}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No transactions found</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default WalletServiceExample;
