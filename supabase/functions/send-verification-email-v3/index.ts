// @ts-nocheck
// supabase/functions/send-verification-email-v3/index.ts
// Production-ready email verification with Resend API

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'; 

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting helper (simple in-memory store for Edge Functions)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const isRateLimited = (email: string): boolean => {
  const now = Date.now();
  const key = `email:${email}`;
  const limit = rateLimitStore.get(key);
  
  if (!limit || now > limit.resetTime) {
    // Reset or initialize
    rateLimitStore.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return false;
  }
  
  if (limit.count >= 3) { // Max 3 emails per minute per email address
    return true;
  }
  
  limit.count++;
  return false;
};

// Input validation
const validateInput = (payload: any): { isValid: boolean; error?: string } => {
  if (!payload.userId || typeof payload.userId !== 'string') {
    return { isValid: false, error: 'Valid userId is required' };
  }
  
  if (!payload.email || typeof payload.email !== 'string') {
    return { isValid: false, error: 'Valid email is required' };
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  if (!payload.verificationToken || typeof payload.verificationToken !== 'string') {
    return { isValid: false, error: 'Valid verification token is required' };
  }
  
  return { isValid: true };
};

// Enhanced email template with better styling and accessibility
const createEmailTemplate = (verifyUrl: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your UniNest Email Address</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #667eea; font-size: 28px; font-weight: 700; line-height: 1.2;">
                                Welcome to UniNest!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                                Thank you for joining UniNest, the premier platform for university student housing. To complete your registration and start finding your perfect home, please verify your email address.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${verifyUrl}" 
                                           style="display: inline-block; padding: 16px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; line-height: 1.4;"
                                           target="_blank" rel="noopener">
                                            Verify My Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                                If the button above doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 8px 0 0; word-break: break-all;">
                                <a href="${verifyUrl}" style="color: #667eea; text-decoration: underline;" target="_blank" rel="noopener">
                                    ${verifyUrl}
                                </a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 12px; color: #9ca3af; font-size: 12px; line-height: 1.4;">
                                This verification link will expire in 24 hours for security reasons.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.4;">
                                If you didn't create a UniNest account, please ignore this email or contact our support team.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let payload: any;

  // Environment configuration (declare at function level for error handler access)
  const config = {
    SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    RESEND_API_KEY: Deno.env.get('RESEND_API_KEY'),
    APP_URL: Deno.env.get('APP_URL') || 'https://www.uninest.us',
    ENVIRONMENT: Deno.env.get('ENVIRONMENT') || 'production',
  };

  try {
    console.log('🚀 Email verification function started');
    
    // Parse and validate request
    try {
      payload = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse JSON payload:', parseError);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid JSON payload',
        error: 'REQUEST_PARSE_ERROR'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Input validation
    const validation = validateInput(payload);
    if (!validation.isValid) {
      console.error('❌ Input validation failed:', validation.error);
      return new Response(JSON.stringify({ 
        success: false, 
        message: validation.error,
        error: 'VALIDATION_ERROR'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { userId, email, verificationToken } = payload;
    
    // Rate limiting check
    if (isRateLimited(email)) {
      console.warn('⚠️ Rate limit exceeded for email:', email);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Too many verification requests. Please wait before requesting another email.',
        error: 'RATE_LIMITED'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      });
    }
    
    console.log('📋 Configuration loaded:', {
      environment: config.ENVIRONMENT,
      hasSupabaseUrl: !!config.SUPABASE_URL,
      hasServiceKey: !!config.SUPABASE_SERVICE_ROLE_KEY,
      hasResendKey: !!config.RESEND_API_KEY,
      appUrl: config.APP_URL
    });

    // Validate required environment variables
    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing critical environment variables');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Server configuration error',
        error: 'MISSING_ENV_CONFIG'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!config.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured - email sending will fail');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Email service not configured',
        error: 'EMAIL_SERVICE_UNAVAILABLE'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 503,
      });
    }

    // Initialize Supabase client with error handling
    let supabaseClient;
    try {
      supabaseClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
    } catch (clientError) {
      console.error('❌ Failed to create Supabase client:', clientError);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Database connection error',
        error: 'DB_CONNECTION_ERROR'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Hash verification token with better error handling
    let tokenHash: string;
    try {
      const tokenBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificationToken));
      tokenHash = Array.from(new Uint8Array(tokenBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      console.log('🔐 Token hashed successfully');
    } catch (hashError) {
      console.error('❌ Token hashing failed:', hashError);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Token processing error',
        error: 'TOKEN_HASH_ERROR'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Database operations with enhanced error handling
    console.log('💾 Storing verification token in database');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const { data: insertData, error: insertError } = await supabaseClient
      .from('email_verification_tokens')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        email: email,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      
      // Check for specific error types
      if (insertError.code === '23505') { // Unique constraint violation
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'A verification email has already been sent recently',
          error: 'DUPLICATE_TOKEN'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        });
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Failed to store verification token',
        error: 'DB_INSERT_ERROR',
        details: insertError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('✅ Token stored successfully with ID:', insertData.id);

    // Email sending with Resend API
    const baseUrl = config.ENVIRONMENT === 'development' ? 'http://localhost:3000' : config.APP_URL;
    const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    console.log(`📧 Preparing to send email to: ${email}`);
    console.log(`🔗 Verification URL: ${verifyUrl}`);

    try {
      const fromEmail = 'UniNest <onboarding@resend.dev>';
      
      console.log('� Sending via Resend API with verified domain');
      
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'UniNest/1.0',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'Verify Your UniNest Email Address',
          html: createEmailTemplate(verifyUrl),
          tags: [
            { name: 'category', value: 'email_verification' },
            { name: 'environment', value: config.ENVIRONMENT }
          ],
        }),
      });

      console.log('📧 Resend API response status:', emailResponse.status);

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('❌ Resend API error:', errorText);
        
        // Still return success since token is stored - user can manually verify
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Email delivery failed, but verification token is saved',
          error: 'EMAIL_DELIVERY_FAILED',
          tokenId: insertData.id,
          verificationUrl: verifyUrl
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      const emailResult = await emailResponse.json();
      console.log('✅ Email sent successfully:', emailResult);
      
      const processingTime = Date.now() - startTime;
      console.log(`⚡ Function completed in ${processingTime}ms`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Verification email sent successfully',
        tokenId: insertData.id,
        emailId: emailResult.id,
        processingTime: `${processingTime}ms`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (emailError: any) {
      console.error('❌ Email sending error:', emailError);
      
      // Return partial success - token is stored for manual verification
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Email service temporarily unavailable',
        error: 'EMAIL_SERVICE_ERROR',
        tokenId: insertData.id,
        verificationUrl: verifyUrl,
        details: emailError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Unexpected function error:', error);
    console.error('🔍 Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Internal server error',
      error: 'INTERNAL_ERROR',
      processingTime: `${processingTime}ms`,
      ...(config.ENVIRONMENT === 'development' && { details: error.message })
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
