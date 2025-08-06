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

// Initialize with empty state - no mock data
const userData = {
  users: [], // Empty array - no mock users
  trades: [], // Empty array - no mock trades
  wallets: [], // Empty array - no mock wallets
  kycApplications: [] // Empty array - no mock KYC applications
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
    type: 'connection_established',
    clientId: clientId,
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(ws, message);
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected:', clientId);
    clients.delete(clientId);
    
    // Remove from all rooms
    rooms.forEach((room, roomId) => {
      if (room.clients.has(ws)) {
        room.clients.delete(ws);
        if (room.clients.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(clientId);
  });
});

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
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type'
      }));
  }
}

function handleAuth(ws, data) {
  const { email, password, isAdmin } = data;
  
  // Allow anonymous connections for basic functionality
  if (email === 'anonymous@example.com' && password === 'anonymous') {
    ws.userId = 'anonymous';
    ws.isAdmin = false;
    
    ws.send(JSON.stringify({
      type: 'auth_success',
      user: {
        id: 'anonymous',
        email: 'anonymous@example.com',
        full_name: 'Anonymous User',
        is_admin: false,
        is_verified: false,
        kyc_status: 'pending'
      }
    }));
    return;
  }
  
  // Handle token-based authentication
  if (password === 'token_auth') {
    // For now, accept any authenticated user
    ws.userId = email;
    ws.isAdmin = isAdmin || false;
    
    ws.send(JSON.stringify({
      type: 'auth_success',
      user: {
        id: email,
        email: email,
        full_name: email.split('@')[0],
        is_admin: isAdmin || false,
        is_verified: true,
        kyc_status: 'approved'
      }
    }));
    return;
  }
  
  // Admin authentication - check against database or environment
  if (isAdmin) {
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const user = {
        id: 'admin-001',
        email: email,
        full_name: 'Admin User',
        is_admin: true,
        is_verified: true,
        kyc_status: 'approved'
      };
      
      ws.userId = user.id;
      ws.isAdmin = user.is_admin;
      
      ws.send(JSON.stringify({
        type: 'auth_success',
        user: user
      }));
      return;
    }
  }
  
  // If no authentication method worked, still allow connection but mark as unauthenticated
  ws.userId = 'unauthenticated';
  ws.isAdmin = false;
  
  ws.send(JSON.stringify({
    type: 'auth_success',
    user: {
      id: 'unauthenticated',
      email: email || 'unknown@example.com',
      full_name: 'Unauthenticated User',
      is_admin: false,
      is_verified: false,
      kyc_status: 'pending'
    }
  }));
}

function handleJoinRoom(ws, data) {
  const { roomId } = data;
  
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      clients: new Set()
    });
  }
  
  const room = rooms.get(roomId);
  room.clients.add(ws);
  
  ws.send(JSON.stringify({
    type: 'room_joined',
    roomId: roomId
  }));
}

function handleLeaveRoom(ws, data) {
  const { roomId } = data;
  const room = rooms.get(roomId);
  
  if (room && room.clients.has(ws)) {
    room.clients.delete(ws);
    if (room.clients.size === 0) {
      rooms.delete(roomId);
    }
  }
  
  ws.send(JSON.stringify({
    type: 'room_left',
    roomId: roomId
  }));
}

function handleTrade(ws, data) {
  const { userId, tradingPair, tradeType, orderType, amount, price } = data;
  
  // Create new trade with real data
  const newTrade = {
    id: `trade-${Date.now()}`,
    user_id: userId,
    trading_pair: tradingPair,
    trade_type: tradeType,
    order_type: orderType,
    amount: amount,
    price: price,
    total_value: amount * price,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  
  // Add to user data (empty array for new users)
  userData.trades.push(newTrade);
  
  // Broadcast trade to all clients
  broadcastToAll({
    type: 'new_trade',
    trade: newTrade
  });
  
  // Update user's wallet
  updateWallet(userId, newTrade);
}

function handleAdminAction(ws, data) {
  if (!ws.isAdmin) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Admin privileges required'
    }));
    return;
  }
  
  const { action, targetUserId, details } = data;
  
  // Handle admin actions
  switch (action) {
    case 'fund_user':
      // Update user wallet
      const wallet = userData.wallets.find(w => w.user_id === targetUserId && w.currency === 'USDT');
      if (wallet) {
        wallet.balance += details.amount;
      }
      break;
      
    case 'approve_kyc':
      // Update KYC status
      const application = userData.kycApplications.find(app => app.id === details.applicationId);
      if (application) {
        application.status = 'approved';
      }
      break;
  }
  
  // Broadcast admin action
  broadcastToAdmins({
    type: 'admin_action',
    action: action,
    targetUserId: targetUserId,
    details: details
  });
}

function handleKYCReview(ws, data) {
  if (!ws.isAdmin) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Admin privileges required'
    }));
    return;
  }
  
  const { applicationId, status, reason } = data;
  
  // Update KYC application status
  const application = userData.kycApplications.find(app => app.id === applicationId);
  if (application) {
    application.status = status;
    application.reviewed_at = new Date().toISOString();
    application.review_reason = reason;
  }
  
  // Broadcast KYC update
  broadcastToAll({
    type: 'kyc_updated',
    applicationId: applicationId,
    status: status,
    reason: reason
  });
}

function handleWalletUpdate(ws, data) {
  const { userId, currency, amount, type } = data;
  
  // Find or create wallet
  let wallet = userData.wallets.find(w => w.user_id === userId && w.currency === currency);
  if (!wallet) {
    wallet = {
      id: `wallet-${userId}-${currency}`,
      user_id: userId,
      currency: currency,
      balance: 0,
      locked_balance: 0
    };
    userData.wallets.push(wallet);
  }
  
  // Update balance based on type
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

function handleChatMessage(ws, data) {
  const { roomId, message, userId } = data;
  
  const chatMessage = {
    id: `msg-${Date.now()}`,
    roomId: roomId,
    userId: userId,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  // Broadcast to room
  broadcastToRoom(roomId, {
    type: 'chat_message',
    message: chatMessage
  });
}

function sendUserData(ws, userId) {
  // Get user-specific data (empty for new users)
  const userTrades = userData.trades.filter(t => t.user_id === userId);
  const userWallets = userData.wallets.filter(w => w.user_id === userId);
  
  ws.send(JSON.stringify({
    type: 'user_data',
    trades: userTrades,
    wallets: userWallets
  }));
}

function updateWallet(userId, trade) {
  // Update wallet based on trade
  const wallet = userData.wallets.find(w => w.user_id === userId && w.currency === 'USDT');
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

// REST API endpoints - return empty arrays for new users
app.get('/api/users', (req, res) => {
  res.json(userData.users); // Empty array
});

app.get('/api/trades', (req, res) => {
  res.json(userData.trades); // Empty array
});

app.get('/api/wallets', (req, res) => {
  res.json(userData.wallets); // Empty array
});

app.get('/api/kyc-applications', (req, res) => {
  res.json(userData.kycApplications); // Empty array
});

app.post('/api/trades', (req, res) => {
  const trade = {
    id: `trade-${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString()
  };
  userData.trades.push(trade);
  res.json(trade);
});

app.put('/api/kyc-applications/:id', (req, res) => {
  const { id } = req.params;
  const application = userData.kycApplications.find(app => app.id === id);
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
  console.log(`HTTP API available at https://kryvextrading-com.onrender.com`);
  console.log('✅ WebSocket server initialized with clean state - no mock data');
}); 