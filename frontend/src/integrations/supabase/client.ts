import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Enhanced validation and debugging
console.log('🔧 Supabase Configuration Check:', {
  url: supabaseUrl ? '✅ Set' : '❌ Missing',
  key: supabaseAnonKey ? '✅ Set' : '❌ Missing',
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD
})

// Detailed environment variable debugging
console.log('🔍 Detailed Environment Debug:', {
  supabaseUrl: supabaseUrl || 'undefined',
  supabaseUrlLength: supabaseUrl ? supabaseUrl.length : 0,
  supabaseAnonKey: supabaseAnonKey ? `Set (${supabaseAnonKey.length} chars)` : 'undefined',
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
})

// Create a robust Supabase client that always works
let supabase: any = null

// Function to create the client
const createSupabaseClient = () => {
  try {
    // Use environment variables if available, otherwise use fallback credentials
    const finalUrl = supabaseUrl || 'https://ftkeczodadvtnxofrwps.supabase.co'
    const finalKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg'

    // Validate the credentials before creating client
    if (!finalUrl || !finalKey) {
      throw new Error('Invalid Supabase credentials')
    }

    // Log which credentials we're using
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("⚠️ Using fallback Supabase credentials")
    } else {
      console.log("✅ Using environment variable Supabase credentials")
    }

    // Create singleton Supabase client with proper configuration
    const client = createClient(finalUrl, finalKey, {
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
    return client
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    
    // Emergency fallback - create a minimal client
    console.warn("⚠️ Creating emergency fallback client")
    return createClient(
      'https://ftkeczodadvtnxofrwps.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg'
    )
  }
}

// Initialize the client immediately
supabase = createSupabaseClient()

// Helper function to get the client (with fallback)
export const getSupabaseClient = () => {
  if (!supabase) {
    console.warn('⚠️ Supabase client was null, recreating...')
    supabase = createSupabaseClient()
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
    supabaseUrl: supabaseUrl ? '✅ Set' : '❌ Missing',
    supabaseAnonKey: supabaseAnonKey ? '✅ Set' : '❌ Missing',
    apiUrl: getApiUrl(),
    mode: import.meta.env.MODE,
    clientInitialized: !!supabase
  })
}

// Export the singleton supabase client
export { supabase }