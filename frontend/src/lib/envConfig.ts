// =============================================
// PRODUCTION-SAFE ENVIRONMENT CONFIGURATION
// =============================================

interface EnvironmentConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  NODE_ENV: string;
  BASE_URL: string;
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
}

// Get environment variables with proper fallbacks
const getEnvironmentConfig = (): EnvironmentConfig => {
  // Try import.meta.env first (Vite development)
  let supabaseUrl = '';
  let supabaseAnonKey = '';
  let nodeEnv = 'production';
  let baseUrl = '/';

  try {
    // Check if import.meta is available (ES module context)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      nodeEnv = import.meta.env.MODE || 'production';
      baseUrl = import.meta.env.BASE_URL || '/';
    }
  } catch (error) {
    // import.meta not available, fall back to window.env
    console.warn('import.meta not available, using window.env fallback');
  }

  // Fallback to window.env (for production builds)
  if (!supabaseUrl && typeof window !== 'undefined' && (window as any).env) {
    supabaseUrl = (window as any).env.SUPABASE_URL || '';
    supabaseAnonKey = (window as any).env.SUPABASE_ANON_KEY || '';
    nodeEnv = (window as any).env.NODE_ENV || 'production';
    baseUrl = (window as any).env.BASE_URL || '/';
  }

  // Final fallback to hardcoded values (for emergency)
  if (!supabaseUrl) {
    supabaseUrl = 'https://ftkeczodadvtnxofrwps.supabase.co';
    console.warn('Using fallback Supabase URL');
  }

  if (!supabaseAnonKey) {
    supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzI5NzQsImV4cCI6MjA0NzU0ODk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
    console.warn('Using fallback Supabase key');
  }

  return {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
    NODE_ENV: nodeEnv,
    BASE_URL: baseUrl,
    IS_DEVELOPMENT: nodeEnv === 'development',
    IS_PRODUCTION: nodeEnv === 'production',
  };
};

// Create and export the config
const envConfig = getEnvironmentConfig();

// Validate the configuration
const validateConfig = () => {
  const errors: string[] = [];

  if (!envConfig.SUPABASE_URL) {
    errors.push('SUPABASE_URL is not defined');
  }

  if (!envConfig.SUPABASE_ANON_KEY) {
    errors.push('SUPABASE_ANON_KEY is not defined');
  }

  if (errors.length > 0) {
    console.error('❌ Environment configuration errors:', errors);
    return false;
  }

  return true;
};

// Export the validated config
export const config = envConfig;

// Export validation function
export const isValidConfig = validateConfig();

// Export individual values for convenience
export const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  NODE_ENV,
  BASE_URL,
  IS_DEVELOPMENT,
  IS_PRODUCTION,
} = envConfig;

// Export a function to get config (useful for dynamic access)
export const getConfig = () => envConfig;

// Export a function to update config at runtime (useful for testing)
export const updateConfig = (updates: Partial<EnvironmentConfig>) => {
  Object.assign(envConfig, updates);
};

export default envConfig;
