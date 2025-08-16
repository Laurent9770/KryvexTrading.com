// =============================================
// ENVIRONMENT CONFIGURATION - BUILD TIME INJECTION
// =============================================
// This file exports environment variables that are injected at build time
// to avoid import.meta issues in production builds

export const env = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
  VITE_STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  BASE_URL: import.meta.env.BASE_URL,
} as const;

// Validation function
export const validateEnv = () => {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !env[key as keyof typeof env]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
};

// Export individual values for convenience
export const {
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY,
  VITE_API_URL,
  VITE_WS_URL,
  VITE_STRIPE_PUBLIC_KEY,
  MODE,
  DEV,
  PROD,
  BASE_URL,
} = env;
