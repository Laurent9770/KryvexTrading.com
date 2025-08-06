import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ActivityItem } from '@/services/supabaseActivityService';
import supabaseActivityService from '@/services/supabaseActivityService';

import { useToast } from '@/hooks/use-toast';
import supabaseKYCService from '../services/supabaseKYCService';
import supabaseAuthService, { AuthUser, LoginCredentials, RegisterData, ProfileUpdateData } from '@/services/supabaseAuthService';
import supabaseTradingService from '@/services/supabaseTradingService';

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

  // Initialize Supabase auth
  useEffect(() => {
    const unsubscribe = supabaseAuthService.subscribe((authState) => {
      setIsLoading(authState.isLoading);
      setIsAuthenticated(authState.isAuthenticated);
      setIsAdmin(authState.isAdmin);

      if (authState.user) {
        // Convert AuthUser to User interface
        const userData: User = {
          id: authState.user.id,
          email: authState.user.email,
          username: authState.user.email.split('@')[0],
          firstName: authState.user.fullName?.split(' ')[0] || 'John',
          lastName: authState.user.fullName?.split(' ').slice(1).join(' ') || 'Trader',
          phone: authState.user.phone || '+1 (555) 123-4567',
          country: authState.user.country || 'United States',
          bio: 'Professional crypto trader with 5+ years of experience.',
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

        setUser(userData);

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

          setFundingAccount(prev => ({
            USDT: {
              balance: authState.user.accountBalance.toFixed(2),
              usdValue: `$${authState.user.accountBalance.toFixed(2)}`,
              available: authState.user.accountBalance.toFixed(2)
            }
          }));
        }

        // Load user activities and trading data
        loadUserData(authState.user.id);
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
      }
    });

    return () => {
      unsubscribe();
      supabaseTradingService.cleanup();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Load trading history
      const { success, trades } = await supabaseTradingService.getRecentTrades(userId, 50);
      if (success && trades) {
        setTradingHistory(trades.map(trade => ({
          id: trade.id,
          symbol: 'BTC/USDT', // Default symbol since we don't have trading_pairs relation
          type: trade.trade_type,
          amount: trade.amount,
          price: trade.price,
          pnl: trade.profit_loss,
          status: trade.result,
          timestamp: trade.created_at
        })));
      }

      // Load trading stats
      const { success: statsSuccess, stats } = await supabaseTradingService.getTradingStats(userId);
      if (statsSuccess && stats) {
        setPortfolioStats({
          totalBalance: `$${stats.netProfit.toFixed(2)}`,
          totalPnl: `$${stats.netProfit.toFixed(2)}`,
          pnlPercentage: `${stats.winRate.toFixed(1)}%`,
          totalTrades: stats.totalTrades,
          winRate: `${stats.winRate.toFixed(1)}%`,
          activePositions: 0
        });
      }

      // Load portfolio data
      const { success: portfolioSuccess, portfolio } = await supabaseTradingService.getPortfolioData(userId);
      if (portfolioSuccess && portfolio) {
        setTradingAccount(prev => {
          const newAccount = { ...prev };
          portfolio.assets.forEach(asset => {
            newAccount[asset.symbol.split('/')[0]] = {
              balance: asset.balance.toFixed(8),
              usdValue: `$${asset.value.toFixed(2)}`,
              available: asset.balance.toFixed(8)
            };
          });
          return newAccount;
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Memoize functions to prevent infinite re-renders
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
      id: `activity-${Date.now()}`,
      userId: user?.id || 'unknown',
      timestamp: new Date(),
      time: new Date().toLocaleTimeString(),
      ...activity
    };
    
    setActivityFeed(prev => [newActivity, ...prev]);
    if (user?.id) {
      supabaseActivityService.addActivity(user.id, activity);
    }
  }, [user?.id]);

  const addTrade = useCallback((trade: any) => {
    setTradingHistory(prev => [trade, ...prev]);
  }, []);

  const updatePortfolioStats = useCallback(() => {
    const totalBalance = Object.values(tradingAccount).reduce((sum, asset) => {
      return sum + parseFloat(asset.usdValue.replace('$', ''));
    }, 0);
    
    const totalPnl = Object.values(tradingAccount).reduce((sum, asset) => {
      return sum + parseFloat(asset.usdValue.replace('$', ''));
    }, 0);
    
    setPortfolioStats({
      totalBalance: `$${totalBalance.toFixed(2)}`,
      totalPnl: `$${totalPnl.toFixed(2)}`,
      pnlPercentage: '0.0%',
      totalTrades: tradingHistory.length,
      winRate: '0.0%',
      activePositions: 0
    });
  }, [tradingAccount, tradingHistory.length]);

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

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const credentials: LoginCredentials = { email, password };
      const { success, error } = await supabaseAuthService.signIn(credentials);

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
        description: error instanceof Error ? error.message : "Failed to login. Please try again."
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
    try {
      const registerData: RegisterData = {
        email,
        password,
        fullName: `${firstName} ${lastName}`,
        phone,
        country: 'United States'
      };

      const { success, error } = await supabaseAuthService.signUp(registerData);

      if (!success) {
        throw new Error(error || 'Registration failed');
      }

      toast({
        title: "Registration Successful",
        description: "Account created successfully. Please check your email for verification.",
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
  };

  const logout = () => {
    supabaseAuthService.signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const updateUserProfile = async (profileData: Partial<User>) => {
    try {
      const updateData: ProfileUpdateData = {
        fullName: profileData.firstName && profileData.lastName ? `${profileData.firstName} ${profileData.lastName}` : undefined,
        avatar: profileData.avatar,
        phone: profileData.phone,
        country: profileData.country
      };

      const { success, error } = await supabaseAuthService.updateProfile(updateData);

      if (!success) {
        throw new Error(error || 'Profile update failed');
      }

      // Update local user state
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
  };

  const checkAdminAccess = () => {
    return isAuthenticated && isAdmin;
  };

  const requireAdmin = () => {
    const hasAccess = checkAdminAccess();
    if (!hasAccess) {
      console.warn('Admin access denied for user:', user?.email);
    }
    return hasAccess;
  };

  const isUserRegistered = (email: string): boolean => {
    // This would typically check against the database
    // For now, return false to allow registration
    return false;
  };

  // Set up real-time subscriptions when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Subscribe to price updates for major trading pairs
      const unsubscribePrices = supabaseTradingService.subscribeToPriceUpdates(
        ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT'],
        (price) => {
          updateRealTimePrice(price.symbol, price.price, price.change24h, price.volume24h);
        }
      );

      // Subscribe to user's trades
      const unsubscribeTrades = supabaseTradingService.subscribeToUserTrades(
        user.id,
        (trade) => {
                     addTrade({
             id: trade.id,
             symbol: 'BTC/USDT', // Default symbol since we don't have trading_pairs relation
             type: trade.trade_type,
             amount: trade.amount,
             price: trade.price,
             pnl: trade.profit_loss,
             status: trade.result,
             timestamp: trade.created_at
           });
        }
      );

      return () => {
        unsubscribePrices();
        unsubscribeTrades();
      };
    }
  }, [isAuthenticated, user, addTrade, updateRealTimePrice]);

  const value: AuthContextType = {
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};