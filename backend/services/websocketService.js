const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const authService = require('./authService');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map to store connected clients
    this.adminClients = new Set(); // Set to store admin clients
  }

  // Initialize WebSocket server
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      clientTracking: true
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    console.log('WebSocket server initialized on /ws path');
  }

  // Handle new WebSocket connection
  async handleConnection(ws, req) {
    try {
      // Extract token from query parameters or headers
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('WebSocket connection rejected: No token provided');
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify token and get user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await authService.getUserById(decoded.id);
      
      if (!user || !user.is_active) {
        console.log('WebSocket connection rejected: Invalid or inactive user');
        ws.close(1008, 'Invalid or inactive user');
        return;
      }

      // Store client connection
      const clientInfo = {
        ws,
        userId: user.id,
        email: user.email,
        isAdmin: user.is_admin,
        connectedAt: new Date()
      };

      this.clients.set(user.id, clientInfo);

      if (user.is_admin) {
        this.adminClients.add(ws);
      }

      // Send welcome message
      this.sendToClient(user.id, {
        type: 'connection',
        message: 'Connected to Kryvex Trading Platform',
        timestamp: new Date().toISOString()
      });

      // Handle client messages
      ws.on('message', (data) => {
        try {
          this.handleMessage(user.id, data);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', (code, reason) => {
        console.log(`WebSocket client disconnected: ${user.email} (${code}: ${reason})`);
        this.handleDisconnect(user.id);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
        this.handleDisconnect(user.id);
      });

      console.log(`✅ WebSocket client connected: ${user.email} (${user.is_admin ? 'Admin' : 'User'})`);

    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  // Handle incoming messages
  handleMessage(userId, data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'ping':
          this.sendToClient(userId, { type: 'pong', timestamp: new Date().toISOString() });
          break;
        
        case 'subscribe':
          // Handle subscription to specific channels
          this.handleSubscription(userId, message);
          break;
        
        case 'unsubscribe':
          // Handle unsubscription from channels
          this.handleUnsubscription(userId, message);
          break;
        
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  // Handle client disconnect
  handleDisconnect(userId) {
    const clientInfo = this.clients.get(userId);
    if (clientInfo) {
      if (clientInfo.isAdmin) {
        this.adminClients.delete(clientInfo.ws);
      }
      this.clients.delete(userId);
      console.log(`Client disconnected: ${clientInfo.email}`);
    }
  }

  // Send message to specific client
  sendToClient(userId, message) {
    const clientInfo = this.clients.get(userId);
    if (clientInfo && clientInfo.ws.readyState === WebSocket.OPEN) {
      try {
        clientInfo.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message to client:', error);
        this.handleDisconnect(userId);
      }
    }
  }

  // Send message to all clients
  sendToAll(message) {
    this.clients.forEach((clientInfo, userId) => {
      this.sendToClient(userId, message);
    });
  }

  // Send message to all admin clients
  sendToAdmins(message) {
    this.adminClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error sending message to admin:', error);
        }
      }
    });
  }

  // Send message to all non-admin clients
  sendToUsers(message) {
    this.clients.forEach((clientInfo, userId) => {
      if (!clientInfo.isAdmin) {
        this.sendToClient(userId, message);
      }
    });
  }

  // Handle subscription to channels
  handleSubscription(userId, message) {
    const clientInfo = this.clients.get(userId);
    if (clientInfo) {
      if (!clientInfo.subscriptions) {
        clientInfo.subscriptions = new Set();
      }
      
      if (message.channel) {
        clientInfo.subscriptions.add(message.channel);
        this.sendToClient(userId, {
          type: 'subscribed',
          channel: message.channel,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // Handle unsubscription from channels
  handleUnsubscription(userId, message) {
    const clientInfo = this.clients.get(userId);
    if (clientInfo && clientInfo.subscriptions) {
      if (message.channel) {
        clientInfo.subscriptions.delete(message.channel);
        this.sendToClient(userId, {
          type: 'unsubscribed',
          channel: message.channel,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // Send notification to specific user
  sendNotification(userId, notification) {
    this.sendToClient(userId, {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }

  // Send notification to all users
  broadcastNotification(notification) {
    this.sendToUsers({
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }

  // Send trade update to user
  sendTradeUpdate(userId, tradeData) {
    this.sendToClient(userId, {
      type: 'trade_update',
      data: tradeData,
      timestamp: new Date().toISOString()
    });
  }

  // Send deposit/withdrawal update to user
  sendTransactionUpdate(userId, transactionData) {
    this.sendToClient(userId, {
      type: 'transaction_update',
      data: transactionData,
      timestamp: new Date().toISOString()
    });
  }

  // Send KYC status update to user
  sendKYCUpdate(userId, kycData) {
    this.sendToClient(userId, {
      type: 'kyc_update',
      data: kycData,
      timestamp: new Date().toISOString()
    });
  }

  // Send system announcement to all users
  sendSystemAnnouncement(announcement) {
    this.sendToAll({
      type: 'system_announcement',
      data: announcement,
      timestamp: new Date().toISOString()
    });
  }

  // Send admin notification to admins
  sendAdminNotification(notification) {
    this.sendToAdmins({
      type: 'admin_notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }

  // Get connected clients info (for admin)
  getConnectedClients() {
    const clients = [];
    this.clients.forEach((clientInfo, userId) => {
      clients.push({
        userId,
        email: clientInfo.email,
        isAdmin: clientInfo.isAdmin,
        connectedAt: clientInfo.connectedAt,
        subscriptions: clientInfo.subscriptions ? Array.from(clientInfo.subscriptions) : []
      });
    });
    return clients;
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      totalConnections: this.clients.size,
      adminConnections: this.adminClients.size,
      userConnections: this.clients.size - this.adminClients.size
    };
  }

  // Broadcast trade result to all users (for live trading)
  broadcastTradeResult(tradeData) {
    this.sendToAll({
      type: 'trade_result',
      data: tradeData,
      timestamp: new Date().toISOString()
    });
  }

  // Send market update to all users
  broadcastMarketUpdate(marketData) {
    this.sendToAll({
      type: 'market_update',
      data: marketData,
      timestamp: new Date().toISOString()
    });
  }

  // Send wallet balance update to specific user
  sendWalletUpdate(userId, walletData) {
    this.sendToClient(userId, {
      type: 'wallet_update',
      data: walletData,
      timestamp: new Date().toISOString()
    });
  }

  // Send chat message to room
  sendChatMessage(roomId, messageData) {
    // This would be implemented based on your chat room logic
    // For now, we'll send to all users
    this.sendToAll({
      type: 'chat_message',
      data: {
        roomId,
        ...messageData
      },
      timestamp: new Date().toISOString()
    });
  }

  // Send admin action notification
  sendAdminActionNotification(actionData) {
    this.sendToAdmins({
      type: 'admin_action',
      data: actionData,
      timestamp: new Date().toISOString()
    });
  }

  // Health check
  healthCheck() {
    return {
      status: 'healthy',
      connections: this.getConnectionStats(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new WebSocketService(); 