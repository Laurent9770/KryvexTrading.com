// Polyfill for missing globals that Supabase needs
if (typeof global === 'undefined') {
  (window as any).global = window;
}

// Ensure Headers is available
if (typeof window !== 'undefined' && !window.Headers) {
  console.warn('Headers not available, creating polyfill');
  (window as any).Headers = class {
    constructor(init: any = {}) {
      Object.assign(this, init);
    }
  };
}

// Hardcoded credentials that we know work
const SUPABASE_URL = 'https://ftkeczodadvtnxofrwps.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg'

console.log('🔧 Initializing Supabase client with polyfills...')

// Create the client with safe error handling and dynamic import
let supabase: any = null

async function createSupabaseClient() {
  try {
    // Dynamic import to ensure all dependencies are loaded
    const { createClient } = await import('@supabase/supabase-js');
    
    console.log('📦 Supabase package loaded successfully');
    
    // Create with minimal configuration
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    
    console.log('✅ Supabase client created successfully:', {
      client: !!supabase,
      auth: !!supabase?.auth,
      url: SUPABASE_URL,
      keyLength: SUPABASE_ANON_KEY.length
    });
    
    return supabase;
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    console.error('Error details:', error)
  
    // Create a mock client to prevent crashes
    supabase = {
      auth: {
        signInWithOAuth: async () => ({ data: null, error: new Error('Supabase client unavailable') }),
        getSession: async () => ({ data: { session: null }, error: new Error('Supabase client unavailable') }),
        signOut: async () => ({ error: new Error('Supabase client unavailable') }),
        signUp: async () => ({ data: null, error: new Error('Supabase client unavailable') }),
        signInWithPassword: async () => ({ data: null, error: new Error('Supabase client unavailable') }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => ({ data: null, error: new Error('Supabase client unavailable') }),
        insert: () => ({ data: null, error: new Error('Supabase client unavailable') }),
        update: () => ({ data: null, error: new Error('Supabase client unavailable') }),
        delete: () => ({ data: null, error: new Error('Supabase client unavailable') })
      })
    } as any;
    
    console.warn('⚠️ Using mock Supabase client to prevent crashes');
    return supabase;
  }
}

// Initialize the client immediately
createSupabaseClient().then(client => {
  supabase = client;
}).catch(error => {
  console.error('Failed to initialize Supabase client:', error);
});

// Create a synchronous getter that ensures the client is available
const getSupabaseClient = async (): Promise<any> => {
  if (!supabase) {
    console.log('🔄 Waiting for Supabase client initialization...');
    supabase = await createSupabaseClient();
  }
  return supabase;
};

// Export both sync and async versions
export { supabase };
export { getSupabaseClient };

// Simplified helper functions for the new async client
export const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'https://kryvextrading-com.onrender.com'
}

export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || false
}

export const logEnvironmentStatus = (): void => {
  console.log('🔧 Frontend Environment Status:', {
    supabaseUrl: SUPABASE_URL,
    clientInitialized: !!supabase,
    authAvailable: !!(supabase && supabase.auth),
    mode: import.meta.env.MODE,
    apiUrl: getApiUrl()
  })
}

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
    const client = await getSupabaseClient()
    result.clientStatus = 'available'

    if (client.auth) {
      result.authStatus = 'available'

      try {
        const { data: { session }, error } = await client.auth.getSession()
        result.sessionStatus = error ? `error: ${error.message}` : (session ? 'active' : 'none')
      } catch (sessionError: any) {
        result.sessionStatus = `failed: ${sessionError.message}`
      }

      try {
        const { data, error } = await client.from('profiles').select('count').limit(1)
        if (error) {
          result.policiesStatus = error.message.includes('permission') || error.message.includes('policy') 
            ? 'policy_error' : `db_error: ${error.message}`
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