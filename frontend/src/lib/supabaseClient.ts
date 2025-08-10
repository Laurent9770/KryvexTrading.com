import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

// Log configuration status
console.log('SUPABASE CONFIGURATION:');
console.log(`URL: ${supabaseUrl ? 'Defined ✓' : 'Missing ✗'}`);
console.log(`ANON KEY: ${supabaseAnonKey ? 'Defined ✓' : 'Missing ✗'}`);

// Create a minimal client with no additional options
// This pattern works across all versions of Supabase JS
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log successful initialization
console.log('✅ Supabase client initialized with minimal configuration');

export default supabase;
