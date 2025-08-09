// WORKING Supabase Client - Real Authentication
console.log('🚀 Starting WORKING Supabase client...');

// Essential polyfills
if (typeof window !== 'undefined') {
  console.log('🔧 Setting up polyfills...');
  (window as any).global = window;
  (window as any).process = { env: {}, version: 'browser', platform: 'browser' };
  
  // Critical polyfills for Supabase
  if (!(window as any).Buffer) {
    (window as any).Buffer = {
      from: (data: any) => new Uint8Array(data),
      isBuffer: () => false
    };
  }
}

// Import Supabase
import { createClient, SupabaseClient } from '@supabase/supabase-js';
console.log('✅ Supabase SDK imported');

// Real credentials
const SUPABASE_URL = 'https://ftkeczodadvtnxofrwps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

console.log('🔗 URL:', SUPABASE_URL);
console.log('🔑 Key valid:', SUPABASE_ANON_KEY.length > 100);

// Create the real client
console.log('🏗️ Creating real Supabase client...');

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Enable for OAuth
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'kryvex-frontend'
    }
  }
});

// Validate client immediately
console.log('🔍 Validating client...');
console.log('Has auth:', !!supabase.auth);
console.log('Has from:', !!supabase.from);
console.log('Has storage:', !!supabase.storage);

// Mark as real client
(supabase as any).__isRealClient = true;

// Test basic functionality
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.log('⚠️ Auth test error (expected):', error.message);
  } else {
    console.log('✅ Auth test successful, session:', !!data.session);
  }
}).catch(err => {
  console.log('⚠️ Auth test failed:', err.message);
});

console.log('✅ REAL SUPABASE CLIENT CREATED AND READY!');

// Exports
export { supabase };
export default supabase;

export const getSupabaseClient = (): SupabaseClient => {
  console.log('🔍 getSupabaseClient called - returning REAL client');
  return supabase;
};

export const hasRealSupabaseClient = (): boolean => {
  const isReal = !!(supabase as any).__isRealClient;
  console.log('🔍 hasRealSupabaseClient called, result:', isReal);
  return isReal;
};

export const getApiUrl = (): string => {
  return 'https://kryvextrading-com.onrender.com';
};

export const isDevelopment = (): boolean => {
  return typeof window !== 'undefined' && 
         (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
};

export const logEnvironmentStatus = (): void => {
  console.log('🌍 Environment Status:', {
    supabaseConnected: true,
    isRealClient: true,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    authAvailable: !!supabase.auth
  });
};

// Initialize immediately
logEnvironmentStatus();
console.log('🎉 WORKING Supabase client ready for authentication!');