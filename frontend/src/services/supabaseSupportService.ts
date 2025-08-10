import supabase from '@/lib/supabaseClient'
import { SupportTicket, SupportTicketInsert, SupportTicketUpdate, SupportMessage, SupportMessageInsert, SupportMessageUpdate } from '@/integrations/supabase/types'

interface SupportTicketWithMessages extends SupportTicket {
  messages: SupportMessage[]
  user: {
    full_name: string
    email: string
  }
}

class SupabaseSupportService {
  private userId: string | null = null

  setUserId(userId: string) {
    this.userId = userId
  }

  async createTicket(subject: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'): Promise<SupportTicket> {
    if (!this.userId) throw new Error('User ID not set')

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: this.userId,
          subject,
          priority,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating support ticket:', error)
      throw error
    }
  }

  async getMyTickets(): Promise<SupportTicket[]> {
    if (!this.userId) throw new Error('User ID not set')

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching support tickets:', error)
      throw error
    }
  }

  async getTicketWithMessages(ticketId: string): Promise<SupportTicketWithMessages | null> {
    try {
      // Get ticket details
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select(`
          *,
          user:profiles!support_tickets_user_id_fkey(full_name, email)
        `)
        .eq('id', ticketId)
        .single()

      if (ticketError) throw ticketError

      // Get messages for this ticket
      const { data: messages, error: messagesError } = await supabase
        .from('support_messages')
        .select(`
          *,
          sender:profiles!support_messages_sender_id_fkey(full_name, email)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError

      return {
        ...ticket,
        messages: messages || []
      }
    } catch (error) {
      console.error('Error fetching ticket with messages:', error)
      throw error
    }
  }

  async addMessage(ticketId: string, message: string, attachments?: any): Promise<SupportMessage> {
    if (!this.userId) throw new Error('User ID not set')

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: this.userId,
          message,
          attachments: attachments || null,
          is_admin: false
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding support message:', error)
      throw error
    }
  }

  async updateTicketStatus(ticketId: string, status: 'open' | 'in_progress' | 'closed'): Promise<void> {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating ticket status:', error)
      throw error
    }
  }

  // Admin methods
  async getAllTickets(): Promise<SupportTicketWithMessages[]> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          user:profiles!support_tickets_user_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get messages for each ticket
      const ticketsWithMessages = await Promise.all(
        (data || []).map(async (ticket) => {
          const { data: messages } = await supabase
            .from('support_messages')
            .select('*')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: true })

          return {
            ...ticket,
            messages: messages || []
          }
        })
      )

      return ticketsWithMessages
    } catch (error) {
      console.error('Error fetching all support tickets:', error)
      throw error
    }
  }

  async assignTicket(ticketId: string, adminId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ assigned_to: adminId })
        .eq('id', ticketId)

      if (error) throw error
    } catch (error) {
      console.error('Error assigning ticket:', error)
      throw error
    }
  }

  async addAdminMessage(ticketId: string, message: string, adminId: string, attachments?: any): Promise<SupportMessage> {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: adminId,
          message,
          attachments: attachments || null,
          is_admin: true
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding admin message:', error)
      throw error
    }
  }

  // Real-time subscriptions
  subscribeToTicketUpdates(ticketId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        callback
      )
      .subscribe()
  }

  subscribeToAllTickets(callback: (payload: any) => void) {
    return supabase
      .channel('all-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        callback
      )
      .subscribe()
  }
}

export const supabaseSupportService = new SupabaseSupportService()
