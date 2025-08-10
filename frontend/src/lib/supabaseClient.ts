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

// Create Supabase client with defensive coding
// This will prevent the "supabaseUrl is required" error
const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Export the initialized client
export default supabase;
export { supabase };
