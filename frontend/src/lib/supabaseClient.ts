import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                   "https://ftkeczodadvtnxofrwps.supabase.co";

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg";

// Debug output
console.log('🔄 Supabase client initialization:');
console.log('URL:', supabaseUrl ? 'Defined ✓' : 'Missing ✗');
console.log('ANON KEY:', supabaseAnonKey ? 'Defined ✓' : 'Missing ✗');

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
      'X-Client-Info': 'kryvex-trading-platform'
    }
  }
};

// Create and export the Supabase client instance
const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  options
);

// Test the connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection error:', error);
  } else {
    console.log('✅ Supabase client connected successfully');
  }
}).catch((error) => {
  console.error('❌ Failed to test Supabase connection:', error);
});

export default supabase;
