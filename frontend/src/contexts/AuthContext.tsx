import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '@/lib/supabaseClient';
import logger, { logAuth, logWallet, logError, logSuccess, logWarning } from '@/utils/logger';

// =============================================
// AUTH CONTEXT TYPES
// =============================================

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isVerified?: boolean;
  kycStatus?: string;
  accountBalance?: number;
}

interface WalletData {
  balance: number;
  currency: string;
  lastUpdated: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshWalletFromDatabase: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

// =============================================
// AUTH CONTEXT
// =============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// =============================================
// AUTH PROVIDER
// =============================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
  });
  
  const [walletData, setWalletData] = useState<{
    tradingAccount: WalletData;
    fundingAccount: WalletData;
  }>({
    tradingAccount: { balance: 0, currency: 'USDT', lastUpdated: new Date().toISOString() },
    fundingAccount: { balance: 0, currency: 'USDT', lastUpdated: new Date().toISOString() },
  });
  
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // =============================================
  // AUTHENTICATION FUNCTIONS
  // =============================================

  const signIn = async (email: string, password: string) => {
    try {
      logAuth('Attempting sign in', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logError('Sign in failed', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        logSuccess('Sign in successful', { email: data.user.email });
        return { success: true };
      }

      return { success: false, error: 'Sign in failed' };
    } catch (error) {
      logError('Sign in error', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      logAuth('Attempting sign up', { email, firstName, lastName });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        logError('Sign up failed', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        logSuccess('Sign up successful', { email: data.user.email });
        return { success: true };
      }

      return { success: false, error: 'Sign up failed' };
    } catch (error) {
      logError('Sign up error', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      logAuth('Signing out');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        logError('Sign out error', error);
      } else {
        logSuccess('Sign out successful');
      }
    } catch (error) {
      logError('Sign out error', error);
    }
  };

  // =============================================
  // WALLET FUNCTIONS
  // =============================================

  const refreshWalletFromDatabase = useCallback(async () => {
    if (!authState.user?.id) {
      logWarning('Cannot refresh wallet: no user ID');
      return;
    }

    try {
      logWallet('Force refreshing wallet from database', { userId: authState.user.id });
      setWalletLoading(true);
      setWalletError(null);

      // Clear localStorage to force fresh data
      localStorage.removeItem(`kryvex_trading_account_${authState.user.id}`);
      localStorage.removeItem(`kryvex_funding_account_${authState.user.id}`);

      const { data, error } = await supabase.rpc('get_user_wallet_summary', {
        user_id_param: authState.user.id
      });

      if (error) {
        logError('Failed to get wallet summary', error);
        setWalletError('Failed to load wallet data');
        return;
      }

      if (data) {
        const { tradingAccount, fundingAccount } = data;
        
        const newWalletData = {
          tradingAccount: {
            balance: tradingAccount?.balance || 0,
            currency: tradingAccount?.asset || 'USDT',
            lastUpdated: new Date().toISOString(),
          },
          fundingAccount: {
            balance: fundingAccount?.balance || 0,
            currency: fundingAccount?.asset || 'USDT',
            lastUpdated: new Date().toISOString(),
          },
        };

        setWalletData(newWalletData);
        
        // Store in localStorage
        localStorage.setItem(`kryvex_trading_account_${authState.user.id}`, JSON.stringify(newWalletData.tradingAccount));
        localStorage.setItem(`kryvex_funding_account_${authState.user.id}`, JSON.stringify(newWalletData.fundingAccount));
        
        logSuccess('Wallet refreshed from database', newWalletData);
      }
    } catch (error) {
      logError('Error refreshing wallet', error);
      setWalletError('Failed to refresh wallet data');
    } finally {
      setWalletLoading(false);
    }
  }, [authState.user?.id]);

  const refreshUserData = useCallback(async () => {
    if (!authState.user?.id) {
      logWarning('Cannot refresh user data: no user ID');
      return;
    }

    try {
      logAuth('Refreshing user data', { userId: authState.user.id });
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authState.user.id)
        .single();

      if (profileError) {
        logError('Failed to load profile', profileError);
        return;
      }

      if (profileData) {
        const updatedUser = {
          ...authState.user,
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          isVerified: profileData.is_verified,
          kycStatus: profileData.kyc_status,
          accountBalance: profileData.account_balance,
        };

        setAuthState(prev => ({
          ...prev,
          user: updatedUser,
        }));

        logSuccess('User data refreshed', updatedUser);
      }
    } catch (error) {
      logError('Error refreshing user data', error);
    }
  }, [authState.user?.id, authState.user]);

  // =============================================
  // AUTH STATE MANAGEMENT
  // =============================================

  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    logAuth('Auth state change detected', { event, userId: session?.user?.id });
    
    if (event === 'SIGNED_IN' && session?.user) {
      try {
        const userData = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.first_name,
          lastName: session.user.user_metadata?.last_name,
        };

        logSuccess('User data processed', userData);

        // Check if user is admin
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .single();

        const isAdmin = !roleError && roleData?.role === 'admin';

        setAuthState({
          user: userData,
          isLoading: false,
          isAuthenticated: true,
          isAdmin,
        });

        // Initialize wallet data
        await refreshWalletFromDatabase();
        await refreshUserData();

      } catch (error) {
        logError('Error processing auth state change', error);
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false,
        });
      }
    } else if (event === 'SIGNED_OUT') {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      });
      
      // Clear wallet data
      setWalletData({
        tradingAccount: { balance: 0, currency: 'USDT', lastUpdated: new Date().toISOString() },
        fundingAccount: { balance: 0, currency: 'USDT', lastUpdated: new Date().toISOString() },
      });
      
      // Clear localStorage
      if (authState.user?.id) {
        localStorage.removeItem(`kryvex_trading_account_${authState.user.id}`);
        localStorage.removeItem(`kryvex_funding_account_${authState.user.id}`);
      }
    }
  }, [refreshWalletFromDatabase, refreshUserData, authState.user?.id]);

  // =============================================
  // EFFECTS
  // =============================================

  useEffect(() => {
    logAuth('Initializing AuthContext');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logError('Error getting initial session', error);
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        if (session?.user) {
          await handleAuthStateChange('SIGNED_IN', session);
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        logError('Error in getInitialSession', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    getInitialSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  // =============================================
  // ROUTING LOGIC
  // =============================================

  useEffect(() => {
    const { isAuthenticated, isLoading, isAdmin } = authState;
    const currentPath = location.pathname;

    logAuth('Auth state check', { isAuthenticated, isLoading, user: authState.user?.email });

    if (isLoading) {
      logAuth('Still loading auth state, skipping redirect logic');
      return;
    }

    if (isAuthenticated) {
      logAuth('User is authenticated, checking current location', { 
        isAdmin, 
        userEmail: authState.user?.email, 
        currentPath 
      });

      // Redirect from auth page to appropriate dashboard
      if (currentPath === '/auth') {
        const targetPath = isAdmin ? '/admin' : '/dashboard';
        logAuth('Currently on auth page, redirecting', { targetPath, userEmail: authState.user?.email, adminStatus: isAdmin });
        navigate(targetPath, { replace: true });
      }
    } else {
      logAuth('User is not authenticated, checking if redirect needed', { currentPath });
      
      // Redirect to auth page if on protected route
      const protectedRoutes = ['/dashboard', '/admin', '/trading', '/wallet', '/settings'];
      if (protectedRoutes.some(route => currentPath.startsWith(route))) {
        logAuth('Unauthenticated user accessing protected route, redirecting to /auth');
        navigate('/auth', { replace: true });
      }
    }
  }, [authState, location.pathname, navigate]);

  // =============================================
  // CONTEXT VALUE
  // =============================================

  const contextValue: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    refreshWalletFromDatabase,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};