import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import websocketService from '../services/websocketService';
import tradingEngine from '../services/tradingEngine';
import activityService, { ActivityItem } from '../services/activityService';
import kycService from '../services/kycService'; // Added import for kycService
import userSessionService from '../services/userSessionService'; // Added import for userSessionService
import { toast } from '../components/ui/use-toast'; // Added import for toast

interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  bio?: string;
  avatar?: string;
  
  // New 2-level KYC system
  kycLevel1?: {
    status: 'unverified' | 'verified';
    verifiedAt?: string;
  };
  kycLevel2?: {
    status: 'not_started' | 'pending' | 'approved' | 'rejected';
    submittedAt?: string;
    reviewedAt?: string;
    rejectionReason?: string;
    documents?: {
      fullName: string;
      dateOfBirth: string;
      country: string;
      idType: string;
      idNumber: string;
      frontUrl?: string;
      backUrl?: string;
      selfieUrl?: string;
    };
  };
  
  // Legacy KYC status for backward compatibility
  kycStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  kycSubmittedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, firstName: string, lastName: string, phone: string) => Promise<void>;
  updateUserProfile: (profileData: Partial<User>) => void;
  
  // Admin access control
  checkAdminAccess: () => boolean;
  requireAdmin: () => boolean;
  
  // Helper functions
  isUserRegistered: (email: string) => boolean;
  
  // Global state for real-time updates
  tradingAccount: { [key: string]: { balance: string; usdValue: string; available: string } };
  fundingAccount: { USDT: { balance: string; usdValue: string; available: string } };
  activityFeed: ActivityItem[];
  tradingHistory: any[];
  portfolioStats: {
    totalBalance: string;
    totalPnl: string;
    pnlPercentage: string;
    totalTrades: number;
    winRate: string;
    activePositions: number;
  };
  
  // Real-time price data
  realTimePrices: { [key: string]: { price: number; change: number; volume: number; timestamp: string } };
  
  // Global update functions
  updateTradingBalance: (asset: string, amount: number, operation: 'add' | 'subtract') => void;
  updateFundingBalance: (amount: number, operation: 'add' | 'subtract') => void;
  addActivity: (activity: Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'>) => void;
  addTrade: (trade: any) => void;
  updatePortfolioStats: () => void;
  updateRealTimePrice: (symbol: string, price: number, change: number, volume: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize user from localStorage or sessionStorage on app load
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Check localStorage first (persistent login)
        const savedUser = localStorage.getItem('authUser');
        if (savedUser) {
          return JSON.parse(savedUser);
        }
        
        // Check sessionStorage (session login)
        const sessionUser = sessionStorage.getItem('authUser');
        if (sessionUser) {
          return JSON.parse(sessionUser);
        }
      }
    } catch (error) {
      console.warn('Error accessing storage:', error);
    }
    return null;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize authentication state from localStorage or sessionStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Check localStorage first (persistent login)
        if (localStorage.getItem('authToken')) {
          return true;
        }
        
        // Check sessionStorage (session login)
        if (sessionStorage.getItem('authToken')) {
          return true;
        }
      }
    } catch (error) {
      console.warn('Error accessing storage:', error);
    }
    return false;
  });
  
  const [isAdmin, setIsAdmin] = useState(() => {
    // Initialize admin state from localStorage or sessionStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Check localStorage first (persistent login)
        const localStorageAdmin = localStorage.getItem('authIsAdmin');
        if (localStorageAdmin) {
          return localStorageAdmin === 'true';
        }
        
        // Check sessionStorage (session login)
        const sessionStorageAdmin = sessionStorage.getItem('authIsAdmin');
        if (sessionStorageAdmin) {
          return sessionStorageAdmin === 'true';
        }
      }
    } catch (error) {
      console.warn('Error accessing storage:', error);
    }
    return false;
  });

  // Global state for real-time updates - Start with clean data for new users
  const [tradingAccount, setTradingAccount] = useState({
    USDT: { balance: "0.00", usdValue: "$0.00", available: "0.00" }
  });

  const [fundingAccount, setFundingAccount] = useState({
    USDT: { balance: "0.00", usdValue: "$0.00", available: "0.00" }
  });

  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);

  const [tradingHistory, setTradingHistory] = useState<any[]>([]);

  const [portfolioStats, setPortfolioStats] = useState({
    totalBalance: "$0.00",
    totalPnl: "$0.00",
    pnlPercentage: "0.0%",
    totalTrades: 0,
    winRate: "0.0%",
    activePositions: 0
  });

  // Real-time price data
  const [realTimePrices, setRealTimePrices] = useState<{ [key: string]: { price: number; change: number; volume: number; timestamp: string } }>({
    BTC: { price: 48500, change: 2.45, volume: 342000000, timestamp: new Date().toISOString() },
    ETH: { price: 3200, change: -1.23, volume: 187000000, timestamp: new Date().toISOString() },
    SOL: { price: 485, change: 6.78, volume: 76000000, timestamp: new Date().toISOString() },
    ADA: { price: 1, change: 0.5, volume: 45000000, timestamp: new Date().toISOString() },
    XRP: { price: 2.34, change: 15.67, volume: 98000000, timestamp: new Date().toISOString() },
    USDT: { price: 1, change: 0, volume: 1000000000, timestamp: new Date().toISOString() }
  });

  // TODO: Implement real API call to get asset prices
  const getAssetPrice = (asset: string): number => {
    // TODO: Replace with real API call
    // const response = await fetch(`/api/prices/${asset}`);
    // const data = await response.json();
    // return data.price;
    
    // For now, return 0 until real API is implemented
    return 0;
  };

  // Function to update trading account balance
  const updateTradingBalance = (asset: string, amount: number, operation: 'add' | 'subtract') => {
    setTradingAccount(prev => {
      const current = prev[asset as keyof typeof prev];
      if (!current) return prev;

      const currentBalance = parseFloat(current.balance.replace(/,/g, ''));
      const currentAvailable = parseFloat(current.available.replace(/,/g, ''));
      
      let newBalance, newAvailable;
      if (operation === 'add') {
        newBalance = currentBalance + amount;
        newAvailable = currentAvailable + amount;
      } else {
        newBalance = Math.max(0, currentBalance - amount);
        newAvailable = Math.max(0, currentAvailable - amount);
      }

      const newUsdValue = (newBalance * getAssetPrice(asset)).toFixed(2);

      return {
        ...prev,
        [asset]: {
          balance: newBalance.toFixed(8),
          usdValue: `$${newUsdValue}`,
          available: newAvailable.toFixed(8)
        }
      };
    });
  };

  // Function to update funding account balance
  const updateFundingBalance = (amount: number, operation: 'add' | 'subtract') => {
    setFundingAccount(prev => {
      const current = prev.USDT;
      const currentBalance = parseFloat(current.balance.replace(/,/g, ''));
      const currentAvailable = parseFloat(current.available.replace(/,/g, ''));

      let newBalance, newAvailable;
      if (operation === 'add') {
        newBalance = currentBalance + amount;
        newAvailable = currentAvailable + amount;
      } else {
        newBalance = Math.max(0, currentBalance - amount);
        newAvailable = Math.max(0, currentAvailable - amount);
      }

      return {
        USDT: {
          balance: newBalance.toFixed(2),
          usdValue: `$${newBalance.toFixed(2)}`,
          available: newAvailable.toFixed(2)
        }
      };
    });
  };

  // Function to add new activity
  const addActivity = (activity: Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'>) => {
    if (user?.id) {
      const newActivity = activityService.addActivity(user.id, activity);
      setActivityFeed(activityService.getUserActivities(user.id));
    }
  };

  // Function to add new trade
  const addTrade = (trade: any) => {
    const newTrade = {
      ...trade,
      id: Date.now(),
      date: new Date().toLocaleDateString('en-GB')
    };
    setTradingHistory(prev => [newTrade, ...prev.slice(0, 49)]); // Keep last 50 trades
  };

  // Function to update portfolio stats
  const updatePortfolioStats = () => {
    const totalBalance = Object.values(tradingAccount).reduce((sum, asset) => {
      return sum + parseFloat(asset.usdValue.replace('$', '').replace(',', ''));
    }, 0) + parseFloat(fundingAccount.USDT.usdValue.replace('$', '').replace(',', ''));

    const totalPnl = Object.values(tradingAccount).reduce((sum, asset) => {
      // TODO: Implement real P&L calculation from API
      // For now, return 0 until real calculation is implemented
      return sum + 0;
    }, 0);

    setPortfolioStats(prev => ({
      ...prev,
      totalBalance: `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalPnl: `+$${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      pnlPercentage: `+${((totalPnl / totalBalance) * 100).toFixed(1)}%`
    }));
  };

  // Function to update real-time prices
  const updateRealTimePrice = (symbol: string, price: number, change: number, volume: number) => {
    setRealTimePrices(prev => ({
      ...prev,
      [symbol]: {
        price,
        change,
        volume,
        timestamp: new Date().toISOString()
      }
    }));
  };

  // Auto-login effect - check for existing auth token on app load
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('authUser');
        
        if (token && savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            setIsAuthenticated(true);
            setIsAdmin(localStorage.getItem('authIsAdmin') === 'true');
            
            // WebSocket is already connected by default, no need to reconnect
            console.log('Auto-login successful for user:', userData.email);
          } catch (error) {
            console.error('Error during auto-login:', error);
            // Clear invalid data
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
                localStorage.removeItem('authIsAdmin');
              }
            } catch (clearError) {
              console.warn('Error clearing localStorage:', clearError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage during auto-login:', error);
    }
  }, []);

  // WebSocket event handlers for admin updates
  useEffect(() => {
    // Listen for admin actions that affect user data
    websocketService.on('admin_user_update', (data: any) => {
      console.log('Admin updated user data:', data);
      // Handle admin updates to user data
      if (data.userId === user?.id) {
        // Update local state based on admin changes
        if (data.type === 'wallet_update') {
          // Update wallet balances
          if (data.currency === 'USDT') {
            setFundingAccount(prev => ({
              ...prev,
              USDT: {
                balance: data.newBalance.toFixed(2),
                usdValue: `$${data.newBalance.toFixed(2)}`,
                available: data.newAvailable.toFixed(2)
              }
            }));
          }
        }
      }
    });

    // Listen for new user registrations (admin only)
    websocketService.on('user_registered', (data: any) => {
      console.log('New user registered:', data);
      // This event is for admin panel updates
    });

    // Listen for profile updates (admin only)
    websocketService.on('profile_updated', (data: any) => {
      console.log('Profile updated:', data);
      // This event is for admin panel updates
    });

    return () => {
      websocketService.off('admin_user_update', () => {});
      websocketService.off('user_registered', () => {});
      websocketService.off('profile_updated', () => {});
    };
  }, [user?.id]);

  // Update portfolio stats when balances change
  useEffect(() => {
    updatePortfolioStats();
  }, [tradingAccount, fundingAccount]);

  // Initialize trading engine with auth context
  useEffect(() => {
    tradingEngine.setAuthContext({
      tradingAccount,
      updateTradingBalance
    });
  }, [tradingAccount, updateTradingBalance]);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    const handleAuthSuccess = (data: any) => {
      console.log('Auth success:', data);
      
      // Load persisted user data from localStorage with safety checks
      let persistedUserData: any = {};
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const persistedProfile = localStorage.getItem('userProfile');
          if (persistedProfile) {
            persistedUserData = JSON.parse(persistedProfile);
          }
        }
      } catch (error) {
        console.error('Error loading persisted user data:', error);
      }
      
      const userData = {
        id: data.user.id,
        email: data.user.email,
        username: data.user.email.split('@')[0],
        firstName: persistedUserData.firstName || 'John',
        lastName: persistedUserData.lastName || 'Trader',
        phone: persistedUserData.phone || '+1 (555) 123-4567',
        country: persistedUserData.country || 'United States',
        bio: persistedUserData.bio || 'Professional crypto trader with 5+ years of experience.',
        avatar: persistedUserData.avatar || undefined
      };
      
      // Persist authentication data to localStorage with safety checks
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const mockToken = 'mock-jwt-token-' + Date.now();
          localStorage.setItem('authToken', mockToken);
          localStorage.setItem('authUser', JSON.stringify(userData));
          localStorage.setItem('authIsAdmin', (data.user.is_admin || false).toString());
        }
      } catch (localStorageError) {
        console.warn('Error persisting to localStorage:', localStorageError);
      }
      
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(data.user.is_admin || false);
      
      // Load user activities
      setActivityFeed(activityService.getUserActivities(userData.id));
      
      // Add initial activity if user has no activities
      if (activityService.getUserActivities(userData.id).length === 0) {
        const initialActivity = {
          type: 'reset' as const,
          action: 'ACCOUNT_RESET',
          description: 'Reset to 1,000 USDT',
          amount: '1,000 USDT',
          status: 'completed' as const,
          icon: '🔄'
        };
        activityService.addActivity(userData.id, initialActivity);
        setActivityFeed(activityService.getUserActivities(userData.id));
      }
      
      // Set trading engine auth context
      tradingEngine.setAuthContext({ user: userData, isAdmin: data.user.is_admin || false });
    };

    const handleAuthError = (error: any) => {
      console.error('Auth error:', error);
      
      // Clear authentication data from localStorage with safety checks
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          localStorage.removeItem('authIsAdmin');
        }
      } catch (localStorageError) {
        console.warn('Error clearing localStorage:', localStorageError);
      }
      
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
    };

    const handlePriceUpdates = (updates: any[]) => {
      updates.forEach(update => {
        updateRealTimePrice(update.symbol, update.price, update.change, update.volume);
      });
    };

    const handleTradeEvent = (tradeEvent: any) => {
      addActivity(tradeEvent);
      addTrade({
        pair: tradeEvent.symbol,
        type: tradeEvent.action.toLowerCase(),
        amount: tradeEvent.amount.split(' ')[0],
        price: tradeEvent.price,
        pnl: tradeEvent.pnl,
        status: tradeEvent.status
      });
    };

    const handleBalanceUpdate = (balanceUpdate: any) => {
      if (balanceUpdate.type === 'trading') {
        updateTradingBalance(balanceUpdate.asset, balanceUpdate.amount, balanceUpdate.operation);
      } else if (balanceUpdate.type === 'funding') {
        updateFundingBalance(balanceUpdate.amount, balanceUpdate.operation);
      }
    };

    const handleNotification = (notification: any) => {
      console.log('Received notification:', notification);
      // Handle notifications (could show toast, update UI, etc.)
    };

    // Set up WebSocket event listeners
    websocketService.on('auth_success', handleAuthSuccess);
    websocketService.on('auth_error', handleAuthError);
    websocketService.on('price_updates', handlePriceUpdates);
    websocketService.on('trade_event', handleTradeEvent);
    websocketService.on('balance_update', handleBalanceUpdate);
    websocketService.on('notification', handleNotification);

    return () => {
      websocketService.off('auth_success', handleAuthSuccess);
      websocketService.off('auth_error', handleAuthError);
      websocketService.off('price_updates', handlePriceUpdates);
      websocketService.off('trade_event', handleTradeEvent);
      websocketService.off('balance_update', handleBalanceUpdate);
      websocketService.off('notification', handleNotification);
    };
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      // Check for admin credentials
      if (email === 'admin@kryvex.com' && password === 'Kryvex.@123') {
        const adminUser = {
          id: 'admin-001',
          email: 'admin@kryvex.com',
          username: 'admin',
          firstName: 'Admin',
          lastName: 'Kryvex'
        };
        
        const mockToken = 'admin-jwt-token-' + Date.now();
        
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            // Use localStorage for admin (always persistent)
            localStorage.setItem('authToken', mockToken);
            localStorage.setItem('authUser', JSON.stringify(adminUser));
            localStorage.setItem('authIsAdmin', 'true');
          }
        } catch (localStorageError) {
          console.warn('Error persisting to localStorage:', localStorageError);
        }
        
        setUser(adminUser);
        setIsAuthenticated(true);
        setIsAdmin(true);
        
        websocketService.authenticate(email, password);
        
        console.log('Admin login successful');
        return;
      }
      
      // Check if user exists in registeredUsers (real registration)
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
          const user = registeredUsers.find((u: any) => u.email === email && u.password === password);
          
          if (!user) {
            throw new Error('Invalid credentials. Please register first.');
          }
          
          // Create clean user object without password for session
          const sessionUser = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            username: user.username,
            country: user.country || '',
            bio: user.bio || '',
            avatar: user.avatar || '',
            kycStatus: user.kycStatus || 'unverified',
            walletBalance: user.walletBalance || 0
          };
          
          const mockToken = 'user-jwt-token-' + Date.now();
          
          // Use appropriate storage based on rememberMe preference
          if (rememberMe) {
            localStorage.setItem('authToken', mockToken);
            localStorage.setItem('authUser', JSON.stringify(sessionUser));
            localStorage.setItem('authIsAdmin', 'false');
            console.log('User login successful (persistent):', sessionUser.email);
          } else {
            sessionStorage.setItem('authToken', mockToken);
            sessionStorage.setItem('authUser', JSON.stringify(sessionUser));
            sessionStorage.setItem('authIsAdmin', 'false');
            console.log('User login successful (session):', sessionUser.email);
          }
          
          setUser(sessionUser);
          setIsAuthenticated(true);
          setIsAdmin(false);
          
          // Sync user's wallet balance to trading account
          if (sessionUser.walletBalance && sessionUser.walletBalance > 0) {
            // Update trading account with user's wallet balance
            setTradingAccount(prev => ({
              ...prev,
              USDT: {
                balance: sessionUser.walletBalance.toFixed(8),
                usdValue: `$${sessionUser.walletBalance.toFixed(2)}`,
                available: sessionUser.walletBalance.toFixed(8)
              }
            }));
            
            // Also update funding account
            setFundingAccount(prev => ({
              USDT: {
                balance: sessionUser.walletBalance.toFixed(2),
                usdValue: `$${sessionUser.walletBalance.toFixed(2)}`,
                available: sessionUser.walletBalance.toFixed(2)
              }
            }));
          }
          
          // Create user session for tracking
          const sessionToken = mockToken;
          const ipAddress = '127.0.0.1'; // In real app, get from request
          const userAgent = navigator.userAgent;
          userSessionService.createSession(
            sessionUser.id,
            sessionUser.username || `${sessionUser.firstName} ${sessionUser.lastName}`,
            sessionUser.email,
            sessionToken,
            ipAddress,
            userAgent
          );
          
          websocketService.authenticate(email, password);
          
          return;
        }
      } catch (localStorageError) {
        console.warn('Error accessing localStorage:', localStorageError);
      }
      
      throw new Error('Invalid credentials. Please register first.');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
    try {
      // TODO: Implement real API call for registration
      console.log('Registering user:', { email, firstName, lastName, phone });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create user object
      const newUser = {
        id: `user-${Date.now()}`,
        email,
        firstName,
        lastName,
        phone,
        username: `${firstName} ${lastName}`,
        country: '',
        bio: '',
        avatar: '',
        // Initialize new KYC system
        kycLevel1: {
          status: 'unverified' as const
        },
        kycLevel2: {
          status: 'not_started' as const
        },
        // Legacy KYC for backward compatibility
        kycStatus: 'unverified' as const,
        createdAt: new Date().toISOString()
      };
      
      // Store in localStorage for demo
      const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      existingUsers.push({ ...newUser, password }); // Include password for login
      localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
      
      // Set session without password
      const sessionUser = { ...newUser };
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('authToken', 'user-jwt-token-' + Date.now());
        sessionStorage.setItem('authUser', JSON.stringify(sessionUser));
        sessionStorage.setItem('authIsAdmin', 'false');
      }
      
      setUser(sessionUser);
      setIsAuthenticated(true);
      setIsAdmin(false);
      
      // Send verification email automatically
      try {
        await kycService.sendVerificationEmail(email);
        console.log('Verification email sent to:', email);
      } catch (error) {
        console.warn('Failed to send verification email:', error);
      }
      
      // Emit real-time update to admin
      websocketService.notifyUserRegistration(newUser);
      
      toast({
        title: "Registration Successful",
        description: "Account created successfully. Please check your email for verification.",
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Failed to create account. Please try again."
      });
      throw error;
    }
  };

  const logout = () => {
    // Clear session data from both localStorage and sessionStorage, keep registered users
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear localStorage session data
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        localStorage.removeItem('authIsAdmin');
        
        // Clear sessionStorage session data
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authUser');
        sessionStorage.removeItem('authIsAdmin');
        
        // Note: We keep 'registeredUsers' so users can login again
      }
    } catch (localStorageError) {
      console.warn('Error clearing storage:', localStorageError);
    }
    
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    websocketService.disconnect();
    
    console.log('Logout successful, session data cleared (registered users preserved)');
  };

  const updateUserProfile = (profileData: Partial<User>) => {
    setUser(prev => {
      if (prev) {
        const updatedUser = { ...prev, ...profileData };
        // Persist updated user data to localStorage with safety checks
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('authUser', JSON.stringify(updatedUser));
          }
        } catch (localStorageError) {
          console.warn('Error persisting user profile to localStorage:', localStorageError);
        }
        
        // Notify admin panel about profile update
        websocketService.updateProfile(prev.id, profileData);
        
        return updatedUser;
      }
      return null;
    });
  };

  const checkAdminAccess = () => {
    return isAdmin;
  };

  const requireAdmin = () => {
    if (!isAdmin) {
      console.error('Access denied: Admin privileges required.');
      return false;
    }
    return true;
  };

  // Helper function to check if user is already registered
  const isUserRegistered = (email: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        return registeredUsers.some((u: any) => u.email === email);
      }
    } catch (error) {
      console.warn('Error checking user registration:', error);
    }
    return false;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    register,
    updateUserProfile,
    checkAdminAccess,
    requireAdmin,
    isUserRegistered,
    tradingAccount,
    fundingAccount,
    activityFeed,
    tradingHistory,
    portfolioStats,
    realTimePrices,
    updateTradingBalance,
    updateFundingBalance,
    addActivity,
    addTrade,
    updatePortfolioStats,
    updateRealTimePrice
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};