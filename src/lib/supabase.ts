import { createClient } from "@supabase/supabase-js";
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables in development
if (import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('❌ Supabase environment variables are missing!');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
}

// Create Supabase client
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  try {
    return !!(
      supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith('https://') &&
      supabaseUrl.includes('supabase.co') &&
      supabaseAnonKey.length > 20
    );
  } catch (error) {
    console.error("Error checking Supabase configuration:", error);
    return false;
  }
};