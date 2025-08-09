import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Direct hardcoded credentials to ensure they're always available
const SUPABASE_URL = 'https://ftkeczodadvtnxofrwps.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg'

// Get environment variables (will override hardcoded if available)
const envUrl = import.meta.env.VITE_SUPABASE_URL
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Use env vars if available, otherwise use hardcoded
const finalUrl = envUrl || SUPABASE_URL
const finalKey = envKey || SUPABASE_ANON_KEY

console.log('🔧 Supabase Configuration:', {
  usingEnvVars: !!(envUrl && envKey),
  hasUrl: !!finalUrl,
  hasKey: !!finalKey,
  urlLength: finalUrl?.length || 0,
  keyLength: finalKey?.length || 0
})

// Create the Supabase client with validated credentials
let supabaseClient: SupabaseClient | null = null

try {
  // Validate that we have the required values
  if (!finalUrl || !finalKey || finalUrl === 'undefined' || finalKey === 'undefined') {
    throw new Error('Invalid Supabase credentials')
  }

  // Create the client with basic configuration
  supabaseClient = createClient(finalUrl, finalKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false // Disable to prevent issues
    }
  })

  console.log('✅ Supabase client initialized successfully')
} catch (error) {
  console.error('❌ Supabase client initialization failed:', error)
  
  // Last resort - create with minimal config
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    console.warn('⚠️ Using minimal Supabase client configuration')
  } catch (fallbackError) {
    console.error('❌ Even fallback client creation failed:', fallbackError)
  }
}

// Export the client directly
export const supabase = supabaseClient

// Helper function to get the client safely
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    console.warn('⚠️ Supabase client is null, creating new one...')
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    } catch (error) {
      console.error('❌ Failed to recreate Supabase client:', error)
      throw new Error('Supabase client unavailable')
    }
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
    clientInitialized: !!supabaseClient
  })
}