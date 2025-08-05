import websocketService from './websocketService';

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  type?: 'login' | 'logout' | 'trade' | 'deposit' | 'withdrawal' | 'profile_update' | 'kyc_update' | 'wallet_update' | 'admin_action';
}

export interface AdminNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  userId?: string;
  read?: boolean;
}

class UserActivityService {
  private activities: UserActivity[] = [];
  private notifications: AdminNotification[] = [];
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupWebSocketListeners();
    this.loadStoredData();
  }

  private setupWebSocketListeners() {
    // User activity events
    websocketService.on('user_activity', this.handleUserActivity.bind(this));
    websocketService.on('user_login', this.handleUserLogin.bind(this));
    websocketService.on('user_logout', this.handleUserLogout.bind(this));
    
    // Trading events
    websocketService.on('trade_completed', this.handleTradeUpdate.bind(this));
    websocketService.on('deposit_status_updated', this.handleDepositUpdate.bind(this));
    websocketService.on('withdrawal_status_updated', this.handleWithdrawalUpdate.bind(this));
    
    // Admin action events
    websocketService.on('admin_action', this.handleAdminAction.bind(this));
  }

  private loadStoredData() {
    try {
      const storedActivities = localStorage.getItem('user_activities');
      if (storedActivities) {
        this.activities = JSON.parse(storedActivities);
      }

      const storedNotifications = localStorage.getItem('admin_notifications');
      if (storedNotifications) {
        this.notifications = JSON.parse(storedNotifications);
      }
    } catch (error) {
      console.error('Error loading stored activity data:', error);
    }
  }

  private saveActivities() {
    try {
      localStorage.setItem('user_activities', JSON.stringify(this.activities));
    } catch (error) {
      console.error('Error saving activities:', error);
    }
  }

  private saveNotifications() {
    try {
      localStorage.setItem('admin_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private handleUserActivity(data: any) {
    const activity: UserActivity = {
      id: this.generateId(),
      userId: data.userId || 'unknown',
      userName: data.userName || 'Unknown User',
      action: data.action || 'Activity',
      details: data.details || 'User performed an action',
      timestamp: new Date().toISOString(),
      type: data.type || 'profile_update'
    };

    this.addActivity(activity);
    this.addNotification({
      id: this.generateId(),
      type: 'info',
      title: 'User Activity',
      message: `${activity.userName} ${activity.action}`,
      timestamp: activity.timestamp,
      userId: activity.userId
    });
  }

  private handleUserLogin(data: any) {
    const activity: UserActivity = {
      id: this.generateId(),
      userId: data.userId || 'unknown',
      userName: data.userName || 'Unknown User',
      action: 'logged in',
      details: `User logged in from ${data.ip || 'unknown location'}`,
      timestamp: new Date().toISOString(),
      type: 'login'
    };

    this.addActivity(activity);
    this.addNotification({
      id: this.generateId(),
      type: 'success',
      title: 'User Login',
      message: `${activity.userName} logged in`,
      timestamp: activity.timestamp,
      userId: activity.userId
    });
  }

  private handleUserLogout(data: any) {
    const activity: UserActivity = {
      id: this.generateId(),
      userId: data.userId || 'unknown',
      userName: data.userName || 'Unknown User',
      action: 'logged out',
      details: 'User logged out',
      timestamp: new Date().toISOString(),
      type: 'logout'
    };

    this.addActivity(activity);
    this.addNotification({
      id: this.generateId(),
      type: 'info',
      title: 'User Logout',
      message: `${activity.userName} logged out`,
      timestamp: activity.timestamp,
      userId: activity.userId
    });
  }

  private handleTradeUpdate(data: any) {
    const activity: UserActivity = {
      id: this.generateId(),
      userId: data.userId || 'unknown',
      userName: data.userName || 'Unknown User',
      action: 'completed a trade',
      details: `${data.symbol || 'Unknown'} - ${data.type || 'Unknown'} - $${data.amount || 0}`,
      timestamp: new Date().toISOString(),
      type: 'trade'
    };

    this.addActivity(activity);
    this.addNotification({
      id: this.generateId(),
      type: 'success',
      title: 'Trade Completed',
      message: `${activity.userName} completed a trade`,
      timestamp: activity.timestamp,
      userId: activity.userId
    });
  }

  private handleDepositUpdate(data: any) {
    const activity: UserActivity = {
      id: this.generateId(),
      userId: data.userId || 'unknown',
      userName: data.userName || 'Unknown User',
      action: 'deposit updated',
      details: `Deposit status: ${data.status || 'unknown'} - $${data.amount || 0}`,
      timestamp: new Date().toISOString(),
      type: 'deposit'
    };

    this.addActivity(activity);
    this.addNotification({
      id: this.generateId(),
      type: data.status === 'approved' ? 'success' : 'warning',
      title: 'Deposit Update',
      message: `${activity.userName}'s deposit ${data.status}`,
      timestamp: activity.timestamp,
      userId: activity.userId
    });
  }

  private handleWithdrawalUpdate(data: any) {
    const activity: UserActivity = {
      id: this.generateId(),
      userId: data.userId || 'unknown',
      userName: data.userName || 'Unknown User',
      action: 'withdrawal updated',
      details: `Withdrawal status: ${data.status || 'unknown'} - $${data.amount || 0}`,
      timestamp: new Date().toISOString(),
      type: 'withdrawal'
    };

    this.addActivity(activity);
    this.addNotification({
      id: this.generateId(),
      type: data.status === 'approved' ? 'success' : 'warning',
      title: 'Withdrawal Update',
      message: `${activity.userName}'s withdrawal ${data.status}`,
      timestamp: activity.timestamp,
      userId: activity.userId
    });
  }

  private handleAdminAction(data: any) {
    const activity: UserActivity = {
      id: this.generateId(),
      userId: data.adminId || 'unknown',
      userName: data.adminName || 'Admin',
      action: data.action || 'admin action',
      details: data.details || 'Admin performed an action',
      timestamp: new Date().toISOString(),
      type: 'admin_action'
    };

    this.addActivity(activity);
    this.addNotification({
      id: this.generateId(),
      type: 'info',
      title: 'Admin Action',
      message: `${activity.userName} ${activity.action}`,
      timestamp: activity.timestamp,
      userId: activity.userId
    });
  }

  public addActivity(activity: UserActivity) {
    this.activities.unshift(activity);
    
    // Keep only last 1000 activities
    if (this.activities.length > 1000) {
      this.activities = this.activities.slice(0, 1000);
    }

    this.saveActivities();
    this.notifyListeners('activity', activity);
  }

  public addNotification(notification: AdminNotification) {
    this.notifications.unshift(notification);
    
    // Keep only last 500 notifications
    if (this.notifications.length > 500) {
      this.notifications = this.notifications.slice(0, 500);
    }

    this.saveNotifications();
    this.notifyListeners('notification', notification);
  }

  public getActivities(limit: number = 50): UserActivity[] {
    return this.activities.slice(0, limit);
  }

  public getNotifications(limit: number = 20): AdminNotification[] {
    return this.notifications.slice(0, limit);
  }

  public getUnreadNotifications(): AdminNotification[] {
    return this.notifications.filter(n => !n.read);
  }

  public markNotificationAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners('notification_update', notification);
    }
  }

  public markAllNotificationsAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners('notifications_all_read');
  }

  public clearActivities() {
    this.activities = [];
    this.saveActivities();
    this.notifyListeners('activities_cleared');
  }

  public clearNotifications() {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners('notifications_cleared');
  }

  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in activity service listener:', error);
        }
      });
    }
  }

  public getActivityStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      totalActivities: this.activities.length,
      activitiesLastHour: this.activities.filter(a => new Date(a.timestamp) > oneHourAgo).length,
      activitiesLastDay: this.activities.filter(a => new Date(a.timestamp) > oneDayAgo).length,
      totalNotifications: this.notifications.length,
      unreadNotifications: this.getUnreadNotifications().length,
      recentActivityTypes: this.activities
        .slice(0, 100)
        .reduce((acc, activity) => {
          acc[activity.type || 'unknown'] = (acc[activity.type || 'unknown'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    };
  }

  public destroy() {
    // Clean up WebSocket listeners
    websocketService.off('user_activity', this.handleUserActivity.bind(this));
    websocketService.off('user_login', this.handleUserLogin.bind(this));
    websocketService.off('user_logout', this.handleUserLogout.bind(this));
    websocketService.off('trade_completed', this.handleTradeUpdate.bind(this));
    websocketService.off('deposit_status_updated', this.handleDepositUpdate.bind(this));
    websocketService.off('withdrawal_status_updated', this.handleWithdrawalUpdate.bind(this));
    websocketService.off('admin_action', this.handleAdminAction.bind(this));
    
    // Clear listeners
    this.listeners.clear();
  }
}

// Create singleton instance
export const userActivityService = new UserActivityService();

// Export for use in components
export default userActivityService; 