import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a safe Supabase client that handles the headers error
let supabase: any;

try {
  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ CRITICAL ERROR: Missing Supabase environment variables');
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
    
    // Create a minimal fallback client
    console.warn('⚠️ Creating fallback Supabase client due to missing environment variables');
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
  } else {
    console.log('🔐 Initializing Supabase client...');
    console.log('🔍 Environment:', import.meta.env.MODE);
    
    // Create the Supabase client with error handling
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

    console.log('✅ Supabase client initialized successfully');
  }
} catch (error) {
  console.error('❌ Error initializing Supabase client:', error);
  
  // Create a minimal fallback client that won't cause crashes
  console.warn('⚠️ Creating fallback Supabase client due to initialization error');
  
  try {
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
  } catch (fallbackError) {
    console.error('❌ Even fallback client failed:', fallbackError);
    
    // Create a mock client as last resort
    supabase = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Client initialization failed' } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Client initialization failed' } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: null } })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Client initialization failed' } }),
            maybeSingle: () => Promise.resolve({ data: null, error: { message: 'Client initialization failed' } })
          }),
          insert: () => ({
            select: () => Promise.resolve({ data: null, error: { message: 'Client initialization failed' } })
          }),
          update: () => ({
            eq: () => ({
              select: () => Promise.resolve({ data: null, error: { message: 'Client initialization failed' } })
            })
          })
        })
      })
    };
  }
}

export default supabase;
