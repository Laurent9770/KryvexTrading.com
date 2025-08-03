import websocketService from './websocketService';

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

class ChatService {
  private messages: Map<string, ChatMessage[]> = new Map();
  private rooms: ChatRoom[] = [];
  private currentRoom: string | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupWebSocketListeners();
    this.initializeRooms();
  }

  private setupWebSocketListeners() {
    websocketService.on('chat_message', (message: ChatMessage) => {
      this.addMessage(message);
      this.emit('message_received', message);
    });

    websocketService.on('room_joined', (roomId: string) => {
      this.currentRoom = roomId;
      this.emit('room_joined', roomId);
    });

    websocketService.on('room_left', (roomId: string) => {
      if (this.currentRoom === roomId) {
        this.currentRoom = null;
      }
      this.emit('room_left', roomId);
    });

    websocketService.on('user_rooms', (rooms: any[]) => {
      this.rooms = rooms.map(room => ({
        id: room.id,
        name: room.name,
        type: room.isAdminOnly ? 'admin' : 'general',
        participants: []
      }));
      this.emit('rooms_updated', this.rooms);
    });

    websocketService.on('added_to_room', (data: any) => {
      // User was added to a new room by admin
      const newRoom: ChatRoom = {
        id: data.roomId,
        name: data.roomName,
        type: 'general',
        participants: []
      };
      this.rooms.push(newRoom);
      this.emit('rooms_updated', this.rooms);
    });
  }

  private async initializeRooms() {
    // Get user's accessible rooms from WebSocket
    websocketService.getUserRooms();
    
    // Fallback to default rooms if no response
    setTimeout(() => {
      if (this.rooms.length === 0) {
        this.rooms = [
          { id: 'admin', name: 'Admin Channel', type: 'admin', participants: [] }
        ];
      }
    }, 1000);
  }

  // Room management
  async joinRoom(roomId: string) {
    websocketService.joinRoom(roomId);
    this.currentRoom = roomId;
    
    // Load existing messages for the room
    if (!this.messages.has(roomId)) {
      this.messages.set(roomId, []);
    }
    
    this.emit('room_joined', roomId);
  }

  async leaveRoom(roomId: string) {
    websocketService.leaveRoom(roomId);
    if (this.currentRoom === roomId) {
      this.currentRoom = null;
    }
    this.emit('room_left', roomId);
  }

  // Message handling
  async sendMessage(message: string, roomId: string, userName: string, type: 'user' | 'admin' | 'system' = 'user') {
    const chatMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: websocketService.user || 'anonymous',
      userName,
      message,
      timestamp: new Date().toISOString(),
      room: roomId,
      type
    };

    websocketService.sendChatMessage(message, roomId, userName, type);
    this.addMessage(chatMessage);
    this.emit('message_sent', chatMessage);
  }

  private addMessage(message: ChatMessage) {
    const roomMessages = this.messages.get(message.room) || [];
    roomMessages.push(message);
    this.messages.set(message.room, roomMessages);

    // Update room's last message
    const room = this.rooms.find(r => r.id === message.room);
    if (room) {
      room.lastMessage = message;
    }
  }

  // Data retrieval
  async getMessages(roomId: string): Promise<ChatMessage[]> {
    try {
      // Clean the roomId to remove any invalid characters
      const cleanRoomId = roomId.replace(/[^a-zA-Z0-9-_]/g, '');
      
      const response = await fetch(`/api/chat/messages/${cleanRoomId}`);
      if (response.ok) {
        const apiMessages = await response.json();
        // Merge with local messages
        const localMessages = this.messages.get(roomId) || [];
        const allMessages = [...apiMessages, ...localMessages];
        // Sort by timestamp
        return allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      } else if (response.status === 404) {
        console.warn(`Chat room '${cleanRoomId}' not found, using local messages only`);
        // Return local messages if API returns 404
        return this.messages.get(roomId) || [];
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Return local messages on error
      return this.messages.get(roomId) || [];
    }
    return this.messages.get(roomId) || [];
  }

  async getRooms(): Promise<ChatRoom[]> {
    try {
      const response = await fetch('/api/chat/rooms');
      if (response.ok) {
        this.rooms = await response.json();
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
    return this.rooms;
  }

  async getCurrentRoom(): Promise<string | null> {
    return this.currentRoom;
  }

  async getUsers(): Promise<any[]> {
    try {
      const response = await fetch('/api/chat/users');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
    return [];
  }

  // Admin functions
  async sendSystemMessage(message: string, roomId: string) {
    await this.sendMessage(message, roomId, 'System', 'system');
  }

  async broadcastToAdmins(message: string) {
    await this.sendMessage(message, 'admin', 'Admin', 'admin');
  }

  // Event listeners
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

  // Utility methods
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  isMessageFromCurrentUser(message: ChatMessage): boolean {
    return message.userId === websocketService.user;
  }

  getUnreadCount(roomId: string): number {
    // This would typically be tracked per user
    // For now, return 0
    return 0;
  }

  markAsRead(roomId: string) {
    // This would update the unread count
    // Implementation depends on your tracking system
  }
}

// Create singleton instance
const chatService = new ChatService();
export default chatService; 