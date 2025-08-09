// FINAL BULLETPROOF Supabase Client - Static Import Only
import { createClient, SupabaseClient } from '@supabase/supabase-js';

console.log('🔧 Starting FINAL bulletproof Supabase client initialization...');

// Ensure all globals exist for browser compatibility
if (typeof global === 'undefined') {
  (window as any).global = window;
  console.log('✅ Set global = window');
}

if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
  console.log('✅ Set process.env polyfill');
}

// HARDCODED CREDENTIALS - Completely independent of environment variables
const SUPABASE_URL = 'https://ftkeczodadvtnxofrwps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

console.log('🔧 Using hardcoded Supabase credentials:', {
  url: SUPABASE_URL,
  keyLength: SUPABASE_ANON_KEY.length,
  urlValid: SUPABASE_URL.includes('supabase.co'),
  keyValid: SUPABASE_ANON_KEY.startsWith('eyJ')
});

// Validate credentials
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('CRITICAL: Supabase credentials are missing');
}

if (!SUPABASE_URL.includes('supabase.co')) {
  throw new Error('CRITICAL: Invalid Supabase URL format');
}

if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
  throw new Error('CRITICAL: Invalid Supabase key format');
}

// Create the Supabase client - Direct creation, no try/catch to see the real error
console.log('🔧 Creating Supabase client with direct createClient call...');

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

// Simple synchronous getter
export const getSupabaseClient = (): SupabaseClient => {
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

console.log('🎉 FINAL Supabase client initialization complete!');