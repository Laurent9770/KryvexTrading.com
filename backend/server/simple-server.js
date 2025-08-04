import { WebSocketServer } from 'ws';
import http from 'http';
import express from 'express';
import cors from 'cors';

// Global variables for demo purposes
let verificationCodes = {};
let kycSubmissions = {};

// Create Express app
const app = express();

// Configure CORS for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Track users and their rooms
const userRooms = new Map(); // userId -> Set of roomIds
const roomUsers = new Map(); // room -> Set of userIds
const roomPermissions = new Map(); // room -> { creator: adminId, isAdminOnly: boolean }
const userConnections = new Map(); // userId -> WebSocket connection

console.log('Starting WebSocket server...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Kryvex Trading Platform'
  }));
  
  // Track this connection
  const connectionId = `conn-${Date.now()}`;
  console.log(`New connection: ${connectionId}`);
  
  // Store connection reference
  let currentUserId = null;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data);
      
      if (data.type === 'auth') {
         // Mock authentication - accept any valid email/password combination
         if (data.email && data.password) {
           const isAdmin = data.email.includes('admin');
           const userId = 'user-' + Date.now();
           
           // Store user connection
           currentUserId = userId;
           userConnections.set(userId, ws);
           
           // Initialize user rooms set
           if (!userRooms.has(userId)) {
             userRooms.set(userId, new Set());
           }
           
           // Initialize general room if it doesn't exist
           if (!roomUsers.has('general')) {
             roomUsers.set('general', new Set());
             roomPermissions.set('general', { 
               creator: 'system', 
               isAdminOnly: false,
               name: 'General Support'
             });
           }
           
           // Add user to general room by default
           roomUsers.get('general').add(userId);
           userRooms.get(userId).add('general');
           
           // If admin, add to admin-only rooms by default
           if (isAdmin) {
             if (!roomUsers.has('admin')) {
               roomUsers.set('admin', new Set());
               roomPermissions.set('admin', { 
                 creator: userId, 
                 isAdminOnly: true,
                 name: 'Admin Channel'
               });
             }
             roomUsers.get('admin').add(userId);
             userRooms.get(userId).add('admin');
           }
           
           ws.send(JSON.stringify({
             type: 'auth_success',
             user: {
               id: userId,
               email: data.email,
               full_name: data.email.split('@')[0],
               is_admin: isAdmin
             }
           }));
           
           console.log(`User ${userId} (${isAdmin ? 'admin' : 'user'}) authenticated`);
         } else {
           ws.send(JSON.stringify({
             type: 'auth_error',
             message: 'Invalid credentials'
           }));
         }
      } else if (data.type === 'profile_update') {
        // Handle profile updates and broadcast to admin
        console.log('Profile update received:', data);
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'profile_updated',
              userId: data.userId,
              profileData: data.profileData,
              timestamp: data.timestamp
            }));
          }
        });
      } else if (data.type === 'security_update') {
        // Handle security settings updates
        console.log('Security update received:', data);
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'security_updated',
              userId: data.userId,
              securityData: data.securityData,
              timestamp: data.timestamp
            }));
          }
        });
      } else if (data.type === 'notification_update') {
        // Handle notification preferences updates
        console.log('Notification update received:', data);
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'notification_updated',
              userId: data.userId,
              notificationData: data.notificationData,
              timestamp: data.timestamp
            }));
          }
        });
      } else if (data.type === 'display_update') {
        // Handle display preferences updates
        console.log('Display update received:', data);
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'display_updated',
              userId: data.userId,
              displayData: data.displayData,
              timestamp: data.timestamp
            }));
          }
        });
      } else if (data.type === 'kyc_status_update') {
        // Handle KYC status updates
        console.log('KYC update received:', data);
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'kyc_updated',
              userId: data.userId,
              kycData: data.kycData,
              timestamp: data.timestamp
            }));
          }
        });
      } else if (data.type === 'portfolio_update') {
        // Handle portfolio updates
        console.log('Portfolio update received:', data);
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'portfolio_updated',
              userId: data.userId,
              portfolioData: data.portfolioData,
              timestamp: data.timestamp
            }));
          }
        });
      } else if (data.type === 'user_registered') {
        // Handle new user registration and broadcast to admin
        console.log('New user registered:', data);
        
        // Broadcast to all connected clients (admin users will filter this)
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'user_registered',
              user: data.user,
              timestamp: data.timestamp || new Date().toISOString()
            }));
          }
        });
        
        console.log(`Broadcasted user registration to ${wss.clients.size} clients`);
      } else if (data.type === 'wallet_updated') {
        // Handle wallet updates and broadcast to admin
        console.log('Wallet update received:', data);
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'wallet_updated',
              userId: data.userId,
              walletData: data.walletData,
              timestamp: data.timestamp || new Date().toISOString()
            }));
          }
        });
      } else if (data.type === 'trade_completed') {
        // Handle trade completion and broadcast to admin
        console.log('Trade completed:', data);
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'trade_completed',
              userId: data.userId,
              tradeData: data.tradeData,
              timestamp: data.timestamp || new Date().toISOString()
            }));
          }
        });
      } else if (data.type === 'kyc_status_updated') {
        // Handle KYC status updates and broadcast to admin
        console.log('KYC status update:', data);
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'kyc_status_updated',
              userId: data.userId,
              kycData: data.kycData,
              timestamp: data.timestamp || new Date().toISOString()
            }));
          }
        });
      } else if (data.type === 'kyc_submission') {
        // Handle KYC submission notifications
        console.log('KYC submission:', data);
        
        // Broadcast to admin clients
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'kyc_submission_created',
              submissionId: data.submissionId,
              data: data.data,
              timestamp: data.timestamp
            }));
          }
        });
      
      console.log(`Broadcasted user registration to ${wss.clients.size - 1} clients`);
    } else if (data.type === 'profile_update') {
      // Handle profile updates and broadcast to admin
      console.log('Profile update received:', data);
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'profile_updated',
            userId: data.userId,
            profileData: data.profileData,
            timestamp: data.timestamp
          }));
        }
      });
    } else if (data.type === 'wallet_update') {
      // Handle wallet updates and broadcast to admin
      console.log('Wallet update received:', data);
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'wallet_updated',
            userId: data.userId,
            walletData: data.walletData,
            timestamp: data.timestamp
          }));
        }
      });
    } else if (data.type === 'trade_completed') {
      // Handle trade completion
      console.log('Trade completed:', data);
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'trade_completed',
            userId: data.userId,
            tradeData: data.tradeData,
            timestamp: data.timestamp
          }));
        }
      });
    } else if (data.type === 'analytics_update') {
      // Handle analytics updates
      console.log('Analytics update received:', data);
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'analytics_updated',
            userId: data.userId,
            analyticsData: data.analyticsData,
            timestamp: data.timestamp
          }));
        }
      });
             } else if (data.type === 'create_room') {
         // Only admins can create rooms
         const userId = data.userId;
         const isAdmin = data.isAdmin;
         
         if (!isAdmin) {
           ws.send(JSON.stringify({
             type: 'error',
             message: 'Only admins can create rooms'
           }));
           return;
         }
         
         const roomId = data.roomId;
         const roomName = data.roomName;
         const isAdminOnly = data.isAdminOnly || false;
         
         // Create room
         if (!roomUsers.has(roomId)) {
           roomUsers.set(roomId, new Set());
           roomPermissions.set(roomId, { 
             creator: userId, 
             isAdminOnly: isAdminOnly,
             name: roomName
           });
           
           // Add creator to room
           roomUsers.get(roomId).add(userId);
           if (!userRooms.has(userId)) {
             userRooms.set(userId, new Set());
           }
           userRooms.get(userId).add(roomId);
           
           console.log(`Admin ${userId} created room ${roomId} (${roomName})`);
           
           ws.send(JSON.stringify({
             type: 'room_created',
             roomId,
             roomName,
             isAdminOnly
           }));
         } else {
           ws.send(JSON.stringify({
             type: 'error',
             message: 'Room already exists'
           }));
         }
       } else if (data.type === 'add_user_to_room') {
         // Only admins can add users to rooms
         const adminId = data.adminId;
         const targetUserId = data.targetUserId;
         const roomId = data.roomId;
         
         // Check if user is admin
         const adminConnection = userConnections.get(adminId);
         if (!adminConnection) {
           ws.send(JSON.stringify({
             type: 'error',
             message: 'Admin not found'
           }));
           return;
         }
         
         // Check if room exists and admin has permission
         if (!roomUsers.has(roomId)) {
           ws.send(JSON.stringify({
             type: 'error',
             message: 'Room does not exist'
           }));
           return;
         }
         
         const roomPerms = roomPermissions.get(roomId);
         if (roomPerms.creator !== adminId) {
           ws.send(JSON.stringify({
             type: 'error',
             message: 'Only room creator can add users'
           }));
           return;
         }
         
         // Add user to room
         roomUsers.get(roomId).add(targetUserId);
         if (!userRooms.has(targetUserId)) {
           userRooms.set(targetUserId, new Set());
         }
         userRooms.get(targetUserId).add(roomId);
         
         // Notify target user
         const targetConnection = userConnections.get(targetUserId);
         if (targetConnection) {
           targetConnection.send(JSON.stringify({
             type: 'added_to_room',
             roomId,
             roomName: roomPerms.name
           }));
         }
         
         console.log(`Admin ${adminId} added user ${targetUserId} to room ${roomId}`);
         
         ws.send(JSON.stringify({
           type: 'user_added_to_room',
           targetUserId,
           roomId
         }));
       } else if (data.type === 'join_room') {
         // Handle room joining (only if user has permission)
         console.log('User attempting to join room:', data.room);
         
         const userId = data.userId;
         const roomId = data.room;
         
         // Check if user has permission to join this room
         if (!userRooms.has(userId) || !userRooms.get(userId).has(roomId)) {
           ws.send(JSON.stringify({
             type: 'error',
             message: 'You do not have permission to join this room'
           }));
           return;
         }
         
         ws.send(JSON.stringify({
           type: 'room_joined',
           room: roomId
         }));
         
         console.log(`User ${userId} joined room ${roomId}`);
       } else if (data.type === 'leave_room') {
         // Handle room leaving
         console.log('User leaving room:', data.room);
         
         const userId = data.userId;
         const roomId = data.room;
         
         // Remove user from room tracking
         if (userRooms.has(userId)) {
           userRooms.get(userId).delete(roomId);
         }
         
         if (roomUsers.has(roomId)) {
           roomUsers.get(roomId).delete(userId);
         }
         
         ws.send(JSON.stringify({
           type: 'room_left',
           room: roomId
         }));
         
         console.log(`User ${userId} left room ${roomId}`);
       } else if (data.type === 'get_user_rooms') {
         // Get rooms that user has access to
         const userId = data.userId;
         const userRoomSet = userRooms.get(userId) || new Set();
         
         const accessibleRooms = Array.from(userRoomSet).map(roomId => {
           const perms = roomPermissions.get(roomId);
           return {
             id: roomId,
             name: perms?.name || roomId,
             isAdminOnly: perms?.isAdminOnly || false
           };
         });
         
         ws.send(JSON.stringify({
           type: 'user_rooms',
           rooms: accessibleRooms
         }));
       } else if (data.type === 'get_all_rooms') {
         // Only admins can see all rooms
         const userId = data.userId;
         const isAdmin = data.isAdmin;
         
         if (!isAdmin) {
           ws.send(JSON.stringify({
             type: 'error',
             message: 'Only admins can view all rooms'
           }));
           return;
         }
         
         const allRooms = Array.from(roomPermissions.entries()).map(([roomId, perms]) => ({
           id: roomId,
           name: perms.name || roomId,
           isAdminOnly: perms.isAdminOnly,
           userCount: roomUsers.get(roomId)?.size || 0
         }));
         
         ws.send(JSON.stringify({
           type: 'all_rooms',
           rooms: allRooms
         }));
             } else if (data.type === 'chat_message') {
         // Handle chat messages
         console.log('Chat message received:', data);
         const chatMessage = {
           id: `msg-${Date.now()}`,
           userId: data.userId || 'anonymous',
           userName: data.userName || 'Anonymous',
           message: data.message,
           timestamp: new Date().toISOString(),
           room: data.room,
           type: data.messageType || 'user'
         };
         
         // Check if sender has permission to send to this room
         const senderId = data.userId;
         const roomId = data.room;
         
         if (!userRooms.has(senderId) || !userRooms.get(senderId).has(roomId)) {
           ws.send(JSON.stringify({
             type: 'error',
             message: 'You do not have permission to send messages to this room'
           }));
           return;
         }
         
         // Broadcast to users who have permission to be in this room
         const usersInRoom = roomUsers.get(roomId) || new Set();
         
         console.log(`Broadcasting message to room ${roomId} with ${usersInRoom.size} users`);
         
         usersInRoom.forEach(userId => {
           const userConnection = userConnections.get(userId);
           if (userConnection && userConnection.readyState === 1) {
             userConnection.send(JSON.stringify({
               type: 'chat_message',
               message: chatMessage
             }));
           }
         });
         
         // If message is in general room, also notify all admins
         if (roomId === 'general') {
           const adminUsers = Array.from(userConnections.keys()).filter(userId => {
             // Check if user is admin (you might want to store admin status in a separate map)
             const connection = userConnections.get(userId);
             return connection && connection !== ws; // Don't send back to sender
           });
           
           adminUsers.forEach(adminId => {
             const adminConnection = userConnections.get(adminId);
             if (adminConnection && adminConnection.readyState === 1) {
               adminConnection.send(JSON.stringify({
                 type: 'chat_message',
                 message: {
                   ...chatMessage,
                   room: 'admin', // Show in admin room
                   originalRoom: 'general' // Track original room
                 }
               }));
             }
           });
         }
         
         // Log the message for debugging
         console.log(`Broadcasting message to room ${data.room}:`, chatMessage);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    
    // Clean up user tracking for this connection
    if (currentUserId) {
      userConnections.delete(currentUserId);
      console.log(`User ${currentUserId} disconnected`);
    }
    
    console.log(`Connection ${connectionId} disconnected`);
  });
});

// Password validation function
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Registration endpoint
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'All fields are required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please enter a valid email address'
      });
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password does not meet security requirements',
        details: passwordValidation.errors
      });
    }
    
    // Check if user already exists (in a real app, this would check the database)
    // For now, we'll just return success since the frontend handles user storage
    res.status(201).json({
      success: true,
      message: 'User registration successful',
      user: {
        email,
        firstName,
        lastName,
        phone
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An unexpected error occurred during registration'
    });
  }
});

// Login endpoint with password validation
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }
    
    // Check for admin credentials
    if (email === 'admin@kryvex.com' && password === 'Kryvex.@123') {
      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        user: {
          id: 'admin-001',
          email: 'admin@kryvex.com',
          username: 'admin',
          firstName: 'Admin',
          lastName: 'Kryvex',
          isAdmin: true
        },
        token: 'admin-jwt-token-' + Date.now()
      });
    }
    
    // For regular users, the frontend handles authentication
    // This endpoint would typically validate against a database
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        email,
        isAdmin: false
      },
      token: 'user-jwt-token-' + Date.now()
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An unexpected error occurred during login'
    });
  }
});

// REST API endpoints
app.get('/api/users', (req, res) => {
  res.json([
    {
      id: 'admin-001',
      email: 'admin@kryvex.com',
      full_name: 'Admin User',
      is_admin: true
    },
    {
      id: 'trader-001',
      email: 'trader1@example.com',
      full_name: 'John Trader',
      is_admin: false
    }
  ]);
});

// Portfolio API endpoint
app.get('/api/portfolio/:userId', (req, res) => {
  const { userId } = req.params;
  
  // Mock portfolio data
  const portfolioData = {
    totalBalance: 84567.89,
    assets: [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        balance: '0.5',
        usdValue: 22500.00,
        percentage: 26.6,
        priceChange: '+2.34%'
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        balance: '3.2',
        usdValue: 9600.00,
        percentage: 11.4,
        priceChange: '+1.87%'
      },
      {
        symbol: 'USDT',
        name: 'Tether',
        balance: '52467.89',
        usdValue: 52467.89,
        percentage: 62.0,
        priceChange: '0.00%'
      }
    ],
    distribution: [
      { symbol: 'BTC', percentage: 26.6, color: '#F7931A' },
      { symbol: 'ETH', percentage: 11.4, color: '#627EEA' },
      { symbol: 'USDT', percentage: 62.0, color: '#26A17B' }
    ]
  };
  
  res.json(portfolioData);
});

// Recent Trades API endpoint
app.get('/api/trades/recent/:userId', (req, res) => {
  const { userId } = req.params;
  
  // Mock recent trades data
  const recentTrades = [
    {
      id: 'trade-001',
      type: 'SPOT',
      symbol: 'BTC/USDT',
      direction: 'LONG',
      entryPrice: 45000.00,
      result: 'WIN',
      pnl: 234.56,
      timeExecuted: '2024-01-15T10:30:00Z',
      duration: '5m'
    },
    {
      id: 'trade-002',
      type: 'FUTURES',
      symbol: 'ETH/USDT',
      direction: 'SHORT',
      entryPrice: 3000.00,
      result: 'LOSS',
      pnl: -156.78,
      timeExecuted: '2024-01-15T09:15:00Z',
      duration: '10m'
    },
    {
      id: 'trade-003',
      type: 'OPTIONS',
      symbol: 'SOL/USDT',
      direction: 'LONG',
      entryPrice: 400.00,
      result: 'WIN',
      pnl: 567.89,
      timeExecuted: '2024-01-15T08:45:00Z',
      duration: '15m'
    },
    {
      id: 'trade-004',
      type: 'BINARY',
      symbol: 'ADA/USDT',
      direction: 'HIGHER',
      entryPrice: 0.80,
      result: 'WIN',
      pnl: 123.45,
      timeExecuted: '2024-01-15T08:00:00Z',
      duration: '5m'
    },
    {
      id: 'trade-005',
      type: 'QUANT',
      symbol: 'BTC/USDT',
      direction: 'ARBITRAGE',
      entryPrice: 44950.00,
      result: 'WIN',
      pnl: 89.12,
      timeExecuted: '2024-01-15T07:30:00Z',
      duration: '2m'
    }
  ];
  
  res.json(recentTrades);
});

// Analytics API endpoint
app.get('/api/analytics/:userId', (req, res) => {
  const { userId } = req.params;
  
  // Mock analytics data
  const analyticsData = {
    pnlChart: [
      { date: '2024-01-09', pnl: 1200.50 },
      { date: '2024-01-10', pnl: 1350.75 },
      { date: '2024-01-11', pnl: 980.25 },
      { date: '2024-01-12', pnl: 2100.00 },
      { date: '2024-01-13', pnl: 1850.30 },
      { date: '2024-01-14', pnl: 2200.45 },
      { date: '2024-01-15', pnl: 2450.67 }
    ],
    volumeChart: [
      { date: '2024-01-09', volume: 15 },
      { date: '2024-01-10', volume: 22 },
      { date: '2024-01-11', volume: 18 },
      { date: '2024-01-12', volume: 25 },
      { date: '2024-01-13', volume: 20 },
      { date: '2024-01-14', volume: 28 },
      { date: '2024-01-15', volume: 32 }
    ],
    winLossDistribution: {
      wins: 156,
      losses: 72
    },
    insights: {
      mostTradedPair: 'BTC/USDT',
      mostUsedTradeType: 'Spot',
      bestPerformingBot: 'Arbitrage Pro',
      bestTrade: '+$1,234.56'
    }
  };
  
  res.json(analyticsData);
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'WebSocket server is running!' });
});

// Chat API endpoints
app.get('/api/chat/rooms', (req, res) => {
  res.json([
    {
      id: 'general',
      name: 'General Chat',
      type: 'general',
      participants: []
    },
    {
      id: 'support',
      name: 'Support',
      type: 'support',
      participants: []
    },
    {
      id: 'admin',
      name: 'Admin Channel',
      type: 'admin',
      participants: []
    }
  ]);
});

app.get('/api/chat/messages/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  // Mock messages for each room
  const mockMessages = {
    general: [
      {
        id: 'msg-1',
        userId: 'user-1',
        userName: 'John Trader',
        message: 'Hello everyone!',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        room: 'general',
        type: 'user'
      },
      {
        id: 'msg-2',
        userId: 'admin-1',
        userName: 'Admin',
        message: 'Welcome to Kryvex Trading Platform!',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        room: 'general',
        type: 'admin'
      }
    ],
    support: [
      {
        id: 'msg-3',
        userId: 'user-2',
        userName: 'Sarah Johnson',
        message: 'I need help with my withdrawal',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        room: 'support',
        type: 'user'
      },
      {
        id: 'msg-4',
        userId: 'admin-1',
        userName: 'Support Team',
        message: 'Hello Sarah, how can I help you today?',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        room: 'support',
        type: 'admin'
      }
    ],
    admin: [
      {
        id: 'msg-5',
        userId: 'admin-1',
        userName: 'Admin',
        message: 'New user registration: trader1@example.com',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        room: 'admin',
        type: 'admin'
      },
      {
        id: 'msg-6',
        userId: 'admin-1',
        userName: 'Admin',
        message: 'KYC verification completed for user-123',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        room: 'admin',
        type: 'admin'
      }
    ]
  };
  
  // Return messages for the requested room, or empty array if room doesn't exist
  const messages = mockMessages[roomId] || [];
  res.json(messages);
});

app.get('/api/chat/users', (req, res) => {
  res.json([
    {
      id: 'user-1',
      name: 'John Trader',
      email: 'trader1@example.com',
      status: 'online',
      lastSeen: new Date().toISOString()
    },
    {
      id: 'user-2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      status: 'online',
      lastSeen: new Date().toISOString()
    },
    {
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@kryvex.com',
      status: 'online',
      lastSeen: new Date().toISOString()
    }
  ]);
});

// Wallet Management endpoints
app.get('/api/withdrawal-requests', (req, res) => {
  res.json([
    {
      id: 'withdraw-1',
      userId: 'user-1',
      username: 'trader1',
      userEmail: 'trader1@example.com',
      amount: 500,
      asset: 'USDT',
      blockchain: 'TRC20',
      walletAddress: 'TQn9Y2khDD95GJdQKj8J9X9Y2khDD95GJdQK',
      status: 'pending',
      requestDate: new Date().toISOString(),
      remarks: 'Withdrawal for trading'
    },
    {
      id: 'withdraw-2',
      userId: 'user-2',
      username: 'trader2',
      userEmail: 'trader2@example.com',
      amount: 1000,
      asset: 'BTC',
      blockchain: 'Bitcoin',
      walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      status: 'approved',
      requestDate: new Date(Date.now() - 86400000).toISOString(),
      processedDate: new Date().toISOString(),
      processedBy: 'admin@kryvex.com',
      txHash: '0x1234567890abcdef'
    }
  ]);
});

app.get('/api/user-wallets', (req, res) => {
  res.json([
    {
      userId: 'user-1',
      username: 'trader1',
      email: 'trader1@example.com',
      fundingWallet: { USDT: 2000, BTC: 0.05 },
      tradingWallet: { USDT: 1000, BTC: 0.02 },
      lastUpdated: new Date().toISOString()
    },
    {
      userId: 'user-2',
      username: 'trader2',
      email: 'trader2@example.com',
      fundingWallet: { USDT: 1500, BTC: 0.03 },
      tradingWallet: { USDT: 800, BTC: 0.01 },
      lastUpdated: new Date().toISOString()
    }
  ]);
});

app.get('/api/wallet-transactions', (req, res) => {
  res.json([
    {
      id: 'tx-1',
      userId: 'user-1',
      username: 'trader1',
      action: 'fund',
      walletType: 'funding',
      amount: 1000,
      asset: 'USDT',
      performedBy: 'admin@kryvex.com',
      timestamp: new Date().toISOString(),
      remarks: 'Initial funding',
      status: 'completed'
    },
    {
      id: 'tx-2',
      userId: 'user-1',
      username: 'trader1',
      action: 'withdraw',
      walletType: 'funding',
      amount: 500,
      asset: 'USDT',
      performedBy: 'admin@kryvex.com',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      remarks: 'Withdrawal approved',
      status: 'completed'
    }
  ]);
});

// KYC Management endpoints
app.get('/api/kyc-submissions', (req, res) => {
  res.json([
    {
      id: 'kyc-1',
      userId: 'user-1',
      username: 'trader1',
      userEmail: 'trader1@example.com',
      fullName: 'John Smith',
      country: 'United States',
      dateOfBirth: '1990-05-15',
      documentType: 'passport',
      status: 'pending',
      submissionDate: new Date().toISOString(),
      documents: {
        idFront: '/mock-documents/passport-front.jpg',
        idBack: '/mock-documents/passport-back.jpg',
        selfie: '/mock-documents/selfie-1.jpg',
        proofOfAddress: '/mock-documents/address-proof-1.pdf'
      },
      remarks: 'All documents submitted'
    },
    {
      id: 'kyc-2',
      userId: 'user-2',
      username: 'trader2',
      userEmail: 'trader2@example.com',
      fullName: 'Sarah Johnson',
      country: 'Canada',
      dateOfBirth: '1985-12-20',
      documentType: 'national_id',
      status: 'approved',
      submissionDate: new Date(Date.now() - 86400000).toISOString(),
      processedDate: new Date().toISOString(),
      processedBy: 'admin@kryvex.com',
      documents: {
        idFront: '/mock-documents/id-front-2.jpg',
        selfie: '/mock-documents/selfie-2.jpg'
      },
      remarks: 'KYC approved successfully'
    },
    {
      id: 'kyc-3',
      userId: 'user-3',
      username: 'trader3',
      userEmail: 'trader3@example.com',
      fullName: 'Michael Brown',
      country: 'United Kingdom',
      dateOfBirth: '1992-08-10',
      documentType: 'drivers_license',
      status: 'rejected',
      submissionDate: new Date(Date.now() - 172800000).toISOString(),
      processedDate: new Date(Date.now() - 86400000).toISOString(),
      processedBy: 'admin@kryvex.com',
      rejectionReason: 'Blurry image quality. Please resubmit with clearer photos.',
      documents: {
        idFront: '/mock-documents/license-front-3.jpg',
        idBack: '/mock-documents/license-back-3.jpg',
        selfie: '/mock-documents/selfie-3.jpg'
      },
      remarks: 'Document quality issues'
    }
  ]);
});

app.get('/api/kyc-actions', (req, res) => {
  res.json([
    {
      id: 'action-1',
      kycId: 'kyc-1',
      userId: 'user-1',
      username: 'trader1',
      action: 'submitted',
      performedBy: 'trader1@example.com',
      timestamp: new Date().toISOString(),
      remarks: 'KYC documents submitted'
    },
    {
      id: 'action-2',
      kycId: 'kyc-2',
      userId: 'user-2',
      username: 'trader2',
      action: 'submitted',
      performedBy: 'trader2@example.com',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      remarks: 'KYC documents submitted'
    },
    {
      id: 'action-3',
      kycId: 'kyc-2',
      userId: 'user-2',
      username: 'trader2',
      action: 'approved',
      performedBy: 'admin@kryvex.com',
      timestamp: new Date().toISOString(),
      remarks: 'KYC approved successfully'
    },
    {
      id: 'action-4',
      kycId: 'kyc-3',
      userId: 'user-3',
      username: 'trader3',
      action: 'submitted',
      performedBy: 'trader3@example.com',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      remarks: 'KYC documents submitted'
    },
    {
      id: 'action-5',
      kycId: 'kyc-3',
      userId: 'user-3',
      username: 'trader3',
      action: 'rejected',
      performedBy: 'admin@kryvex.com',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      rejectionReason: 'Blurry image quality. Please resubmit with clearer photos.',
      remarks: 'Document quality issues'
    }
  ]);
});

// KYC Management Endpoints
app.post('/api/kyc/send-verification-email', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  // TODO: Implement real email sending service
  console.log('Sending verification email to:', email);
  
  // Generate verification code
  const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Store verification code (in production, use Redis or database)
  if (!verificationCodes) verificationCodes = {};
  verificationCodes[email] = {
    code: verificationCode,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  };
  
  res.json({ 
    success: true, 
    message: 'Verification email sent successfully',
    // In production, don't return the code
    code: verificationCode // Only for demo
  });
});

app.post('/api/kyc/verify-email', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }
  
  const storedVerification = verificationCodes?.[email];
  if (!storedVerification || storedVerification.code !== code) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }
  
  if (new Date() > storedVerification.expiresAt) {
    return res.status(400).json({ error: 'Verification code has expired' });
  }
  
  // Mark email as verified
  // TODO: Update user in database
  console.log('Email verified for:', email);
  
  // Clean up verification code
  delete verificationCodes[email];
  
  // Broadcast KYC status update
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        type: 'kyc_status_updated',
        userId: email,
        level: 1,
        status: 'verified',
        verifiedAt: new Date().toISOString()
      }));
    }
  });
  
  res.json({ 
    success: true, 
    message: 'Email verified successfully' 
  });
});

app.post('/api/kyc/submit-identity', (req, res) => {
  const { fullName, dateOfBirth, country, idType, idNumber, frontFile, backFile, selfieFile } = req.body;
  
  if (!fullName || !dateOfBirth || !country || !idType || !idNumber || !frontFile || !selfieFile) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // TODO: Implement file upload and storage
  console.log('Identity verification submitted:', { fullName, dateOfBirth, country, idType, idNumber });
  
  // Store KYC submission
  const submissionId = `kyc-${Date.now()}`;
  if (!kycSubmissions) kycSubmissions = {};
  kycSubmissions[submissionId] = {
    userId: fullName, // Using fullName as userId for demo
    level2: {
      status: 'pending',
      submittedAt: new Date().toISOString(),
      documents: {
        fullName,
        dateOfBirth,
        country,
        idType,
        idNumber,
        frontUrl: frontFile ? `https://example.com/uploads/${frontFile.name}` : '',
        backUrl: backFile ? `https://example.com/uploads/${backFile.name}` : '',
        selfieUrl: selfieFile ? `https://example.com/uploads/${selfieFile.name}` : ''
      }
    }
  };
  
  // Broadcast KYC submission created
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        type: 'kyc_submission_created',
        userId: fullName,
        submissionId,
        level: 2,
        status: 'pending',
        submittedAt: new Date().toISOString()
      }));
    }
  });
  
  res.json({ 
    success: true, 
    message: 'Identity verification submitted successfully',
    submissionId 
  });
});

app.get('/api/kyc/status/:userId', (req, res) => {
  const { userId } = req.params;
  
  // TODO: Get KYC status from database
  console.log('Getting KYC status for user:', userId);
  
  // Mock response
  const status = {
    level1: { status: 'unverified' },
    level2: { status: 'not_started' }
  };
  
  res.json(status);
});

app.get('/api/kyc/submissions', (req, res) => {
  // TODO: Get KYC submissions from database
  console.log('Getting KYC submissions for admin');
  
  const submissions = Object.values(kycSubmissions || {}).filter(sub => sub.level2.status === 'pending');
  res.json(submissions);
});

app.post('/api/kyc/review/:submissionId', (req, res) => {
  const { submissionId } = req.params;
  const { status, reason } = req.body;
  
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  if (status === 'rejected' && !reason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }
  
  // TODO: Update KYC submission in database
  console.log('Reviewing KYC submission:', submissionId, status, reason);
  
  const submission = kycSubmissions?.[submissionId];
  if (!submission) {
    return res.status(404).json({ error: 'KYC submission not found' });
  }
  
  // Update submission status
  submission.level2.status = status;
  submission.level2.reviewedAt = new Date().toISOString();
  if (status === 'rejected') {
    submission.level2.rejectionReason = reason;
  }
  
  // Broadcast KYC status update
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        type: 'kyc_status_updated',
        userId: submissionId,
        level: 2,
        status,
        reviewedAt: new Date().toISOString(),
        rejectionReason: reason
      }));
    }
  });
  
  res.json({ 
    success: true, 
    message: `KYC submission ${status} successfully` 
  });
});

// Deposit Management Endpoints
app.post('/api/deposits/submit', (req, res) => {
  try {
    const { userId, userEmail, amount, currency, network, transactionHash, notes, proofFile } = req.body;
    
    if (!userId || !userEmail || !amount || !currency || !network) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'User ID, email, amount, currency, and network are required'
      });
    }
    
    const depositRequest = {
      id: `deposit-${Date.now()}`,
      userId,
      userEmail,
      amount: parseFloat(amount),
      currency,
      network,
      transactionHash,
      notes,
      proofFile,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    // Store deposit request (in production, save to database)
    if (!global.depositRequests) global.depositRequests = [];
    global.depositRequests.push(depositRequest);
    
    // Broadcast deposit request to admin
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'deposit_request',
          requestId: depositRequest.id,
          userId,
          userEmail,
          amount: depositRequest.amount,
          currency,
          network,
          transactionHash,
          notes,
          proofFile,
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully',
      requestId: depositRequest.id
    });
    
  } catch (error) {
    console.error('Deposit submission error:', error);
    res.status(500).json({
      error: 'Deposit submission failed',
      message: 'An unexpected error occurred'
    });
  }
});

// Withdrawal Management Endpoints
app.post('/api/withdrawals/submit', (req, res) => {
  try {
    const { userId, username, userEmail, amount, asset, blockchain, walletAddress, remarks } = req.body;
    
    if (!userId || !username || !userEmail || !amount || !asset || !blockchain || !walletAddress) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'User ID, username, email, amount, asset, blockchain, and wallet address are required'
      });
    }
    
    const withdrawalRequest = {
      id: `withdrawal-${Date.now()}`,
      userId,
      username,
      userEmail,
      amount: parseFloat(amount),
      asset,
      blockchain,
      walletAddress,
      status: 'pending',
      requestDate: new Date().toISOString(),
      remarks
    };
    
    // Store withdrawal request (in production, save to database)
    if (!global.withdrawalRequests) global.withdrawalRequests = [];
    global.withdrawalRequests.push(withdrawalRequest);
    
    // Broadcast withdrawal request to admin
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'withdrawal_request',
          requestId: withdrawalRequest.id,
          userId,
          username,
          userEmail,
          amount: withdrawalRequest.amount,
          asset,
          blockchain,
          walletAddress,
          remarks,
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      requestId: withdrawalRequest.id
    });
    
  } catch (error) {
    console.error('Withdrawal submission error:', error);
    res.status(500).json({
      error: 'Withdrawal submission failed',
      message: 'An unexpected error occurred'
    });
  }
});

// Get deposit requests (admin only)
app.get('/api/admin/deposits', (req, res) => {
  try {
    const deposits = global.depositRequests || [];
    res.json(deposits);
  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({
      error: 'Failed to fetch deposits',
      message: 'An unexpected error occurred'
    });
  }
});

// Get withdrawal requests (admin only)
app.get('/api/admin/withdrawals', (req, res) => {
  try {
    const withdrawals = global.withdrawalRequests || [];
    res.json(withdrawals);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({
      error: 'Failed to fetch withdrawals',
      message: 'An unexpected error occurred'
    });
  }
});

// Update deposit status (admin only)
app.put('/api/admin/deposits/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, processedBy, remarks } = req.body;
    
    if (!global.depositRequests) {
      return res.status(404).json({ error: 'No deposit requests found' });
    }
    
    const depositIndex = global.depositRequests.findIndex(d => d.id === id);
    if (depositIndex === -1) {
      return res.status(404).json({ error: 'Deposit request not found' });
    }
    
    global.depositRequests[depositIndex] = {
      ...global.depositRequests[depositIndex],
      status,
      processedBy,
      processedAt: new Date().toISOString(),
      remarks
    };
    
    // Broadcast deposit status update
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'deposit_status_updated',
          requestId: id,
          status,
          processedBy,
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    res.json({
      success: true,
      message: 'Deposit status updated successfully',
      deposit: global.depositRequests[depositIndex]
    });
    
  } catch (error) {
    console.error('Error updating deposit status:', error);
    res.status(500).json({
      error: 'Failed to update deposit status',
      message: 'An unexpected error occurred'
    });
  }
});

// Update withdrawal status (admin only)
app.put('/api/admin/withdrawals/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, processedBy, txHash, remarks } = req.body;
    
    if (!global.withdrawalRequests) {
      return res.status(404).json({ error: 'No withdrawal requests found' });
    }
    
    const withdrawalIndex = global.withdrawalRequests.findIndex(w => w.id === id);
    if (withdrawalIndex === -1) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }
    
    global.withdrawalRequests[withdrawalIndex] = {
      ...global.withdrawalRequests[withdrawalIndex],
      status,
      processedBy,
      processedDate: new Date().toISOString(),
      txHash,
      remarks
    };
    
    // Broadcast withdrawal status update
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'withdrawal_status_updated',
          requestId: id,
          status,
          processedBy,
          txHash,
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    res.json({
      success: true,
      message: 'Withdrawal status updated successfully',
      withdrawal: global.withdrawalRequests[withdrawalIndex]
    });
    
  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    res.status(500).json({
      error: 'Failed to update withdrawal status',
      message: 'An unexpected error occurred'
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ WebSocket server running on port ${PORT}`);
  console.log(`✅ HTTP API available at http://localhost:${PORT}`);
  console.log(`✅ Test endpoint: http://localhost:${PORT}/api/test`);
});

// Catch-all handler for undefined routes
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET /api/test',
      'GET /api/users',
      'GET /api/chat/rooms',
      'GET /api/chat/messages/:roomId',
      'GET /api/chat/users',
      'GET /api/withdrawal-requests',
      'GET /api/user-wallets',
      'GET /api/wallet-transactions',
      'GET /api/kyc-submissions',
      'GET /api/kyc-actions'
    ]
  });
}); 