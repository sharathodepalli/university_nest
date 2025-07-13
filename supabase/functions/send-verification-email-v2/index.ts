// @ts-nocheck
// supabase/functions/send-verification-email-v2/index.ts
// FINAL VERSION: Handle permissions properly with service role

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

    // Environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'contact@thetrueshades.com';
    const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';

    // Create Supabase client with service role key
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Hash the verification token
    const tokenBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificationToken));
    const tokenHash = Array.from(new Uint8Array(tokenBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Insert verification token using service role (should bypass RLS)
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
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Database Insert Failed: ${insertError.message}`,
        errorDetails: {
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          message: insertError.message
        },
        debugInfo: {
          userId: userId,
          email: email,
          tokenHashLength: tokenHash.length,
          expiresAt: expiresAt
        }
      }), {
        headers: corsHeaders,
        status: 500,
      });
    }

    // Send email using SendGrid
    const emailData = {
      personalizations: [{
        to: [{ email: email }],
        subject: 'Verify Your Email - University Nest'
      }],
      from: { email: FROM_EMAIL },
      content: [{
        type: 'text/html',
        value: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify Your Email Address</h2>
            <p>Click the link below to verify your email address:</p>
            <a href="${APP_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email
            </a>
            <p>This link will expire in 15 minutes.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `
      }]
    };

    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      return new Response(JSON.stringify({ 
        success: false, 
        message: `SendGrid Error: ${emailResponse.status} - ${errorText}`,
        note: "Database insert succeeded but email failed"
      }), {
        headers: corsHeaders,
        status: 500,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Verification email sent successfully!",
      details: {
        tokenCreated: true,
        emailSent: true,
        expiresAt: expiresAt,
        tokenId: insertData?.id
      }
    }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: `Function Error: ${error.message || 'Unknown error'}`,
      errorStack: error.stack ? error.stack.substring(0, 500) : 'No stack trace'
    }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});