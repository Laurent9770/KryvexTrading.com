import { createClient } from '@supabase/supabase-js';

// Hardcoded values to prevent any environment variable issues
const supabaseUrl = 'https://ftkeczodadvtnxofrwps.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

console.log('🔍 SUPABASE CLIENT DEBUGGING:');
console.log(`URL: "${supabaseUrl}" (length: ${supabaseUrl.length})`);
console.log(`ANON KEY: "${supabaseAnonKey.substring(0, 20)}..." (length: ${supabaseAnonKey.length})`);

// Create client with absolutely no options
let supabase;

try {
  // Use the most basic createClient call possible
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client initialized successfully');
} catch (error) {
  console.error('❌ Supabase client initialization failed:', error);
  
  // Create a mock client as fallback
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
      insert: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
      update: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
      delete: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
      eq: () => ({ select: () => Promise.resolve({ data: null, error: new Error('Mock client') }) }),
      single: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
      order: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
      limit: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
      range: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
      updateUser: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      })
    },
    channel: () => ({
      on: () => ({ subscribe: () => Promise.resolve({ error: null }) }),
      subscribe: () => Promise.resolve({ error: null })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
        download: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
        remove: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
        list: () => Promise.resolve({ data: null, error: new Error('Mock client') })
      })
    }
  } as any;
  
  console.log('⚠️ Using mock client due to initialization failure');
}

export default supabase;
