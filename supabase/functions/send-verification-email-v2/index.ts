// @ts-nocheck
// supabase/functions/send-verification-email-v2/index.ts
// STEP 2: Test environment variables access
// Previous step (basic function) worked! Now testing env vars.

// Define CORS headers (essential for frontend to even call it)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, change to your specific frontend URL
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests (browser sends OPTIONS first)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse JSON body (we know this works from step 1)
    const payload = await req.json();

    // NEW: Test environment variable access - this might be the crash point
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com';

    // Check if environment variables are accessible
    const envStatus = {
      SUPABASE_URL: SUPABASE_URL ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      SENDGRID_API_KEY: SENDGRID_API_KEY ? 'SET' : 'MISSING',
      FROM_EMAIL: FROM_EMAIL
    };

    // Return environment variable status for debugging
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Environment variables accessed successfully!",
      envStatus: envStatus,
      payload: payload
    }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error: any) {
    // If anything crashes during env var access
    return new Response(JSON.stringify({ 
      success: false, 
      message: `Step 2 Crashed (Env Vars): ${error.message || 'Unknown error'}` 
    }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});