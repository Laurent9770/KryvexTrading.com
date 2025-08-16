import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import supabaseAuthService, { AuthUser, AuthState } from '@/services/supabaseAuthService';
import supabase from '@/lib/supabaseClient';
import walletSyncService from '@/services/walletSyncService';

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
  walletBalance?: number;
  
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

interface ActivityItem {
  id: string;
  userId: string;
  type: 'login' | 'logout' | 'trade' | 'deposit' | 'withdrawal' | 'kyc_submitted' | 'kyc_approved' | 'kyc_rejected';
  description: string;
  amount?: number;
  currency?: string;
  timestamp: string;
  time: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPhoneOTP: (phoneNumber: string) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  loginWithPhone: (sessionId: string, otp: string, phoneNumber: string) => Promise<void>;
  resendPhoneOTP: (sessionId: string, phoneNumber: string) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  sendKYCEmailVerification: (email: string) => Promise<{ success: boolean; verificationId?: string; error?: string }>;
  verifyKYCEmailCode: (verificationId: string, code: string, email: string) => Promise<{ success: boolean; error?: string }>;
  resendKYCEmailVerification: (verificationId: string) => Promise<{ success: boolean; verificationId?: string; error?: string }>;
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
  
  // Wallet state
  walletLoading: boolean;
  walletError: string | null;
  
  // Global update functions
  updateTradingBalance: (asset: string, amount: number, operation: 'add' | 'subtract') => void;
  updateFundingBalance: (amount: number, operation: 'add' | 'subtract') => void;
  addActivity: (activity: Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'>) => void;
  addTrade: (trade: any) => void;
  updatePortfolioStats: () => void;
  refreshWalletFromDatabase: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Global state for real-time updates
  const [tradingAccount, setTradingAccount] = useState<{ [key: string]: { balance: string; usdValue: string; available: string } }>({
    USDT: { balance: '0.00000000', usdValue: '$0.00', available: '0.00000000' },
    BTC: { balance: '0.00000000', usdValue: '$0.00', available: '0.00000000' },
    ETH: { balance: '0.00000000', usdValue: '$0.00', available: '0.00000000' }
  });

  const [fundingAccount, setFundingAccount] = useState<{ USDT: { balance: string; usdValue: string; available: string } }>({
    USDT: { balance: '0.00', usdValue: '$0.00', available: '0.00' }
  });

  // Wallet persistence and sync state
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [tradingHistory, setTradingHistory] = useState<any[]>([]);
  const [realTimePrices, setRealTimePrices] = useState<{ [key: string]: { price: number; change: number; volume: number; timestamp: string } }>({});

  const [portfolioStats, setPortfolioStats] = useState({
    totalBalance: '$0.00',
    totalPnl: '$0.00',
    pnlPercentage: '0.0%',
    totalTrades: 0,
    winRate: '0.0%',
    activePositions: 0
  });

  // Initialize authentication
  useEffect(() => {
    try {
      console.log('🔐 Initializing AuthContext...');
      
      // Check if Supabase client is available
      if (!supabase || !supabase.auth) {
        console.error('❌ Supabase client not available');
        setIsLoading(false);
        return;
      }
      
      // Subscribe to auth state changes
      let unsubscribe: (() => void) | null = null;
      
      // Listen for storage events (when other tabs/windows update auth)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'supabase.auth.token') {
          console.log('🔄 Storage auth change detected, refreshing state...');
          // Trigger a refresh of the auth state
          if (e.newValue) {
            // Refresh auth state by getting current session
            supabaseAuthService.getAuthState();
          } else {
            // Session was cleared
            setUser(null);
            setIsAuthenticated(false);
            setIsAdmin(false);
          }
        }
      };
      
      // Listen for custom auth state events
      const handleAuthStateEvent = (e: CustomEvent) => {
        console.log('🔄 Custom auth state change detected:', e.detail);
        if (e.detail?.user) {
          // Refresh auth state by getting current session
          supabaseAuthService.getAuthState();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('authStateChange', handleAuthStateEvent as EventListener);
      
      try {
        unsubscribe = supabaseAuthService.subscribe((authState: AuthState) => {
          console.log('🔍 AuthContext received auth state:', authState);
          
          if (authState.user) {
            // Convert AuthUser to User interface
            const userData: User = {
              id: authState.user.id,
              email: authState.user.email,
              username: authState.user.email.split('@')[0],
              firstName: authState.user.fullName?.split(' ')[0] || '',
              lastName: authState.user.fullName?.split(' ').slice(1).join(' ') || '',
              phone: authState.user.phone || '',
              country: authState.user.country || '',
              bio: '',
              avatar: authState.user.avatar,
              walletBalance: authState.user.accountBalance,
              kycStatus: authState.user.kycStatus === 'approved' ? 'verified' : authState.user.kycStatus,
              kycLevel1: {
                status: authState.user.isVerified ? 'verified' : 'unverified'
              },
              kycLevel2: {
                status: authState.user.kycStatus === 'approved' ? 'approved' : 
                        authState.user.kycStatus === 'rejected' ? 'rejected' : 
                        authState.user.kycStatus === 'pending' ? 'pending' : 'not_started'
              }
            };

            console.log('✅ User data processed:', userData);
            setUser(userData);
            setIsAuthenticated(true);
            setIsAdmin(authState.isAdmin);
            setIsLoading(false);

            // Initialize wallet after user is authenticated and data is set
            setTimeout(() => {
              if (userData?.id) {
                console.log('🔄 Initializing wallet for user:', userData.email);
                initializeWallet();
              } else {
                console.warn('⚠️ User data not fully loaded, skipping wallet initialization');
              }
            }, 200); // Small delay to ensure state is updated
          } else {
            setUser(null);
            setIsAuthenticated(false);
            setIsAdmin(false);
            setIsLoading(false);
            
            // Reset trading account
            setTradingAccount({
              USDT: { balance: '0.00000000', usdValue: '$0.00', available: '0.00000000' },
              BTC: { balance: '0.00000000', usdValue: '$0.00', available: '0.00000000' },
              ETH: { balance: '0.00000000', usdValue: '$0.00', available: '0.00000000' }
            });
            
            setFundingAccount({
              USDT: { balance: '0.00', usdValue: '$0.00', available: '0.00' }
            });
            
            setActivityFeed([]);
            setTradingHistory([]);
            setPortfolioStats({
              totalBalance: '$0.00',
              totalPnl: '$0.00',
              pnlPercentage: '0.0%',
              totalTrades: 0,
              winRate: '0.0%',
              activePositions: 0
            });
            setRealTimePrices({});
          }
        });
      } catch (error) {
        console.error('❌ Error subscribing to auth service:', error);
        setIsLoading(false);
      }

      return () => {
        try {
          if (unsubscribe) {
            unsubscribe();
          }
          window.removeEventListener('storage', handleStorageChange);
          window.removeEventListener('authStateChange', handleAuthStateEvent as EventListener);
        } catch (error) {
          console.warn('Error unsubscribing from auth:', error);
        }
      };
    } catch (error) {
      console.error('Error initializing auth:', error);
      setIsLoading(false);
    }
  }, []);

  // Auto-redirect effect when authentication state changes
  useEffect(() => {
    console.log('🔄 Auth state check - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'user:', user?.email);
    
    // Don't redirect while still loading
    if (isLoading) {
      console.log('⏳ Still loading auth state, skipping redirect logic');
      return;
    }
    
    if (isAuthenticated && user) {
      console.log('🔄 Auth state changed - user is authenticated, checking current location...');
      console.log('🔍 User is admin:', isAdmin);
      console.log('🔍 Current user email:', user?.email);
      console.log('🔍 Current pathname:', window.location.pathname);
      
      // Check if we're on the auth page and should redirect
      if (window.location.pathname === '/auth' || window.location.pathname === '/') {
        console.log('📍 Currently on auth page, redirecting...');
        
        // Use a longer delay to ensure the auth state is fully processed
        setTimeout(() => {
          try {
            // Redirect admin users to admin dashboard, regular users to regular dashboard
            const targetPath = isAdmin ? '/admin' : '/dashboard';
            console.log('🎯 Redirecting to:', targetPath);
            console.log('🎯 User email:', user?.email, 'Admin status:', isAdmin);
            
            // Only redirect if we're still on the same page (to avoid loops)
            if (window.location.pathname === '/auth' || window.location.pathname === '/') {
              window.location.href = targetPath;
            }
          } catch (error) {
            console.warn('Auto-redirect failed:', error);
          }
        }, 500); // Increased delay to 500ms
      }
    } else if (!isAuthenticated) {
      console.log('🔄 User is not authenticated, checking if redirect needed...');
      
      // Only redirect if we're on a protected route
      const protectedRoutes = ['/dashboard', '/admin', '/trading', '/wallet', '/settings', '/kyc'];
      const isOnProtectedRoute = protectedRoutes.some(route => 
        window.location.pathname.startsWith(route)
      );
      
      if (isOnProtectedRoute) {
        console.log('🚫 Unauthenticated user accessing protected route, redirecting to /auth');
        window.location.href = '/auth';
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, user?.email]);

  // Authentication functions
  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const { success, error } = await supabaseAuthService.signIn({ email, password });
      if (!success) {
        throw new Error(error || 'Login failed');
      }
      
      // Wait a moment for auth state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast({
        title: "Login Successful",
        description: "Welcome back to Kryvex Trading!",
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const loginWithGoogle = useCallback(async () => {
    try {
      const { success, error } = await supabaseAuthService.signInWithGoogle();
      if (!success) {
        throw new Error(error || 'Google login failed');
      }
      // Note: Success toast will be shown after redirect completes
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: "Google Login Failed",
        description: error instanceof Error ? error.message : "Failed to sign in with Google. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const sendPhoneOTP = useCallback(async (phoneNumber: string) => {
    try {
      const result = await supabaseAuthService.sendPhoneOTP(phoneNumber);
      if (!result.success) {
        throw new Error(result.error || 'Failed to send OTP');
      }
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${phoneNumber}`,
      });
      return {
        success: true,
        sessionId: result.sessionId
      };
    } catch (error) {
      console.error('Send OTP error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send OTP. Please try again.";
      toast({
        title: "Failed to Send OTP",
        description: errorMessage,
        variant: "destructive"
      });
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [toast]);

  const loginWithPhone = useCallback(async (sessionId: string, otp: string, phoneNumber: string) => {
    try {
      const { success, error, isNewUser } = await supabaseAuthService.signInWithPhone(sessionId, otp, phoneNumber);
      if (!success) {
        throw new Error(error || 'Phone login failed');
      }
      toast({
        title: "Login Successful",
        description: isNewUser ? "Welcome to Kryvex Trading!" : "Welcome back!",
      });
    } catch (error) {
      console.error('Phone login error:', error);
      toast({
        title: "Phone Login Failed",
        description: error instanceof Error ? error.message : "Invalid OTP. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const resendPhoneOTP = useCallback(async (sessionId: string, phoneNumber: string) => {
    try {
      const result = await supabaseAuthService.resendPhoneOTP(sessionId, phoneNumber);
      if (!result.success) {
        throw new Error(result.error || 'Failed to resend OTP');
      }
      toast({
        title: "OTP Resent",
        description: `New verification code sent to ${phoneNumber}`,
      });
      return {
        success: true,
        sessionId: result.sessionId
      };
    } catch (error) {
      console.error('Resend OTP error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to resend OTP. Please try again.";
      toast({
        title: "Failed to Resend OTP",
        description: errorMessage,
        variant: "destructive"
      });
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [toast]);

  const sendKYCEmailVerification = useCallback(async (email: string) => {
    try {
      const result = await supabaseAuthService.sendKYCEmailVerification(email);
      if (!result.success) {
        throw new Error(result.error || 'Failed to send verification email');
      }
      toast({
        title: "Verification Email Sent",
        description: `Please check your email for the verification code`,
      });
      return {
        success: true,
        verificationId: result.verificationId
      };
    } catch (error) {
      console.error('Send email verification error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send verification email. Please try again.";
      toast({
        title: "Failed to Send Email",
        description: errorMessage,
        variant: "destructive"
      });
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [toast]);

  const verifyKYCEmailCode = useCallback(async (verificationId: string, code: string, email: string) => {
    try {
      const result = await supabaseAuthService.verifyKYCEmailCode(verificationId, code, email);
      if (!result.success) {
        throw new Error(result.error || 'Email verification failed');
      }
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified for KYC",
      });
      return {
        success: true
      };
    } catch (error) {
      console.error('Email verification error:', error);
      const errorMessage = error instanceof Error ? error.message : "Invalid verification code. Please try again.";
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive"
      });
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [toast]);

  const resendKYCEmailVerification = useCallback(async (verificationId: string) => {
    try {
      const result = await supabaseAuthService.resendKYCEmailVerification(verificationId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to resend verification email');
      }
      toast({
        title: "Email Resent",
        description: "A new verification code has been sent to your email",
      });
      return {
        success: true,
        verificationId: result.verificationId
      };
    } catch (error) {
      console.error('Resend email verification error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to resend verification email. Please try again.";
      toast({
        title: "Failed to Resend Email",
        description: errorMessage,
        variant: "destructive"
      });
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [toast]);

  const logout = useCallback(() => {
    try {
      // Clear state immediately
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      
      // Clear all user data
      setTradingAccount({
        USDT: { balance: '0.00000000', usdValue: '$0.00', available: '0.00000000' },
        BTC: { balance: '0.00000000', usdValue: '$0.00', available: '0.00000000' },
        ETH: { balance: '0.00000000', usdValue: '$0.00', available: '0.00000000' }
      });
      
      setFundingAccount({
        USDT: { balance: '0.00', usdValue: '$0.00', available: '0.00' }
      });
      
      setActivityFeed([]);
      setTradingHistory([]);
      
      // Clear storage and call auth service
      localStorage.removeItem('supabase.auth.token');
      supabaseAuthService.signOut();
      
      // Dispatch storage event to notify other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'supabase.auth.token',
        newValue: null
      }));
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      
      // Navigate to landing page after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if there's an error
      window.location.href = '/';
    }
  }, [toast]);

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
    try {
      const { success, error } = await supabaseAuthService.signUp({
        email,
        password,
        fullName: `${firstName} ${lastName}`,
        phone,
        country: 'United States'
      });
      if (!success) {
        throw new Error(error || 'Registration failed');
      }
      toast({
        title: "Registration Successful",
        description: "Welcome to Kryvex Trading! Your account has been created.",
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const updateUserProfile = useCallback(async (profileData: Partial<User>) => {
    try {
      const { success, error } = await supabaseAuthService.updateProfile({
        fullName: profileData.firstName && profileData.lastName ? 
          `${profileData.firstName} ${profileData.lastName}` : undefined,
        avatar: profileData.avatar,
        phone: profileData.phone,
        country: profileData.country
      });
      
      if (!success) {
        throw new Error(error || 'Profile update failed');
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Admin access control
  const checkAdminAccess = useCallback(() => {
    return isAdmin;
  }, [isAdmin]);

  const requireAdmin = useCallback(() => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  }, [isAdmin, toast]);

  // Helper functions
  const isUserRegistered = useCallback((email: string) => {
    // This would typically check against a database
    // For now, we'll assume all users are registered if they're authenticated
    return isAuthenticated;
  }, [isAuthenticated]);

  // Global update functions
  // Wallet persistence functions
  const saveWalletToStorage = useCallback((tradingAcc: any, fundingAcc: any) => {
    try {
      // Only save data if user is authenticated
      if (!user?.id) {
        console.warn('⚠️ Cannot save wallet data: No authenticated user');
        return;
      }
      
      localStorage.setItem(`kryvex_trading_account_${user.id}`, JSON.stringify(tradingAcc));
      localStorage.setItem(`kryvex_funding_account_${user.id}`, JSON.stringify(fundingAcc));
      localStorage.setItem(`kryvex_wallet_last_updated_${user.id}`, new Date().toISOString());
    } catch (error) {
      console.error('Error saving wallet to storage:', error);
    }
  }, [user?.id]);

  const loadWalletFromStorage = useCallback(() => {
    try {
      // Only load data if user is authenticated
      if (!user?.id) {
        console.warn('⚠️ Cannot load wallet data: No authenticated user');
        return false;
      }
      
      const savedTradingAccount = localStorage.getItem(`kryvex_trading_account_${user.id}`);
      const savedFundingAccount = localStorage.getItem(`kryvex_funding_account_${user.id}`);
      const lastUpdated = localStorage.getItem(`kryvex_wallet_last_updated_${user.id}`);

      if (savedTradingAccount && savedFundingAccount) {
        const tradingData = JSON.parse(savedTradingAccount);
        const fundingData = JSON.parse(savedFundingAccount);

        // Validate the data structure
        if (tradingData && typeof tradingData === 'object' && 
            fundingData && typeof fundingData === 'object') {
          
          setTradingAccount(tradingData);
          setFundingAccount(fundingData);
          
          console.log('✅ Wallet loaded from storage for user:', user.id, { tradingData, fundingData, lastUpdated });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading wallet from storage:', error);
      return false;
    }
  }, [user?.id]);

  const saveActivityFeedToStorage = useCallback((activities: ActivityItem[]) => {
    try {
      // Only save data if user is authenticated
      if (!user?.id) {
        console.warn('⚠️ Cannot save activity feed: No authenticated user');
        return;
      }
      
      localStorage.setItem(`kryvex_activity_feed_${user.id}`, JSON.stringify(activities));
    } catch (error) {
      console.error('Error saving activity feed to storage:', error);
    }
  }, [user?.id]);

  const loadActivityFeedFromStorage = useCallback(() => {
    try {
      // Only load data if user is authenticated
      if (!user?.id) {
        console.warn('⚠️ Cannot load activity feed: No authenticated user');
        return false;
      }
      
      const savedActivities = localStorage.getItem(`kryvex_activity_feed_${user.id}`);
      if (savedActivities) {
        const activities = JSON.parse(savedActivities);
        if (Array.isArray(activities)) {
          setActivityFeed(activities);
          console.log('✅ Activity feed loaded from storage for user:', user.id, activities.length, 'activities');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading activity feed from storage:', error);
      return false;
    }
  }, [user?.id]);

  const saveTradingHistoryToStorage = useCallback((trades: any[]) => {
    try {
      // Only save data if user is authenticated
      if (!user?.id) {
        console.warn('⚠️ Cannot save trading history: No authenticated user');
        return;
      }
      
      localStorage.setItem(`kryvex_trading_history_${user.id}`, JSON.stringify(trades));
    } catch (error) {
      console.error('Error saving trading history to storage:', error);
    }
  }, [user?.id]);

  const loadTradingHistoryFromStorage = useCallback(() => {
    try {
      // Only load data if user is authenticated
      if (!user?.id) {
        console.warn('⚠️ Cannot load trading history: No authenticated user');
        return false;
      }
      
      const savedTrades = localStorage.getItem(`kryvex_trading_history_${user.id}`);
      if (savedTrades) {
        const trades = JSON.parse(savedTrades);
        if (Array.isArray(trades)) {
          setTradingHistory(trades);
          console.log('✅ Trading history loaded from storage for user:', user.id, trades.length, 'trades');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading trading history from storage:', error);
      return false;
    }
  }, [user?.id]);

  const initializeWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError(null);

    try {
      // First, check for an authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.warn('⚠️ No authenticated session found');
        setWalletLoading(false);
        return;
      }

      // Verify user is still authenticated
      if (!user?.id || user.id !== session.user.id) {
        console.warn('⚠️ User session mismatch, waiting for auth state to sync');
        setWalletLoading(false);
        return;
      }

      console.log('✅ Authenticated user confirmed:', user.email);

      // Add a small delay to ensure user session is fully processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Double-check user is still authenticated after delay
      if (!user?.id) {
        console.warn('⚠️ User no longer authenticated after delay');
        setWalletLoading(false);
        return;
      }

      // Try to sync from database first
      try {
        console.log('🔄 Attempting to sync wallet from database for user:', user.id);
        const { tradingAccount: dbTradingAccount, fundingAccount: dbFundingAccount } = 
          await walletSyncService.syncAndUpdateWallet(user.id);
        
        console.log('✅ Wallet synced from database:', { dbTradingAccount, dbFundingAccount });
        
        // Update state with database data
        setTradingAccount(dbTradingAccount);
        setFundingAccount(dbFundingAccount);
        
        // Save to localStorage for offline access
        saveWalletToStorage(dbTradingAccount, dbFundingAccount);
        
      } catch (dbError) {
        console.warn('⚠️ Could not sync from database, using localStorage fallback:', dbError);
        
        // Fallback to localStorage
        const loadedFromStorage = loadWalletFromStorage();
        
        if (!loadedFromStorage) {
          // If no stored data, initialize with default values for new authenticated users
          const defaultTradingAccount = {
            USDT: { balance: '1000.00000000', usdValue: '$1000.00', available: '1000.00000000' },
            BTC: { balance: '0.00000000', usdValue: '$0.00', available: '0.00000000' },
            ETH: { balance: '0.00000000', usdValue: '$0.00', available: '0.00000000' }
          };
          
          const defaultFundingAccount = {
            USDT: { balance: '5000.00', usdValue: '$5000.00', available: '5000.00' }
          };

          setTradingAccount(defaultTradingAccount);
          setFundingAccount(defaultFundingAccount);
          saveWalletToStorage(defaultTradingAccount, defaultFundingAccount);
          
          console.log('✅ Wallet initialized with default values for authenticated user:', user.id);
        }
      }

      // Load activity feed and trading history from localStorage
      loadActivityFeedFromStorage();
      loadTradingHistoryFromStorage();

    } catch (error) {
      console.error('Error initializing wallet:', error);
      setWalletError('Failed to load wallet data');
    } finally {
      setWalletLoading(false);
    }
  }, [user?.id, user?.email, loadWalletFromStorage, saveWalletToStorage, loadActivityFeedFromStorage, loadTradingHistoryFromStorage]);

  const updateTradingBalance = useCallback((asset: string, amount: number, operation: 'add' | 'subtract') => {
    setTradingAccount(prev => {
      const currentBalance = parseFloat(prev[asset]?.balance || '0');
      const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
      const newBalanceStr = (newBalance || 0).toFixed(8);
      
      const updatedAccount = {
        ...prev,
        [asset]: {
          balance: newBalanceStr,
          usdValue: `$${(newBalance || 0).toFixed(2)}`,
          available: newBalanceStr
        }
      };

      // Save to localStorage immediately
      saveWalletToStorage(updatedAccount, fundingAccount);
      
      return updatedAccount;
    });
  }, [fundingAccount, saveWalletToStorage]);

  const updateFundingBalance = useCallback((amount: number, operation: 'add' | 'subtract') => {
    setFundingAccount(prev => {
      const currentBalance = parseFloat(prev.USDT?.balance || '0');
      const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
      const newBalanceStr = (newBalance || 0).toFixed(2);
      
      const updatedAccount = {
        USDT: {
          balance: newBalanceStr,
          usdValue: `$${(newBalance || 0).toFixed(2)}`,
          available: newBalanceStr
        }
      };

      // Save to localStorage immediately
      saveWalletToStorage(tradingAccount, updatedAccount);
      
      return updatedAccount;
    });
  }, [tradingAccount, saveWalletToStorage]);

  const addActivity = useCallback((activity: Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'>) => {
    const newActivity: ActivityItem = {
      ...activity,
      id: Date.now().toString(),
      userId: user?.id || '',
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString()
    };
    
    setActivityFeed(prev => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Filter out activities older than 30 days
      const filteredActivities = prev.filter(act => 
        new Date(act.timestamp) > thirtyDaysAgo
      );
      
      const updatedActivities = [newActivity, ...filteredActivities];
      
      // Save to localStorage
      saveActivityFeedToStorage(updatedActivities);
      
      return updatedActivities;
    });
  }, [user?.id, saveActivityFeedToStorage]);

  const addTrade = useCallback((trade: any) => {
    setTradingHistory(prev => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Filter out trades older than 30 days
      const filteredTrades = prev.filter(t => 
        new Date(t.timestamp || t.time || Date.now()) > thirtyDaysAgo
      );
      
      const updatedTrades = [trade, ...filteredTrades];
      
      // Save to localStorage
      saveTradingHistoryToStorage(updatedTrades);
      
      return updatedTrades;
    });
  }, [saveTradingHistoryToStorage]);

  const updatePortfolioStats = useCallback(() => {
    // Calculate portfolio stats based on current trading account
    const totalBalance = Object.values(tradingAccount).reduce((sum, asset) => {
      return sum + parseFloat(asset.usdValue.replace('$', ''));
    }, 0);
    
    setPortfolioStats(prev => ({
      ...prev,
      totalBalance: `$${(totalBalance || 0).toFixed(2)}`
    }));
  }, [tradingAccount]);

  const refreshWalletFromDatabase = useCallback(async () => {
    if (!user?.id) {
      console.warn('⚠️ No user ID available for wallet refresh');
      return;
    }

    try {
      console.log('🔄 Force refreshing wallet from database for user:', user.id);
      setWalletLoading(true);
      setWalletError(null);
      
      // Clear localStorage to force fresh data
      localStorage.removeItem(`kryvex_trading_account_${user.id}`);
      localStorage.removeItem(`kryvex_funding_account_${user.id}`);
      
      const { tradingAccount: dbTradingAccount, fundingAccount: dbFundingAccount } = 
        await walletSyncService.forceRefreshWallet(user.id);
      
      console.log('✅ Wallet refreshed from database:', { dbTradingAccount, dbFundingAccount });
      
      // Update state with fresh database data
      setTradingAccount(dbTradingAccount);
      setFundingAccount(dbFundingAccount);
      
      // Save to localStorage
      saveWalletToStorage(dbTradingAccount, dbFundingAccount);
      
      // Update portfolio stats
      updatePortfolioStats();
      
      // Clear any previous errors
      setWalletError(null);
      
    } catch (error) {
      console.error('❌ Failed to refresh wallet from database:', error);
      setWalletError('Failed to refresh wallet data');
    } finally {
      setWalletLoading(false);
    }
  }, [user?.id, saveWalletToStorage, updatePortfolioStats]);

  const updateRealTimePrice = useCallback((symbol: string, price: number, change: number, volume: number) => {
    setRealTimePrices(prev => ({
      ...prev,
      [symbol]: {
        price,
        change,
        volume,
        timestamp: new Date().toISOString()
      }
    }));
  }, []);

  // Debug function to troubleshoot authentication and wallet issues
  const debugAuthAndWallet = useCallback(async () => {
    try {
      console.log('🔍 === AUTH & WALLET DEBUG ===');
      
      // Check auth state
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📊 Current Session:', session);
      
      // Check user details
      const currentUser = session?.user;
      console.log('👤 Current User:', currentUser);
      
      // Check context user state
      console.log('🎭 Context User State:', {
        user: user,
        isAuthenticated,
        isAdmin,
        isLoading
      });
      
      // Check user wallets if authenticated
      if (currentUser?.id) {
        const { data: wallets, error } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', currentUser.id);
        
        console.log('💰 User Wallets:', wallets);
        if (error) console.error('❌ Wallet fetch error:', error);
      }
      
      // Check localStorage wallet data
      const storedWallet = localStorage.getItem('tradingAccount');
      const storedFunding = localStorage.getItem('fundingAccount');
      console.log('💾 Stored Wallet Data:', {
        trading: storedWallet ? JSON.parse(storedWallet) : null,
        funding: storedFunding ? JSON.parse(storedFunding) : null
      });
      
      console.log('🔍 === END DEBUG ===');
    } catch (error) {
      console.error('❌ Debug function error:', error);
    }
  }, [user, isAuthenticated, isAdmin, isLoading]);

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    login,
    loginWithGoogle,
    sendPhoneOTP,
    loginWithPhone,
    resendPhoneOTP,
    sendKYCEmailVerification,
    verifyKYCEmailCode,
    resendKYCEmailVerification,
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
    walletLoading,
    walletError,
    updateTradingBalance,
    updateFundingBalance,
    addActivity,
    addTrade,
    updatePortfolioStats,
    initializeWallet,
    refreshWalletFromDatabase,
    updateRealTimePrice,
    debugAuthAndWallet, // Add debug function to context
  }), [
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    login,
    loginWithGoogle,
    sendPhoneOTP,
    loginWithPhone,
    resendPhoneOTP,
    sendKYCEmailVerification,
    verifyKYCEmailCode,
    resendKYCEmailVerification,
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
    walletLoading,
    walletError,
    updateTradingBalance,
    updateFundingBalance,
    addActivity,
    addTrade,
    updatePortfolioStats,
    initializeWallet,
    refreshWalletFromDatabase,
    updateRealTimePrice,
    debugAuthAndWallet, // Add debug function to dependencies
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};