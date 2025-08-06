import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  room: string;
  type: 'user' | 'admin' | 'system';
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'support' | 'general' | 'admin' | 'private';
  participants: string[];
  lastMessage?: ChatMessage;
}

class SupabaseChatService {
  private messages: Map<string, ChatMessage[]> = new Map();
  private rooms: ChatRoom[] = [];
  private currentRoom: string | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private userId: string | null = null;
  private subscriptions: Map<string, any> = new Map();

  constructor() {
    this.initializeRooms();
  }

  private async initializeRooms() {
    try {
      // Get user's accessible rooms from Supabase
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .or('is_public.eq.true,participants.cs.{' + this.userId + '}');

      if (error) {
        console.error('Error loading chat rooms:', error);
        // Fallback to default rooms
        this.rooms = [
          { id: 'general', name: 'General Support', type: 'general', participants: [] },
          { id: 'admin', name: 'Admin Channel', type: 'admin', participants: [] }
        ];
      } else {
        this.rooms = rooms.map(room => ({
          id: room.id,
          name: room.name,
          type: room.type || 'general',
          participants: room.participants || []
        }));
      }

      this.emit('rooms_updated', this.rooms);
    } catch (error) {
      console.error('Error initializing chat rooms:', error);
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.initializeRooms();
  }

  // Room management
  async joinRoom(roomId: string) {
    try {
      // Add user to room participants if not already there
      const room = this.rooms.find(r => r.id === roomId);
      if (room && this.userId && !room.participants.includes(this.userId)) {
        await supabase
          .from('chat_rooms')
          .update({ participants: [...room.participants, this.userId] })
          .eq('id', roomId);
      }

      this.currentRoom = roomId;
      
      // Load existing messages for the room
      if (!this.messages.has(roomId)) {
        await this.loadMessages(roomId);
      }
      
      // Subscribe to real-time messages for this room
      this.subscribeToRoom(roomId);
      
      this.emit('room_joined', roomId);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  }

  async leaveRoom(roomId: string) {
    try {
      // Remove user from room participants
      const room = this.rooms.find(r => r.id === roomId);
      if (room && this.userId) {
        const updatedParticipants = room.participants.filter(p => p !== this.userId);
        await supabase
          .from('chat_rooms')
          .update({ participants: updatedParticipants })
          .eq('id', roomId);
      }

      // Unsubscribe from room messages
      const subscription = this.subscriptions.get(roomId);
      if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete(roomId);
      }

      if (this.currentRoom === roomId) {
        this.currentRoom = null;
      }
      
      this.emit('room_left', roomId);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }

  private async loadMessages(roomId: string) {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error loading messages:', error);
        this.messages.set(roomId, []);
      } else {
        const chatMessages: ChatMessage[] = messages.map(msg => ({
          id: msg.id,
          userId: msg.user_id,
          userName: msg.user_name,
          message: msg.message,
          timestamp: msg.created_at,
          room: msg.room,
          type: msg.type || 'user'
        }));
        this.messages.set(roomId, chatMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      this.messages.set(roomId, []);
    }
  }

  private subscribeToRoom(roomId: string) {
    // Unsubscribe from previous subscription if exists
    const existingSubscription = this.subscriptions.get(roomId);
    if (existingSubscription) {
      existingSubscription.unsubscribe();
    }

    // Subscribe to new messages in this room
    const subscription = supabase
      .channel(`chat:${roomId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `room=eq.${roomId}`
        }, 
        (payload) => {
          const newMessage: ChatMessage = {
            id: payload.new.id,
            userId: payload.new.user_id,
            userName: payload.new.user_name,
            message: payload.new.message,
            timestamp: payload.new.created_at,
            room: payload.new.room,
            type: payload.new.type || 'user'
          };
          
          this.addMessage(newMessage);
          this.emit('message_received', newMessage);
        }
      )
      .subscribe();

    this.subscriptions.set(roomId, subscription);
  }

  async sendMessage(message: string, roomId: string, userName: string, type: 'user' | 'admin' | 'system' = 'user') {
    if (!this.userId) {
      console.error('No user ID set');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: this.userId,
          user_name: userName,
          message: message,
          room: roomId,
          type: type
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      const chatMessage: ChatMessage = {
        id: data.id,
        userId: data.user_id,
        userName: data.user_name,
        message: data.message,
        timestamp: data.created_at,
        room: data.room,
        type: data.type || 'user'
      };

      this.addMessage(chatMessage);
      this.emit('message_sent', chatMessage);
      
      return chatMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  private addMessage(message: ChatMessage) {
    const roomMessages = this.messages.get(message.room) || [];
    roomMessages.push(message);
    this.messages.set(message.room, roomMessages);
  }

  async getMessages(roomId: string): Promise<ChatMessage[]> {
    if (!this.messages.has(roomId)) {
      await this.loadMessages(roomId);
    }
    return this.messages.get(roomId) || [];
  }

  async getRooms(): Promise<ChatRoom[]> {
    return this.rooms;
  }

  async getCurrentRoom(): Promise<string | null> {
    return this.currentRoom;
  }

  async getUsers(): Promise<any[]> {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .limit(50);

      if (error) {
        console.error('Error loading users:', error);
        return [];
      }

      return users.map(user => ({
        id: user.id,
        name: user.full_name || user.email,
        email: user.email
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  async sendSystemMessage(message: string, roomId: string) {
    return this.sendMessage(message, roomId, 'System', 'system');
  }

  async broadcastToAdmins(message: string) {
    const adminRoom = this.rooms.find(room => room.type === 'admin');
    if (adminRoom) {
      return this.sendMessage(message, adminRoom.id, 'System', 'system');
    }
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }

  isMessageFromCurrentUser(message: ChatMessage): boolean {
    return message.userId === this.userId;
  }

  getUnreadCount(roomId: string): number {
    // This would need to be implemented with a read status tracking system
    return 0;
  }

  markAsRead(roomId: string) {
    // This would need to be implemented with a read status tracking system
  }

  // Cleanup method
  cleanup() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    this.listeners.clear();
  }
}

const supabaseChatService = new SupabaseChatService();
export default supabaseChatService; 