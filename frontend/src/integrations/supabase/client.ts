// BULLETPROOF Supabase Client - Force Fix All Issues
import { createClient, SupabaseClient } from '@supabase/supabase-js';

console.log('🔧 Starting bulletproof Supabase client initialization...');

// Ensure all required globals exist
if (typeof global === 'undefined') {
  (window as any).global = window;
  console.log('✅ Set global = window');
}

if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
  console.log('✅ Set process.env polyfill');
}

// HARDCODED CREDENTIALS - NO ENVIRONMENT VARIABLES
const SUPABASE_URL = 'https://ftkeczodadvtnxofrwps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

console.log('🔧 Using hardcoded Supabase credentials:', {
  url: SUPABASE_URL,
  keyLength: SUPABASE_ANON_KEY.length,
  urlValid: SUPABASE_URL.includes('supabase.co'),
  keyValid: SUPABASE_ANON_KEY.startsWith('eyJ')
});

// Validate credentials before proceeding
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('CRITICAL: Supabase credentials are missing');
}

if (!SUPABASE_URL.includes('supabase.co')) {
  throw new Error('CRITICAL: Invalid Supabase URL format');
}

if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
  throw new Error('CRITICAL: Invalid Supabase key format');
}

// Create Supabase client with maximum compatibility
let supabase: SupabaseClient | null = null;

try {
  console.log('🔧 Creating Supabase client with minimal config...');
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

  console.log('✅ Supabase client created successfully!', {
    client: !!supabase,
    auth: !!supabase?.auth,
    from: !!supabase?.from,
    storage: !!supabase?.storage
  });

} catch (error) {
  console.error('❌ CRITICAL: Failed to create Supabase client:', error);
  console.error('❌ Error name:', error?.name);
  console.error('❌ Error message:', error?.message);
  console.error('❌ Error stack:', error?.stack);
  console.error('❌ Full error object:', JSON.stringify(error, null, 2));
  
  // Also log what we attempted to pass to createClient
  console.error('❌ Attempted to create client with:', {
    url: SUPABASE_URL,
    keyLength: SUPABASE_ANON_KEY?.length,
    urlType: typeof SUPABASE_URL,
    keyType: typeof SUPABASE_ANON_KEY
  });
  
  // Create absolute minimal mock to prevent app crashes
  supabase = {
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }),
      signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }),
      signOut: async () => ({ error: { message: 'Supabase client failed to initialize' } }),
      getSession: async () => ({ data: { session: null }, error: { message: 'Supabase client failed to initialize' } }),
      getUser: async () => ({ data: { user: null }, error: { message: 'Supabase client failed to initialize' } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      resetPasswordForEmail: async () => ({ error: { message: 'Supabase client failed to initialize' } }),
      updateUser: async () => ({ error: { message: 'Supabase client failed to initialize' } })
    },
    from: () => ({
      select: () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }),
      insert: () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }),
      update: () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }),
      delete: () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }),
      eq: () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }),
      single: () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }),
      limit: () => ({ data: null, error: { message: 'Supabase client failed to initialize' } })
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }),
        download: async () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }),
        remove: async () => ({ data: null, error: { message: 'Supabase client failed to initialize' } })
      })
    }
  };
  
  console.warn('⚠️ Using mock Supabase client to prevent app crashes');
}

// Simple synchronous getter - no async needed
export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  return supabase;
};

// Export the client directly
export { supabase };

// Helper functions
export const getApiUrl = (): string => {
  return 'https://kryvextrading-com.onrender.com';
};

export const isDevelopment = (): boolean => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

export const logEnvironmentStatus = (): void => {
  console.log('🔧 Frontend Environment Status:', {
    supabaseUrl: SUPABASE_URL,
    clientInitialized: !!supabase,
    authAvailable: !!(supabase && supabase.auth),
    hostname: window.location.hostname,
    origin: window.location.origin
  });
};

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
  };

  try {
    const client = getSupabaseClient();
    result.clientStatus = 'available';

    if (client.auth) {
      result.authStatus = 'available';

      try {
        const { data: { session }, error } = await client.auth.getSession();
        result.sessionStatus = error ? `error: ${error.message}` : (session ? 'active' : 'none');
      } catch (sessionError: any) {
        result.sessionStatus = `failed: ${sessionError.message}`;
      }

      try {
        const { data, error } = await client.from('profiles').select('count').limit(1);
        if (error) {
          result.policiesStatus = error.message.includes('permission') || error.message.includes('policy') 
            ? 'policy_error' : `db_error: ${error.message}`;
        } else {
          result.policiesStatus = 'accessible';
        }
      } catch (dbError: any) {
        result.policiesStatus = `failed: ${dbError.message}`;
      }
    } else {
      result.authStatus = 'unavailable';
    }
  } catch (clientError: any) {
    result.clientStatus = `failed: ${clientError.message}`;
  }

  console.log('🔍 Auth & Policy Test Results:', result);
  return result;
};

// Test the client immediately
console.log('🧪 Testing Supabase client immediately...');
try {
  const testClient = getSupabaseClient();
  console.log('✅ Client test passed:', {
    auth: !!testClient.auth,
    from: !!testClient.from,
    storage: !!testClient.storage
  });
} catch (testError) {
  console.error('❌ Client test failed:', testError);
}

console.log('🎉 Bulletproof Supabase client initialization complete!');