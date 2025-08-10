import { createClient } from '@supabase/supabase-js';

// Ensure proper Supabase client initialization
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!);

export interface SafeQueryResult<T> {
  data: T[];
  error: any;
  success: boolean;
}

export class SupabaseSafeQueries {
  /**
   * Get current authenticated user safely
   */
  private async getCurrentUser() {
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

  /**
   * Safer data fetching with proper error handling
   */
  async getAllUserWallets(): Promise<SafeQueryResult<any>> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user) {
        console.error('No authenticated user for getAllUserWallets');
        return { data: [], error: 'No authenticated user', success: false };
      }

      console.log('Fetching all user wallets...');

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, username, account_balance, funding_wallet, trading_wallet, created_at, updated_at')
        .eq('user_id', user.id); // Safer way to filter

      if (error) {
        console.error('Error fetching wallets:', error);
        return { data: [], error, success: false };
      }

      const wallets = data || []; // Ensure array is always returned
      console.log(`Successfully fetched ${wallets.length} user wallets`);
      
      return { data: wallets, error: null, success: true };

    } catch (err) {
      console.error('Unexpected error in getAllUserWallets:', err);
      return { data: [], error: err, success: false };
    }
  }

  /**
   * Get wallet transactions safely
   */
  async getWalletTransactions(): Promise<SafeQueryResult<any>> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user) {
        console.error('No authenticated user for getWalletTransactions');
        return { data: [], error: 'No authenticated user', success: false };
      }

      console.log('Fetching wallet transactions...');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching transactions:', error);
        return { data: [], error, success: false };
      }

      const transactions = data || []; // Ensure array is always returned
      console.log(`Successfully fetched ${transactions.length} wallet transactions`);
      
      return { data: transactions, error: null, success: true };

    } catch (err) {
      console.error('Unexpected error in getWalletTransactions:', err);
      return { data: [], error: err, success: false };
    }
  }

  /**
   * Get user profile safely
   */
  async getUserProfile(): Promise<SafeQueryResult<any>> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user) {
        console.error('No authenticated user for getUserProfile');
        return { data: [], error: 'No authenticated user', success: false };
      }

      console.log('Fetching user profile...');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return { data: [], error, success: false };
      }

      const profile = data ? [data] : []; // Convert single object to array for consistency
      console.log('Successfully fetched user profile');
      
      return { data: profile, error: null, success: true };

    } catch (err) {
      console.error('Unexpected error in getUserProfile:', err);
      return { data: [], error: err, success: false };
    }
  }

  /**
   * Get withdrawal requests safely
   */
  async getWithdrawalRequests(): Promise<SafeQueryResult<any>> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user) {
        console.error('No authenticated user for getWithdrawalRequests');
        return { data: [], error: 'No authenticated user', success: false };
      }

      console.log('Fetching withdrawal requests...');

      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching withdrawal requests:', error);
        return { data: [], error, success: false };
      }

      const withdrawals = data || []; // Ensure array is always returned
      console.log(`Successfully fetched ${withdrawals.length} withdrawal requests`);
      
      return { data: withdrawals, error: null, success: true };

    } catch (err) {
      console.error('Unexpected error in getWithdrawalRequests:', err);
      return { data: [], error: err, success: false };
    }
  }

  /**
   * Get trading pairs safely (public data)
   */
  async getTradingPairs(): Promise<SafeQueryResult<any>> {
    try {
      console.log('Fetching trading pairs...');

      const { data, error } = await supabase
        .from('trading_pairs')
        .select('*')
        .order('symbol', { ascending: true });

      if (error) {
        console.error('Error fetching trading pairs:', error);
        return { data: [], error, success: false };
      }

      const pairs = data || []; // Ensure array is always returned
      console.log(`Successfully fetched ${pairs.length} trading pairs`);
      
      return { data: pairs, error: null, success: true };

    } catch (err) {
      console.error('Unexpected error in getTradingPairs:', err);
      return { data: [], error: err, success: false };
    }
  }

  /**
   * Admin function: Get all profiles (admin only)
   */
  async getAllProfiles(): Promise<SafeQueryResult<any>> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user) {
        console.error('No authenticated user for getAllProfiles');
        return { data: [], error: 'No authenticated user', success: false };
      }

      console.log('Fetching all profiles (admin function)...');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all profiles:', error);
        return { data: [], error, success: false };
      }

      const profiles = data || []; // Ensure array is always returned
      console.log(`Successfully fetched ${profiles.length} profiles`);
      
      return { data: profiles, error: null, success: true };

    } catch (err) {
      console.error('Unexpected error in getAllProfiles:', err);
      return { data: [], error: err, success: false };
    }
  }

  /**
   * Admin function: Get all transactions (admin only)
   */
  async getAllTransactions(): Promise<SafeQueryResult<any>> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user) {
        console.error('No authenticated user for getAllTransactions');
        return { data: [], error: 'No authenticated user', success: false };
      }

      console.log('Fetching all transactions (admin function)...');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching all transactions:', error);
        return { data: [], error, success: false };
      }

      const transactions = data || []; // Ensure array is always returned
      console.log(`Successfully fetched ${transactions.length} transactions`);
      
      return { data: transactions, error: null, success: true };

    } catch (err) {
      console.error('Unexpected error in getAllTransactions:', err);
      return { data: [], error: err, success: false };
    }
  }

  /**
   * Insert data safely
   */
  async safeInsert<T>(tableName: string, data: any): Promise<SafeQueryResult<T>> {
    try {
      console.log(`Inserting into ${tableName}:`, data);

      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select();

      if (error) {
        console.error(`Error inserting into ${tableName}:`, error);
        return { data: [], error, success: false };
      }

      const insertedData = result || []; // Ensure array is always returned
      console.log(`Successfully inserted into ${tableName}`);
      
      return { data: insertedData, error: null, success: true };

    } catch (err) {
      console.error(`Unexpected error in safeInsert for ${tableName}:`, err);
      return { data: [], error: err, success: false };
    }
  }

  /**
   * Update data safely
   */
  async safeUpdate<T>(tableName: string, data: any, filters: Record<string, any>): Promise<SafeQueryResult<T>> {
    try {
      console.log(`Updating ${tableName} with filters:`, filters, 'data:', data);

      let query = supabase
        .from(tableName)
        .update(data);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data: result, error } = await query.select();

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        return { data: [], error, success: false };
      }

      const updatedData = result || []; // Ensure array is always returned
      console.log(`Successfully updated ${tableName}`);
      
      return { data: updatedData, error: null, success: true };

    } catch (err) {
      console.error(`Unexpected error in safeUpdate for ${tableName}:`, err);
      return { data: [], error: err, success: false };
    }
  }

  /**
   * Generic safe query method
   */
  async safeQuery<T>(
    tableName: string,
    selectFields: string = '*',
    filters?: Record<string, any>,
    options?: {
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      single?: boolean;
    }
  ): Promise<SafeQueryResult<T>> {
    try {
      console.log(`Querying ${tableName} with fields: ${selectFields}`);

      let query = supabase
        .from(tableName)
        .select(selectFields);

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? false
        });
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      // Execute query
      const { data, error } = await query;

      if (error) {
        console.error(`Error querying ${tableName}:`, error);
        return { data: [], error, success: false };
      }

      // Handle single vs multiple results
      let result = data;
      if (options?.single) {
        result = Array.isArray(data) ? (data.length > 0 ? [data[0]] : []) : (data ? [data] : []);
      } else {
        result = data || []; // Ensure array is always returned
      }

      console.log(`Successfully queried ${tableName}, returned ${result.length} records`);
      
      return { data: result as T[], error: null, success: true };

    } catch (err) {
      console.error(`Unexpected error in safeQuery for ${tableName}:`, err);
      return { data: [], error: err, success: false };
    }
  }
}

// Export singleton instance
export const supabaseSafeQueries = new SupabaseSafeQueries();
export default supabaseSafeQueries;
