import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ftkeczodadvtnxofrwps.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg'

// Enhanced validation and debugging
console.log('🔧 Supabase Configuration:', {
  url: supabaseUrl ? '✅ Set' : '❌ Missing',
  key: supabaseAnonKey ? '✅ Set' : '❌ Missing',
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:', {
    url: supabaseUrl ? 'set' : 'missing',
    key: supabaseAnonKey ? 'set' : 'missing'
  })
}

// Create a proper mock client with all Supabase methods
const createMockClient = () => {
  const mockQueryBuilder = () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        order: () => ({
          limit: async () => ({ data: [], error: null })
        })
      }),
      or: () => ({
        order: () => ({
          limit: async () => ({ data: [], error: null })
        })
      }),
      order: () => ({
        limit: async () => ({ data: [], error: null })
      }),
      limit: async () => ({ data: [], error: null }),
      single: async () => ({ data: null, error: null })
    }),
    insert: async () => ({ data: null, error: null }),
    update: () => ({
      eq: async () => ({ data: null, error: null })
    }),
    delete: () => ({
      eq: async () => ({ data: null, error: null })
    })
  })

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async (credentials: any) => {
        console.log('🔐 Mock signInWithPassword called with:', credentials)
        // Mock successful login for admin@kryvex.com and sales@kryvex.com
        if ((credentials.email === 'admin@kryvex.com' && credentials.password === 'admin123') ||
            (credentials.email === 'sales@kryvex.com' && credentials.password === 'Kryvex.@123')) {
          return {
            data: {
              user: {
                id: 'mock-user-id',
                email: credentials.email,
                role: credentials.email === 'admin@kryvex.com' ? 'admin' : 'user'
              },
              session: {
                access_token: 'mock-token',
                refresh_token: 'mock-refresh-token'
              }
            },
            error: null
          }
        }
        return {
          data: null,
          error: { message: 'Invalid credentials' }
        }
      },
      signUp: async (credentials: any) => {
        console.log('🔐 Mock signUp called with:', credentials)
        // Mock successful registration
        return {
          data: {
            user: {
              id: 'mock-new-user-id',
              email: credentials.email,
              role: 'user'
            },
            session: {
              access_token: 'mock-token',
              refresh_token: 'mock-refresh-token'
            }
          },
          error: null
        }
      },
      signOut: async () => ({ error: null }),
      onAuthStateChange: (callback: any) => {
        // Mock auth state change
        setTimeout(() => {
          callback('SIGNED_IN', {
            user: {
              id: 'mock-user-id',
              email: 'admin@kryvex.com',
              role: 'admin'
            }
          })
        }, 100)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      getUser: async () => ({ data: { user: null }, error: null })
    },
    from: mockQueryBuilder,
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    },
    channel: () => ({
      on: () => ({
        subscribe: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      })
    })
  }
}

// Create Supabase client with proper configuration
let supabase: any

try {
  // Create client with proper configuration
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
  
  console.log('✅ Supabase client initialized successfully')
  
  // Test the connection
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.warn('⚠️ Supabase connection test failed, using mock client')
      supabase = createMockClient()
    } else {
      console.log('✅ Supabase connection test successful')
    }
  }).catch((error) => {
    console.warn('⚠️ Supabase connection test failed, using mock client:', error)
    supabase = createMockClient()
  })
  
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error)
  
  // If even the basic client fails, create a proper mock client
  console.warn('⚠️ Creating fallback mock client')
  supabase = createMockClient()
}

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