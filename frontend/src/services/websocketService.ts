import { getWebSocketUrl } from '@/config/api';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();
  private messageQueue: any[] = [];
  private isConnecting = false;
  private isConnected = false;
  private userId: string | null = null;
  private isAdmin = false;
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.connect();
  }

  private getWebSocketUrl(): string {
    // Use environment variable in production, fallback to localhost in development
    if (import.meta.env.PROD) {
      return import.meta.env.VITE_WS_URL || 'wss://your-backend-domain.com';
    }
    return getWebSocketUrl();
  }

  private connect() {
    if (this.isConnecting) return;
    
    this.isConnecting = true;
    const wsUrl = this.getWebSocketUrl();
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        this.startRealTimeUpdates();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.emit('disconnected');
        this.stopRealTimeUpdates();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private startRealTimeUpdates() {
    // Simulate price updates every 5 seconds
    this.priceUpdateInterval = setInterval(() => {
      this.simulatePriceUpdates();
    }, 5000);
  }

  private stopRealTimeUpdates() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }
  }

  private simulatePriceUpdates() {
    const assets = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP'];
    const updates = assets.map(asset => {
      const basePrice = this.getBasePrice(asset);
      const change = (Math.random() - 0.5) * 0.02; // ±1% change
      const newPrice = basePrice * (1 + change);
      
      return {
        symbol: asset,
        price: newPrice,
        change: change * 100,
        volume: Math.random() * 1000 + 100,
        timestamp: new Date().toISOString()
      };
    });

    this.emit('price_updates', updates);
  }

  private getBasePrice(asset: string): number {
    const prices: { [key: string]: number } = {
      BTC: 48500,
      ETH: 3200,
      USDT: 1,
      SOL: 485,
      ADA: 1,
      XRP: 2.34
    };
    return prices[asset] || 0;
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleMessage(data: any) {
    console.log('Received WebSocket message:', data);
    
    try {
      switch (data.type) {
        case 'connection':
          console.log('Connected to server:', data.message);
          break;
          
        case 'auth_success':
          if (data.user && typeof data.user === 'object') {
            this.userId = data.user.id;
            this.isAdmin = data.user.is_admin === true;
            this.emit('auth_success', data);
          } else {
            console.error('Invalid auth_success data:', data);
          }
          break;
          
        case 'auth_error':
          this.emit('auth_error', data.message || 'Authentication failed');
          break;
          
        case 'user_data':
          this.emit('user_data', data);
          break;
          
        case 'trade_created':
          this.emit('trade_created', data.trade);
          break;
          
        case 'wallet_updated':
          console.log('WebSocketService: Received wallet_updated event:', data);
          this.emit('wallet_updated', data);
          break;
          
        case 'kyc_updated':
          this.emit('kyc_updated', data.application);
          break;
          
        case 'admin_action':
          this.emit('admin_action', data);
          break;
          
        case 'chat_message':
          this.emit('chat_message', data.message);
          break;
          
        case 'room_joined':
          this.emit('room_joined', data.room);
          break;
          
        case 'room_left':
          this.emit('room_left', data.room);
          break;
           
        case 'room_created':
          this.emit('room_created', data);
          break;
           
        case 'user_added_to_room':
          this.emit('user_added_to_room', data);
          break;
           
        case 'added_to_room':
          this.emit('added_to_room', data);
          break;
           
        case 'user_rooms':
          this.emit('user_rooms', data.rooms);
          break;
           
        case 'all_rooms':
          this.emit('all_rooms', data.rooms);
          break;
          
        case 'price_update':
          this.emit('price_update', data.price);
          break;
          
        case 'market_update':
          this.emit('market_update', data.market);
          break;
          
        case 'balance_update':
          this.emit('balance_update', data.balance);
          break;
          
        case 'order_update':
          this.emit('order_update', data.order);
          break;
          
        case 'notification':
          this.emit('notification', data.notification);
          break;
          
        case 'user_registered':
          console.log('WebSocketService: Received user_registered event:', data);
          this.emit('user_registered', data);
          break;
          
        case 'kyc_level_updated':
          console.log('WebSocketService: Received kyc_level_updated event:', data);
          this.emit('kyc_level_updated', data);
          break;
          
        case 'kyc_submission_created':
          console.log('WebSocketService: Received kyc_submission_created event:', data);
          this.emit('kyc_submission_created', data);
          break;
          
        case 'trade_completed':
          console.log('WebSocketService: Received trade_completed event:', data);
          this.emit('trade_completed', data);
          break;
          
        case 'kyc_status_updated':
          console.log('WebSocketService: Received kyc_status_updated event:', data);
          this.emit('kyc_status_updated', data);
          break;
          
        case 'deposit_request':
          console.log('WebSocketService: Received deposit_request event:', data);
          this.emit('deposit_request', data);
          break;
          
        case 'withdrawal_request':
          console.log('WebSocketService: Received withdrawal_request event:', data);
          this.emit('withdrawal_request', data);
          break;
          
        case 'deposit_status_updated':
          console.log('WebSocketService: Received deposit_status_updated event:', data);
          this.emit('deposit_status_updated', data);
          break;
          
        case 'withdrawal_status_updated':
          console.log('WebSocketService: Received withdrawal_status_updated event:', data);
          this.emit('withdrawal_status_updated', data);
          break;
          
        case 'trade_started':
          console.log('WebSocketService: Received trade_started event:', data);
          this.emit('trade_started', data);
          break;
          
        case 'user_updated':
          console.log('WebSocketService: Received user_updated event:', data);
          this.emit('user_updated', data);
          break;
          
        default:
          console.log('Unknown WebSocket message type:', data.type);
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  // Authentication
  authenticate(email: string, password: string) {
    this.send({
      type: 'auth',
      email,
      password
    });
  }

  // Room management
  createRoom(roomId: string, roomName: string, isAdminOnly: boolean = false) {
    this.send({
      type: 'create_room',
      roomId,
      roomName,
      isAdminOnly,
      userId: this.userId,
      isAdmin: this.isAdmin
    });
  }

  addUserToRoom(adminId: string, targetUserId: string, roomId: string) {
    this.send({
      type: 'add_user_to_room',
      adminId,
      targetUserId,
      roomId
    });
  }

  joinRoom(room: string) {
    this.send({
      type: 'join_room',
      room,
      userId: this.userId
    });
  }

  leaveRoom(room: string) {
    this.send({
      type: 'leave_room',
      room,
      userId: this.userId
    });
  }

  getUserRooms() {
    this.send({
      type: 'get_user_rooms',
      userId: this.userId
    });
  }

  getAllRooms() {
    this.send({
      type: 'get_all_rooms',
      userId: this.userId,
      isAdmin: this.isAdmin
    });
  }

  // Trading
  createTrade(trade: any) {
    this.send({
      type: 'trade',
      trade
    });
  }

  // Admin actions
  performAdminAction(action: string, targetUserId: string, details: any) {
    this.send({
      type: 'admin_action',
      action,
      targetUserId,
      details
    });
  }

  // KYC review
  reviewKYC(applicationId: string, status: string, verificationLevel: string, notes: string) {
    this.send({
      type: 'kyc_review',
      applicationId,
      status,
      verificationLevel,
      notes
    });
  }

  updateProfile(userId: string, profileData: any) {
    this.send({
      type: 'profile_update',
      userId,
      profileData,
      timestamp: new Date().toISOString()
    });
  }

  updateSecuritySettings(userId: string, securityData: any) {
    this.send({
      type: 'security_update',
      userId,
      securityData,
      timestamp: new Date().toISOString()
    });
  }

  updateNotificationPreferences(userId: string, notificationData: any) {
    this.send({
      type: 'notification_update',
      userId,
      notificationData,
      timestamp: new Date().toISOString()
    });
  }

  updateDisplayPreferences(userId: string, displayData: any) {
    this.send({
      type: 'display_update',
      userId,
      displayData,
      timestamp: new Date().toISOString()
    });
  }

  updateKYCStatus(userId: string, kycData: any) {
    this.send({
      type: 'kyc_status_update',
      userId,
      kycData,
      timestamp: new Date().toISOString()
    });
  }

  notifyKYCSubmission(submissionId: string, data: any) {
    this.send({
      type: 'kyc_submission',
      submissionId,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Wallet updates
  updateWallet(userId: string, currency: string, amount: number, operation: 'add' | 'subtract') {
    this.send({
      type: 'wallet_update',
      userId,
      currency,
      amount,
      operation
    });
  }

  // Chat
  sendChatMessage(message: string, room: string, userName?: string, messageType?: string) {
    this.send({
      type: 'chat_message',
      message,
      room,
      userName,
      messageType,
      userId: this.userId
    });
  }

  // Subscribe to real-time data
  subscribeToPrices(symbols: string[]) {
    this.send({
      type: 'subscribe_prices',
      symbols
    });
  }

  subscribeToMarketData(markets: string[]) {
    this.send({
      type: 'subscribe_market_data',
      markets
    });
  }

  subscribeToUserData(userId: string) {
    this.send({
      type: 'subscribe_user_data',
      userId
    });
  }

  // Notify admin about user registration
  notifyUserRegistration(user: any) {
    console.log('Sending user registration notification:', user);
    this.send({
      type: 'user_registered',
      user,
      timestamp: new Date().toISOString()
    });
  }

  // Utility methods
  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
      this.messageQueue.push(data); // Queue messages if not connected
    }
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

  // Getters
  get connected() {
    return this.isConnected;
  }

  get user() {
    return this.userId;
  }

  get admin() {
    return this.isAdmin;
  }

  // Disconnect
  disconnect() {
    this.stopRealTimeUpdates();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();
export default websocketService; 