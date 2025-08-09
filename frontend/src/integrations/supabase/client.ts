import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Hardcoded credentials that we know work
const SUPABASE_URL = 'https://ftkeczodadvtnxofrwps.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg'

console.log('🔧 Initializing Supabase client...')

// Create the client immediately with minimal configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

console.log('✅ Supabase client created:', {
  client: !!supabase,
  auth: !!supabase?.auth,
  url: SUPABASE_URL,
  keyLength: SUPABASE_ANON_KEY.length
})

// Export the client
export { supabase }

// Helper function to get the client safely
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase || !supabase.auth) {
    console.error('❌ Supabase client or auth not available')
    throw new Error('Supabase client unavailable')
  }
  return supabase
}

// Helper function to test connection (call this when needed)
export const testConnection = async () => {
  const client = getSupabaseClient()
  
  try {
    const { data, error } = await client.from('users').select('count').limit(1)
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

// Helper function to get user role
export const getUserRole = async (userId: string): Promise<'admin' | 'user'> => {
  const client = getSupabaseClient()
  
  try {
    const { data, error } = await client
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
    supabaseUrl: SUPABASE_URL,
    clientInitialized: !!supabase,
    authAvailable: !!(supabase && supabase.auth),
    mode: import.meta.env.MODE,
    apiUrl: getApiUrl()
  })
}

// Helper function to test authentication and policies
export const testAuthPolicies = async (): Promise<{
  clientStatus: string;
  authStatus: string;
  sessionStatus: string;
  policiesStatus: string;
}> => {
  const result = {
    clientStatus: 'unknown',
    authStatus: 'unknown', 
    sessionStatus: 'unknown',
    policiesStatus: 'unknown'
  }

  try {
    // Test client
    const client = getSupabaseClient()
    result.clientStatus = 'available'

    // Test auth
    if (client.auth) {
      result.authStatus = 'available'

      // Test session
      try {
        const { data: { session }, error } = await client.auth.getSession()
        if (error) {
          result.sessionStatus = `error: ${error.message}`
        } else {
          result.sessionStatus = session ? 'active' : 'none'
        }
      } catch (sessionError: any) {
        result.sessionStatus = `failed: ${sessionError.message}`
      }

      // Test basic database access (policies)
      try {
        const { data, error } = await client.from('profiles').select('count').limit(1)
        if (error) {
          if (error.message.includes('permission') || error.message.includes('policy')) {
            result.policiesStatus = 'policy_error'
          } else {
            result.policiesStatus = `db_error: ${error.message}`
          }
        } else {
          result.policiesStatus = 'accessible'
        }
      } catch (dbError: any) {
        result.policiesStatus = `failed: ${dbError.message}`
      }
    } else {
      result.authStatus = 'unavailable'
    }
  } catch (clientError: any) {
    result.clientStatus = `failed: ${clientError.message}`
  }

  console.log('🔍 Auth & Policy Test Results:', result)
  return result
}