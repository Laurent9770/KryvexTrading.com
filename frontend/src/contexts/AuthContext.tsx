import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import supabaseAuthService, { AuthUser, AuthState } from '@/services/supabaseAuthService';
import { getSupabaseClient } from '@/integrations/supabase/client';

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
      const supabase = getSupabaseClient();
      if (!supabase || !supabase.auth) {
        console.error('❌ Supabase client not available');
        setIsLoading(false);
        return;
      }
      
      // Subscribe to auth state changes
      let unsubscribe: (() => void) | null = null;
      
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

            // Update trading account with user's balance
            if (authState.user.accountBalance > 0) {
              setTradingAccount(prev => ({
                ...prev,
                USDT: {
                  balance: authState.user.accountBalance.toFixed(8),
                  usdValue: `$${authState.user.accountBalance.toFixed(2)}`,
                  available: authState.user.accountBalance.toFixed(8)
                }
              }));
            }
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
        } catch (error) {
          console.warn('Error unsubscribing from auth:', error);
        }
      };
    } catch (error) {
      console.error('Error initializing auth:', error);
      setIsLoading(false);
    }
  }, []);

  // Authentication functions
  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const { success, error } = await supabaseAuthService.signIn({ email, password });
      if (!success) {
        throw new Error(error || 'Login failed');
      }
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

  const logout = useCallback(() => {
    try {
      supabaseAuthService.signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
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
  const updateTradingBalance = useCallback((asset: string, amount: number, operation: 'add' | 'subtract') => {
    setTradingAccount(prev => {
      const currentBalance = parseFloat(prev[asset]?.balance || '0');
      const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
      const newBalanceStr = newBalance.toFixed(8);
      
      return {
        ...prev,
        [asset]: {
          balance: newBalanceStr,
          usdValue: `$${newBalance.toFixed(2)}`,
          available: newBalanceStr
        }
      };
    });
  }, []);

  const updateFundingBalance = useCallback((amount: number, operation: 'add' | 'subtract') => {
    setFundingAccount(prev => {
      const currentBalance = parseFloat(prev.USDT.balance);
      const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
      const newBalanceStr = newBalance.toFixed(2);
      
      return {
        USDT: {
          balance: newBalanceStr,
          usdValue: `$${newBalance.toFixed(2)}`,
          available: newBalanceStr
        }
      };
    });
  }, []);

  const addActivity = useCallback((activity: Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'>) => {
    const newActivity: ActivityItem = {
      ...activity,
      id: Date.now().toString(),
      userId: user?.id || '',
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString()
    };
    
    setActivityFeed(prev => [newActivity, ...prev.slice(0, 49)]); // Keep last 50 activities
  }, [user?.id]);

  const addTrade = useCallback((trade: any) => {
    setTradingHistory(prev => [trade, ...prev.slice(0, 99)]); // Keep last 100 trades
  }, []);

  const updatePortfolioStats = useCallback(() => {
    // Calculate portfolio stats based on current trading account
    const totalBalance = Object.values(tradingAccount).reduce((sum, asset) => {
      return sum + parseFloat(asset.usdValue.replace('$', ''));
    }, 0);
    
    setPortfolioStats(prev => ({
      ...prev,
      totalBalance: `$${totalBalance.toFixed(2)}`
    }));
  }, [tradingAccount]);

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

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
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
  }), [
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
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
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};