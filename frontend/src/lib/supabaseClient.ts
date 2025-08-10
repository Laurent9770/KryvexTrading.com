import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://ftkeczodadvtnxofrwps.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

// Comprehensive debugging and validation
console.log('🔍 SUPABASE CLIENT DEBUGGING:');
console.log(`URL: "${supabaseUrl}" (length: ${supabaseUrl.length})`);
console.log(`ANON KEY: "${supabaseAnonKey.substring(0, 20)}..." (length: ${supabaseAnonKey.length})`);
console.log(`URL is valid: ${supabaseUrl.startsWith('https://')}`);
console.log(`ANON KEY is valid: ${supabaseAnonKey.length > 100}`);

// Create a minimal client with no additional options
// This pattern works across all versions of Supabase JS
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log successful initialization
console.log('✅ Supabase client initialized with minimal configuration');

export default supabase;
