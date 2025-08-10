import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                   "https://ftkeczodadvtnxofrwps.supabase.co";

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg";

// Log configuration status
console.log('SUPABASE CONFIGURATION:');
console.log(`URL: ${supabaseUrl ? 'Defined ✓' : 'Missing ✗'}`);
console.log(`ANON KEY: ${supabaseAnonKey ? 'Defined ✓' : 'Missing ✗'}`);

// Create a safer Supabase client without any potentially problematic options
let supabase: SupabaseClient;

try {
  // First try with minimal options
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  
  console.log('✅ Supabase client initialized successfully');
} catch (error) {
  // Fallback to even more minimal initialization if the first attempt fails
  console.error('Error creating Supabase client with options, falling back to minimal client:', error);
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('⚠️ Supabase client initialized with fallback configuration');
}

// Export the client instance
export default supabase;
