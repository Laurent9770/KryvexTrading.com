import supabase from '@/lib/supabaseClient';

export interface ActivityItem {
  id: string;
  userId: string;
  type: 'spot' | 'futures' | 'options' | 'binary' | 'quant' | 'bot' | 'staking' | 'wallet' | 'profile' | 'notification' | 'admin' | 'reset';
  action: string;
  description: string;
  amount?: string;
  symbol?: string;
  status: 'success' | 'error' | 'running' | 'pending' | 'completed';
  timestamp: Date;
  meta?: {
    tradeId?: string;
    botId?: string;
    poolId?: string;
    pnl?: string;
    duration?: string;
    strategy?: string;
    [key: string]: any;
  };
  icon: string;
  time: string;
}

class SupabaseActivityService {
  private static instance: SupabaseActivityService;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): SupabaseActivityService {
    if (!SupabaseActivityService.instance) {
      SupabaseActivityService.instance = new SupabaseActivityService();
    }
    return SupabaseActivityService.instance;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  // Add new activity for a user
  async addActivity(userId: string, activity: Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'>): Promise<ActivityItem> {
    try {
      const newActivity = {
        user_id: userId,
        type: activity.type,
        action: activity.action,
        description: activity.description,
        amount: activity.amount,
        symbol: activity.symbol,
        status: activity.status,
        meta: activity.meta,
        icon: activity.icon
      };

      const { data, error } = await supabase
        .from('user_activities')
        .insert(newActivity)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        type: data.type,
        action: data.action,
        description: data.description,
        amount: data.amount,
        symbol: data.symbol,
        status: data.status,
        meta: data.meta,
        icon: data.icon,
        timestamp: new Date(data.created_at),
        time: this.getRelativeTime(new Date(data.created_at))
      };
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  }

  // Get activities for a user
  async getUserActivities(userId: string, limit: number = 20): Promise<ActivityItem[]> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data.map(activity => ({
        id: activity.id,
        userId: activity.user_id,
        type: activity.type,
        action: activity.action,
        description: activity.description,
        amount: activity.amount,
        symbol: activity.symbol,
        status: activity.status,
        meta: activity.meta,
        icon: activity.icon,
        timestamp: new Date(activity.created_at),
        time: this.getRelativeTime(new Date(activity.created_at))
      }));
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
  }

  // Get activities by type
  async getActivitiesByType(userId: string, type: ActivityItem['type'], limit: number = 20): Promise<ActivityItem[]> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data.map(activity => ({
        id: activity.id,
        userId: activity.user_id,
        type: activity.type,
        action: activity.action,
        description: activity.description,
        amount: activity.amount,
        symbol: activity.symbol,
        status: activity.status,
        meta: activity.meta,
        icon: activity.icon,
        timestamp: new Date(activity.created_at),
        time: this.getRelativeTime(new Date(activity.created_at))
      }));
    } catch (error) {
      console.error('Error fetching activities by type:', error);
      return [];
    }
  }

  // Clear activities for a user
  async clearUserActivities(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_activities')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error clearing user activities:', error);
      throw error;
    }
  }

  // Real-time subscription for activities
  subscribeToActivities(callback: (activity: ActivityItem) => void) {
    if (!this.userId) return null;

    const subscription = supabase
      .channel(`activities:${this.userId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'user_activities',
          filter: `user_id=eq.${this.userId}`
        }, 
        (payload) => {
          const activity = payload.new as any;
          callback({
            id: activity.id,
            userId: activity.user_id,
            type: activity.type,
            action: activity.action,
            description: activity.description,
            amount: activity.amount,
            symbol: activity.symbol,
            status: activity.status,
            meta: activity.meta,
            icon: activity.icon,
            timestamp: new Date(activity.created_at),
            time: this.getRelativeTime(new Date(activity.created_at))
          });
        }
      )
      .subscribe();

    return subscription;
  }

  // Helper methods for creating specific activity types
  static createSpotTradeActivity(
    userId: string,
    action: 'buy' | 'sell',
    symbol: string,
    amount: string,
    pnl?: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    return {
      type: 'spot',
      action: `${action.toUpperCase()} SPOT`,
      description: `${action.toUpperCase()} ${amount} ${symbol}`,
      symbol,
      amount,
      status: 'completed',
      icon: action === 'buy' ? '📈' : '📉',
      meta: { pnl }
    };
  }

  static createFuturesTradeActivity(
    userId: string,
    action: 'open' | 'close' | 'tp_hit' | 'sl_hit',
    symbol: string,
    amount: string,
    pnl?: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    return {
      type: 'futures',
      action: `${action.toUpperCase()} FUTURES`,
      description: `${action.toUpperCase()} ${amount} ${symbol}`,
      symbol,
      amount,
      status: 'completed',
      icon: '⚡',
      meta: { pnl }
    };
  }

  static createWalletActivity(
    userId: string,
    action: 'deposit' | 'withdrawal' | 'transfer',
    amount: string,
    from?: string,
    to?: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    return {
      type: 'wallet',
      action: `${action.toUpperCase()}`,
      description: `${action.toUpperCase()} ${amount} USDT`,
      amount,
      status: 'completed',
      icon: '💰',
      meta: { from, to }
    };
  }

  static createProfileActivity(
    userId: string,
    action: 'kyc_verified' | 'password_changed' | 'profile_updated',
    description: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    return {
      type: 'profile',
      action: action.toUpperCase().replace('_', ' '),
      description,
      status: 'completed',
      icon: '👤'
    };
  }

  // Get relative time string
  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  }

  // Cleanup
  cleanup() {
    // Unsubscribe from all channels
    supabase.removeAllChannels();
  }
}

const supabaseActivityService = SupabaseActivityService.getInstance();
export default supabaseActivityService; 