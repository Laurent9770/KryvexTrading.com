// PRODUCTION-READY Supabase Client
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Production-safe logging
const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const log = isDev ? console.log : () => {};

log('🔧 Initializing Supabase client...');

// Essential polyfills for production
if (typeof window !== 'undefined') {
  if (typeof (window as any).global === 'undefined') {
    (window as any).global = window;
  }
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  }
}

// Static credentials - no environment dependencies
const SUPABASE_URL = 'https://ftkeczodadvtnxofrwps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

// Basic validation
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase credentials missing');
}

// Create client with minimal config for production compatibility
log('🔧 Creating Supabase client...');

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false // Disable to prevent production issues
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Production-safe validation
if (!supabase || !supabase.auth || !supabase.from) {
  throw new Error('Supabase client initialization failed');
}

log('✅ Supabase client created successfully');

// Export the client
export { supabase };

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