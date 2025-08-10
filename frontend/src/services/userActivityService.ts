interface UserActivity {
  id: string;
  userId: string;
  userName?: string;
  action?: string;
  activityType?: string;
  description?: string;
  details?: string;
  timestamp: string;
  metadata?: any;
}

interface UserNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  userId?: string;
  timestamp: string;
  read: boolean;
}

class UserActivityService {
  private activities: UserActivity[] = [];
  private notifications: UserNotification[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      this.activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
      this.notifications = JSON.parse(localStorage.getItem('user_notifications') || '[]');
    } catch (error) {
      console.warn('Error loading activity data from localStorage:', error);
      this.activities = [];
      this.notifications = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('user_activities', JSON.stringify(this.activities));
      localStorage.setItem('user_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.warn('Error saving activity data to localStorage:', error);
    }
  }

  getActivities(): UserActivity[] {
    return this.activities.slice(-100); // Return last 100 activities
  }

  getNotifications(): UserNotification[] {
    return this.notifications.slice(-50); // Return last 50 notifications
  }

  addActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>): void {
    const newActivity: UserActivity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    this.activities.push(newActivity);
    this.saveToStorage();
  }

  addNotification(notification: Omit<UserNotification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: UserNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    this.notifications.push(newNotification);
    this.saveToStorage();
  }

  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
    }
  }

  clearOldActivities(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    this.activities = this.activities.filter(activity => 
      new Date(activity.timestamp) > cutoffDate
    );
    this.saveToStorage();
  }

  clearOldNotifications(daysToKeep: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    this.notifications = this.notifications.filter(notification => 
      new Date(notification.timestamp) > cutoffDate
    );
    this.saveToStorage();
  }
}

const userActivityService = new UserActivityService();
export default userActivityService;
