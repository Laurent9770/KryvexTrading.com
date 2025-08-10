import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
// Using both possible formats for maximum compatibility
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL ||
                   process.env?.NEXT_PUBLIC_SUPABASE_URL ||
                   process.env?.VITE_SUPABASE_URL ||
                   "https://ftkeczodadvtnxofrwps.supabase.co";

const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY ||
                       process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                       process.env?.VITE_SUPABASE_ANON_KEY ||
                       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg";

// Debug output - this helps identify environment issues
console.log('SUPABASE INITIALIZATION:');
console.log('URL:', supabaseUrl ? 'Defined ✓' : 'Missing ✗');
console.log('ANON KEY:', supabaseAnonKey ? 'Defined ✓' : 'Missing ✗');

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Create Supabase client with defensive coding and proper configuration
const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'kryvex-trading-platform'
      }
    }
  }
);

// Test the client connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase client connection error:', error);
  } else {
    console.log('✅ Supabase client connected successfully');
  }
}).catch((error) => {
  console.error('❌ Failed to test Supabase connection:', error);
});

// Export the initialized client
export default supabase;
export { supabase };
