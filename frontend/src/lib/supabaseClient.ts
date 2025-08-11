import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a safe Supabase client that handles the headers error
let supabase: any;

// Check if we're in a browser environment and have proper URLs
const isBrowser = typeof window !== 'undefined';
const hasValidUrl = supabaseUrl && supabaseUrl.startsWith('http');
const hasValidKey = supabaseAnonKey && supabaseAnonKey.length > 0;

console.log('🔍 Environment check:', {
  isBrowser,
  hasValidUrl,
  hasValidKey,
  supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
  supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.length} chars` : 'MISSING'
});

try {
  // Only try to create real client if we have valid credentials and are in browser
  if (isBrowser && hasValidUrl && hasValidKey) {
    console.log('🔐 Initializing Supabase client...');
    console.log('🔍 Environment:', import.meta.env.MODE);
    
    // Create the Supabase client with minimal configuration
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });

    console.log('✅ Supabase client initialized successfully');
  } else {
    throw new Error('Invalid environment or credentials');
  }
} catch (error) {
  console.error('❌ Error initializing Supabase client:', error);
  
  // Create a comprehensive mock client that includes all necessary methods
  console.warn('⚠️ Creating comprehensive mock Supabase client');
  
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase client initialization failed' } 
      }),
      signUp: async () => ({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase client initialization failed' } 
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: (callback: any) => {
        // Return a subscription object
        const subscription = {
          data: { subscription: null },
          unsubscribe: () => {}
        };
        return subscription;
      },
      getAccessToken: async () => ({ data: { access_token: null }, error: null }),
      refreshSession: async () => ({ data: { session: null }, error: null })
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed' } }),
          maybeSingle: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed' } })
        }),
        insert: (data: any) => ({
          select: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed' } })
        }),
        update: (data: any) => ({
          eq: (column: string, value: any) => ({
            select: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed' } })
          })
        }),
        delete: () => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed' } })
        })
      })
    }),
    rpc: (func: string, params?: any) => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed' } }),
    channel: (name: string) => ({
      on: (event: string, callback: any) => ({
        subscribe: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed' } })
      }),
      subscribe: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed' } })
    })
  };
}

export default supabase;
