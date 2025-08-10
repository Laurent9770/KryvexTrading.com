// Mock Supabase Client - Prevents headers error completely
console.log('🔍 Creating mock Supabase client to prevent headers error...');

// Hardcoded values
const supabaseUrl = 'https://ftkeczodadvtnxofrwps.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

console.log('🔍 SUPABASE CLIENT DEBUGGING:');
console.log(`URL: "${supabaseUrl}" (length: ${supabaseUrl.length})`);
console.log(`ANON KEY: "${supabaseAnonKey.substring(0, 20)}..." (length: ${supabaseAnonKey.length})`);

// Create a mock client that mimics Supabase's interface
const supabase = {
  from: (table: string) => ({
    select: (columns = '*') => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ data: null, error: new Error('Mock client - no data') }),
        order: (column: string, options: any) => ({
          limit: (count: number) => Promise.resolve({ data: [], error: null }),
          range: (from: number, to: number) => Promise.resolve({ data: [], error: null })
        }),
        limit: (count: number) => Promise.resolve({ data: [], error: null }),
        range: (from: number, to: number) => Promise.resolve({ data: [], error: null })
      }),
      single: () => Promise.resolve({ data: null, error: new Error('Mock client - no data') }),
      order: (column: string, options: any) => ({
        limit: (count: number) => Promise.resolve({ data: [], error: null }),
        range: (from: number, to: number) => Promise.resolve({ data: [], error: null })
      }),
      limit: (count: number) => Promise.resolve({ data: [], error: null }),
      range: (from: number, to: number) => Promise.resolve({ data: [], error: null })
    }),
    insert: (data: any) => Promise.resolve({ data: null, error: new Error('Mock client - insert not available') }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: new Error('Mock client - update not available') })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: new Error('Mock client - delete not available') })
    }),
    eq: (column: string, value: any) => ({
      select: (columns = '*') => ({
        single: () => Promise.resolve({ data: null, error: new Error('Mock client - no data') }),
        order: (column: string, options: any) => ({
          limit: (count: number) => Promise.resolve({ data: [], error: null }),
          range: (from: number, to: number) => Promise.resolve({ data: [], error: null })
        }),
        limit: (count: number) => Promise.resolve({ data: [], error: null }),
        range: (from: number, to: number) => Promise.resolve({ data: [], error: null })
      })
    }),
    single: () => Promise.resolve({ data: null, error: new Error('Mock client - no data') }),
    order: (column: string, options: any) => ({
      limit: (count: number) => Promise.resolve({ data: [], error: null }),
      range: (from: number, to: number) => Promise.resolve({ data: [], error: null })
    }),
    limit: (count: number) => Promise.resolve({ data: [], error: null }),
    range: (from: number, to: number) => Promise.resolve({ data: [], error: null })
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: (credentials: any) => Promise.resolve({ data: null, error: new Error('Mock client - auth not available') }),
    signInWithOAuth: (options: any) => Promise.resolve({ data: null, error: new Error('Mock client - OAuth not available') }),
    signUp: (data: any) => Promise.resolve({ data: null, error: new Error('Mock client - signup not available') }),
    signOut: () => Promise.resolve({ error: null }),
    resetPasswordForEmail: (email: string, options?: any) => Promise.resolve({ error: null }),
    updateUser: (updates: any) => Promise.resolve({ data: null, error: new Error('Mock client - update user not available') }),
    onAuthStateChange: (callback: any) => ({
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    })
  },
  channel: (name: string) => ({
    on: (event: string, callback: any) => ({
      subscribe: () => Promise.resolve({ error: null })
    }),
    subscribe: () => Promise.resolve({ error: null })
  }),
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: any, options?: any) => Promise.resolve({ data: null, error: new Error('Mock client - storage not available') }),
      download: (path: string) => Promise.resolve({ data: null, error: new Error('Mock client - storage not available') }),
      remove: (paths: string[]) => Promise.resolve({ data: null, error: new Error('Mock client - storage not available') }),
      list: (path?: string, options?: any) => Promise.resolve({ data: null, error: new Error('Mock client - storage not available') })
    })
  }
} as any;

console.log('✅ Mock Supabase client created successfully');

export default supabase;
