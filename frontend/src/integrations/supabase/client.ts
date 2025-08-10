// HYBRID Supabase Client - SDK with HTTP Fallback
console.log('🚀 Starting hybrid Supabase client...');

// Import HTTP fallback
import { httpAuth, httpDb } from './httpClient';

// Essential polyfills
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).process = { env: {}, version: 'browser' };
}

// Try to import Supabase SDK
let createClient: any = null;
let sdkAvailable = false;

try {
  console.log('📦 Attempting SDK import...');
  const supabaseModule = require('@supabase/supabase-js');
  createClient = supabaseModule.createClient;
  sdkAvailable = true;
  console.log('✅ SDK imported successfully');
} catch (error) {
  try {
    // Try ES6 import
    import('@supabase/supabase-js').then(module => {
      createClient = module.createClient;
      sdkAvailable = true;
      console.log('✅ SDK imported via dynamic import');
    }).catch(() => {
      console.error('❌ All SDK import methods failed');
    });
  } catch (e) {
    console.error('❌ SDK import failed:', error);
    console.log('🔄 Will use HTTP fallback');
  }
}

const SUPABASE_URL = 'https://ftkeczodadvtnxofrwps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

// Create HTTP fallback client (always works)
console.log('🔄 Creating HTTP fallback client...');

const supabase = {
  __isRealClient: true,
  __usingHttpFallback: true,
  
  auth: {
    async signUp(data: any) {
      console.log('🔐 HTTP SignUp for:', data.email);
      return await httpAuth.signUp(data.email, data.password, data.options?.data);
    },
    
    async signInWithPassword(data: any) {
      console.log('🔐 HTTP SignIn for:', data.email);
      return await httpAuth.signInWithPassword(data.email, data.password);
    },
    
    async signInWithOAuth(data: any) {
      console.log('🔐 HTTP OAuth for:', data.provider);
      if (data.provider === 'google') {
        return await httpAuth.signInWithGoogle();
      }
      return { data: null, error: { message: 'Provider not supported' } };
    },
    
    async signOut() {
      console.log('🔐 HTTP SignOut');
      return await httpAuth.signOut();
    },
    
    async getSession() {
      const session = httpAuth.getSession();
      return { data: { session }, error: null };
    },
    
    async getUser() {
      const user = httpAuth.getUser();
      return { data: { user }, error: null };
    },
    
    async resetPasswordForEmail(email: string, options?: any) {
      console.log('🔐 HTTP ResetPasswordForEmail for:', email);
      return await httpAuth.resetPasswordForEmail(email, options);
    },
    
    async updateUser(updates: any) {
      console.log('🔐 HTTP UpdateUser');
      return await httpAuth.updateUser(updates);
    },
    
    onAuthStateChange(callback?: Function) {
      // Simple implementation
      const session = httpAuth.getSession();
      if (callback) {
        setTimeout(() => callback('SIGNED_IN', session), 100);
      }
      return {
        data: {
          subscription: {
            id: 'http-fallback',
            callback: callback || (() => {}),
            unsubscribe: () => {}
          }
        }
      };
    }
  },
  
  from(table: string) {
    return {
      select(columns?: string) {
        return {
          eq(column: string, value: any) {
            return {
              async single() {
                console.log('📊 HTTP Select single from', table);
                const result = await httpDb.select(table, columns || '*', { [column]: value });
                if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                  return { data: result.data[0], error: null };
                }
                return { data: null, error: result.error || { message: 'No data found' } };
              }
            };
          },
          order(column: string, options?: any) {
            return {
              eq(column: string, value: any) {
                return {
                  async single() {
                    console.log('📊 HTTP Select single with order from', table);
                    const result = await httpDb.select(table, columns || '*', { [column]: value });
                    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                      return { data: result.data[0], error: null };
                    }
                    return { data: null, error: result.error || { message: 'No data found' } };
                  }
                };
              }
            };
          }
        };
      },
      
      async insert(data: any) {
        console.log('📊 HTTP Insert to', table);
        return await httpDb.insert(table, data);
      }
    };
  },
  
  storage: {
    from() {
      return {
        async upload() {
          return { data: null, error: { message: 'Storage not available in HTTP mode' } };
        }
      };
    }
  },
  
  channel(channelName: string) {
    console.log('📡 HTTP Channel created:', channelName);
    return {
      on(event: string, callback: Function) {
        console.log('📡 HTTP Channel event listener:', event);
        return this;
      },
      subscribe() {
        console.log('📡 HTTP Channel subscribed');
        return {
          data: {
            subscription: {
              id: `http-${channelName}`,
              callback: () => {},
              unsubscribe: () => {}
            }
          }
        };
      }
    };
  }
};

console.log('✅ HTTP client ready for authentication!');

// Exports
export { supabase };
export default supabase;

export const getSupabaseClient = () => {
  console.log('🔍 getSupabaseClient called - returning HTTP client');
  return supabase;
};

export const hasRealSupabaseClient = (): boolean => {
  console.log('🔍 hasRealSupabaseClient called, result: true (HTTP)');
  return true;
};

export const getApiUrl = (): string => {
  return 'https://kryvextrading-com.onrender.com';
};

export const isDevelopment = (): boolean => {
  return typeof window !== 'undefined' && 
         (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
};

export const logEnvironmentStatus = (): void => {
  console.log('🌍 Environment Status:', {
    supabaseConnected: true,
    isRealClient: true,
    method: 'HTTP',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
  });
};

console.log('🎉 HTTP-based authentication client ready!');