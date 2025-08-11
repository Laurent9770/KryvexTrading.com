import { createClient } from '@supabase/supabase-js';
import { validateEnvironment, logEnvironmentStatus } from './envValidation';

// =============================================
// COMPREHENSIVE SUPABASE CLIENT INITIALIZATION
// =============================================

// Global polyfills for browser compatibility
if (typeof globalThis !== 'undefined') {
  // Headers polyfill
  if (!globalThis.Headers) {
    (globalThis as any).Headers = class Headers {
      private headers: Map<string, string> = new Map();
      
      constructor(init?: any) {
        if (init) {
          Object.entries(init).forEach(([key, value]) => {
            this.headers.set(key.toLowerCase(), String(value));
          });
        }
      }
      
      append(name: string, value: string) {
        this.headers.set(name.toLowerCase(), value);
      }
      
      delete(name: string) {
        this.headers.delete(name.toLowerCase());
      }
      
      get(name: string) {
        return this.headers.get(name.toLowerCase()) || null;
      }
      
      has(name: string) {
        return this.headers.has(name.toLowerCase());
      }
      
      set(name: string, value: string) {
        this.headers.set(name.toLowerCase(), value);
      }
      
      forEach(callback: (value: string, key: string) => void) {
        this.headers.forEach((value, key) => callback(value, key));
      }
    };
  }

  // Request polyfill
  if (!globalThis.Request) {
    (globalThis as any).Request = class Request {
      constructor(input: any, init?: any) {
        // Basic implementation
      }
    };
  }

  // Response polyfill
  if (!globalThis.Response) {
    (globalThis as any).Response = class Response {
      constructor(body?: any, init?: any) {
        // Basic implementation
      }
    };
  }
}

// =============================================
// SUPABASE CLIENT CREATION
// =============================================

let supabase: any = null;

const initializeSupabaseClient = () => {
  // Validate environment
  const env = validateEnvironment();
  
  // Log environment status
  logEnvironmentStatus(env);
  
  if (!env.isValid) {
    const errorMessage = `Supabase environment validation failed:\n${env.errors.join('\n')}`;
    console.error('❌', errorMessage);
    throw new Error(errorMessage);
  }

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.warn('⚠️ Not in browser environment, skipping Supabase client initialization');
    return null;
  }

  try {
    console.log('🔐 Creating Supabase client...');
    
    // Create client with explicit options to avoid headers issues
    supabase = createClient(env.config.supabaseUrl, env.config.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'kryvex-trading-platform'
        }
      }
    });

    console.log('✅ Supabase client created successfully');
    
    // Test the connection
    testSupabaseConnection();
    
    return supabase;
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    throw error;
  }
};

// =============================================
// CONNECTION TESTING
// =============================================

const testSupabaseConnection = async () => {
  if (!supabase) return;
  
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test basic query
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.warn('⚠️ Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error) {
    console.warn('⚠️ Supabase connection test error:', error);
    return false;
  }
};

// =============================================
// CLIENT EXPORT
// =============================================

// Initialize the client immediately
try {
  supabase = initializeSupabaseClient();
} catch (error) {
  console.error('❌ Critical: Supabase client initialization failed:', error);
  
  // In production, we should fail fast
  if (import.meta.env.PROD) {
    throw new Error(`Supabase client initialization failed: ${error}`);
  }
  
  // In development, we can provide a more detailed error
  console.error('💡 Development tip: Check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are properly set');
}

export default supabase;
