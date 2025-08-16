import supabase from './supabaseClient';
import logger from '@/utils/logger';

// =============================================
// SUPABASE REALTIME CONFIGURATION
// =============================================

interface RealtimeConfig {
  enabled: boolean;
  reconnectAttempts: number;
  reconnectDelay: number;
  maxReconnectDelay: number;
}

const defaultConfig: RealtimeConfig = {
  enabled: true,
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
};

class SupabaseRealtimeManager {
  private config: RealtimeConfig;
  private subscriptions: Map<string, any> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectCount = 0;

  constructor(config: Partial<RealtimeConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Subscribe to table changes with automatic reconnection
  subscribeToTable(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: any) => void,
    filter?: string
  ) {
    if (!this.config.enabled) {
      logger.warn(`Realtime disabled, skipping subscription to ${table}`);
      return null;
    }

    const subscriptionKey = `${table}:${event}:${filter || 'all'}`;
    
    try {
      let query = supabase
        .channel(subscriptionKey)
        .on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table,
            filter,
          },
          callback
        );

      // Add error handling and reconnection logic
      query = query.on('error', (error) => {
        logger.error(`Realtime subscription error for ${table}:`, error);
        this.handleReconnection(subscriptionKey, table, event, callback, filter);
      });

      const subscription = query.subscribe((status) => {
        logger.debug(`Realtime subscription status for ${table}:`, status);
        
        if (status === 'SUBSCRIBED') {
          this.reconnectCount = 0; // Reset reconnect count on successful connection
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.handleReconnection(subscriptionKey, table, event, callback, filter);
        }
      });

      this.subscriptions.set(subscriptionKey, subscription);
      logger.success(`Subscribed to ${table} ${event} events`);
      
      return subscription;
    } catch (error) {
      logger.error(`Failed to subscribe to ${table}:`, error);
      return null;
    }
  }

  // Handle automatic reconnection
  private handleReconnection(
    subscriptionKey: string,
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: any) => void,
    filter?: string
  ) {
    if (this.reconnectCount >= this.config.reconnectAttempts) {
      logger.error(`Max reconnection attempts reached for ${table}`);
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectCount),
      this.config.maxReconnectDelay
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectCount++;
      logger.warn(`Attempting to reconnect to ${table} (attempt ${this.reconnectCount})`);
      
      // Remove old subscription
      this.unsubscribe(subscriptionKey);
      
      // Create new subscription
      this.subscribeToTable(table, event, callback, filter);
    }, delay);
  }

  // Unsubscribe from a specific subscription
  unsubscribe(subscriptionKey: string) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      try {
        supabase.removeChannel(subscription);
        this.subscriptions.delete(subscriptionKey);
        logger.success(`Unsubscribed from ${subscriptionKey}`);
      } catch (error) {
        logger.error(`Error unsubscribing from ${subscriptionKey}:`, error);
      }
    }
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll() {
    this.subscriptions.forEach((subscription, key) => {
      try {
        supabase.removeChannel(subscription);
        logger.success(`Unsubscribed from ${key}`);
      } catch (error) {
        logger.error(`Error unsubscribing from ${key}:`, error);
      }
    });
    
    this.subscriptions.clear();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.reconnectCount = 0;
  }

  // Get subscription status
  getSubscriptionStatus(subscriptionKey: string) {
    return this.subscriptions.has(subscriptionKey);
  }

  // Get all active subscriptions
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }
}

// Create singleton instance
const realtimeManager = new SupabaseRealtimeManager();

export default realtimeManager;

// Convenience functions for common subscriptions
export const subscribeToWalletUpdates = (userId: string, callback: (payload: any) => void) => {
  return realtimeManager.subscribeToTable(
    'user_wallets',
    '*',
    callback,
    `user_id=eq.${userId}`
  );
};

export const subscribeToTransactions = (userId: string, callback: (payload: any) => void) => {
  return realtimeManager.subscribeToTable(
    'wallet_transactions',
    '*',
    callback,
    `user_id=eq.${userId}`
  );
};

export const subscribeToAdminActions = (callback: (payload: any) => void) => {
  return realtimeManager.subscribeToTable(
    'admin_actions',
    '*',
    callback
  );
};
