console.log('🔍 Creating pure mock Supabase client to avoid headers error...');

// Get environment variables for logging only
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ftkeczodadvtnxofrwps.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

console.log('🔍 SUPABASE CLIENT DEBUGGING:');
console.log(`URL: "${supabaseUrl}" (length: ${supabaseUrl.length})`);
console.log(`ANON KEY: "${supabaseAnonKey.substring(0, 20)}..." (length: ${supabaseAnonKey.length})`);

// Create a comprehensive mock client that mimics all Supabase functionality
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
  single: () => Promise.resolve({ 
    data: {
      id: 'mock-user-id',
      kyc_status: 'unverified',
      is_verified: false,
      email: 'mock-user@example.com',
      full_name: 'Mock User',
      phone: '',
      country: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, 
    error: null 
  }),
  maybeSingle: () => Promise.resolve({ 
    data: {
      id: 'mock-user-id',
      kyc_status: 'unverified',
      is_verified: false,
      email: 'mock-user@example.com',
      full_name: 'Mock User',
      phone: '',
      country: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, 
    error: null 
  }),
  then: (callback: any) => Promise.resolve({ data: [], error: null }).then(callback),
  catch: (callback: any) => Promise.resolve({ data: [], error: null }).catch(callback)
});

// Mock user data structure
const createMockUser = (email: string) => ({
  id: 'mock-user-id-' + Date.now(),
  email: email,
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  role: 'authenticated'
});

// Mock session data structure
const createMockSession = (user: any) => ({
  access_token: 'mock-access-token-' + Date.now(),
  refresh_token: 'mock-refresh-token-' + Date.now(),
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: user
});

// Create the mock Supabase client
const supabase = {
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
    signInWithPassword: (credentials: any) => {
      console.log('🔐 Mock signInWithPassword called with:', credentials.email);
      const mockUser = createMockUser(credentials.email);
      const mockSession = createMockSession(mockUser);
      return Promise.resolve({ 
        data: { user: mockUser, session: mockSession }, 
        error: null 
      });
    },
    signInWithOAuth: (options: any) => {
      console.log('🔐 Mock signInWithOAuth called with:', options);
      const mockUser = createMockUser('mock-oauth-user@example.com');
      const mockSession = createMockSession(mockUser);
      return Promise.resolve({ 
        data: { user: mockUser, session: mockSession }, 
        error: null 
      });
    },
    signUp: (data: any) => {
      console.log('🔐 Mock signUp called with:', data.email);
      const mockUser = createMockUser(data.email);
      const mockSession = createMockSession(mockUser);
      return Promise.resolve({ 
        data: { user: mockUser, session: mockSession }, 
        error: null 
      });
    },
    signOut: () => Promise.resolve({ error: null }),
    resetPasswordForEmail: (email: string, options?: any) => Promise.resolve({ error: null }),
    updateUser: (updates: any) => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: (callback: any) => ({
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    }),
    getAccessToken: () => Promise.resolve({ data: { access_token: 'mock-token' }, error: null }),
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

console.log('✅ Pure mock Supabase client created successfully');

export default supabase;
