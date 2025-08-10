import supabase from '@/lib/supabaseClient'
import { Notification, NotificationInsert, NotificationUpdate } from '@/integrations/supabase/types'

interface AdminNotification {
  id: string
  admin_id: string
  target_user_id: string | null
  title: string
  message: string
  notification_type: 'info' | 'warning' | 'success' | 'error'
  is_broadcast: boolean
  is_read: boolean
  created_at: string
  target_user?: {
    full_name: string
    email: string
  }
}

class SupabaseNotificationService {
  private userId: string | null = null

  setUserId(userId: string) {
    this.userId = userId
  }

  async getMyNotifications(): Promise<Notification[]> {
    if (!this.userId) throw new Error('User ID not set')

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw error
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  async markAllAsRead(): Promise<void> {
    if (!this.userId) throw new Error('User ID not set')

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', this.userId)
        .eq('is_read', false)

      if (error) throw error
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }

  async getUnreadCount(): Promise<number> {
    if (!this.userId) throw new Error('User ID not set')

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  // Admin methods
  async getAdminNotifications(adminId: string): Promise<AdminNotification[]> {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select(`
          *,
          target_user:profiles!admin_notifications_target_user_id_fkey(full_name, email)
        `)
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching admin notifications:', error)
      throw error
    }
  }

  async createAdminNotification(
    adminId: string,
    title: string,
    message: string,
    notificationType: 'info' | 'warning' | 'success' | 'error' = 'info',
    targetUserId?: string,
    isBroadcast: boolean = false
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .insert({
          admin_id: adminId,
          target_user_id: targetUserId,
          title,
          message,
          notification_type: notificationType,
          is_broadcast: isBroadcast,
          is_read: false
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating admin notification:', error)
      throw error
    }
  }

  async markAdminNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Error marking admin notification as read:', error)
      throw error
    }
  }

  async broadcastNotification(
    adminId: string,
    title: string,
    message: string,
    notificationType: 'info' | 'warning' | 'success' | 'error' = 'info'
  ): Promise<any> {
    try {
      // Create broadcast notification for admin
      const adminNotification = await this.createAdminNotification(
        adminId,
        title,
        message,
        notificationType,
        undefined,
        true
      )

      // Create notifications for all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('user_id')

      if (usersError) throw usersError

      if (users && users.length > 0) {
        const userNotifications = users.map(user => ({
          user_id: user.user_id,
          title,
          message,
          type: notificationType,
          is_read: false,
          created_by: adminId
        }))

        const { error: insertError } = await supabase
          .from('notifications')
          .insert(userNotifications)

        if (insertError) throw insertError
      }

      return adminNotification
    } catch (error) {
      console.error('Error broadcasting notification:', error)
      throw error
    }
  }

  // Real-time subscriptions
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }

  subscribeToAdminNotifications(adminId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`admin-notifications-${adminId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notifications',
          filter: `admin_id=eq.${adminId}`
        },
        callback
      )
      .subscribe()
  }
}

export const supabaseNotificationService = new SupabaseNotificationService()
