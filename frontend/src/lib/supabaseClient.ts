import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe environment variable retrieval with explicit logging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Comprehensive logging and validation
console.log('SUPABASE CONFIGURATION DIAGNOSTICS:');
console.log(`URL Length: ${supabaseUrl.length}`);
console.log(`Anon Key Length: ${supabaseAnonKey.length}`);

// Create a safe headers object
const safeHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Enhanced client creation with explicit global configuration
let supabase: SupabaseClient;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: safeHeaders
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  console.log('✅ Supabase client initialized with robust headers');
} catch (error) {
  console.error('❌ Supabase client initialization failed:', error);
  
  // Fallback to minimal configuration
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('⚠️ Fallback: Supabase client created with minimal config');
  } catch (fallbackError) {
    console.error('🚨 Critical: Cannot create Supabase client', fallbackError);
    
    // Create a mock client to prevent total application failure
    supabase = {
      from: () => ({
        select: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
        insert: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      }
    } as any;
  }
}

// Diagnostic logging of client capabilities
console.log('Client Diagnostic:');
console.log(`Can create 'from' queries: ${!!supabase.from}`);
console.log(`Has auth methods: ${!!supabase.auth}`);

// Diagnostic function to test Supabase connection
export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.auth.getSession();
    console.log('Session Data:', data);
    console.log('Session Error:', error);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return false;
    } else {
      console.log('✅ Supabase connection test successful');
      return true;
    }
  } catch (catchError) {
    console.error('❌ Unexpected Supabase connection error:', catchError);
    return false;
  }
}

// Run the diagnostic on initialization
testSupabaseConnection();

export default supabase;
