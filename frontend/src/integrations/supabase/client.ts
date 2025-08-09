// ULTRA-SIMPLE Production Supabase Client - Zero Dependencies on Node.js APIs
import { createClient } from '@supabase/supabase-js';

// Comprehensive polyfills to prevent ANY Node.js reference errors
if (typeof window !== 'undefined') {
  // Polyfill global
  if (!(window as any).global) {
    (window as any).global = window;
  }
  
  // Polyfill process completely
  if (!(window as any).process) {
    (window as any).process = {
      env: {},
      version: 'v18.0.0',
      versions: { node: '18.0.0' },
      platform: 'browser',
      nextTick: (fn: Function) => setTimeout(fn, 0),
      cwd: () => '/',
      argv: []
    };
  }
  
  // Polyfill require (the source of our errors)
  if (!(window as any).require) {
    (window as any).require = (id: string) => {
      throw new Error(`Module '${id}' not found in browser environment`);
    };
  }
  
  // Polyfill Buffer if needed
  if (!(window as any).Buffer) {
    (window as any).Buffer = {
      from: (data: any) => new Uint8Array(data),
      isBuffer: () => false
    };
  }
}

// Safe logging
const safeLog = (msg: string, data?: any) => {
  if (typeof console !== 'undefined' && console.log) {
    try {
      console.log(msg, data || '');
    } catch (e) {
      // Ignore logging errors
    }
  }
};

safeLog('🔧 Ultra-simple Supabase client initialization...');

// Hardcoded credentials - absolutely no environment variable dependencies
const SUPABASE_URL = 'https://ftkeczodadvtnxofrwps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

// Create the client with absolute minimal configuration
let supabase: any;

try {
  safeLog('🔧 Creating Supabase client...');
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce'
    }
  });
  
  // Immediate validation
  if (supabase && supabase.auth && supabase.from) {
    safeLog('✅ Supabase client created successfully');
  } else {
    throw new Error('Client created but missing essential methods');
  }
} catch (error: any) {
  safeLog('❌ Supabase client creation failed:', error.message);
  
  // Create a functional mock that won't crash the app
  supabase = {
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Supabase client unavailable' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase client unavailable' } }),
      signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase client unavailable' } }),
      signInWithOtp: async () => ({ data: null, error: { message: 'Supabase client unavailable' } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: null } })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'Supabase client unavailable' } }) }) }),
      insert: () => ({ select: async () => ({ data: null, error: { message: 'Supabase client unavailable' } }) }),
      update: () => ({ eq: () => ({ select: async () => ({ data: null, error: { message: 'Supabase client unavailable' } }) }) }),
      delete: () => ({ eq: async () => ({ data: null, error: { message: 'Supabase client unavailable' } }) })
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Supabase client unavailable' } }),
        download: async () => ({ data: null, error: { message: 'Supabase client unavailable' } })
      })
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
      subscribe: () => ({})
    })
  };
  
  safeLog('⚠️ Using mock Supabase client to prevent crashes');
}

// Export the client (either real or mock)
export { supabase };

// Default export for compatibility
export default supabase;

// Simple getter function
export const getSupabaseClient = (): SupabaseClient => {
  return supabase;
};

// Helper functions
export const getApiUrl = (): string => {
  return 'https://kryvextrading-com.onrender.com';
};

export const isDevelopment = (): boolean => {
  return typeof window !== 'undefined' && 
         (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
};

export const logEnvironmentStatus = (): void => {
  if (isDevelopment()) {
    console.log('🔧 Environment Status:', {
      supabaseConnected: !!supabase,
      hostname: window.location.hostname
    });
  }
};

// Production-ready client - no complex testing that might cause issues