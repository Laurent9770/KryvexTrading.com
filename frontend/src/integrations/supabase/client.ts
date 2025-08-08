import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Enhanced validation and debugging
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Configuration:', {
    url: supabaseUrl ? '✅ Set' : '❌ Missing',
    key: supabaseAnonKey ? '✅ Set' : '❌ Missing',
    mode: import.meta.env.MODE
  })
}

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:', {
    url: supabaseUrl ? 'set' : 'missing',
    key: supabaseAnonKey ? 'set' : 'missing'
  })
  
  // In production, we should throw an error
  if (import.meta.env.PROD) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
  }
}

// Create Supabase client with proper configuration
let supabase: any

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
    
    console.log('✅ Supabase client created successfully')
  } else {
    throw new Error('Missing Supabase credentials')
  }
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error)
  
  // Create a fallback client for development
  if (import.meta.env.DEV) {
    console.warn('⚠️ Using fallback client for development')
    supabase = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: (callback: any) => {
          return { 
            data: { 
              subscription: { 
                unsubscribe: () => {} 
              } 
            } 
          }
        },
        getUser: async () => ({ data: { user: null }, error: null })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
          })
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
          })
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
            })
          })
        })
      })
    }
  } else {
    throw error
  }
}

// Test the client by making a simple query
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.warn('⚠️ Supabase connection test failed:', error)
      return false
    }
    console.log('✅ Supabase client initialized and tested successfully')
    return true
  } catch (testError) {
    console.error('❌ Supabase client test failed:', testError)
    return false
  }
}

// Test connection on initialization
testConnection()

// Helper function to get user role
export const getUserRole = async (userId: string): Promise<'admin' | 'user'> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user role:', error)
      return 'user'
    }

    return data?.role || 'user'
  } catch (error) {
    console.error('Error in getUserRole:', error)
    return 'user'
  }
}

// Helper function to check if user is admin
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const role = await getUserRole(userId)
    return role === 'admin'
  } catch (error) {
    console.error('Error in isUserAdmin:', error)
    return false
  }
}

// Helper function to get API URL
export const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'https://kryvextrading-com.onrender.com'
}

// Helper function to check if running in development
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || false
}

// Helper function to log environment status
export const logEnvironmentStatus = (): void => {
  console.log('🔧 Frontend Environment Status:', {
    supabaseUrl: supabaseUrl ? '✅ Set' : '❌ Missing',
    supabaseAnonKey: supabaseAnonKey ? '✅ Set' : '❌ Missing',
    apiUrl: getApiUrl(),
    mode: import.meta.env.MODE,
    clientInitialized: !!supabase
  })
}

// Export the supabase client
export { supabase }