// BULLETPROOF Supabase Client - Step by Step Creation
console.log('🚀 STARTING SUPABASE CLIENT INITIALIZATION...');

// Step 1: Essential polyfills FIRST
if (typeof window !== 'undefined') {
  console.log('🔧 Setting up browser polyfills...');
  (window as any).global = window;
  (window as any).process = { env: {}, version: 'browser', platform: 'browser' };
  
  // Add require polyfill
  if (!(window as any).require) {
    (window as any).require = () => {
      throw new Error('require() not available in browser');
    };
  }
}

// Step 2: Import Supabase
console.log('📦 Importing Supabase SDK...');
import { createClient } from '@supabase/supabase-js';
console.log('✅ Supabase SDK imported successfully');

// Step 3: Hardcoded credentials
console.log('🔑 Using hardcoded credentials...');
const SUPABASE_URL = 'https://ftkeczodadvtnxofrwps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

console.log('🔗 URL:', SUPABASE_URL);
console.log('🔑 Key length:', SUPABASE_ANON_KEY.length);

// Step 4: Create client
console.log('🏗️ Creating Supabase client...');
let supabase: any;

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  });

  console.log('🔍 Client created, validating...');
  console.log('Client exists:', !!supabase);
  console.log('Auth exists:', !!supabase?.auth);
  console.log('From exists:', !!supabase?.from);
  console.log('Storage exists:', !!supabase?.storage);

  if (supabase && supabase.auth && supabase.from) {
    console.log('✅ REAL SUPABASE CLIENT CREATED SUCCESSFULLY!');
    (supabase as any).__isRealClient = true;
  } else {
    throw new Error('Client missing essential methods');
  }
} catch (error) {
  console.error('❌ SUPABASE CLIENT CREATION FAILED:', error);
  console.error('Error stack:', (error as any)?.stack);
  
  // Create functional mock as last resort
  console.log('⚠️ Creating mock client as fallback...');
  supabase = {
    __isRealClient: false,
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }),
      signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: null } })
    },
    from: () => ({
      select: () => ({ 
        eq: () => ({ 
          single: async () => ({ data: null, error: { message: 'Supabase client failed to initialize' } }) 
        }) 
      })
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Supabase client failed to initialize' } })
      })
    }
  };
}

// Step 5: Exports
console.log('📤 Setting up exports...');

export { supabase };
export default supabase;

export const getSupabaseClient = () => {
  console.log('🔍 getSupabaseClient called, returning:', !!supabase ? 'client' : 'null');
  return supabase;
};

export const hasRealSupabaseClient = (): boolean => {
  const isReal = !!(supabase as any)?.__isRealClient;
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
    supabaseConnected: !!supabase,
    isRealClient: hasRealSupabaseClient(),
    hostname: window.location.hostname,
    isDev: isDevelopment()
  });
};

console.log('🎉 SUPABASE CLIENT SETUP COMPLETE!');
console.log('Real client available:', hasRealSupabaseClient());