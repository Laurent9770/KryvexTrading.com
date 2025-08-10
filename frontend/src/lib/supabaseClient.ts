import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

// Comprehensive debugging and validation
console.log('🔍 SUPABASE CLIENT DEBUGGING:');
console.log(`URL: "${supabaseUrl}" (length: ${supabaseUrl.length})`);
console.log(`ANON KEY: "${supabaseAnonKey.substring(0, 20)}..." (length: ${supabaseAnonKey.length})`);
console.log(`URL is valid: ${supabaseUrl.startsWith('https://')}`);
console.log(`ANON KEY is valid: ${supabaseAnonKey.length > 100}`);

// Validate environment variables before creating client
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase environment variables!');
  console.error(`URL: ${supabaseUrl ? 'Defined' : 'MISSING'}`);
  console.error(`ANON KEY: ${supabaseAnonKey ? 'Defined' : 'MISSING'}`);
  throw new Error('Supabase environment variables are not properly configured');
}

// Create a minimal client with validation
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Validate the client was created properly
  if (!supabase) {
    throw new Error('Supabase client is undefined after creation');
  }
  
  if (!supabase.from) {
    throw new Error('Supabase client missing .from() method');
  }
  
  if (!supabase.auth) {
    throw new Error('Supabase client missing .auth property');
  }
  
  console.log('✅ Supabase client initialized successfully');
  console.log('✅ Client validation passed');
  
} catch (error) {
  console.error('❌ Supabase client initialization failed:', error);
  throw error;
}

// Add debugging wrapper to catch undefined calls
const originalFrom = supabase.from;
supabase.from = function(tableName: string) {
  if (!tableName) {
    console.error('❌ CRITICAL: .from() called with undefined table name');
    throw new Error('Table name is undefined');
  }
  
  const result = originalFrom.call(this, tableName);
  
  if (!result) {
    console.error('❌ CRITICAL: .from() returned undefined for table:', tableName);
    throw new Error(`Query builder is undefined for table: ${tableName}`);
  }
  
  return result;
};

export default supabase;
