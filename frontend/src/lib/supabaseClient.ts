import { createClient } from '@supabase/supabase-js';

// =============================================
// MINIMAL SUPABASE CLIENT SETUP
// =============================================

// Get environment variables directly
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not defined');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not defined');
}

// Log environment status
console.log('🔍 Environment Status:');
console.log('Mode:', import.meta.env.MODE);
console.log('Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('Supabase Key:', supabaseAnonKey ? `✓ Set (${supabaseAnonKey.length} chars)` : '✗ Missing');

// Create Supabase client with absolutely minimal configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ Supabase client created successfully');

export default supabase;
