// Environment Variable Test Utility
// Use this to verify your .env configuration

export const testEnvironmentVariables = () => {
  console.log('🧪 ENVIRONMENT VARIABLE TEST');
  console.log('============================');
  
  // Test Vite environment variables
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  // Check if variables are defined
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('\n📊 ANALYSIS:');
  console.log('Supabase URL defined:', !!supabaseUrl);
  console.log('Supabase Anon Key defined:', !!supabaseAnonKey);
  
  // Check for common issues
  if (!supabaseUrl) {
    console.error('❌ VITE_SUPABASE_URL is missing');
  } else if (supabaseUrl === 'undefined') {
    console.error('❌ VITE_SUPABASE_URL is "undefined" string');
  } else if (supabaseUrl === '') {
    console.error('❌ VITE_SUPABASE_URL is empty');
  } else {
    console.log('✅ VITE_SUPABASE_URL looks good');
  }
  
  if (!supabaseAnonKey) {
    console.error('❌ VITE_SUPABASE_ANON_KEY is missing');
  } else if (supabaseAnonKey === 'undefined') {
    console.error('❌ VITE_SUPABASE_ANON_KEY is "undefined" string');
  } else if (supabaseAnonKey === '') {
    console.error('❌ VITE_SUPABASE_ANON_KEY is empty');
  } else if (!supabaseAnonKey.startsWith('eyJ')) {
    console.error('❌ VITE_SUPABASE_ANON_KEY format is invalid (should start with "eyJ")');
  } else {
    console.log('✅ VITE_SUPABASE_ANON_KEY looks good');
  }
  
  // Test URL format
  if (supabaseUrl) {
    try {
      new URL(supabaseUrl);
      console.log('✅ VITE_SUPABASE_URL format is valid');
    } catch (error) {
      console.error('❌ VITE_SUPABASE_URL format is invalid:', error);
    }
  }
  
  console.log('\n💡 NEXT STEPS:');
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('1. Check your .env file exists in the frontend directory');
    console.log('2. Verify the variable names start with VITE_');
    console.log('3. Make sure there are no spaces around the = sign');
    console.log('4. Restart your development server after changing .env');
  } else {
    console.log('✅ Environment variables appear to be configured correctly');
    console.log('If you\'re still getting errors, the issue might be:');
    console.log('- Supabase Data API disabled');
    console.log('- Missing RLS policies');
    console.log('- Network connectivity issues');
  }
  
  return {
    supabaseUrl: !!supabaseUrl && supabaseUrl !== 'undefined' && supabaseUrl !== '',
    supabaseAnonKey: !!supabaseAnonKey && supabaseAnonKey !== 'undefined' && supabaseAnonKey !== '' && supabaseAnonKey.startsWith('eyJ')
  };
};

// Export for manual testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testEnv = testEnvironmentVariables;
}
