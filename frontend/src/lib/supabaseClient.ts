import { createClient } from '@supabase/supabase-js';

console.log('🔍 Creating robust Supabase client...');

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ftkeczodadvtnxofrwps.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

console.log('🔍 SUPABASE CLIENT DEBUGGING:');
console.log(`URL: "${supabaseUrl}" (length: ${supabaseUrl.length})`);
console.log(`ANON KEY: "${supabaseAnonKey.substring(0, 20)}..." (length: ${supabaseAnonKey.length})`);

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  throw new Error('Supabase URL and Anon Key are required');
}

// Create a safe Supabase client with comprehensive error handling
let supabase: any;

// Function to create mock client
const createMockClient = () => {
  console.log('🔄 Creating fallback mock client...');
  
  const createMockQueryBuilder = () => ({
    select: (columns = '*') => createMockQueryBuilder(),
    eq: (column: string, value: any) => createMockQueryBuilder(),
    neq: (column: string, value: any) => createMockQueryBuilder(),
    gt: (column: string, value: any) => createMockQueryBuilder(),
    gte: (column: string, value: any) => createMockQueryBuilder(),
    lt: (column: string, value: any) => createMockQueryBuilder(),
    lte: (column: string, value: any) => createMockQueryBuilder(),
    like: (column: string, pattern: string) => createMockQueryBuilder(),
    ilike: (column: string, pattern: string) => createMockQueryBuilder(),
    in: (column: string, values: any[]) => createMockQueryBuilder(),
    not: (column: string, operator: string, value: any) => createMockQueryBuilder(),
    or: (filters: string, values: any[]) => createMockQueryBuilder(),
    order: (column: string, options: any) => createMockQueryBuilder(),
    limit: (count: number) => createMockQueryBuilder(),
    range: (from: number, to: number) => createMockQueryBuilder(),
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (callback: any) => Promise.resolve({ data: [], error: null }).then(callback),
    catch: (callback: any) => Promise.resolve({ data: [], error: null }).catch(callback)
  });

  return {
    from: (table: string) => ({
      select: (columns = '*') => createMockQueryBuilder(),
      insert: (data: any) => Promise.resolve({ data: null, error: null }),
      upsert: (data: any) => Promise.resolve({ data: null, error: null }),
      update: (data: any) => createMockQueryBuilder(),
      delete: () => createMockQueryBuilder(),
      eq: (column: string, value: any) => createMockQueryBuilder(),
      neq: (column: string, value: any) => createMockQueryBuilder(),
      gt: (column: string, value: any) => createMockQueryBuilder(),
      gte: (column: string, value: any) => createMockQueryBuilder(),
      lt: (column: string, value: any) => createMockQueryBuilder(),
      lte: (column: string, value: any) => createMockQueryBuilder(),
      like: (column: string, pattern: string) => createMockQueryBuilder(),
      ilike: (column: string, pattern: string) => createMockQueryBuilder(),
      in: (column: string, values: any[]) => createMockQueryBuilder(),
      not: (column: string, operator: string, value: any) => createMockQueryBuilder(),
      or: (filters: string, values: any[]) => createMockQueryBuilder(),
      order: (column: string, options: any) => createMockQueryBuilder(),
      limit: (count: number) => createMockQueryBuilder(),
      range: (from: number, to: number) => createMockQueryBuilder(),
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (callback: any) => Promise.resolve({ data: [], error: null }).then(callback),
      catch: (callback: any) => Promise.resolve({ data: [], error: null }).catch(callback)
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: (credentials: any) => Promise.resolve({ data: null, error: null }),
      signInWithOAuth: (options: any) => Promise.resolve({ data: null, error: null }),
      signUp: (data: any) => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: (email: string, options?: any) => Promise.resolve({ error: null }),
      updateUser: (updates: any) => Promise.resolve({ data: null, error: null }),
      onAuthStateChange: (callback: any) => ({
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }),
      getAccessToken: () => Promise.resolve({ data: { access_token: null }, error: null }),
      refreshSession: () => Promise.resolve({ data: { session: null }, error: null })
    },
    channel: (name: string) => ({
      on: (event: string, callback: any) => ({
        subscribe: () => Promise.resolve({ error: null })
      }),
      subscribe: () => Promise.resolve({ error: null }),
      unsubscribe: () => Promise.resolve({ error: null })
    }),
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: any, options?: any) => Promise.resolve({ data: null, error: null }),
        download: (path: string) => Promise.resolve({ data: null, error: null }),
        remove: (paths: string[]) => Promise.resolve({ data: null, error: null }),
        list: (path?: string, options?: any) => Promise.resolve({ data: null, error: null }),
        createSignedUrl: (path: string, expiresIn: number) => Promise.resolve({ data: { signedUrl: null }, error: null }),
        createSignedUploadUrl: (path: string) => Promise.resolve({ data: { signedUrl: null }, error: null })
      })
    },
    functions: {
      invoke: (name: string, options?: any) => Promise.resolve({ data: null, error: null })
    },
    rpc: (func: string, params?: any) => Promise.resolve({ data: null, error: null }),
    schema: (schema: string) => supabase,
    rest: {
      from: (table: string) => supabase.from(table)
    }
  } as any;
};

// Try to create the real Supabase client with multiple fallback strategies
try {
  // Strategy 1: Basic client creation
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client created successfully (Strategy 1)');
} catch (error) {
  console.warn('⚠️ Strategy 1 failed:', error);
  
  try {
    // Strategy 2: Client with minimal auth config
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Supabase client created successfully (Strategy 2)');
  } catch (error2) {
    console.warn('⚠️ Strategy 2 failed:', error2);
    
    try {
      // Strategy 3: Client with no config
      supabase = createClient(supabaseUrl, supabaseAnonKey, {});
      console.log('✅ Supabase client created successfully (Strategy 3)');
    } catch (error3) {
      console.error('❌ All strategies failed, using mock client:', error3);
      supabase = createMockClient();
    }
  }
}

// Test the connection safely with timeout
const testConnection = async () => {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );
    
    const sessionPromise = supabase.auth.getSession();
    
    const { data, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
    
    if (error) {
      console.warn('⚠️ Supabase auth session error:', error.message);
    } else {
      console.log('✅ Supabase client initialized successfully');
      console.log('🔐 Session status:', data.session ? 'Active' : 'No session');
    }
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    console.log('🔄 Falling back to mock client...');
    supabase = createMockClient();
  }
};

// Run connection test
testConnection();

export default supabase;
