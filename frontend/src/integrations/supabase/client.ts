// CRASH-PROOF Supabase Client
console.log('🚀 Starting crash-proof Supabase client...');

// Essential polyfills first
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).process = { env: {}, version: 'browser' };
}

// Import Supabase at the top level
import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials
const SUPABASE_URL = 'https://ftkeczodadvtnxofrwps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

// Create mock client first (safe fallback)
const mockClient = {
  __isRealClient: false,
  auth: {
    signUp: async () => ({ data: null, error: { message: 'Supabase unavailable' } }),
    signInWithPassword: async () => ({ data: null, error: { message: 'Supabase unavailable' } }),
    signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase unavailable' } }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: null } })
  },
  from: () => ({
    select: () => ({ 
      eq: () => ({ 
        single: async () => ({ data: null, error: { message: 'Supabase unavailable' } }) 
      }) 
    })
  }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: { message: 'Supabase unavailable' } })
    })
  }
};

// Try to create real client, fall back to mock
let supabase: any = mockClient;

try {
  console.log('🏗️ Creating real Supabase client...');
  
  const realClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  });
  
  // Validate the client
  if (realClient && realClient.auth && realClient.from) {
    console.log('✅ REAL SUPABASE CLIENT CREATED!');
    supabase = realClient;
    (supabase as any).__isRealClient = true;
  } else {
    console.warn('⚠️ Real client missing methods, using mock');
  }
  
} catch (error) {
  console.error('❌ Failed to create real client:', error);
  console.log('⚠️ Using mock client as fallback');
}

// Exports
export { supabase };
export default supabase;

export const getSupabaseClient = () => supabase;

export const hasRealSupabaseClient = (): boolean => {
  return !!(supabase as any)?.__isRealClient;
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
    supabaseConnected: !!supabase,
    isRealClient: hasRealSupabaseClient(),
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
  });
};

console.log('🎉 Crash-proof client ready, real client:', hasRealSupabaseClient());