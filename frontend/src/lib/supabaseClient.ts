import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe environment variable retrieval with explicit logging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Comprehensive logging and validation
console.log('SUPABASE CONFIGURATION DIAGNOSTICS:');
console.log(`URL Length: ${supabaseUrl.length}`);
console.log(`Anon Key Length: ${supabaseAnonKey.length}`);

// Enhanced client creation with minimal but safe configuration
let supabase: SupabaseClient;

try {
  // Try with minimal auth options only (no global headers)
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  console.log('✅ Supabase client initialized with auth options');
} catch (error) {
  console.error('❌ Supabase client initialization with auth options failed:', error);
  
  // Fallback to minimal configuration
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('⚠️ Fallback: Supabase client created with minimal config');
  } catch (fallbackError) {
    console.error('🚨 Critical: Cannot create Supabase client', fallbackError);
    
    // Create a comprehensive mock client to prevent total application failure
    supabase = {
      from: () => ({
        select: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
        insert: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
        update: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
        eq: () => ({ select: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }) }),
        single: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
        order: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
        limit: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
        range: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
        signInWithOAuth: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
        signUp: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
        signOut: () => Promise.resolve({ error: null }),
        resetPasswordForEmail: () => Promise.resolve({ error: null }),
        updateUser: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
        onAuthStateChange: (callback: any) => {
          // Return a subscription object with unsubscribe method
          return {
            data: {
              subscription: {
                unsubscribe: () => {}
              }
            }
          };
        }
      },
      channel: () => ({
        on: () => ({ subscribe: () => Promise.resolve({ error: null }) }),
        subscribe: () => Promise.resolve({ error: null })
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
          download: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
          remove: () => Promise.resolve({ data: null, error: new Error('Offline mock client') }),
          list: () => Promise.resolve({ data: null, error: new Error('Offline mock client') })
        })
      }
    } as any;
    
    console.log('⚠️ Using comprehensive mock client due to initialization failure');
  }
}

// Diagnostic logging of client capabilities
console.log('Client Diagnostic:');
console.log(`Can create 'from' queries: ${!!supabase.from}`);
console.log(`Has auth methods: ${!!supabase.auth}`);
console.log(`Has onAuthStateChange: ${!!supabase.auth?.onAuthStateChange}`);

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
