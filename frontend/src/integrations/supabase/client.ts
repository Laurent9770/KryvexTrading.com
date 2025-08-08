import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ftkeczodadvtnxofrwps.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg'

// Enhanced validation and debugging
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Configuration:', {
    url: supabaseUrl ? '✅ Set' : '❌ Missing',
    key: supabaseAnonKey ? '✅ Set' : '❌ Missing',
    mode: import.meta.env.MODE
  })
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:', {
    url: supabaseUrl ? 'set' : 'missing',
    key: supabaseAnonKey ? 'set' : 'missing'
  })
}

// Create a proper mock client with all Supabase methods
const createMockClient = () => {
  if (import.meta.env.DEV) {
    console.log('🔧 Creating mock Supabase client')
  }
      const mockQueryBuilder = (table: string) => {
      if (import.meta.env.DEV) {
        console.log('🔧 Mock query builder called for table:', table)
      }
    return {
          select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            // Return a mock profile for profiles table
            if (table === 'profiles') {
              return { 
                data: { 
                  id: 'mock-profile-id',
                  user_id: 'mock-user-id',
                  email: 'mock@example.com',
                  full_name: 'Mock User',
                  account_balance: 0,
                  is_verified: false,
                  kyc_status: 'pending',
                  account_status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }, 
                error: null 
              }
            }
            // Return a mock role for user_roles table
            if (table === 'user_roles') {
              return { 
                data: { 
                  id: 'mock-role-id',
                  user_id: 'mock-user-id',
                  role: 'user'
                }, 
                error: null 
              }
            }
            return { data: null, error: null }
          },
          eq: (column: string, value: any) => ({
            single: async () => {
              // Handle double eq calls
              if (table === 'profiles') {
                return { 
                  data: { 
                    id: 'mock-profile-id',
                    user_id: 'mock-user-id',
                    email: 'mock@example.com',
                    full_name: 'Mock User',
                    account_balance: 0,
                    is_verified: false,
                    kyc_status: 'pending',
                    account_status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }, 
                  error: null 
                }
              }
              return { data: null, error: null }
            }
          }),
          order: (column: string, options?: any) => ({
            limit: async (count: number) => ({ data: [], error: null }),
            range: async (start: number, end: number) => ({ data: [], error: null })
          })
        }),
      or: (condition: string) => ({
        order: (column: string, options?: any) => ({
          limit: async (count: number) => ({ data: [], error: null }),
          range: async (start: number, end: number) => ({ data: [], error: null })
        })
      }),
      order: (column: string, options?: any) => ({
        limit: async (count: number) => ({ data: [], error: null }),
        range: async (start: number, end: number) => ({ data: [], error: null })
      }),
      limit: async (count: number) => ({ data: [], error: null }),
      range: async (start: number, end: number) => ({ data: [], error: null }),
      single: async () => {
        // Return a mock profile for profiles table
        if (table === 'profiles') {
          return { 
            data: { 
              id: 'mock-profile-id',
              user_id: 'mock-user-id',
              email: 'mock@example.com',
              full_name: 'Mock User',
              account_balance: 0,
              is_verified: false,
              kyc_status: 'pending',
              account_status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, 
            error: null 
          }
        }
        return { data: null, error: null }
      }
    }),
    insert: (data: any) => {
      if (import.meta.env.DEV) {
        console.log('🔧 Mock insert operation for table:', table, 'with data:', data)
      }
      return {
        select: (columns?: string) => ({
          single: async () => {
            // Return the inserted data for profiles table
            if (table === 'profiles') {
              const mockProfile = { 
                id: 'mock-profile-id',
                user_id: data.user_id || 'mock-user-id',
                email: data.email || 'mock@example.com',
                full_name: data.full_name || 'Mock User',
                account_balance: data.account_balance || 0,
                is_verified: data.is_verified || false,
                kyc_status: data.kyc_status || 'pending',
                account_status: data.account_status || 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
              if (import.meta.env.DEV) {
                console.log('✅ Mock profile created:', mockProfile)
              }
              return { data: mockProfile, error: null }
            }
            // Return the inserted data for user_roles table
            if (table === 'user_roles') {
              const mockRole = { 
                id: 'mock-role-id',
                user_id: data.user_id || 'mock-user-id',
                role: data.role || 'user'
              }
              if (import.meta.env.DEV) {
                console.log('✅ Mock role created:', mockRole)
              }
              return { data: mockRole, error: null }
            }
            return { data: null, error: null }
          }
        })
      }
    },
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: (columns?: string) => ({
          single: async () => {
            // Return updated data for profiles table
            if (table === 'profiles') {
              return { 
                data: { 
                  id: 'mock-profile-id',
                  user_id: 'mock-user-id',
                  email: 'mock@example.com',
                  full_name: data.full_name || 'Mock User',
                  account_balance: data.account_balance || 0,
                  is_verified: data.is_verified || false,
                  kyc_status: data.kyc_status || 'pending',
                  account_status: data.account_status || 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }, 
                error: null 
              }
            }
            return { data: null, error: null }
          }
        })
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        select: (columns?: string) => ({
          single: async () => ({ data: null, error: null })
        })
      })
    })
  }
}

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async (credentials: any) => {
        if (import.meta.env.DEV) {
          console.log('🔐 Mock signInWithPassword called with:', credentials)
        }
        // Mock successful login for test users
        const validUsers = [
          { email: 'admin@kryvex.com', password: 'admin123', role: 'admin' },
          { email: 'sales@kryvex.com', password: 'Kryvex.@123', role: 'user' },
          { email: 'user@test.com', password: 'password123', role: 'user' },
          { email: 'admin@test.com', password: 'admin123', role: 'admin' },
          { email: 'mumuna@gmail.com', password: 'Mumuna@123', role: 'user' }
        ]
        
        const user = validUsers.find(u => u.email === credentials.email && u.password === credentials.password)
        
        if (user) {
          return {
            data: {
              user: {
                id: 'mock-user-id',
                email: credentials.email,
                role: user.role
              },
              session: {
                access_token: 'mock-token',
                refresh_token: 'mock-refresh-token'
              }
            },
            error: null
          }
        }
        
        if (import.meta.env.DEV) {
          console.log('❌ Mock authentication failed for:', credentials.email)
        }
        return {
          data: null,
          error: { message: 'Invalid credentials' }
        }
      },
      signUp: async (credentials: any) => {
        if (import.meta.env.DEV) {
          console.log('🔐 Mock signUp called with:', credentials)
        }
        // Mock successful registration
        return {
          data: {
            user: {
              id: 'mock-new-user-id',
              email: credentials.email,
              role: 'user',
              user_metadata: {
                full_name: credentials.options?.data?.full_name || credentials.email.split('@')[0]
              }
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
        return { 
          data: { 
            subscription: { 
              unsubscribe: () => {
                if (import.meta.env.DEV) {
                  console.log('🔧 Mock auth subscription unsubscribed')
                }
              } 
            } 
          } 
        }
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
        subscribe: () => {
          if (import.meta.env.DEV) {
            console.log('🔧 Mock subscription created')
          }
                  return { 
          unsubscribe: () => {
            if (import.meta.env.DEV) {
              console.log('🔧 Mock subscription unsubscribed')
            }
          } 
        }
        }
      })
    })
  }
}

// Create Supabase client with proper error handling
let supabase: any

// Check if we have real Supabase credentials
const hasRealSupabase = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key' &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')

// Always try to use real Supabase client if credentials are available
if (hasRealSupabase) {
  console.log('🚀 Using real Supabase client')
  try {
    // Create client with proper configuration
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
    
    // Test the client by making a simple query
    const testQuery = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1)
        if (error) {
          console.warn('⚠️ Supabase connection test failed:', error)
          throw error
        }
        console.log('✅ Real Supabase client initialized and tested')
      } catch (testError) {
        console.error('❌ Supabase client test failed:', testError)
        throw testError
      }
    }
    
    // Run the test
    testQuery().catch(() => {
      console.warn('⚠️ Falling back to mock client due to connection issues')
      supabase = createMockClient()
    })
    
  } catch (error) {
    console.error('❌ Failed to create real Supabase client:', error)
    console.warn('⚠️ Falling back to mock client')
    supabase = createMockClient()
  }
} else {
  console.log('🔧 No real Supabase credentials found, using mock client')
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