// Supabase Test Utility - Use this to manually test Supabase client initialization
import { createClient } from '@supabase/supabase-js';

export const testSupabaseConnection = async () => {
  console.log('🧪 MANUAL SUPABASE CONNECTION TEST');
  
  try {
    // Get environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Environment Variables:');
    console.log('- VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
    console.log('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Environment variables are missing');
    }
    
    // Create test client
    console.log('Creating test Supabase client...');
    const testSupabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic query
    console.log('Testing basic query...');
    const { data, error } = await testSupabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Test failed:', error.message);
      
      if (error.message.includes('Data API')) {
        console.error('💡 SOLUTION: Enable Data API in Supabase Settings → API');
      } else if (error.message.includes('RLS') || error.message.includes('policy')) {
        console.error('💡 SOLUTION: Create RLS policies for the profiles table');
      } else if (error.message.includes('permission')) {
        console.error('💡 SOLUTION: Check table permissions and RLS policies');
      } else {
        console.error('💡 SOLUTION: Check your Supabase configuration');
      }
      
      return { success: false, error: error.message };
    } else {
      console.log('✅ Test successful! Supabase is working correctly.');
      return { success: true, data };
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return { success: false, error: error.message };
  }
};

// Export for manual testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testSupabaseConnection;
}
