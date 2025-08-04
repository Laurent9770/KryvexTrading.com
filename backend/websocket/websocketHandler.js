const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

class WebSocketHandler {
  constructor() {
    this.clients = new Map(); // Map to store client connections
    this.rooms = new Map(); // Map to store room members
    this.jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
  }

  setupWebSocket(wss) {
    this.wss = wss;

    wss.on('connection', (ws, req) => {
      console.log('🔌 New WebSocket connection');

      // Authenticate connection
      this.authenticateConnection(ws, req)
        .then(user => {
          if (user) {
            this.handleConnection(ws, user);
          } else {
            ws.close(1008, 'Authentication failed');
          }
        })
        .catch(error => {
          console.error('WebSocket authentication error:', error);
          ws.close(1008, 'Authentication failed');
        });
    });

    // Handle server shutdown
    wss.on('close', () => {
      console.log('🔌 WebSocket server closed');
    });
  }

  // Authenticate WebSocket connection
  async authenticateConnection(ws, req) {
    try {
      // Get token from query parameters or headers
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return null;
      }

      // Verify token
      const decoded = jwt.verify(token, this.jwtSecret);
      const user = await authService.getUserById(decoded.id);

      if (!user || !user.is_active) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isAdmin: user.is_admin,
        isVerified: user.is_verified
      };
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      return null;
    }
  }

  // Handle new connection
  handleConnection(ws, user) {
    // Store client connection
    this.clients.set(user.id, {
      ws,
      user,
      rooms: new Set()
    });

    console.log(`👤 User ${user.email} connected`);

    // Send welcome message
    this.sendToClient(ws, {
      type: 'connection_established',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin
        },
        message: 'WebSocket connection established'
      }
    });

    // Add user to default rooms
    this.addUserToRoom(user.id, 'general');
    if (user.isAdmin) {
      this.addUserToRoom(user.id, 'admin');
    }

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(ws, user, message);
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
        this.sendToClient(ws, {
          type: 'error',
          data: {
            message: 'Invalid message format'
          }
        });
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.handleDisconnect(user.id);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnect(user.id);
    });
  }

  // Handle incoming messages
  handleMessage(ws, user, message) {
    const { type, data } = message;

    switch (type) {
      case 'join_room':
        this.handleJoinRoom(user.id, data.room);
        break;

      case 'leave_room':
        this.handleLeaveRoom(user.id, data.room);
        break;

      case 'chat_message':
        this.handleChatMessage(user, data);
        break;

      case 'get_rooms':
        this.handleGetRooms(user.id);
        break;

      case 'get_room_users':
        this.handleGetRoomUsers(user.id, data.room);
        break;

      case 'ping':
        this.sendToClient(ws, { type: 'pong', data: { timestamp: Date.now() } });
        break;

      default:
        console.log(`Unknown message type: ${type}`);
        this.sendToClient(ws, {
          type: 'error',
          data: {
            message: `Unknown message type: ${type}`
          }
        });
    }
  }

  // Handle user joining a room
  handleJoinRoom(userId, roomName) {
    this.addUserToRoom(userId, roomName);
    
    // Notify other users in the room
    this.broadcastToRoom(roomName, {
      type: 'user_joined_room',
      data: {
        room: roomName,
        user: this.clients.get(userId)?.user
      }
    }, [userId]);

    console.log(`👤 User ${userId} joined room: ${roomName}`);
  }

  // Handle user leaving a room
  handleLeaveRoom(userId, roomName) {
    this.removeUserFromRoom(userId, roomName);
    
    // Notify other users in the room
    this.broadcastToRoom(roomName, {
      type: 'user_left_room',
      data: {
        room: roomName,
        user: this.clients.get(userId)?.user
      }
    }, [userId]);

    console.log(`👤 User ${userId} left room: ${roomName}`);
  }

  // Handle chat message
  handleChatMessage(user, data) {
    const { room, message, type = 'user' } = data;

    if (!room || !message) {
      return;
    }

    // Check if user is in the room
    const client = this.clients.get(user.id);
    if (!client || !client.rooms.has(room)) {
      return;
    }

    const chatMessage = {
      id: Date.now().toString(),
      room,
      userId: user.id,
      userEmail: user.email,
      userFirstName: user.firstName,
      userLastName: user.lastName,
      message,
      type,
      timestamp: new Date().toISOString()
    };

    // Broadcast message to room
    this.broadcastToRoom(room, {
      type: 'chat_message',
      data: chatMessage
    });

    // If message is in general room and user is admin, also send to admin room
    if (room === 'general' && user.isAdmin) {
      this.broadcastToRoom('admin', {
        type: 'chat_message',
        data: {
          ...chatMessage,
          originalRoom: 'general',
          notification: true
        }
      });
    }

    console.log(`💬 Chat message in ${room}: ${user.email}: ${message}`);
  }

  // Handle get rooms request
  handleGetRooms(userId) {
    const client = this.clients.get(userId);
    if (!client) return;

    const rooms = Array.from(client.rooms);
    this.sendToClient(client.ws, {
      type: 'user_rooms',
      data: { rooms }
    });
  }

  // Handle get room users request
  handleGetRoomUsers(userId, roomName) {
    const roomUsers = this.getRoomUsers(roomName);
    const client = this.clients.get(userId);
    
    if (client) {
      this.sendToClient(client.ws, {
        type: 'room_users',
        data: {
          room: roomName,
          users: roomUsers
        }
      });
    }
  }

  // Add user to room
  addUserToRoom(userId, roomName) {
    const client = this.clients.get(userId);
    if (!client) return;

    client.rooms.add(roomName);

    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName).add(userId);

    console.log(`👤 User ${userId} added to room: ${roomName}`);
  }

  // Remove user from room
  removeUserFromRoom(userId, roomName) {
    const client = this.clients.get(userId);
    if (client) {
      client.rooms.delete(roomName);
    }

    const room = this.rooms.get(roomName);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.rooms.delete(roomName);
      }
    }

    console.log(`👤 User ${userId} removed from room: ${roomName}`);
  }

  // Get users in a room
  getRoomUsers(roomName) {
    const room = this.rooms.get(roomName);
    if (!room) return [];

    return Array.from(room).map(userId => {
      const client = this.clients.get(userId);
      return client ? {
        id: client.user.id,
        email: client.user.email,
        firstName: client.user.firstName,
        lastName: client.user.lastName,
        isAdmin: client.user.isAdmin
      } : null;
    }).filter(Boolean);
  }

  // Handle client disconnect
  handleDisconnect(userId) {
    const client = this.clients.get(userId);
    if (!client) return;

    // Remove user from all rooms
    client.rooms.forEach(roomName => {
      this.removeUserFromRoom(userId, roomName);
      
      // Notify other users in the room
      this.broadcastToRoom(roomName, {
        type: 'user_left_room',
        data: {
          room: roomName,
          user: client.user
        }
      }, [userId]);
    });

    // Remove client
    this.clients.delete(userId);

    console.log(`👤 User ${client.user.email} disconnected`);
  }

  // Send message to specific client
  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Broadcast message to all clients in a room
  broadcastToRoom(roomName, message, excludeUserIds = []) {
    const room = this.rooms.get(roomName);
    if (!room) return;

    room.forEach(userId => {
      if (excludeUserIds.includes(userId)) return;

      const client = this.clients.get(userId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  // Broadcast message to all connected clients
  broadcastToAll(message, excludeUserIds = []) {
    this.clients.forEach((client, userId) => {
      if (excludeUserIds.includes(userId)) return;

      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  // Broadcast message to admin users only
  broadcastToAdmins(message) {
    this.clients.forEach((client, userId) => {
      if (client.user.isAdmin && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  // Send message to specific user
  sendToUser(userId, message) {
    const client = this.clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: this.clients.size,
      totalRooms: this.rooms.size,
      roomStats: Array.from(this.rooms.entries()).map(([roomName, users]) => ({
        room: roomName,
        userCount: users.size
      }))
    };
  }
}

module.exports = new WebSocketHandler(); 