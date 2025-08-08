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

// Create a more robust Supabase client with error handling
let supabase: any = null

try {
  // Validate environment variables before creating client
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Supabase environment variables are missing")
    console.error("URL:", supabaseUrl || 'undefined')
    console.error("Key:", supabaseAnonKey ? 'Set' : 'undefined')
    console.error("Please check your Render.com environment variables:")
    console.error("- VITE_SUPABASE_URL")
    console.error("- VITE_SUPABASE_ANON_KEY")
    
    // Create a fallback client for development
    if (import.meta.env.DEV) {
      console.warn("⚠️ Creating fallback client for development")
      supabase = createClient(
        'https://ftkeczodadvtnxofrwps.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg',
        {
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
        }
      )
    } else {
      throw new Error("Missing Supabase credentials")
    }
  } else {
    // Create singleton Supabase client with proper configuration
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
  }

  console.log('✅ Supabase client created successfully')
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error)
  
  // Create a minimal fallback client
  if (import.meta.env.DEV) {
    console.warn("⚠️ Creating emergency fallback client")
    supabase = createClient(
      'https://ftkeczodadvtnxofrwps.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg'
    )
  } else {
    // In production, we need to handle this more gracefully
    console.error('❌ Cannot create Supabase client in production')
    supabase = null
  }
}

// Helper function to test connection (call this when needed)
export const testConnection = async () => {
  if (!supabase) {
    console.error('❌ Supabase client not available')
    return false
  }

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

// Helper function to get user role
export const getUserRole = async (userId: string): Promise<'admin' | 'user'> => {
  if (!supabase) {
    console.error('❌ Supabase client not available')
    return 'user'
  }

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

// Export the singleton supabase client
export { supabase }