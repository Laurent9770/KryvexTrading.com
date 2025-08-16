import { createClient } from '@supabase/supabase-js';
import { config as envConfig, isValidConfig } from './envConfig';

// =============================================
// PRODUCTION-OPTIMIZED SUPABASE CLIENT
// =============================================

// Get environment variables with validation
const getSupabaseConfig = () => {
  const supabaseUrl = envConfig.SUPABASE_URL;
  const supabaseAnonKey = envConfig.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || supabaseUrl === 'undefined' || supabaseUrl === '') {
    throw new Error('SUPABASE_URL is not properly defined. Check your environment configuration.');
  }
  
  if (!supabaseAnonKey || supabaseAnonKey === 'undefined' || supabaseAnonKey === '') {
    throw new Error('SUPABASE_ANON_KEY is not properly defined. Check your environment configuration.');
  }
  
  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    throw new Error(`Invalid SUPABASE_URL format: ${supabaseUrl}`);
  }
  
  // Validate key format (should be a JWT starting with eyJ)
  if (!supabaseAnonKey.startsWith('eyJ')) {
    throw new Error('Invalid SUPABASE_ANON_KEY format. Should be a JWT token starting with "eyJ".');
  }
  
  return { supabaseUrl, supabaseAnonKey };
};

// Create Supabase client with production-optimized configuration
let supabase: any = null;

try {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'X-Client-Info': 'supabase-js/2.0.0'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
  
  // Only log in development
  if (import.meta.env.DEV) {
    console.log('✅ Supabase client initialized successfully');
  }
  
} catch (error) {
  // Log error in development, handle gracefully in production
  if (import.meta.env.DEV) {
    console.error('❌ Failed to create Supabase client:', error);
  }
  
  // Create fallback client for graceful degradation
  supabase = {
    from: (table: string) => {
      if (import.meta.env.DEV) {
        console.error(`❌ Supabase client not initialized. Cannot query table: ${table}`);
      }
      return {
        select: () => ({ data: null, error: { message: `Supabase client not initialized. Cannot query table: ${table}.` } }),
        insert: () => ({ data: null, error: { message: `Supabase client not initialized. Cannot insert into table: ${table}.` } }),
        update: () => ({ data: null, error: { message: `Supabase client not initialized. Cannot update table: ${table}.` } }),
        delete: () => ({ data: null, error: { message: `Supabase client not initialized. Cannot delete from table: ${table}.` } })
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
  };
}

export default supabase;
