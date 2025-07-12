// @ts-nocheck
// supabase/functions/send-verification-email-v2/index.ts
// STEP 4: Test database insertion
// Previous steps worked! Now testing if DB insert crashes.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

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
    const { userId, email, verificationToken } = payload;

    // Environment variables (we know these work)
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Supabase client (we know this works)
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // NEW: Test token hashing (might crash here)
    const tokenBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificationToken));
    const tokenHash = Array.from(new Uint8Array(tokenBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // NEW: Test database insertion - this is likely the crash point
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    const { data: insertData, error: insertError } = await supabaseClient
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        email: email,
        token_hash: tokenHash,
        expires_at: expiresAt,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      // Return the specific database error
      return new Response(JSON.stringify({ 
        success: false, 
        message: `DB Insert Failed: ${insertError.message}`,
        errorDetails: {
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        }
      }), {
        headers: corsHeaders,
        status: 500,
      });
    }

    // If we reach here, database insertion worked!
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Database insertion successful!",
      insertResult: {
        tokenId: insertData?.id,
        tokenHashLength: tokenHash.length,
        expiresAt: expiresAt
      }
    }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: `Step 4 Crashed (DB/Hashing): ${error.message || 'Unknown error'}`,
      errorStack: error.stack ? error.stack.substring(0, 500) : 'No stack trace'
    }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});