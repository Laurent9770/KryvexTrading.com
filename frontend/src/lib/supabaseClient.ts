import { createClient } from '@supabase/supabase-js';

// Get environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('Supabase URL:', supabaseUrl ? 'Defined ✓' : 'Missing ✗');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Defined ✓' : 'Missing ✗');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error(`VITE_SUPABASE_URL: ${supabaseUrl ? 'Defined' : 'Missing'}`);
  console.error(`VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Defined' : 'Missing'}`);
}

// Create the Supabase client
const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true, 
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export default supabase;
export { supabase };
