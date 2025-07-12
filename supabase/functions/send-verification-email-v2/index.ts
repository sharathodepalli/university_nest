// @ts-nocheck
// This code is for your Supabase Edge Function: send-verification-email-v2/index.ts
// TypeScript checking is disabled for Deno Edge Function compatibility

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // IMPORTANT: In production, change '*' to your specific frontend URL (e.g., 'https://university-nest.vercel.app')
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, email, verificationType, metadata, expiresInMinutes, baseUrl, verificationToken } = await req.json();

    // Removed some console.log as they won't be visible in typical logs for you
    // But keeping the core error logging for clarity in Catch blocks

    // Initialize Supabase client within the Edge Function using service role key
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SENDGRID_API_KEY) {
      console.error("Edge Function: Missing required environment variables."); // This might not be visible either
      return new Response(JSON.stringify({ success: false, message: "Server configuration error: Missing environment variables." }), {
        headers: corsHeaders,
        status: 500,
      });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // --- Token Hashing for Security ---
    // console.log("Edge Function: Hashing token..."); // Removed as it might not be logged
    const tokenBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificationToken));
    const tokenHash = Array.from(new Uint8Array(tokenBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    // console.log("Edge Function: Token hashed successfully."); // Removed

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    // --- Database Insertion ---
    // console.log("Edge Function: Attempting to insert token into email_verification_tokens..."); // Removed
    const { data: insertData, error: insertError } = await supabaseClient
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        email: email,
        token_hash: tokenHash, // Store the HASHED token
        expires_at: expiresAt,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error("Edge Function: Error inserting token:", insertError.message, insertError.details); // This might not be visible
      // CORRECTED: Return specific error message in response body
      return new Response(JSON.stringify({ success: false, message: `DB Insert Error: ${insertError.message || 'Unknown DB error'} Details: ${insertError.details || 'N/A'}` }), {
        headers: corsHeaders,
        status: 500,
      });
    }
    // console.log("Edge Function: Token inserted successfully. ID:", insertData?.id); // Removed

    // --- Email Sending ---
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    // console.log("Edge Function: Constructed verification URL:", verificationUrl); // Removed

    // console.log("Edge Function: Attempting to send email via SendGrid..."); // Removed
    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: email }] }],
        from: { email: FROM_EMAIL, name: 'UniNest Verification' },
        subject: 'Verify Your University Email - UniNest',
        content: [{
          type: 'text/html',
          value: `
            <p>Hello,</p>
            <p>Please verify your email address by clicking on the link below:</p>
            <a href="${verificationUrl}">Verify Email</a>
            <p>This link will expire in ${expiresInMinutes} minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          `
        }],
      }),
    });

    if (!sendgridResponse.ok) {
      const sendgridErrorText = await sendgridResponse.text();
      console.error("Edge Function: SendGrid email failed to send:", sendgridResponse.status, sendgridErrorText); // This might not be visible
      // CORRECTED: Return specific error message in response body
      return new Response(JSON.stringify({ success: false, message: `SendGrid Error: ${sendgridResponse.statusText} - ${sendgridErrorText}` }), {
        headers: corsHeaders,
        status: 500,
      });
    }
    // console.log("Edge Function: Verification email sent successfully via SendGrid."); // Removed

    return new Response(JSON.stringify({ success: true, message: 'Verification email sent successfully!' }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error: any) {
    console.error("Edge Function: Unexpected error during execution:", error.message || error); // This might not be visible
    // CORRECTED: Return specific error message in response body for unexpected errors
    return new Response(JSON.stringify({ success: false, message: `Unexpected Edge Function Error: ${error.message || 'Unknown error'}` }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});