import { createClient } from "@supabase/supabase-js";
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Detailed validation and logging for development
const validateSupabaseConfig = () => {
  console.log('🔍 Checking Supabase configuration...');
  console.log('Environment:', import.meta.env.VITE_ENVIRONMENT || 'unknown');
  console.log('Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ Missing');
  console.log('Supabase Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : '❌ Missing');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase environment variables are missing!');
    console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
    console.error('Current environment variables:', {
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Present' : 'Missing'
    });
    return false;
  }
  
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
    console.error('❌ Invalid Supabase URL format!');
    return false;
  }
  
  console.log('✅ Supabase configuration looks good!');
  return true;
};

// Validate in development
if (import.meta.env.DEV) {
  validateSupabaseConfig();
}

// Create Supabase client with better error handling
export const supabase = createClient<Database>(
  supabaseUrl || (() => {
    console.error('🚨 CRITICAL: No Supabase URL provided! Using placeholder.');
    return 'https://placeholder.supabase.co';
  })(),
  supabaseAnonKey || (() => {
    console.error('🚨 CRITICAL: No Supabase key provided! Using placeholder.');
    return 'placeholder-key';
  })()
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