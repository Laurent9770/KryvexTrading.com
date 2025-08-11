import { createClient } from '@supabase/supabase-js';

// =============================================
// SIMPLE SUPABASE CLIENT INITIALIZATION
// =============================================

// Get environment variables directly
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not defined');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not defined');
}

// Log environment status
console.log('🔍 Environment Status:');
console.log('Mode:', import.meta.env.MODE);
console.log('Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('Supabase Key:', supabaseAnonKey ? `✓ Set (${supabaseAnonKey.length} chars)` : '✗ Missing');

// Create Supabase client with absolutely minimal configuration
let supabase: any = null;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client created successfully');
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error);
  // Create a fallback client that will throw clear errors
  supabase = {
    from: () => {
      throw new Error('Supabase client initialization failed - please check your .env file');
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase client initialization failed - please check your .env file' } 
      }),
      signUp: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase client initialization failed - please check your .env file' } 
      }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: null }, unsubscribe: () => {} })
    }
  };
}

export default supabase;
