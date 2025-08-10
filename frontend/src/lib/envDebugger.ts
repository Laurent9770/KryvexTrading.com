// Environment Debugger - Add this early in your app initialization (like main.jsx/main.tsx)

console.log('======= ENVIRONMENT DEBUGGING =======');
console.log('NODE_ENV:', import.meta.env.MODE);
console.log('BASE_URL:', import.meta.env.BASE_URL);
console.log('SUPABASE_URL defined:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY defined:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('API_URL defined:', !!import.meta.env.VITE_API_URL);
console.log('WS_URL defined:', !!import.meta.env.VITE_WS_URL);

// Additional debugging for deployment platforms
console.log('VITE_SUPABASE_URL value:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set');
console.log('VITE_SUPABASE_ANON_KEY length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0);

// Check for common environment variable issues
if (!import.meta.env.VITE_SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL is missing!');
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is missing!');
}
if (import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY.length < 100) {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY seems too short - may be truncated');
}

console.log('===================================');

// Export for potential use in other files
export const envDebug = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  apiUrl: import.meta.env.VITE_API_URL,
  wsUrl: import.meta.env.VITE_WS_URL,
  nodeEnv: import.meta.env.MODE,
  baseUrl: import.meta.env.BASE_URL
};
