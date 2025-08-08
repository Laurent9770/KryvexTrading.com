import { supabase, getUserRole, isUserAdmin } from '@/integrations/supabase/client'
import { Profile, ProfileInsert, ProfileUpdate } from '@/integrations/supabase/types'
import { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  fullName?: string
  avatar?: string
  phone?: string
  country?: string
  accountBalance: number
  isVerified: boolean
  kycStatus: 'pending' | 'approved' | 'rejected'
  isAdmin: boolean
  accountStatus: 'active' | 'suspended' | 'blocked'
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  fullName: string
  phone?: string
  country?: string
}

export interface ProfileUpdateData {
  fullName?: string
  avatar?: string
  phone?: string
  country?: string
}

class SupabaseAuthService {
  private authState: AuthState = {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false
  }

  private listeners: Set<(state: AuthState) => void> = new Set()

  constructor() {
    this.initializeAuth()
  }

  private async initializeAuth() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        this.updateAuthState({ user: null, isLoading: false, isAuthenticated: false, isAdmin: false })
        return
      }

      if (session?.user) {
        await this.handleUserSession(session.user)
      } else {
        this.updateAuthState({ user: null, isLoading: false, isAuthenticated: false, isAdmin: false })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          await this.handleUserSession(session.user)
        } else if (event === 'SIGNED_OUT') {
          this.updateAuthState({ user: null, isLoading: false, isAuthenticated: false, isAdmin: false })
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      this.updateAuthState({ user: null, isLoading: false, isAuthenticated: false, isAdmin: false })
    }
  }

  private async handleUserSession(user: User) {
    try {
      console.log('🔐 Handling user session for:', user.email)
      
      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        
        // Check if it's a "not found" error (which is expected for new users)
        if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows returned')) {
          console.warn('⚠️ No profile found for user, creating one...')
          await this.createUserProfile(user)
          return
        }
        
        // For other errors, try to create profile anyway
        console.warn('⚠️ Profile fetch failed, attempting to create profile...')
        await this.createUserProfile(user)
        return
      }

      // Check if profile exists and has required fields
      if (!profile) {
        console.warn('⚠️ No profile found for user, creating one...')
        await this.createUserProfile(user)
        return
      }

      // Check if user is admin
      const isAdmin = await isUserAdmin(user.id)

      const authUser: AuthUser = {
        id: user.id,
        email: user.email!,
        fullName: profile?.full_name || user.user_metadata?.full_name || user.email!.split('@')[0],
        avatar: profile?.avatar_url || undefined,
        phone: profile?.phone || undefined,
        country: profile?.country || undefined,
        accountBalance: profile?.account_balance || 0,
        isVerified: profile?.is_verified || false,
        kycStatus: profile?.kyc_status || 'pending',
        isAdmin,
        accountStatus: profile?.account_status || 'active',
        createdAt: profile?.created_at || new Date().toISOString(),
        updatedAt: profile?.updated_at || new Date().toISOString()
      }

      console.log('✅ User session handled successfully:', authUser)

      this.updateAuthState({
        user: authUser,
        isLoading: false,
        isAuthenticated: true,
        isAdmin
      })

      // Set up real-time subscriptions for this user
      this.setupRealtimeSubscriptions(user.id)
    } catch (error) {
      console.error('❌ Error handling user session:', error)
      this.updateAuthState({ user: null, isLoading: false, isAuthenticated: false, isAdmin: false })
    }
  }

  private async createUserProfile(user: User) {
    try {
      console.log('🔧 Creating user profile for:', user.email)
      
      const profileData: ProfileInsert = {
        user_id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email!.split('@')[0],
        account_balance: 0,
        is_verified: false,
        kyc_status: 'pending',
        account_status: 'active'
      }

      console.log('📝 Profile data to insert:', profileData)

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating profile:', error)
        
        // Check if it's a duplicate key error (profile already exists)
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          console.log('ℹ️ Profile already exists, continuing...')
          // Continue with the session handling
          await this.handleUserSession(user)
          return
        }
        
        console.error('❌ Failed to create profile, aborting session setup')
        return
      }

      console.log('✅ Profile created successfully:', profile)

      // Create user role (default to 'user')
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'user'
        })

      if (roleError) {
        console.error('❌ Error creating user role:', roleError)
        // Don't fail the entire process for role creation error
      } else {
        console.log('✅ User role created successfully')
      }

      // Re-fetch the profile with admin status
      await this.handleUserSession(user)
    } catch (error) {
      console.error('❌ Error creating user profile:', error)
      throw error // Re-throw to be handled by caller
    }
  }

  private setupRealtimeSubscriptions(userId: string) {
    // Subscribe to profile changes
    const profileSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('Profile updated:', payload)
          const profile = payload.new as Profile
          const isAdmin = await isUserAdmin(userId)
          
          const authUser: AuthUser = {
            id: userId,
            email: profile.email,
            fullName: profile.full_name || undefined,
            avatar: profile.avatar_url || undefined,
            phone: profile.phone || undefined,
            country: profile.country || undefined,
            accountBalance: profile.account_balance,
            isVerified: profile.is_verified,
            kycStatus: profile.kyc_status,
            isAdmin,
            accountStatus: profile.account_status,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at
          }

          this.updateAuthState({
            user: authUser,
            isLoading: false,
            isAuthenticated: true,
            isAdmin
          })
        }
      )
      .subscribe()

    // Subscribe to notifications
    const notificationSubscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification:', payload)
          // Emit notification event
          this.emit('notification', payload.new)
        }
      )
      .subscribe()

    // Subscribe to trade updates
    const tradeSubscription = supabase
      .channel('trades')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Trade update:', payload)
          this.emit('trade_update', payload)
        }
      )
      .subscribe()

    // Subscribe to transaction updates
    const transactionSubscription = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Transaction update:', payload)
          this.emit('transaction_update', payload)
        }
      )
      .subscribe()

    // Store subscriptions for cleanup
    this.subscriptions = [profileSubscription, notificationSubscription, tradeSubscription, transactionSubscription]
  }

  private subscriptions: any[] = []

  private updateAuthState(newState: Partial<AuthState>) {
    this.authState = { ...this.authState, ...newState }
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState))
  }

  private emit(event: string, data: any) {
    // Emit events to listeners
    this.listeners.forEach(listener => {
      if (typeof listener === 'function') {
        // @ts-ignore
        listener(event, data)
      }
    })
  }

  // Public methods
  async signIn(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        console.error('Sign in error:', error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        await this.handleUserSession(data.user)
        return { success: true }
      }

      return { success: false, error: 'Sign in failed' }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async signUp(data: RegisterData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Attempting to sign up user:', { email: data.email, fullName: data.fullName })
      
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
      })

      if (error) {
        console.error('❌ Sign up error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Sign up successful:', authData)

      if (authData.user) {
        // Profile will be created automatically by the database trigger
        await this.handleUserSession(authData.user)
        return { success: true }
      }

      console.warn('⚠️ Sign up completed but no user data returned')
      return { success: false, error: 'Sign up failed - no user data returned' }
    } catch (error) {
      console.error('❌ Sign up error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
    }
  }

  async signOut(): Promise<void> {
    try {
      // Clean up subscriptions
      this.subscriptions.forEach(sub => sub.unsubscribe())
      this.subscriptions = []

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }

      this.updateAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false
      })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  async updateProfile(updates: ProfileUpdateData): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.authState.user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.fullName,
          avatar_url: updates.avatar,
          phone: updates.phone,
          country: updates.country,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.authState.user.id)

      if (error) {
        console.error('Profile update error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Profile update error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        console.error('Password reset error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('Password update error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Password update error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // State management
  getAuthState(): AuthState {
    return this.authState
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Admin methods
  async promoteToAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.authState.isAdmin) {
        return { success: false, error: 'Unauthorized' }
      }

      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: 'admin'
        })

      if (error) {
        console.error('Promote to admin error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Promote to admin error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async demoteFromAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.authState.isAdmin) {
        return { success: false, error: 'Unauthorized' }
      }

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin')

      if (error) {
        console.error('Demote from admin error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Demote from admin error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated
  }

  isAdmin(): boolean {
    return this.authState.isAdmin
  }

  getUser(): AuthUser | null {
    return this.authState.user
  }

  isLoading(): boolean {
    return this.authState.isLoading
  }

  // Cleanup method
  cleanup() {
    this.subscriptions.forEach(subscription => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing from auth subscription:', error);
        }
      }
    });
    this.subscriptions = [];
    this.listeners.clear();
  }
}

// Create singleton instance
const supabaseAuthService = new SupabaseAuthService()
export default supabaseAuthService 