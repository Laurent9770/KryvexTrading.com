import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Ensure proper Supabase client initialization
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL!, process.env.REACT_APP_SUPABASE_ANON_KEY!);

export interface QueryResult<T> {
  data: T[] | null;
  error: any;
  success: boolean;
}

export class SupabaseQueryHelper {
  private client: SupabaseClient;

  constructor() {
    this.client = supabase;
  }

  /**
   * Safe query method with proper error handling
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
  ): Promise<QueryResult<T>> {
    try {
      console.log(`Querying ${tableName} with fields: ${selectFields}`);
      
      let query = this.client
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
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        return {
          data: null,
          error,
          success: false
        };
      }

      // Handle single vs multiple results
      const result = options?.single ? (Array.isArray(data) ? data[0] : data) : data;
      
      console.log(`Successfully queried ${tableName}, returned ${Array.isArray(result) ? result.length : 1} records`);
      
      return {
        data: result as T[],
        error: null,
        success: true
      };

    } catch (exception) {
      console.error(`Exception in safeQuery for ${tableName}:`, exception);
      return {
        data: null,
        error: exception,
        success: false
      };
    }
  }

  /**
   * Query profiles with safe defaults
   */
  async getProfiles(userId?: string): Promise<QueryResult<any>> {
    const filters = userId ? { user_id: userId } : undefined;
    return this.safeQuery('profiles', 'user_id, email, full_name, username, account_balance, kyc_status, account_status, funding_wallet, trading_wallet, created_at, updated_at', filters);
  }

  /**
   * Query transactions with safe defaults
   */
  async getTransactions(userId?: string, limit: number = 100): Promise<QueryResult<any>> {
    const filters = userId ? { user_id: userId } : undefined;
    return this.safeQuery('transactions', '*', filters, {
      orderBy: { column: 'created_at', ascending: false },
      limit
    });
  }

  /**
   * Query wallet transactions with safe defaults
   */
  async getWalletTransactions(userId?: string, limit: number = 100): Promise<QueryResult<any>> {
    const filters = userId ? { user_id: userId } : undefined;
    return this.safeQuery('wallet_transactions', '*', filters, {
      orderBy: { column: 'created_at', ascending: false },
      limit
    });
  }

  /**
   * Query withdrawals with safe defaults
   */
  async getWithdrawals(userId?: string, limit: number = 100): Promise<QueryResult<any>> {
    const filters = userId ? { user_id: userId } : undefined;
    return this.safeQuery('withdrawals', '*', filters, {
      orderBy: { column: 'created_at', ascending: false },
      limit
    });
  }

  /**
   * Query trading pairs
   */
  async getTradingPairs(): Promise<QueryResult<any>> {
    return this.safeQuery('trading_pairs', '*', undefined, {
      orderBy: { column: 'symbol', ascending: true }
    });
  }

  /**
   * Insert data with error handling
   */
  async safeInsert<T>(tableName: string, data: any): Promise<QueryResult<T>> {
    try {
      console.log(`Inserting into ${tableName}:`, data);
      
      const { data: result, error } = await this.client
        .from(tableName)
        .insert(data)
        .select();

      if (error) {
        console.error(`Error inserting into ${tableName}:`, error);
        return {
          data: null,
          error,
          success: false
        };
      }

      console.log(`Successfully inserted into ${tableName}`);
      return {
        data: result as T[],
        error: null,
        success: true
      };

    } catch (exception) {
      console.error(`Exception in safeInsert for ${tableName}:`, exception);
      return {
        data: null,
        error: exception,
        success: false
      };
    }
  }

  /**
   * Update data with error handling
   */
  async safeUpdate<T>(tableName: string, data: any, filters: Record<string, any>): Promise<QueryResult<T>> {
    try {
      console.log(`Updating ${tableName} with filters:`, filters, 'data:', data);
      
      let query = this.client
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
        return {
          data: null,
          error,
          success: false
        };
      }

      console.log(`Successfully updated ${tableName}`);
      return {
        data: result as T[],
        error: null,
        success: true
      };

    } catch (exception) {
      console.error(`Exception in safeUpdate for ${tableName}:`, exception);
      return {
        data: null,
        error: exception,
        success: false
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  async checkAuth(): Promise<{ user: any; error: any }> {
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      
      if (error) {
        console.error('Authentication error:', error);
        return { user: null, error };
      }

      if (!user) {
        console.warn('No authenticated user found');
        return { user: null, error: 'No authenticated user' };
      }

      console.log('User authenticated:', user.id);
      return { user, error: null };

    } catch (exception) {
      console.error('Exception in checkAuth:', exception);
      return { user: null, error: exception };
    }
  }
}

// Export singleton instance
export const supabaseQueryHelper = new SupabaseQueryHelper();
export default supabaseQueryHelper;
