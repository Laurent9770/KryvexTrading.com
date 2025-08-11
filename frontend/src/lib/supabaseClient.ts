import { createClient } from '@supabase/supabase-js';

// =============================================
// SIMPLIFIED SUPABASE CLIENT INITIALIZATION
// =============================================

// Get environment variables with validation
const getSupabaseConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || supabaseUrl === 'undefined' || supabaseUrl === '') {
    throw new Error('VITE_SUPABASE_URL is not properly defined. Check your .env file and deployment configuration.');
  }
  
  if (!supabaseAnonKey || supabaseAnonKey === 'undefined' || supabaseAnonKey === '') {
    throw new Error('VITE_SUPABASE_ANON_KEY is not properly defined. Check your .env file and deployment configuration.');
  }
  
  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    throw new Error(`Invalid VITE_SUPABASE_URL format: ${supabaseUrl}`);
  }
  
  // Validate key format (should be a JWT starting with eyJ)
  if (!supabaseAnonKey.startsWith('eyJ')) {
    throw new Error('Invalid VITE_SUPABASE_ANON_KEY format. Should be a JWT token starting with "eyJ".');
  }
  
  return { supabaseUrl, supabaseAnonKey };
};

// Create Supabase client with minimal configuration
let supabase: any = null;

try {
  console.log('🔐 Initializing Supabase client...');
  
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  
  // Create client with minimal configuration
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
  
  console.log('✅ Supabase client initialized successfully');
  
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error);
  
  // Create a fallback client
  supabase = {
    from: (table: string) => {
      console.error(`❌ Supabase client not initialized. Cannot query table: ${table}`);
      return {
        select: () => ({ 
          data: null, 
          error: { 
            message: `Supabase client not initialized. Cannot query table: ${table}.` 
          } 
        }),
        insert: () => ({ 
          data: null, 
          error: { 
            message: `Supabase client not initialized. Cannot insert into table: ${table}.` 
          } 
        }),
        update: () => ({ 
          data: null, 
          error: { 
            message: `Supabase client not initialized. Cannot update table: ${table}.` 
          } 
        }),
        delete: () => ({ 
          data: null, 
          error: { 
            message: `Supabase client not initialized. Cannot delete from table: ${table}.` 
          } 
        })
      };
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase client not initialized.' } 
      }),
      signUp: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase client not initialized.' } 
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
