// @ts-nocheck
// supabase/functions/send-verification-email-v2/index.ts
// STEP 3: Test Supabase client initialization
// Previous steps worked! Now testing if createClient crashes.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // Environment variables (we know these work from step 2)
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com';

    // NEW: Test Supabase client initialization - this might be the crash point
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // If we reach here, Supabase client creation worked
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Supabase client created successfully!",
      clientInfo: {
        hasSupabaseUrl: !!SUPABASE_URL,
        hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
        clientType: typeof supabaseClient,
        clientMethods: Object.keys(supabaseClient).slice(0, 5) // Show first 5 methods
      },
      payload: payload
    }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error: any) {
    // If Supabase client creation crashes
    return new Response(JSON.stringify({ 
      success: false, 
      message: `Step 3 Crashed (Supabase Client): ${error.message || 'Unknown error'}`,
      errorStack: error.stack ? error.stack.substring(0, 500) : 'No stack trace'
    }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});