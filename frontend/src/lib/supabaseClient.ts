import { createClient } from '@supabase/supabase-js';
import { env, validateEnv } from './env';

// =============================================
// SUPABASE CLIENT - PRODUCTION OPTIMIZED
// =============================================

// Validate environment before creating client
try {
  validateEnv();
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  throw error;
}

// Create Supabase client with production-optimized configuration
export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'X-Client-Info': 'supabase-js/2.0.0',
      'x-disable-analytics': 'true' // Disable telemetry
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Only log in development
if (env.DEV) {
  console.log('✅ Supabase client initialized successfully');
}

export default supabase;
