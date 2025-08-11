import { createClient } from '@supabase/supabase-js';

// =============================================
// LAZY SUPABASE CLIENT INITIALIZATION
// =============================================

let supabaseInstance: any = null;

const createSupabaseClient = () => {
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

  try {
    // Create Supabase client with absolutely minimal configuration
    const client = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client created successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    throw error;
  }
};

// Create a proxy that maintains the same interface
const supabase = new Proxy({}, {
  get(target, prop) {
    if (!supabaseInstance) {
      supabaseInstance = createSupabaseClient();
    }
    return supabaseInstance[prop];
  }
});

export default supabase;
