import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

// Create options with proper initialization for headers
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      // Add any other default headers you might need
    }
  }
};

// Create and export the Supabase client instance
const supabase: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  options
);

// Debugging
console.log('🔄 Supabase client initialized with proper headers');

export default supabase;
