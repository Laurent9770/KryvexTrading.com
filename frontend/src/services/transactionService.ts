import { createClient } from '@supabase/supabase-js';

// Supabase client initialization
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!, // Fixed: Use VITE_ prefix for Vite
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Transaction Types
interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'trade' | 'fee' | 'bonus';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  reference_id?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

// Transaction Filter Options
interface TransactionFilters {
  type?: 'deposit' | 'withdrawal' | 'transfer' | 'trade' | 'fee' | 'bonus';
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  currency?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Transaction Statistics
interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  byType: { [key: string]: number };
  byCurrency: { [key: string]: number };
}

// Transaction Service
export class TransactionService {
  // Get current authenticated user safely
  private static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Authentication error:', error);
        return null;
      }

      if (!user) {
        console.warn('No authenticated user found');
        return null;
      }

      return user;
    } catch (err) {
      console.error('Exception in getCurrentUser:', err);
      return null;
    }
  }

  // Get user's transactions with filters
  static async getTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for getTransactions');
        return [];
      }

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.currency) {
        query = query.eq('currency', filters.currency);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      // Ensure we always return an array
      return data || [];
    } catch (err) {
      console.error('Unexpected error in getTransactions:', err);
      return [];
    }
  }

  // Get a specific transaction by ID
  static async getTransactionById(transactionId: string): Promise<Transaction | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for getTransactionById');
        return null;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching transaction:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error in getTransactionById:', err);
      return null;
    }
  }

  // Get transactions by type
  static async getTransactionsByType(type: Transaction['type']): Promise<Transaction[]> {
    return this.getTransactions({ type });
  }

  // Get transactions by status
  static async getTransactionsByStatus(status: Transaction['status']): Promise<Transaction[]> {
    return this.getTransactions({ status });
  }

  // Get transactions by currency
  static async getTransactionsByCurrency(currency: string): Promise<Transaction[]> {
    return this.getTransactions({ currency });
  }

  // Get recent transactions (last 10)
  static async getRecentTransactions(): Promise<Transaction[]> {
    return this.getTransactions({ limit: 10 });
  }

  // Get transaction statistics
  static async getTransactionStats(): Promise<TransactionStats> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for getTransactionStats');
        return this.getEmptyStats();
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching transactions for stats:', error);
        return this.getEmptyStats();
      }

      const transactions = data || [];
      
      // Calculate statistics
      const stats: TransactionStats = {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0),
        pendingTransactions: transactions.filter(tx => tx.status === 'pending').length,
        completedTransactions: transactions.filter(tx => tx.status === 'completed').length,
        failedTransactions: transactions.filter(tx => tx.status === 'failed').length,
        byType: {},
        byCurrency: {}
      };

      // Group by type
      transactions.forEach(tx => {
        stats.byType[tx.type] = (stats.byType[tx.type] || 0) + 1;
      });

      // Group by currency
      transactions.forEach(tx => {
        stats.byCurrency[tx.currency] = (stats.byCurrency[tx.currency] || 0) + 1;
      });

      return stats;
    } catch (err) {
      console.error('Unexpected error in getTransactionStats:', err);
      return this.getEmptyStats();
    }
  }

  // Create a new transaction
  static async createTransaction(transactionData: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Transaction | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for createTransaction');
        return null;
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transactionData,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating transaction:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error in createTransaction:', err);
      return null;
    }
  }

  // Update transaction status
  static async updateTransactionStatus(transactionId: string, status: Transaction['status']): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for updateTransactionStatus');
        return false;
      }

      const { error } = await supabase
        .from('transactions')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating transaction status:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error in updateTransactionStatus:', err);
      return false;
    }
  }

  // Delete a transaction (soft delete by updating status to cancelled)
  static async deleteTransaction(transactionId: string): Promise<boolean> {
    return this.updateTransactionStatus(transactionId, 'cancelled');
  }

  // Get transactions within a date range
  static async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return this.getTransactions({ startDate, endDate });
  }

  // Search transactions by description
  static async searchTransactions(searchTerm: string): Promise<Transaction[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for searchTransactions');
        return [];
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .ilike('description', `%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching transactions:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error in searchTransactions:', err);
      return [];
    }
  }

  // Get empty stats object
  private static getEmptyStats(): TransactionStats {
    return {
      totalTransactions: 0,
      totalAmount: 0,
      pendingTransactions: 0,
      completedTransactions: 0,
      failedTransactions: 0,
      byType: {},
      byCurrency: {}
    };
  }
}

// Admin Service for transaction management
export class AdminTransactionService {
  // Get all transactions (admin-only)
  static async getAllTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
    try {
      // First, verify if the current user is an admin
      const user = await TransactionService.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for getAllTransactions');
        return [];
      }

      // Check if user is admin (you might need to implement this based on your user roles)
      // For now, we'll proceed with the assumption that this is called by an admin

      let query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.currency) {
        query = query.eq('currency', filters.currency);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all transactions:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error in getAllTransactions:', err);
      return [];
    }
  }

  // Get transactions for a specific user (admin-only)
  static async getUserTransactions(userId: string, filters: TransactionFilters = {}): Promise<Transaction[]> {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.currency) {
        query = query.eq('currency', filters.currency);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user transactions:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error in getUserTransactions:', err);
      return [];
    }
  }

  // Update any transaction (admin-only)
  static async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', transactionId);

      if (error) {
        console.error('Error updating transaction:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error in updateTransaction:', err);
      return false;
    }
  }
}

// Example Usage
export async function exampleUsage() {
  try {
    // Get all transactions
    const transactions = await TransactionService.getTransactions();
    console.log('All Transactions:', transactions);

    // Get recent transactions
    const recentTransactions = await TransactionService.getRecentTransactions();
    console.log('Recent Transactions:', recentTransactions);

    // Get transactions by type
    const deposits = await TransactionService.getTransactionsByType('deposit');
    console.log('Deposits:', deposits);

    // Get transaction statistics
    const stats = await TransactionService.getTransactionStats();
    console.log('Transaction Stats:', stats);

    // Create a new transaction
    const newTransaction = await TransactionService.createTransaction({
      type: 'deposit',
      amount: 100,
      currency: 'USDT',
      status: 'pending',
      description: 'Test deposit'
    });
    console.log('New Transaction:', newTransaction);

    // Search transactions
    const searchResults = await TransactionService.searchTransactions('deposit');
    console.log('Search Results:', searchResults);

    // Admin: Get all transactions
    const allTransactions = await AdminTransactionService.getAllTransactions();
    console.log('All Transactions (Admin):', allTransactions);

  } catch (error) {
    console.error('Error in example usage:', error);
  }
}

// Export individual functions for easier imports
export const {
  getTransactions,
  getTransactionById,
  getTransactionsByType,
  getTransactionsByStatus,
  getTransactionsByCurrency,
  getRecentTransactions,
  getTransactionStats,
  createTransaction,
  updateTransactionStatus,
  deleteTransaction,
  getTransactionsByDateRange,
  searchTransactions
} = TransactionService;

export const {
  getAllTransactions,
  getUserTransactions,
  updateTransaction
} = AdminTransactionService;

// Export types
export type { Transaction, TransactionFilters, TransactionStats };
