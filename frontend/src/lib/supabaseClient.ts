import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';

// Create a safe Supabase client that handles the headers error
let supabase: any;

// Check if we're in a browser environment and have proper URLs
const isBrowser = typeof window !== 'undefined';
const hasValidUrl = supabaseUrl && supabaseUrl.startsWith('http') && !supabaseUrl.includes('your-project');
const hasValidKey = supabaseAnonKey && supabaseAnonKey.length > 20 && !supabaseAnonKey.includes('your-anon-key');

console.log('🔍 Environment check:', {
  isBrowser,
  hasValidUrl,
  hasValidKey,
  supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
  supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.length} chars` : 'MISSING',
  mode: import.meta.env.MODE,
  envKeys: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});

try {
  // Only try to create real client if we have valid credentials and are in browser
  if (isBrowser && hasValidUrl && hasValidKey) {
    console.log('🔐 Initializing Supabase client...');
    console.log('🔍 URL:', supabaseUrl);
    console.log('🔍 Key length:', supabaseAnonKey.length);
    
    // Create the Supabase client with minimal configuration to avoid headers error
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });

    // Test the connection immediately
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) {
          console.warn('⚠️ Supabase connection test failed:', error.message);
          return false;
        }
        console.log('✅ Supabase connection test successful');
        return true;
      } catch (testError) {
        console.warn('⚠️ Supabase connection test error:', testError);
        return false;
      }
    };

    // Run connection test in background
    testConnection();

    console.log('✅ Supabase client initialized successfully');
  } else {
    console.error('❌ Invalid environment or credentials:', {
      isBrowser,
      hasValidUrl,
      hasValidKey,
      supabaseUrl: supabaseUrl?.substring(0, 20) + '...',
      supabaseAnonKey: supabaseAnonKey?.substring(0, 10) + '...'
    });
    throw new Error('Invalid environment or credentials - please check your .env file');
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
        error: { message: 'Supabase client initialization failed - please check your .env file' } 
      }),
      signUp: async () => ({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase client initialization failed - please check your .env file' } 
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
          single: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed - please check your .env file' } }),
          maybeSingle: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed - please check your .env file' } })
        }),
        insert: (data: any) => ({
          select: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed - please check your .env file' } })
        }),
        update: (data: any) => ({
          eq: (column: string, value: any) => ({
            select: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed - please check your .env file' } })
          })
        }),
        delete: () => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed - please check your .env file' } })
        }),
        order: (column: string, options?: any) => ({
          limit: (count: number) => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed - please check your .env file' } })
        }),
        limit: (count: number) => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed - please check your .env file' } })
      })
    }),
    rpc: (func: string, params?: any) => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed - please check your .env file' } }),
    channel: (name: string) => ({
      on: (event: string, callback: any) => ({
        subscribe: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed - please check your .env file' } })
      }),
      subscribe: () => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed - please check your .env file' } })
    }),
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: any, options?: any) => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed - please check your .env file' } }),
        download: (path: string) => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed - please check your .env file' } }),
        remove: (paths: string[]) => Promise.resolve({ data: null, error: { message: 'Supabase client initialization failed - please check your .env file' } }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: '' } })
      })
    }
  };
}

export default supabase;
