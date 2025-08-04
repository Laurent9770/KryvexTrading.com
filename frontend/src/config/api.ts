// API Configuration
export const API_CONFIG = {
  // Base URLs - Production deployment
  BASE_URL: import.meta.env.VITE_API_URL || 'https://kryvextrading-com.onrender.com',
  WS_URL: import.meta.env.VITE_WS_URL || 'wss://kryvextrading-com.onrender.com',
  
  // API Endpoints
  ENDPOINTS: {
    // Auth
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      VERIFY: '/api/auth/verify',
    },
    
    // Users
    USERS: {
      PROFILE: '/api/users/profile',
      UPDATE: '/api/users/update',
      KYC: '/api/users/kyc',
    },
    
    // Wallets
    WALLETS: {
      BALANCE: '/api/wallets/balance',
      TRANSACTIONS: '/api/wallets/transactions',
      DEPOSIT: '/api/wallets/deposit',
      WITHDRAW: '/api/wallets/withdraw',
    },
    
    // Trading
    TRADING: {
      ORDERS: '/api/trading/orders',
      POSITIONS: '/api/trading/positions',
      HISTORY: '/api/trading/history',
      PLACE_ORDER: '/api/trading/place-order',
    },
    
    // KYC
    KYC: {
      SUBMIT: '/api/kyc/submit',
      STATUS: '/api/kyc/status',
      DOCUMENTS: '/api/kyc/documents',
    },
    
    // Admin
    ADMIN: {
      USERS: '/api/admin/users',
      AUDIT: '/api/admin/audit',
      WALLET_ADJUSTMENTS: '/api/admin/wallet-adjustments',
      KYC_REVIEWS: '/api/admin/kyc-reviews',
    },
    
    // Chat
    CHAT: {
      MESSAGES: '/api/chat/messages',
      ROOMS: '/api/chat/rooms',
      USERS: '/api/chat/users',
    },
    
    // Market
    MARKET: {
      PRICES: '/api/market/prices',
      STATS: '/api/market/stats',
      NEWS: '/api/market/news',
    },
    
    // Health
    HEALTH: '/api/health',
  },
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Timeouts
  TIMEOUT: 10000, // 10 seconds
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 second
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get WebSocket URL
export const getWebSocketUrl = (): string => {
  return API_CONFIG.WS_URL;
};

// Helper function to get auth headers
export const getAuthHeaders = (token?: string) => {
  const headers = { ...API_CONFIG.DEFAULT_HEADERS };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}; 