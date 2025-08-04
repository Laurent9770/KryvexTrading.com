import { API_CONFIG, getApiUrl, getAuthHeaders } from '@/config/api';

class ApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = getApiUrl(endpoint);
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: getAuthHeaders(token),
      ...options,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.get(API_CONFIG.ENDPOINTS.HEALTH);
  }

  // Auth methods
  async login(email: string, password: string): Promise<any> {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, { email, password });
  }

  async register(userData: any): Promise<any> {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
  }

  async logout(): Promise<any> {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
  }

  // User methods
  async getUserProfile(): Promise<any> {
    return this.get(API_CONFIG.ENDPOINTS.USERS.PROFILE);
  }

  async updateUserProfile(profileData: any): Promise<any> {
    return this.put(API_CONFIG.ENDPOINTS.USERS.UPDATE, profileData);
  }

  // Wallet methods
  async getWalletBalance(): Promise<any> {
    return this.get(API_CONFIG.ENDPOINTS.WALLETS.BALANCE);
  }

  async getWalletTransactions(): Promise<any> {
    return this.get(API_CONFIG.ENDPOINTS.WALLETS.TRANSACTIONS);
  }

  // Trading methods
  async getTradingHistory(): Promise<any> {
    return this.get(API_CONFIG.ENDPOINTS.TRADING.HISTORY);
  }

  async placeOrder(orderData: any): Promise<any> {
    return this.post(API_CONFIG.ENDPOINTS.TRADING.PLACE_ORDER, orderData);
  }

  // KYC methods
  async submitKYC(kycData: any): Promise<any> {
    return this.post(API_CONFIG.ENDPOINTS.KYC.SUBMIT, kycData);
  }

  async getKYCStatus(): Promise<any> {
    return this.get(API_CONFIG.ENDPOINTS.KYC.STATUS);
  }

  // Admin methods
  async getAdminUsers(): Promise<any> {
    return this.get(API_CONFIG.ENDPOINTS.ADMIN.USERS);
  }

  async getAdminAudit(): Promise<any> {
    return this.get(API_CONFIG.ENDPOINTS.ADMIN.AUDIT);
  }

  // Chat methods
  async getChatMessages(roomId: string): Promise<any> {
    return this.get(`${API_CONFIG.ENDPOINTS.CHAT.MESSAGES}/${roomId}`);
  }

  async getChatRooms(): Promise<any> {
    return this.get(API_CONFIG.ENDPOINTS.CHAT.ROOMS);
  }

  // Market methods
  async getMarketPrices(): Promise<any> {
    return this.get(API_CONFIG.ENDPOINTS.MARKET.PRICES);
  }

  async getMarketStats(): Promise<any> {
    return this.get(API_CONFIG.ENDPOINTS.MARKET.STATS);
  }
}

// Create singleton instance
const apiService = new ApiService();
export default apiService; 