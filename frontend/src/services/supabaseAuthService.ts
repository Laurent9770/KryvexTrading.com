import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatar?: string;
  phone?: string;
  country?: string;
  accountBalance: number;
  isVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
  isAdmin: boolean;
  accountStatus: 'active' | 'suspended' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  country?: string;
}

export interface ProfileUpdateData {
  fullName?: string;
  avatar?: string;
  phone?: string;
  country?: string;
}

class SupabaseAuthService {
  private authState: AuthState = {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false
  };

  private listeners: Set<(state: AuthState) => void> = new Set();

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      console.log('🔐 Initializing Supabase Auth...');
      
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error);
        this.updateAuthState({ user: null, isLoading: false, isAuthenticated: false, isAdmin: false });
        return;
      }

      if (session?.user) {
        console.log('✅ Session found, handling user:', session.user.email);
        await this.handleUserSession(session.user);
      } else {
        console.log('ℹ️ No session found');
        this.updateAuthState({ user: null, isLoading: false, isAuthenticated: false, isAdmin: false });
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await this.handleUserSession(session.user);
        } else if (event === 'SIGNED_OUT') {
          this.updateAuthState({ user: null, isLoading: false, isAuthenticated: false, isAdmin: false });
        }
      });

      // Store subscription for cleanup
      this.subscriptions.push(subscription);
      
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
      this.updateAuthState({ user: null, isLoading: false, isAuthenticated: false, isAdmin: false });
    }
  }

  private async handleUserSession(user: User) {
    try {
      console.log('🔐 Handling user session for:', user.email);
      
      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Error fetching profile:', profileError);
        return;
      }

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('❌ Error fetching roles:', rolesError);
      }

      const isAdmin = roles?.some(role => role.role === 'admin') || false;

      // Convert to AuthUser interface
      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        fullName: profile?.full_name || user.user_metadata?.full_name,
        avatar: profile?.avatar_url || user.user_metadata?.avatar_url,
        phone: profile?.phone,
        country: profile?.country || 'United States',
        accountBalance: profile?.account_balance || 0,
        isVerified: profile?.is_verified || false,
        kycStatus: profile?.kyc_status || 'pending',
        isAdmin,
        accountStatus: profile?.account_status || 'active',
        createdAt: profile?.created_at || user.created_at,
        updatedAt: profile?.updated_at || user.updated_at
      };

      this.updateAuthState({
        user: authUser,
        isLoading: false,
        isAuthenticated: true,
        isAdmin
      });

      // Set up real-time subscriptions
      this.setupRealtimeSubscriptions(user.id);

    } catch (error) {
      console.error('❌ Error handling user session:', error);
      this.updateAuthState({ user: null, isLoading: false, isAuthenticated: false, isAdmin: false });
    }
  }

  private setupRealtimeSubscriptions(userId: string) {
    try {
      // Subscribe to profile changes
      const profileSubscription = supabase
        .channel('profile_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`
          },
          (payload) => {
            console.log('📊 Profile updated:', payload);
            this.handleUserSession({ id: userId } as User);
          }
        )
        .subscribe();

      // Subscribe to role changes
      const roleSubscription = supabase
        .channel('role_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_roles',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('👤 Role updated:', payload);
            this.handleUserSession({ id: userId } as User);
          }
        )
        .subscribe();

      this.subscriptions.push(profileSubscription, roleSubscription);
    } catch (error) {
      console.error('❌ Error setting up real-time subscriptions:', error);
    }
  }

  private subscriptions: any[] = [];

  private updateAuthState(newState: Partial<AuthState>) {
    this.authState = { ...this.authState, ...newState };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.authState);
      } catch (error) {
        console.error('❌ Error in auth listener:', error);
      }
    });
  }

  // Public API methods
  async signIn(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Attempting sign in for:', credentials.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ Sign in successful');
        return { success: true };
      }

      return { success: false, error: 'Sign in failed' };
    } catch (error) {
      console.error('❌ Unexpected sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signUp(data: RegisterData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Attempting sign up for:', data.email);
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            country: data.country
          }
        }
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        return { success: false, error: error.message };
      }

      if (authData.user) {
        console.log('✅ Sign up successful, creating profile...');
        
        // Ensure profile is created immediately
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            email: authData.user.email,
            full_name: data.fullName,
            phone: data.phone,
            country: data.country,
            kyc_status: 'unverified',
            account_balance: 0,
            is_verified: false
          });

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          // Don't fail registration if profile creation fails, as the trigger should handle it
        }

        console.log('✅ Registration complete');
        return { success: true };
      }

      return { success: false, error: 'Sign up failed' };
    } catch (error) {
      console.error('❌ Unexpected sign up error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('🔐 Signing out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
      } else {
        console.log('✅ Sign out successful');
      }
    } catch (error) {
      console.error('❌ Unexpected sign out error:', error);
    }
  }

  async updateProfile(updates: ProfileUpdateData): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('📝 Updating profile for user:', user.id);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.fullName,
          avatar_url: updates.avatar,
          phone: updates.phone,
          country: updates.country,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Profile update error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Profile updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected profile update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Resetting password for:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Password reset email sent');
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected password reset error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Updating password...');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password update error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Password updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected password update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Admin functions
  async promoteToAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('👑 Promoting user to admin:', userId);
      
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: 'admin'
        });

      if (error) {
        console.error('❌ Admin promotion error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ User promoted to admin successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected admin promotion error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async demoteFromAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('👤 Demoting admin to user:', userId);
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) {
        console.error('❌ Admin demotion error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Admin demoted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected admin demotion error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // State management
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Utility methods
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  isAdmin(): boolean {
    return this.authState.isAdmin;
  }

  getUser(): AuthUser | null {
    return this.authState.user;
  }

  isLoading(): boolean {
    return this.authState.isLoading;
  }

  cleanup() {
    console.log('🧹 Cleaning up auth service...');
    this.subscriptions.forEach(subscription => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.warn('⚠️ Error unsubscribing:', error);
      }
    });
    this.subscriptions = [];
    this.listeners.clear();
  }
}

// Create singleton instance
const supabaseAuthService = new SupabaseAuthService();

export default supabaseAuthService; 