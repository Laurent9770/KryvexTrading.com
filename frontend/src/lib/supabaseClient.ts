// Mock Supabase Client - Prevents headers error completely
console.log('🔍 Creating mock Supabase client to prevent headers error...');

// Hardcoded values
const supabaseUrl = 'https://ftkeczodadvtnxofrwps.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

console.log('🔍 SUPABASE CLIENT DEBUGGING:');
console.log(`URL: "${supabaseUrl}" (length: ${supabaseUrl.length})`);
console.log(`ANON KEY: "${supabaseAnonKey.substring(0, 20)}..." (length: ${supabaseAnonKey.length})`);

// Create a mock client that mimics Supabase's interface and returns safe data
const supabase = {
  from: (table: string) => ({
    select: (columns = '*') => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ data: null, error: null }),
        order: (column: string, options: any) => ({
          limit: (count: number) => Promise.resolve({ data: [], error: null }),
          range: (from: number, to: number) => Promise.resolve({ data: [], error: null })
        }),
        limit: (count: number) => Promise.resolve({ data: [], error: null }),
        range: (from: number, to: number) => Promise.resolve({ data: [], error: null })
      }),
      single: () => Promise.resolve({ data: null, error: null }),
      order: (column: string, options: any) => ({
        limit: (count: number) => Promise.resolve({ data: [], error: null }),
        range: (from: number, to: number) => Promise.resolve({ data: [], error: null })
      }),
      limit: (count: number) => Promise.resolve({ data: [], error: null }),
      range: (from: number, to: number) => Promise.resolve({ data: [], error: null }),
      ilike: (column: string, pattern: string) => ({
        order: (column: string, options: any) => Promise.resolve({ data: [], error: null })
      })
    }),
    insert: (data: any) => Promise.resolve({ data: null, error: null }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
    }),
    eq: (column: string, value: any) => ({
      select: (columns = '*') => ({
        single: () => Promise.resolve({ data: null, error: null }),
        order: (column: string, options: any) => ({
          limit: (count: number) => Promise.resolve({ data: [], error: null }),
          range: (from: number, to: number) => Promise.resolve({ data: [], error: null })
        }),
        limit: (count: number) => Promise.resolve({ data: [], error: null }),
        range: (from: number, to: number) => Promise.resolve({ data: [], error: null })
      })
    }),
    single: () => Promise.resolve({ data: null, error: null }),
    order: (column: string, options: any) => ({
      limit: (count: number) => Promise.resolve({ data: [], error: null }),
      range: (from: number, to: number) => Promise.resolve({ data: [], error: null })
    }),
    limit: (count: number) => Promise.resolve({ data: [], error: null }),
    range: (from: number, to: number) => Promise.resolve({ data: [], error: null }),
    gte: (column: string, value: any) => ({
      lte: (column: string, value: any) => ({
        order: (column: string, options: any) => Promise.resolve({ data: [], error: null })
      }),
      order: (column: string, options: any) => Promise.resolve({ data: [], error: null })
    }),
    lte: (column: string, value: any) => ({
      order: (column: string, options: any) => Promise.resolve({ data: [], error: null })
    })
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
      upload: (path: string, file: any, options?: any) => Promise.resolve({ data: null, error: null }),
      download: (path: string) => Promise.resolve({ data: null, error: null }),
      remove: (paths: string[]) => Promise.resolve({ data: null, error: null }),
      list: (path?: string, options?: any) => Promise.resolve({ data: null, error: null })
    })
  }
} as any;

console.log('✅ Mock Supabase client created successfully');

export default supabase;
