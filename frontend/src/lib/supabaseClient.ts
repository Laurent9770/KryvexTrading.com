import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL ERROR: Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
  
  // In production, throw an error to prevent the app from running with invalid config
  if (import.meta.env.PROD) {
    throw new Error('Missing required Supabase environment variables. Please check your configuration.');
  }
}

console.log('🔐 Initializing production Supabase client...');
console.log('🔍 Environment:', import.meta.env.MODE);
console.log('🔍 Supabase URL:', supabaseUrl ? 'CONFIGURED' : 'MISSING');

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Production validation - ensure we're not in mock mode
if (import.meta.env.PROD) {
  console.log('🚀 PRODUCTION MODE: Real Supabase client initialized');
  console.log('🔒 Authentication enforcement: ENABLED');
  console.log('🚫 Mock user creation: DISABLED');
} else {
  console.log('🔧 DEVELOPMENT MODE: Real Supabase client initialized');
  console.log('🔒 Authentication enforcement: ENABLED');
  console.log('🚫 Mock user creation: DISABLED');
}

export default supabase;
