// @ts-nocheck
// supabase/functions/send-verification-email-v3/index.ts
// Production-ready email verification with Resend API

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
    console.log('🚀 Email verification function started');
    
    const payload = await req.json();
    console.log('📦 Received payload:', { 
      userId: payload?.userId ? 'present' : 'missing',
      email: payload?.email ? 'present' : 'missing', 
      verificationToken: payload?.verificationToken ? 'present' : 'missing'
    });
    
    const { userId, email, verificationToken } = payload;

    // Basic input validation
    if (!userId || !email || !verificationToken) {
      console.error('❌ Missing required fields:', { userId: !!userId, email: !!email, verificationToken: !!verificationToken });
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Missing required fields: userId, email, and verificationToken are required',
        error: 'VALIDATION_ERROR'
      }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format:', email);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid email format',
        error: 'VALIDATION_ERROR'
      }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    // Environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const APP_URL = Deno.env.get('APP_URL') || 'https://www.uninest.us';
    const ENVIRONMENT = Deno.env.get('ENVIRONMENT') || 'production';
    
    console.log('📋 Environment variables loaded');
    console.log(`🏠 Current ENVIRONMENT: ${ENVIRONMENT}`);

    // Basic validation
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Missing Supabase configuration (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)' 
      }), {
        headers: corsHeaders,
        status: 500,
      });
    }

    // Check for RESEND_API_KEY
    if (!RESEND_API_KEY) {
      console.log('⚠️ No RESEND_API_KEY found');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Email service not configured',
        error: 'EMAIL_SERVICE_UNAVAILABLE'
      }), {
        headers: corsHeaders,
        status: 503,
      });
    }

    // Create Supabase client
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Hash the verification token
    const tokenBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificationToken));
    const tokenHash = Array.from(new Uint8Array(tokenBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('🔐 Token hashed, attempting database insert');

    // Insert verification token into database
    const { data: insertData, error: insertError } = await supabaseClient
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        email: email,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Database error storing verification token',
        error: insertError.message 
      }), {
        headers: corsHeaders,
        status: 500,
      });
    }

    console.log('✅ Database insert successful, preparing email');

    // Create verification URL
    const isDevelopment = ENVIRONMENT === 'development';
    const baseUrl = isDevelopment ? 'http://localhost:3000' : APP_URL;
    const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    console.log(`📧 Attempting to send email to: ${email}`);
    console.log(`🔗 Verification URL: ${verifyUrl}`);
    
    // Email template
    const emailHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your UniNest Email Address</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f7fa;">
    <div style="text-align: center; padding: 40px 20px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #667eea; font-size: 28px; font-weight: 700; margin-bottom: 20px;">Welcome to UniNest!</h1>
        <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 30px;">
            Thank you for joining UniNest, the premier platform for university student housing. Please verify your email address to complete your registration.
        </p>
        
        <div style="margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="display: inline-block; padding: 16px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
               Verify My Email Address
            </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verifyUrl}" style="color: #667eea; word-break: break-all;">${verifyUrl}</a>
        </p>
        
        <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">
            This verification link will expire in 24 hours. If you didn't create a UniNest account, please ignore this email.
        </p>
    </div>
</body>
</html>`;

    try {
      console.log('📤 Sending via Resend API');
      
      // Use verified Resend domain
      const fromEmail = 'UniNest <onboarding@resend.dev>';
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'Verify Your UniNest Email Address',
          html: emailHtml,
        }),
      });

      console.log('📧 Resend API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email sent successfully:', result);
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Verification email sent successfully',
          tokenId: insertData.id,
          emailId: result.id
        }), {
          headers: corsHeaders,
          status: 200,
        });
      } else {
        const error = await response.text();
        console.error('❌ Resend API error:', error);
        
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Email delivery failed',
          error: 'EMAIL_DELIVERY_FAILED',
          tokenId: insertData.id,
          verificationUrl: verifyUrl
        }), {
          headers: corsHeaders,
          status: 500,
        });
      }
      
    } catch (emailError: any) {
      console.error('❌ Email service error:', emailError);
      
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Email service temporarily unavailable',
        error: 'EMAIL_SERVICE_ERROR',
        tokenId: insertData.id,
        verificationUrl: verifyUrl
      }), {
        headers: corsHeaders,
        status: 500,
      });
    }

  } catch (error: any) {
    console.error('❌ Function error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});
