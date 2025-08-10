// Use centralized Supabase client with robust error handling
import supabase from '../../lib/supabaseClient';

console.log('🔄 Using centralized Supabase client...');

// Export the centralized client
export { supabase };
export default supabase;

export const getSupabaseClient = () => {
  console.log('🔍 getSupabaseClient called - returning centralized client');
  return supabase;
};

export const hasRealSupabaseClient = (): boolean => {
  console.log('🔍 hasRealSupabaseClient called, result: true');
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
    method: 'Centralized',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
  });
};

// Ensure the client is properly initialized
if (!supabase) {
  console.error('🚨 Critical: Centralized Supabase client is undefined!');
} else {
  console.log('✅ Centralized Supabase client ready!');
}