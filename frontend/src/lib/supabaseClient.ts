import { createClient } from '@supabase/supabase-js';

// =============================================
// FINAL COMPREHENSIVE SUPABASE CLIENT INITIALIZATION
// =============================================

// Enhanced environment variable validation with detailed logging
const getEnvironmentVariables = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log('🔍 FINAL ENVIRONMENT VARIABLES CHECK:');
  console.log('Mode:', import.meta.env.MODE);
  console.log('Supabase URL:', supabaseUrl ? `✓ Set (${supabaseUrl.length} chars)` : '✗ Missing');
  console.log('Supabase Key:', supabaseAnonKey ? `✓ Set (${supabaseAnonKey.length} chars)` : '✗ Missing');

  // Validate environment variables
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is not defined. Please check your .env file and deployment configuration.');
  }

  if (!supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not defined. Please check your .env file and deployment configuration.');
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

  // Check for common deployment issues
  if (supabaseUrl.includes('undefined') || supabaseAnonKey.includes('undefined')) {
    throw new Error('Environment variables contain "undefined" - check your deployment platform configuration.');
  }

  return { supabaseUrl, supabaseAnonKey };
};

// Create Supabase client with comprehensive error handling
let supabase: any = null;

try {
  const { supabaseUrl, supabaseAnonKey } = getEnvironmentVariables();
  
  console.log('🔐 Creating Supabase client...');
  
  // Create client with proper configuration to avoid headers issues
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    }
  });
  
  console.log('✅ Supabase client created successfully');
  
  // Test the connection immediately with comprehensive error detection
  (async () => {
    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Test basic query to check Data API and RLS policies
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        console.warn('⚠️ Supabase connection test failed:', error.message);
        
        // Provide specific guidance based on error type
        if (error.message.includes('Data API')) {
          console.error('❌ CRITICAL: Data API is disabled in Supabase. Please enable it in Settings → API.');
        } else if (error.message.includes('RLS') || error.message.includes('policy')) {
          console.error('❌ CRITICAL: Row Level Security (RLS) policies missing. Please create policies for the profiles table.');
        } else if (error.message.includes('permission') || error.message.includes('access')) {
          console.error('❌ CRITICAL: Permission denied. Check RLS policies and table permissions.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          console.error('❌ CRITICAL: Network error. Check your internet connection and Supabase URL.');
        } else {
          console.error('❌ CRITICAL: Unknown Supabase error. Check your configuration.');
        }
      } else {
        console.log('✅ Supabase connection test successful - Data API and RLS policies are working');
      }
    } catch (testError) {
      console.warn('⚠️ Supabase connection test error:', testError);
    }
  })();
  
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error);
  
  // Create a comprehensive fallback client with detailed error messages
  supabase = {
    from: (table: string) => {
      console.error(`❌ Supabase client not initialized. Cannot query table: ${table}`);
      console.error('💡 Troubleshooting steps:');
      console.error('1. Check your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      console.error('2. Verify environment variables are loaded in your deployment platform');
      console.error('3. Ensure Data API is enabled in Supabase Settings → API');
      console.error('4. Create RLS policies for tables you\'re accessing');
      
      return {
        select: () => ({ 
          data: null, 
          error: { 
            message: `Supabase client not initialized. Cannot query table: ${table}. Check console for troubleshooting steps.` 
          } 
        }),
        insert: () => ({ 
          data: null, 
          error: { 
            message: `Supabase client not initialized. Cannot insert into table: ${table}. Check console for troubleshooting steps.` 
          } 
        }),
        update: () => ({ 
          data: null, 
          error: { 
            message: `Supabase client not initialized. Cannot update table: ${table}. Check console for troubleshooting steps.` 
          } 
        }),
        delete: () => ({ 
          data: null, 
          error: { 
            message: `Supabase client not initialized. Cannot delete from table: ${table}. Check console for troubleshooting steps.` 
          } 
        })
      };
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase client not initialized. Check console for troubleshooting steps.' } 
      }),
      signUp: () => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase client not initialized. Check console for troubleshooting steps.' } 
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
