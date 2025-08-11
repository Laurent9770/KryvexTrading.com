import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a safe Supabase client that handles errors gracefully
let supabase: any;

try {
  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ CRITICAL ERROR: Missing Supabase environment variables');
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
    
    // Create a mock client to prevent crashes
    console.warn('⚠️ Creating fallback mock Supabase client due to missing environment variables');
    
    supabase = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Environment variables not configured' } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Environment variables not configured' } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: null } }),
        getAccessToken: async () => ({ data: { access_token: null }, error: null }),
        refreshSession: async () => ({ data: { session: null }, error: null })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Environment variables not configured' } }),
            maybeSingle: () => Promise.resolve({ data: null, error: { message: 'Environment variables not configured' } })
          }),
          insert: () => ({
            select: () => Promise.resolve({ data: null, error: { message: 'Environment variables not configured' } })
          }),
          update: () => ({
            eq: () => ({
              select: () => Promise.resolve({ data: null, error: { message: 'Environment variables not configured' } })
            })
          }),
          delete: () => ({
            eq: () => Promise.resolve({ data: null, error: { message: 'Environment variables not configured' } })
          })
        })
      }),
      rpc: () => Promise.resolve({ data: null, error: { message: 'Environment variables not configured' } })
    };
  } else {
    console.log('🔐 Initializing production Supabase client...');
    console.log('🔍 Environment:', import.meta.env.MODE);
    console.log('🔍 Supabase URL:', supabaseUrl ? 'CONFIGURED' : 'MISSING');

    // Create the real Supabase client
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

    // Production validation - ensure we're not in mock mode
    if (import.meta.env.PROD) {
      console.log('🚀 PRODUCTION MODE: Real Supabase client initialized');
      console.log('🔒 Authentication enforcement: ENABLED');
      console.log('🚫 Mock user creation: DISABLED');
    } else {
      console.log('🔧 DEVELOPMENT MODE: Real Supabase client initialized');
      console.log('🔒 Authentication enforcement: ENABLED');
      console.log('🚫 Mock user creation: DISABLED');
    }
  }
} catch (error) {
  console.error('❌ Error initializing Supabase client:', error);
  
  // Create a fallback mock client
  console.warn('⚠️ Creating fallback mock Supabase client due to initialization error');
  
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase client initialization failed' } }),
      signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase client initialization failed' } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: null } }),
      getAccessToken: async () => ({ data: { access_token: null }, error: null }),
      refreshSession: async () => ({ data: { session: null }, error: null })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed' } }),
          maybeSingle: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed' } })
        }),
        insert: () => ({
          select: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed' } })
        }),
        update: () => ({
          eq: () => ({
            select: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed' } })
          })
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed' } })
        })
      })
    }),
    rpc: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed' } })
  };
}

export default supabase;
