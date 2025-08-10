/**
 * Utility function to check if all required environment variables are defined.
 * This helps identify configuration issues early during app initialization.
 */
export function checkRequiredEnvVars() {
  const requiredVars = [
    { name: 'VITE_SUPABASE_URL', value: import.meta.env.VITE_SUPABASE_URL },
    { name: 'VITE_SUPABASE_ANON_KEY', value: import.meta.env.VITE_SUPABASE_ANON_KEY }
  ];

  const missingVars = requiredVars.filter(v => !v.value);

  if (missingVars.length > 0) {
    console.warn('⚠️ Some environment variables are missing, using fallback values:');
    missingVars.forEach(v => {
      console.warn(`  - ${v.name}`);
    });
    console.warn('This is okay for development, but should be set in production.');
    return true; // Allow app to continue with fallbacks
  }

  console.log('✅ All required environment variables are defined.');
  return true;
}

/**
 * Logs the current environment configuration for debugging purposes.
 * This helps with debugging deployment issues.
 */
export function logEnvironmentInfo() {
  console.log('📊 Environment Information:');
  console.log(`  - Environment: ${import.meta.env.MODE}`);
  console.log(`  - Base URL: ${import.meta.env.BASE_URL}`);
  console.log(`  - Supabase URL defined: ${!!import.meta.env.VITE_SUPABASE_URL}`);
  console.log(`  - Supabase Anon Key defined: ${!!import.meta.env.VITE_SUPABASE_ANON_KEY}`);
}

/**
 * Call this function at your app's entry point to ensure all is well configured
 */
export function validateEnvironment() {
  logEnvironmentInfo();
  return checkRequiredEnvVars();
}
