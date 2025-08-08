export interface Room {
  id: string;
  name: string;
  description?: string;
  isAdminOnly: boolean;
  createdBy: string;
  createdAt: string;
  userCount: number;
}

export interface RoomUser {
  roomId: string;
  userId: string;
  username: string;
  email: string;
  joinedAt: string;
  isAdmin: boolean;
}

export class RoomService {
  private rooms: Map<string, Room> = new Map();
  private roomUsers: Map<string, RoomUser[]> = new Map();

  constructor() {
    this.loadPersistedData();
    this.initializeDefaultRooms();
  }

  private loadPersistedData() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedRooms = localStorage.getItem('chat_rooms');
        const savedRoomUsers = localStorage.getItem('room_users');
        
        if (savedRooms) {
          const rooms = JSON.parse(savedRooms);
          this.rooms = new Map(Object.entries(rooms));
        }
        
        if (savedRoomUsers) {
          const roomUsers = JSON.parse(savedRoomUsers);
          this.roomUsers = new Map(Object.entries(roomUsers));
        }
      }
    } catch (error) {
      console.warn('Error loading persisted room data:', error);
    }
  }

  private persistData() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const roomsObj = Object.fromEntries(this.rooms);
        const roomUsersObj = Object.fromEntries(this.roomUsers);
        
        localStorage.setItem('chat_rooms', JSON.stringify(roomsObj));
        localStorage.setItem('room_users', JSON.stringify(roomUsersObj));
      }
    } catch (error) {
      console.warn('Error persisting room data:', error);
    }
  }

  private initializeDefaultRooms() {
    // Create default rooms if none exist
    if (this.rooms.size === 0) {
      const defaultRooms: Room[] = [
        {
          id: 'general',
          name: 'General Support',
          description: 'General customer support and inquiries',
          isAdminOnly: false,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          userCount: 0
        },
        {
          id: 'admin',
          name: 'Admin Channel',
          description: 'Admin-only communication channel',
          isAdminOnly: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          userCount: 0
        }
      ];

      defaultRooms.forEach(room => {
        this.rooms.set(room.id, room);
        this.roomUsers.set(room.id, []);
      });

      this.persistData();
    }
  }

  // Create a new room
  createRoom(roomId: string, name: string, description: string, isAdminOnly: boolean, createdBy: string): Room {
    const room: Room = {
      id: roomId,
      name,
      description,
      isAdminOnly,
      createdBy,
      createdAt: new Date().toISOString(),
      userCount: 0
    };

    this.rooms.set(roomId, room);
    this.roomUsers.set(roomId, []);
    this.persistData();
    return room;
  }

  // Add user to room
  addUserToRoom(roomId: string, userId: string, username: string, email: string, isAdmin: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Check if user is already in the room
    const existingUsers = this.roomUsers.get(roomId) || [];
    const userExists = existingUsers.find(user => user.userId === userId);
    if (userExists) return true; // User already in room

    const roomUser: RoomUser = {
      roomId,
      userId,
      username,
      email,
      joinedAt: new Date().toISOString(),
      isAdmin
    };

    existingUsers.push(roomUser);
    this.roomUsers.set(roomId, existingUsers);
    
    // Update room user count
    room.userCount = existingUsers.length;
    this.rooms.set(roomId, room);
    
    this.persistData();
    return true;
  }

  // Remove user from room
  removeUserFromRoom(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const existingUsers = this.roomUsers.get(roomId) || [];
    const updatedUsers = existingUsers.filter(user => user.userId !== userId);
    
    this.roomUsers.set(roomId, updatedUsers);
    
    // Update room user count
    room.userCount = updatedUsers.length;
    this.rooms.set(roomId, room);
    
    this.persistData();
    return true;
  }

  // Get all rooms
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values()).sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  // Get room by ID
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  // Get users in a room
  getRoomUsers(roomId: string): RoomUser[] {
    return this.roomUsers.get(roomId) || [];
  }

  // Get rooms for a user
  getUserRooms(userId: string): Room[] {
    const userRooms: Room[] = [];
    
    this.roomUsers.forEach((users, roomId) => {
      const userInRoom = users.find(user => user.userId === userId);
      if (userInRoom) {
        const room = this.rooms.get(roomId);
        if (room) {
          userRooms.push(room);
        }
      }
    });
    
    return userRooms;
  }

  // Delete room (admin only)
  deleteRoom(roomId: string): boolean {
    if (roomId === 'general' || roomId === 'admin') {
      return false; // Cannot delete default rooms
    }

    this.rooms.delete(roomId);
    this.roomUsers.delete(roomId);
    this.persistData();
    return true;
  }

  // Clear all mock data
  clearMockData(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedRoomUsers = localStorage.getItem('room_users');
        if (savedRoomUsers) {
          const roomUsers = JSON.parse(savedRoomUsers);
          const mockEmails = ['john@example.com', 'jane@example.com', 'mike@example.com', 'sarah@example.com'];
          
          // Remove room users with mock data
          Object.keys(roomUsers).forEach(roomId => {
            const users = roomUsers[roomId];
            const cleanedUsers = users.filter((user: any) => !mockEmails.includes(user.email));
            roomUsers[roomId] = cleanedUsers;
          });
          
          // Update localStorage with cleaned data
          localStorage.setItem('room_users', JSON.stringify(roomUsers));
          this.roomUsers = new Map(Object.entries(roomUsers));
        }
        
        console.log('Room data cleared from localStorage');
      }
    } catch (error) {
      console.warn('Error clearing room data:', error);
    }
  }
}

const roomService = new RoomService();
export default roomService; 