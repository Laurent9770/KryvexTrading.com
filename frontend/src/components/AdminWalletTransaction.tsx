import React, { useState, useEffect } from 'react';
import adminWalletService, { 
  AdminWalletTransactionParams, 
  UserWalletBalance, 
  UserTransactionHistory 
} from '../services/adminWalletService';

interface AdminWalletTransactionProps {
  className?: string;
}

const AdminWalletTransaction: React.FC<AdminWalletTransactionProps> = ({ className = '' }) => {
  const [formData, setFormData] = useState<AdminWalletTransactionParams>({
    target_user_email: '',
    amount: 0,
    currency: 'USD',
    wallet_type: 'funding',
    description: '',
    admin_notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userBalance, setUserBalance] = useState<UserWalletBalance | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<UserTransactionHistory | null>(null);
  const [showUserInfo, setShowUserInfo] = useState(false);

  const currencies = ['USDT', 'USD', 'EUR', 'GBP', 'BTC', 'ETH'];
  const walletTypes = ['funding', 'trading'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = await adminWalletService.sendMoneyToUser(formData);
      setMessage({
        type: 'success',
        text: `Successfully sent $${result.amount.toFixed(2)} ${result.currency} to ${result.target_user_email}`
      });
      
      // Reset form
      setFormData({
        target_user_email: '',
        amount: 0,
        currency: 'USD',
        wallet_type: 'funding',
        description: '',
        admin_notes: ''
      });

      // Refresh user info if showing
      if (showUserInfo && formData.target_user_email) {
        await loadUserInfo(formData.target_user_email);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send money'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async (email: string) => {
    try {
      const [balance, history] = await Promise.all([
        adminWalletService.getUserWalletBalance(email),
        adminWalletService.getUserTransactionHistory(email, 10, 0)
      ]);
      setUserBalance(balance);
      setTransactionHistory(history);
      setShowUserInfo(true);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const handleCheckUser = async () => {
    if (!formData.target_user_email) {
      setMessage({ type: 'error', text: 'Please enter a user email' });
      return;
    }

    setLoading(true);
    try {
      await loadUserInfo(formData.target_user_email);
      setMessage({ type: 'success', text: 'User information loaded successfully' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load user information'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-gray-900 rounded-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-white mb-6">Admin Wallet Transaction</h2>
      
      {/* Transaction Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              User Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                name="target_user_email"
                value={formData.target_user_email}
                onChange={handleInputChange}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="user@example.com"
                required
              />
              <button
                type="button"
                onClick={handleCheckUser}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Check
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-300 mb-2">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Select currency"
            >
              {currencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="wallet_type" className="block text-sm font-medium text-gray-300 mb-2">
              Wallet Type
            </label>
            <select
              id="wallet_type"
              name="wallet_type"
              value={formData.wallet_type}
              onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Select wallet type"
            >
              {walletTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Transaction description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Admin Notes
          </label>
          <textarea
            name="admin_notes"
            value={formData.admin_notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Internal notes (optional)"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Processing...' : 'Send Money to User'}
        </button>
      </form>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-md mb-4 ${
          message.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* User Information */}
      {showUserInfo && userBalance && (
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-white mb-4">User Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-400 text-sm">Email</p>
              <p className="text-white">{userBalance.email}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Full Name</p>
              <p className="text-white">{userBalance.full_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Account Balance</p>
              <p className="text-white">${userBalance.account_balance.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total USD Balance</p>
              <p className="text-white">${userBalance.total_balance_usd.toFixed(2)}</p>
            </div>
          </div>

          {/* Wallet Details */}
          <div className="mb-4">
            <h4 className="text-md font-medium text-white mb-2">Wallet Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {userBalance.wallets.map((wallet, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded">
                  <p className="text-gray-400 text-sm">{wallet.wallet_type} ({wallet.asset})</p>
                  <p className="text-white font-medium">
                    ${wallet.balance.toFixed(2)} {wallet.asset}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          {transactionHistory && transactionHistory.transactions.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-white mb-2">Recent Transactions</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {transactionHistory.transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="bg-gray-700 p-2 rounded text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">{transaction.description}</span>
                      <span className={`font-medium ${
                        transaction.transaction_type === 'deposit' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.transaction_type === 'deposit' ? '+' : '-'}
                        ${transaction.amount.toFixed(2)} {transaction.currency}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {new Date(transaction.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminWalletTransaction;
