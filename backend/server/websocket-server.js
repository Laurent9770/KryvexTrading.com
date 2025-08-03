import { WebSocketServer } from 'ws';
import http from 'http';
import express from 'express';
import cors from 'cors';

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store connected clients
const clients = new Map();
const rooms = new Map();

// Mock data storage
const mockData = {
  users: [
    {
      id: 'admin-001',
      email: 'admin@kryvex.com',
      full_name: 'Admin User',
      is_admin: true,
      is_verified: true,
      kyc_status: 'approved'
    },
    {
      id: 'trader-001',
      email: 'trader1@example.com',
      full_name: 'John Trader',
      is_admin: false,
      is_verified: true,
      kyc_status: 'approved'
    }
  ],
  trades: [
    {
      id: 'trade-001',
      user_id: 'trader-001',
      trading_pair: 'BTC/USDT',
      trade_type: 'buy',
      order_type: 'market',
      amount: 0.1,
      price: 45000,
      total_value: 4500,
      status: 'completed',
      outcome: 'win',
      profit_loss: 250,
      created_at: new Date().toISOString()
    }
  ],
  wallets: [
    {
      id: 'wallet-001',
      user_id: 'trader-001',
      currency: 'USDT',
      balance: 25000,
      locked_balance: 0
    },
    {
      id: 'wallet-002',
      user_id: 'trader-001',
      currency: 'BTC',
      balance: 1.2,
      locked_balance: 0
    }
  ],
  kycApplications: [
    {
      id: '1',
      user_id: 'user-001',
      full_name: 'John Trader',
      email: 'trader1@example.com',
      phone: '+1234567891',
      document_type: 'Passport',
      document_number: 'CA123456789',
      verification_level: 'basic',
      status: 'pending',
      submitted_at: '2024-01-15T10:30:00Z'
    }
  ]
};

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  const clientId = Date.now().toString();
  clients.set(clientId, ws);
  
  ws.clientId = clientId;
  ws.userId = null;
  ws.isAdmin = false;
  
  // Send initial connection confirmation
  ws.send(JSON.stringify({
    type: 'connection',
    clientId: clientId,
    message: 'Connected to Kryvex Trading Platform'
  }));
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, data);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected:', clientId);
    clients.delete(clientId);
    
    // Remove from rooms
    for (const [roomId, room] of rooms.entries()) {
      if (room.clients.has(clientId)) {
        room.clients.delete(clientId);
        if (room.clients.size === 0) {
          rooms.delete(roomId);
        }
      }
    }
  });
});

// Handle different message types
function handleMessage(ws, data) {
  switch (data.type) {
    case 'auth':
      handleAuth(ws, data);
      break;
    case 'join_room':
      handleJoinRoom(ws, data);
      break;
    case 'leave_room':
      handleLeaveRoom(ws, data);
      break;
    case 'trade':
      handleTrade(ws, data);
      break;
    case 'admin_action':
      handleAdminAction(ws, data);
      break;
    case 'kyc_review':
      handleKYCReview(ws, data);
      break;
    case 'wallet_update':
      handleWalletUpdate(ws, data);
      break;
    case 'chat_message':
      handleChatMessage(ws, data);
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
}

// Authentication handler
function handleAuth(ws, data) {
  const { email, password } = data;
  
  // Mock authentication
  let user = null;
  if (email === 'admin@kryvex.com' && password === 'admin123') {
    user = mockData.users.find(u => u.email === email);
    ws.isAdmin = true;
  } else if (email === 'trader1@example.com' && password === 'trader123') {
    user = mockData.users.find(u => u.email === email);
    ws.isAdmin = false;
  }
  
  if (user) {
    ws.userId = user.id;
    ws.send(JSON.stringify({
      type: 'auth_success',
      user: user
    }));
    
    // Join user's personal room
    handleJoinRoom(ws, { room: `user_${user.id}` });
    
    // Send initial data
    sendUserData(ws, user.id);
  } else {
    ws.send(JSON.stringify({
      type: 'auth_error',
      message: 'Invalid credentials'
    }));
  }
}

// Join room handler
function handleJoinRoom(ws, data) {
  const { room } = data;
  
  if (!rooms.has(room)) {
    rooms.set(room, { clients: new Map() });
  }
  
  const roomObj = rooms.get(room);
  roomObj.clients.set(ws.clientId, ws);
  
  ws.send(JSON.stringify({
    type: 'room_joined',
    room: room
  }));
  
  console.log(`Client ${ws.clientId} joined room: ${room}`);
}

// Leave room handler
function handleLeaveRoom(ws, data) {
  const { room } = data;
  
  if (rooms.has(room)) {
    const roomObj = rooms.get(room);
    roomObj.clients.delete(ws.clientId);
    
    if (roomObj.clients.size === 0) {
      rooms.delete(room);
    }
  }
  
  ws.send(JSON.stringify({
    type: 'room_left',
    room: room
  }));
}

// Trade handler
function handleTrade(ws, data) {
  const { trade } = data;
  
  // Add trade to mock data
  const newTrade = {
    id: `trade-${Date.now()}`,
    ...trade,
    created_at: new Date().toISOString()
  };
  
  mockData.trades.push(newTrade);
  
  // Broadcast to all clients
  broadcastToAll({
    type: 'trade_created',
    trade: newTrade
  });
  
  // Update user's wallet
  updateWallet(ws.userId, trade);
}

// Admin action handler
function handleAdminAction(ws, data) {
  if (!ws.isAdmin) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Unauthorized admin action'
    }));
    return;
  }
  
  const { action, targetUserId, details } = data;
  
  // Log admin action
  console.log(`Admin action: ${action} by ${ws.userId} on ${targetUserId}`);
  
  // Broadcast admin action
  broadcastToAdmins({
    type: 'admin_action',
    action: action,
    adminId: ws.userId,
    targetUserId: targetUserId,
    details: details,
    timestamp: new Date().toISOString()
  });
}

// KYC review handler
function handleKYCReview(ws, data) {
  if (!ws.isAdmin) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Unauthorized KYC review'
    }));
    return;
  }
  
  const { applicationId, status, verificationLevel, notes } = data;
  
  // Update KYC application
  const application = mockData.kycApplications.find(app => app.id === applicationId);
  if (application) {
    application.status = status;
    application.verification_level = verificationLevel;
    application.reviewed_at = new Date().toISOString();
    application.reviewed_by = ws.userId;
    application.kyc_notes = notes;
  }
  
  // Broadcast KYC update
  broadcastToAll({
    type: 'kyc_updated',
    application: application
  });
}

// Wallet update handler
function handleWalletUpdate(ws, data) {
  const { userId, currency, amount, type } = data;
  
  // Find or create wallet
  let wallet = mockData.wallets.find(w => w.user_id === userId && w.currency === currency);
  
  if (!wallet) {
    wallet = {
      id: `wallet-${Date.now()}`,
      user_id: userId,
      currency: currency,
      balance: 0,
      locked_balance: 0
    };
    mockData.wallets.push(wallet);
  }
  
  // Update balance
  if (type === 'add') {
    wallet.balance += amount;
  } else if (type === 'subtract') {
    wallet.balance -= amount;
  }
  
  // Broadcast wallet update
  broadcastToUser(userId, {
    type: 'wallet_updated',
    wallet: wallet
  });
}

// Chat message handler
function handleChatMessage(ws, data) {
  const { message, room } = data;
  
  const chatMessage = {
    id: `msg-${Date.now()}`,
    userId: ws.userId,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  // Broadcast to room
  broadcastToRoom(room, {
    type: 'chat_message',
    message: chatMessage
  });
}

// Helper functions
function sendUserData(ws, userId) {
  const userTrades = mockData.trades.filter(t => t.user_id === userId);
  const userWallets = mockData.wallets.filter(w => w.user_id === userId);
  
  ws.send(JSON.stringify({
    type: 'user_data',
    trades: userTrades,
    wallets: userWallets
  }));
}

function updateWallet(userId, trade) {
  // Mock wallet update logic
  const wallet = mockData.wallets.find(w => w.user_id === userId && w.currency === 'USDT');
  if (wallet) {
    wallet.balance -= trade.total_value;
  }
}

function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

function broadcastToAdmins(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.isAdmin) {
      client.send(messageStr);
    }
  });
}

function broadcastToUser(userId, message) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.userId === userId) {
      client.send(messageStr);
    }
  });
}

function broadcastToRoom(roomId, message) {
  const room = rooms.get(roomId);
  if (room) {
    const messageStr = JSON.stringify(message);
    room.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}

// REST API endpoints
app.get('/api/users', (req, res) => {
  res.json(mockData.users);
});

app.get('/api/trades', (req, res) => {
  res.json(mockData.trades);
});

app.get('/api/wallets', (req, res) => {
  res.json(mockData.wallets);
});

app.get('/api/kyc-applications', (req, res) => {
  res.json(mockData.kycApplications);
});

app.post('/api/trades', (req, res) => {
  const trade = {
    id: `trade-${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString()
  };
  mockData.trades.push(trade);
  res.json(trade);
});

app.put('/api/kyc-applications/:id', (req, res) => {
  const { id } = req.params;
  const application = mockData.kycApplications.find(app => app.id === id);
  if (application) {
    Object.assign(application, req.body);
    res.json(application);
  } else {
    res.status(404).json({ error: 'Application not found' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`HTTP API available at http://localhost:${PORT}`);
}); 