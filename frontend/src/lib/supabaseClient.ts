import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Simple validation and client creation
let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL ERROR: Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
  
  // In development, create a minimal client to prevent crashes
  if (import.meta.env.DEV) {
    console.warn('⚠️ Development mode: Creating minimal Supabase client');
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
  } else {
    // In production, throw error to prevent invalid config
    throw new Error('Missing required Supabase environment variables. Please check your configuration.');
  }
} else {
  console.log('🔐 Initializing Supabase client...');
  console.log('🔍 Environment:', import.meta.env.MODE);
  
  // Create the Supabase client with error handling
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

  console.log('✅ Supabase client initialized successfully');
}

export default supabase;
