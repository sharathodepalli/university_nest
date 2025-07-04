import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For development, use placeholder values if env vars are not set
const defaultUrl = "https://placeholder.supabase.co";
const defaultKey = "placeholder-key";

export const supabase = createClient(
  supabaseUrl || defaultUrl,
  supabaseAnonKey || defaultKey
);

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  try {
    const isConfigured =
      supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl !== defaultUrl &&
      supabaseAnonKey !== defaultKey &&
      supabaseUrl.includes("supabase.co");

    // Return actual configuration status for real-time mode
    return isConfigured;
  } catch (error) {
    console.error("Error checking Supabase configuration:", error);
    return false;
  }
};
