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

class ActivityService {
  private static instance: ActivityService;
  private activities: Map<string, ActivityItem[]> = new Map();
  private readonly MAX_ACTIVITIES = 20;

  private constructor() {}

  static getInstance(): ActivityService {
    if (!ActivityService.instance) {
      ActivityService.instance = new ActivityService();
    }
    return ActivityService.instance;
  }

  // Add new activity for a user
  addActivity(userId: string, activity: Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'>): ActivityItem {
    const userActivities = this.activities.get(userId) || [];
    
    const newActivity: ActivityItem = {
      ...activity,
      id: this.generateId(),
      userId,
      timestamp: new Date(),
      time: this.getRelativeTime(new Date())
    };

    // Add to beginning of array
    userActivities.unshift(newActivity);

    // Keep only the latest MAX_ACTIVITIES
    if (userActivities.length > this.MAX_ACTIVITIES) {
      userActivities.splice(this.MAX_ACTIVITIES);
    }

    this.activities.set(userId, userActivities);
    return newActivity;
  }

  // Get activities for a user
  getUserActivities(userId: string): ActivityItem[] {
    return this.activities.get(userId) || [];
  }

  // Get activities by type
  getActivitiesByType(userId: string, type: ActivityItem['type']): ActivityItem[] {
    const userActivities = this.getUserActivities(userId);
    return userActivities.filter(activity => activity.type === type);
  }

  // Clear activities for a user
  clearUserActivities(userId: string): void {
    this.activities.delete(userId);
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

  // Activity type helpers
  static createSpotTradeActivity(
    userId: string,
    action: 'buy' | 'sell',
    symbol: string,
    amount: string,
    pnl?: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    return {
      type: 'spot',
      action: `${action.toUpperCase()}_SPOT`,
      description: `${action === 'buy' ? 'Bought' : 'Sold'} ${amount} ${symbol}`,
      amount,
      symbol,
      status: 'completed',
      meta: { pnl },
      icon: '📈'
    };
  }

  static createFuturesTradeActivity(
    userId: string,
    action: 'open' | 'close' | 'tp_hit' | 'sl_hit',
    symbol: string,
    amount: string,
    pnl?: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    const actionMap = {
      open: 'OPEN_FUTURES',
      close: 'CLOSE_FUTURES',
      tp_hit: 'TAKE_PROFIT_HIT',
      sl_hit: 'STOP_LOSS_HIT'
    };

    return {
      type: 'futures',
      action: actionMap[action],
      description: `${action === 'open' ? 'Opened' : action === 'close' ? 'Closed' : action === 'tp_hit' ? 'Take Profit hit for' : 'Stop Loss hit for'} ${amount} ${symbol}`,
      amount,
      symbol,
      status: 'completed',
      meta: { pnl },
      icon: '📊'
    };
  }

  static createOptionsTradeActivity(
    userId: string,
    strategy: string,
    symbol: string,
    amount: string,
    pnl?: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    return {
      type: 'options',
      action: 'OPTIONS_TRADE',
      description: `${strategy} strategy executed on ${symbol}`,
      amount,
      symbol,
      status: 'completed',
      meta: { strategy, pnl },
      icon: '🎯'
    };
  }

  static createBinaryTradeActivity(
    userId: string,
    direction: 'up' | 'down',
    symbol: string,
    amount: string,
    pnl?: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    return {
      type: 'binary',
      action: 'BINARY_TRADE',
      description: `Binary ${direction} trade on ${symbol}`,
      amount,
      symbol,
      status: 'completed',
      meta: { direction, pnl },
      icon: '🎲'
    };
  }

  static createQuantTradeActivity(
    userId: string,
    strategy: string,
    symbol: string,
    amount: string,
    pnl?: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    return {
      type: 'quant',
      action: 'QUANT_STRATEGY',
      description: `${strategy} quant strategy on ${symbol}`,
      amount,
      symbol,
      status: 'completed',
      meta: { strategy, pnl },
      icon: '🧮'
    };
  }

  static createBotActivity(
    userId: string,
    action: 'start' | 'pause' | 'stop' | 'completed',
    botName: string,
    amount?: string,
    pnl?: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    const actionMap = {
      start: 'BOT_STARTED',
      pause: 'BOT_PAUSED',
      stop: 'BOT_STOPPED',
      completed: 'BOT_COMPLETED'
    };

    return {
      type: 'bot',
      action: actionMap[action],
      description: `Trading bot "${botName}" ${action}`,
      amount,
      status: action === 'completed' ? 'completed' : 'running',
      meta: { botName, pnl },
      icon: '🤖'
    };
  }

  static createStakingActivity(
    userId: string,
    action: 'stake' | 'unstake' | 'claim' | 'maturity',
    poolName: string,
    amount: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    const actionMap = {
      stake: 'STAKE_TOKENS',
      unstake: 'UNSTAKE_TOKENS',
      claim: 'CLAIM_REWARDS',
      maturity: 'STAKE_MATURITY'
    };

    return {
      type: 'staking',
      action: actionMap[action],
      description: `${action === 'stake' ? 'Staked' : action === 'unstake' ? 'Unstaked' : action === 'claim' ? 'Claimed rewards from' : 'Stake matured for'} ${poolName}`,
      amount,
      status: 'completed',
      meta: { poolName },
      icon: '🔒'
    };
  }

  static createWalletActivity(
    userId: string,
    action: 'deposit' | 'withdrawal' | 'transfer',
    amount: string,
    from?: string,
    to?: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    const actionMap = {
      deposit: 'DEPOSIT',
      withdrawal: 'WITHDRAWAL',
      transfer: 'TRANSFER'
    };

    return {
      type: 'wallet',
      action: actionMap[action],
      description: `${action === 'deposit' ? 'Deposited' : action === 'withdrawal' ? 'Withdrew' : 'Transferred'} ${amount}`,
      amount,
      status: 'completed',
      meta: { from, to },
      icon: '💰'
    };
  }

  static createProfileActivity(
    userId: string,
    action: 'kyc_verified' | 'password_changed' | 'profile_updated',
    description: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    const actionMap = {
      kyc_verified: 'KYC_VERIFIED',
      password_changed: 'PASSWORD_CHANGED',
      profile_updated: 'PROFILE_UPDATED'
    };

    return {
      type: 'profile',
      action: actionMap[action],
      description,
      status: 'completed',
      icon: '👤'
    };
  }

  static createNotificationActivity(
    userId: string,
    type: string,
    message: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    return {
      type: 'notification',
      action: 'NOTIFICATION',
      description: message,
      status: 'completed',
      meta: { notificationType: type },
      icon: '🔔'
    };
  }

  static createAdminActivity(
    userId: string,
    action: 'trade_overridden' | 'rewards_sent' | 'account_reset',
    description: string,
    amount?: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    const actionMap = {
      trade_overridden: 'ADMIN_TRADE_OVERRIDE',
      rewards_sent: 'ADMIN_REWARDS',
      account_reset: 'ACCOUNT_RESET'
    };

    return {
      type: 'admin',
      action: actionMap[action],
      description,
      amount,
      status: 'completed',
      icon: '⚙️'
    };
  }

  static createResetActivity(
    userId: string,
    amount: string
  ): Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'> {
    return {
      type: 'reset',
      action: 'ACCOUNT_RESET',
      description: `Reset to ${amount} USDT`,
      amount,
      status: 'completed',
      icon: '🔄'
    };
  }
}

export const activityService = ActivityService.getInstance();
export default activityService; 