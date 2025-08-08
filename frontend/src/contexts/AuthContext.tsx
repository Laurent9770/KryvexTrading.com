import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import supabaseAuthService, { AuthUser, LoginCredentials, RegisterData, ProfileUpdateData } from '@/services/supabaseAuthService';
import supabaseActivityService, { ActivityItem } from '@/services/supabaseActivityService';
import supabaseTradingService from '@/services/supabaseTradingService';
import supabaseKYCService from '../services/supabaseKYCService';
import { supabase } from '@/integrations/supabase/client';
import realTimePriceService from '@/services/realTimePriceService';

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
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Global state for real-time updates - Start with clean data for new users
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

  const [portfolioStats, setPortfolioStats] = useState({
    totalBalance: '$0.00',
    totalPnl: '$0.00',
    pnlPercentage: '0.0%',
    totalTrades: 0,
    winRate: '0.0%',
    activePositions: 0
  });

  // Real-time price data
  const [realTimePrices, setRealTimePrices] = useState<{ [key: string]: { price: number; change: number; volume: number; timestamp: string } }>({});

  // Memoized update functions to prevent unnecessary re-renders
  const updateTradingBalance = useCallback((asset: string, amount: number, operation: 'add' | 'subtract') => {
    setTradingAccount(prev => {
      const current = prev[asset] || { balance: '0.00000000', usdValue: '$0.00', available: '0.00000000' };
      const currentBalance = parseFloat(current.balance);
      const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
      
      return {
        ...prev,
        [asset]: {
          balance: newBalance.toFixed(8),
          usdValue: `$${newBalance.toFixed(2)}`,
          available: newBalance.toFixed(8)
        }
      };
    });
  }, []);

  const updateFundingBalance = useCallback((amount: number, operation: 'add' | 'subtract') => {
    setFundingAccount(prev => {
      const currentBalance = parseFloat(prev.USDT.balance);
      const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
      
      return {
        USDT: {
          balance: newBalance.toFixed(2),
          usdValue: `$${newBalance.toFixed(2)}`,
          available: newBalance.toFixed(2)
        }
      };
    });
  }, []);

  const addActivity = useCallback((activity: Omit<ActivityItem, 'id' | 'userId' | 'timestamp' | 'time'>) => {
    const newActivity: ActivityItem = {
      ...activity,
      id: Date.now().toString(),
      userId: user?.id || 'unknown',
      timestamp: new Date(),
      time: new Date().toLocaleTimeString()
    };
    
    setActivityFeed(prev => [newActivity, ...prev.slice(0, 49)]); // Keep only last 50 activities
  }, [user?.id]);

  const addTrade = useCallback((trade: any) => {
    setTradingHistory(prev => [trade, ...prev.slice(0, 99)]); // Keep only last 100 trades
  }, []);

  const updatePortfolioStats = useCallback(() => {
    // Calculate portfolio stats based on current trading account
    const totalBalance = Object.values(tradingAccount).reduce((sum, asset) => {
      return sum + parseFloat(asset.usdValue.replace('$', '').replace(',', ''));
    }, 0);
    
    const totalTrades = tradingHistory.length;
    const winningTrades = tradingHistory.filter(trade => trade.pnl > 0).length;
    const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0.0';
    
    setPortfolioStats({
      totalBalance: `$${totalBalance.toFixed(2)}`,
      totalPnl: '$0.00', // This would be calculated from actual trades
      pnlPercentage: '0.0%',
      totalTrades,
      winRate: `${winRate}%`,
      activePositions: 0 // This would be calculated from open positions
    });
  }, [tradingAccount, tradingHistory]);

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

  // Initialize Supabase auth with error handling
  useEffect(() => {
    try {
      const unsubscribe = supabaseAuthService.subscribe(async (authState) => {
        setIsLoading(authState.isLoading);
        setIsAuthenticated(authState.isAuthenticated);
        setIsAdmin(authState.isAdmin);

        if (authState.user) {
          try {
            // Load real user profile data from Supabase
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', authState.user.id)
              .single();

            if (profileError) {
              console.error('Error loading user profile:', profileError);
            }

            // Convert AuthUser to User interface with real data
            const userData: User = {
              id: authState.user.id,
              email: authState.user.email,
              username: authState.user.email.split('@')[0],
              firstName: profile?.full_name?.split(' ')[0] || '',
              lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
              phone: profile?.phone || '',
              country: profile?.country || '',
              bio: '',
              avatar: profile?.avatar_url || authState.user.avatar,
              walletBalance: profile?.account_balance || 0,
              kycStatus: profile?.kyc_status === 'approved' ? 'verified' : profile?.kyc_status || 'unverified',
              kycLevel1: {
                status: profile?.is_verified ? 'verified' : 'unverified'
              },
              kycLevel2: {
                status: profile?.kyc_status === 'approved' ? 'approved' : 
                        profile?.kyc_status === 'rejected' ? 'rejected' : 
                        profile?.kyc_status === 'pending' ? 'pending' : 'not_started'
              }
            };

            setUser(userData);

            // Update trading account with user's real balance
            if (profile?.account_balance && profile.account_balance > 0) {
              setTradingAccount(prev => ({
                ...prev,
                USDT: {
                  balance: profile.account_balance.toFixed(8),
                  usdValue: `$${profile.account_balance.toFixed(2)}`,
                  available: profile.account_balance.toFixed(8)
                }
              }));

              setFundingAccount(prev => ({
                USDT: {
                  balance: profile.account_balance.toFixed(2),
                  usdValue: `$${profile.account_balance.toFixed(2)}`,
                  available: profile.account_balance.toFixed(2)
                }
              }));
            }

            // Load user activities and trading data
            loadUserData(authState.user.id);
          } catch (error) {
            console.error('Error processing user data:', error);
            // Fallback to basic user data if profile loading fails
            const userData: User = {
              id: authState.user.id,
              email: authState.user.email,
              username: authState.user.email.split('@')[0],
              firstName: '',
              lastName: '',
              phone: '',
              country: '',
              bio: '',
              avatar: authState.user.avatar,
              walletBalance: 0,
              kycStatus: 'unverified',
              kycLevel1: {
                status: 'unverified'
              },
              kycLevel2: {
                status: 'not_started'
              }
            };
            setUser(userData);
          }
        } else {
          setUser(null);
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

      return () => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing from auth:', error);
        }
      };
    } catch (error) {
      console.error('Error initializing auth:', error);
      setIsLoading(false);
    }
  }, []);

  // Load user data with error handling
  const loadUserData = useCallback(async (userId: string) => {
    try {
      // Load user activities
      const activities = await supabaseActivityService.getUserActivities(userId);
      setActivityFeed(activities);

      // Load trading history
      const { success, data } = await supabaseTradingService.getTrades(userId);
      if (success && data) {
        setTradingHistory(data);
      }

      // Update portfolio stats
      updatePortfolioStats();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [updatePortfolioStats]);

  // Authentication functions with error handling
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
        variant: "destructive",
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again."
      });
      throw error;
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
      
      // Immediately load the user data after successful registration
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Load profile data immediately
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        if (profileError) {
          console.error('Error loading profile after registration:', profileError);
        }

        // Set user data immediately
        const userData: User = {
          id: authUser.id,
          email: authUser.email,
          username: authUser.email.split('@')[0],
          firstName: profile?.full_name?.split(' ')[0] || firstName,
          lastName: profile?.full_name?.split(' ').slice(1).join(' ') || lastName,
          phone: profile?.phone || phone,
          country: profile?.country || 'United States',
          bio: '',
          avatar: profile?.avatar_url || authUser.avatar,
          walletBalance: profile?.account_balance || 0,
          kycStatus: profile?.kyc_status || 'unverified',
          kycLevel1: {
            status: profile?.is_verified ? 'verified' : 'unverified'
          },
          kycLevel2: {
            status: profile?.kyc_status === 'approved' ? 'approved' : 
                    profile?.kyc_status === 'rejected' ? 'rejected' : 
                    profile?.kyc_status === 'pending' ? 'pending' : 'not_started'
          }
        };

        setUser(userData);
        setIsAuthenticated(true);
      }

      toast({
        title: "Registration Successful",
        description: "Welcome to Kryvex Trading! Your account has been created.",
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again."
      });
      throw error;
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      // Clear all user data first
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      
      // Clear all trading data
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

      // Sign out from Supabase
      await supabaseAuthService.signOut();
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "There was an error during logout. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const updateUserProfile = useCallback(async (profileData: Partial<User>) => {
    try {
      const { success, error } = await supabaseAuthService.updateProfile({
        fullName: profileData.firstName && profileData.lastName ? `${profileData.firstName} ${profileData.lastName}` : undefined,
        avatar: profileData.avatar,
        phone: profileData.phone,
        country: profileData.country
      });
      if (!success) {
        throw new Error(error || 'Profile update failed');
      }
      setUser(prev => prev ? { ...prev, ...profileData } : null);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        variant: "destructive",
        title: "Profile Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again."
      });
    }
  }, [toast]);

  const checkAdminAccess = useCallback(() => {
    return isAuthenticated && isAdmin;
  }, [isAuthenticated, isAdmin]);

  const requireAdmin = useCallback(() => {
    const hasAccess = checkAdminAccess();
    if (!hasAccess) {
      console.warn('Admin access denied for user:', user?.email);
    }
    return hasAccess;
  }, [checkAdminAccess, user?.email]);

  const isUserRegistered = useCallback((email: string): boolean => {
    // This would typically check against the database
    // For now, return false to allow registration
    return false;
  }, []);

  // Set up real-time subscriptions when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      try {
        // Subscribe to price updates
        const unsubscribePrices = supabaseTradingService.subscribeToPriceUpdates(
          (price) => {
            updateRealTimePrice(price.symbol, price.price, price.change24h, price.volume24h);
          }
        );

        // Subscribe to user's trades
        const unsubscribeTrades = supabaseTradingService.subscribeToTrades(
          user.id,
          (trade) => {
            addTrade({
              id: trade.id,
              symbol: 'BTC/USDT', // Default symbol since we don't have trading_pairs relation
              type: trade.tradeType,
              amount: trade.amount,
              price: trade.price,
              pnl: trade.profitLoss,
              status: trade.result,
              timestamp: trade.createdAt
            });
          }
        );

        return () => {
          try {
            unsubscribePrices();
            unsubscribeTrades();
          } catch (error) {
            console.warn('Error unsubscribing from real-time updates:', error);
          }
        };
      } catch (error) {
        console.error('Error setting up real-time subscriptions:', error);
      }
    }
  }, [isAuthenticated, user, addTrade, updateRealTimePrice]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<AuthContextType>(() => ({
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
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};