import { createClient } from '@supabase/supabase-js';

// =============================================
// ROBUST SUPABASE CLIENT INITIALIZATION
// =============================================

// Get environment variables with better error handling
const getEnvironmentVariables = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log('🔍 Environment Variables Check:');
  console.log('Mode:', import.meta.env.MODE);
  console.log('Supabase URL:', supabaseUrl ? `✓ Set (${supabaseUrl.length} chars)` : '✗ Missing');
  console.log('Supabase Key:', supabaseAnonKey ? `✓ Set (${supabaseAnonKey.length} chars)` : '✗ Missing');

  // Validate environment variables
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is not defined. Please check your .env file.');
  }

  if (!supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not defined. Please check your .env file.');
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    throw new Error(`Invalid VITE_SUPABASE_URL format: ${supabaseUrl}`);
  }

  // Validate key format (should be a JWT)
  if (!supabaseAnonKey.startsWith('eyJ')) {
    throw new Error('Invalid VITE_SUPABASE_ANON_KEY format. Should be a JWT token starting with "eyJ".');
  }

  return { supabaseUrl, supabaseAnonKey };
};

// Create Supabase client with comprehensive error handling
let supabase: any = null;

try {
  const { supabaseUrl, supabaseAnonKey } = getEnvironmentVariables();
  
  console.log('🔐 Creating Supabase client...');
  
  // Create client with minimal configuration to avoid headers issues
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
  
  console.log('✅ Supabase client created successfully');
  
  // Test the connection immediately
  (async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        console.warn('⚠️ Supabase connection test failed:', error.message);
        if (error.message.includes('Data API')) {
          console.error('❌ CRITICAL: Data API is disabled in Supabase. Please enable it in Settings → API.');
        }
      } else {
        console.log('✅ Supabase connection test successful');
      }
    } catch (testError) {
      console.warn('⚠️ Supabase connection test error:', testError);
    }
  })();
  
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error);
  
  // Create a comprehensive fallback client
  supabase = {
    from: (table: string) => {
      console.error(`❌ Supabase client not initialized. Cannot query table: ${table}`);
      return {
        select: () => ({ data: null, error: { message: 'Supabase client not initialized' } }),
        insert: () => ({ data: null, error: { message: 'Supabase client not initialized' } }),
        update: () => ({ data: null, error: { message: 'Supabase client not initialized' } }),
        delete: () => ({ data: null, error: { message: 'Supabase client not initialized' } })
      };
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase client not initialized' } 
      }),
      signUp: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase client not initialized' } 
      }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: null }, unsubscribe: () => {} }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null })
    },
    channel: () => ({
      on: () => ({ subscribe: () => Promise.resolve({ error: null }) }),
      subscribe: () => Promise.resolve({ error: null })
    })
  };
}

export default supabase;
