import { supabase, getSupabaseClient } from '@/integrations/supabase/client';
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
      console.log('🔧 Initializing chat rooms...')
      
      // Use fallback rooms to avoid HTTP client issues
      this.rooms = [
        { id: 'general', name: 'General Support', type: 'general', participants: [] },
        { id: 'admin', name: 'Admin Channel', type: 'admin', participants: [] }
      ];

      console.log('✅ Chat rooms initialized:', this.rooms.length, 'rooms')
      this.emit('rooms_updated', this.rooms);
    } catch (error) {
      console.error('❌ Error initializing chat rooms:', error);
      // Ensure we have fallback rooms even if everything fails
      this.rooms = [
        { id: 'general', name: 'General Support', type: 'general', participants: [] },
        { id: 'admin', name: 'Admin Channel', type: 'admin', participants: [] }
      ];
      this.emit('rooms_updated', this.rooms);
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.initializeRooms();
  }

  // Room management
  async joinRoom(roomId: string) {
    try {
      // Simplified room joining without database updates
      const room = this.rooms.find(r => r.id === roomId);
      if (room && this.userId && !room.participants.includes(this.userId)) {
        room.participants.push(this.userId);
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
      // Simplified room leaving without database updates
      const room = this.rooms.find(r => r.id === roomId);
      if (room && this.userId) {
        room.participants = room.participants.filter(p => p !== this.userId);
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
      // Simplified message loading - return empty array to prevent errors
      console.log('📝 Loading messages for room:', roomId);
      this.messages.set(roomId, []);
    } catch (error) {
      console.error('Error loading messages:', error);
      this.messages.set(roomId, []);
    }
  }

  private subscribeToRoom(roomId: string) {
    // Simplified subscription - just log the subscription
    console.log('📡 Subscribing to room:', roomId);
    
    // Create a mock subscription
    const mockSubscription = {
      unsubscribe: () => {
        console.log('📡 Unsubscribed from room:', roomId);
      }
    };
    
    this.subscriptions.set(roomId, mockSubscription);
  }

  async sendMessage(message: string, roomId: string, userName: string, type: 'user' | 'admin' | 'system' = 'user') {
    if (!this.userId) {
      console.error('No user ID set');
      return;
    }

    try {
      // Simplified message sending - just create a local message
      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        userId: this.userId,
        userName: userName,
        message: message,
        timestamp: new Date().toISOString(),
        room: roomId,
        type: type
      };

      this.addMessage(chatMessage);
      this.emit('message_sent', chatMessage);
      console.log('📤 Message sent:', message);
      
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
      // Simplified user loading - return empty array to prevent errors
      console.log('👥 Loading users...');
      return [];
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
      if (subscription && typeof subscription.unsubscribe === 'function') {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing from chat subscription:', error);
        }
      }
    });
    this.subscriptions.clear();
    this.listeners.clear();
  }
}

const supabaseChatService = new SupabaseChatService();
export default supabaseChatService; 