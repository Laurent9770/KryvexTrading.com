import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Direct hardcoded credentials to ensure they're always available
const SUPABASE_URL = 'https://ftkeczodadvtnxofrwps.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg'

// Get environment variables (will override hardcoded if available)
const envUrl = import.meta.env.VITE_SUPABASE_URL
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug environment variables
console.log('🔍 Environment Variables Debug:', {
  VITE_SUPABASE_URL: envUrl,
  VITE_SUPABASE_ANON_KEY: envKey ? `${envKey.substring(0, 20)}...` : 'undefined',
  hardcodedUrl: SUPABASE_URL,
  hardcodedKey: SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'undefined',
  importMetaEnv: typeof import.meta.env,
  allEnvKeys: Object.keys(import.meta.env || {})
})

// Use env vars if available, otherwise use hardcoded
const finalUrl = envUrl || SUPABASE_URL
const finalKey = envKey || SUPABASE_ANON_KEY

console.log('🔧 Supabase Configuration:', {
  usingEnvVars: !!(envUrl && envKey),
  hasUrl: !!finalUrl,
  hasKey: !!finalKey,
  urlLength: finalUrl?.length || 0,
  keyLength: finalKey?.length || 0,
  finalUrl: finalUrl,
  finalKeyPrefix: finalKey ? `${finalKey.substring(0, 20)}...` : 'undefined'
})

// Create the Supabase client with validated credentials
let supabaseClient: SupabaseClient | null = null

try {
  // Validate that we have the required values
  if (!finalUrl || !finalKey || finalUrl === 'undefined' || finalKey === 'undefined') {
    console.error('❌ Invalid Supabase credentials:', { finalUrl, finalKey })
    throw new Error(`Invalid Supabase credentials: URL=${!!finalUrl}, Key=${!!finalKey}`)
  }

  // Validate URL format
  if (!finalUrl.startsWith('https://') || !finalUrl.includes('supabase.co')) {
    console.error('❌ Invalid Supabase URL format:', finalUrl)
    throw new Error(`Invalid Supabase URL format: ${finalUrl}`)
  }

  // Validate key format (JWT)
  if (!finalKey.startsWith('eyJ') || finalKey.split('.').length !== 3) {
    console.error('❌ Invalid Supabase key format')
    throw new Error('Invalid Supabase key format')
  }

  console.log('🔧 Creating Supabase client with:', {
    url: finalUrl,
    keyLength: finalKey.length,
    keyPrefix: finalKey.substring(0, 20) + '...'
  })

  // Create the client with basic configuration
  supabaseClient = createClient(finalUrl, finalKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true // Enable for OAuth
    },
    global: {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  })

  // Test the client
  if (supabaseClient && supabaseClient.auth) {
    console.log('✅ Supabase client initialized successfully')
  } else {
    throw new Error('Supabase client or auth is null')
  }
} catch (error) {
  console.error('❌ Supabase client initialization failed:', error)
  
  // Create a simple fallback client
  console.warn('⚠️ Attempting fallback client creation...')
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
    console.warn('⚠️ Using fallback Supabase client')
  } catch (fallbackError) {
    console.error('❌ Even fallback client creation failed:', fallbackError)
    supabaseClient = null
  }
}

// Export the client directly
export const supabase = supabaseClient

// Helper function to get the client safely
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    console.warn('⚠️ Supabase client is null, creating new one...')
    try {
      console.log('🔧 Creating emergency Supabase client...')
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      })
      
      if (!supabaseClient || !supabaseClient.auth) {
        throw new Error('Created client is invalid')
      }
      
      console.log('✅ Emergency Supabase client created successfully')
    } catch (error) {
      console.error('❌ Failed to recreate Supabase client:', error)
      throw new Error(`Supabase client unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  if (!supabaseClient.auth) {
    console.error('❌ Supabase client exists but auth is null')
    throw new Error('Supabase auth unavailable')
  }
  
  return supabaseClient
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
    finalUrl: finalUrl ? '✅ Set' : '❌ Missing',
    finalKey: finalKey ? '✅ Set' : '❌ Missing',
    apiUrl: getApiUrl(),
    mode: import.meta.env.MODE,
    clientInitialized: !!supabaseClient,
    authAvailable: !!(supabaseClient && supabaseClient.auth)
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