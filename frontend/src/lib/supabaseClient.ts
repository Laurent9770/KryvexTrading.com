import { createClient } from '@supabase/supabase-js';

// Check for environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
    console.error('Missing VITE_SUPABASE_URL environment variable');
    // Warn users in development
    if (import.meta.env.DEV) {
        alert('Missing VITE_SUPABASE_URL environment variable. Please check your .env file.');
    }
    throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
    console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
    // Warn users in development
    if (import.meta.env.DEV) {
        alert('Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your .env file.');
    }
    throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export as default for backward compatibility
export default supabase;
