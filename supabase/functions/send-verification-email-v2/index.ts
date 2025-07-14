// @ts-nocheck
// supabase/functions/send-verification-email-v2/index.ts
// OFFICE 365 SMTP VERSION: Using Office 365 instead of SendGrid

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

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
    
    // GoDaddy SMTP Settings (tested and working)
    const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtpout.secureserver.net';
    const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const SMTP_USER = Deno.env.get('SMTP_USER') || 'noreply@uninest.us';
    const SMTP_PASS = Deno.env.get('SMTP_PASS');
    const SMTP_SECURE = Deno.env.get('SMTP_SECURE') === 'true';
    const FROM_EMAIL = SMTP_USER;
    const APP_URL = Deno.env.get('APP_URL') || 'https://www.uninest.us';

    // Validate required environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Missing Supabase configuration' 
      }), {
        headers: corsHeaders,
        status: 500,
      });
    }

    if (!SMTP_PASS) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Missing GoDaddy SMTP password. Please configure SMTP_PASS environment variable.' 
      }), {
        headers: corsHeaders,
        status: 500,
      });
    }
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

    // Create SMTP client for GoDaddy
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: false, // Use STARTTLS instead of direct TLS
        auth: {
          username: SMTP_USER,
          password: SMTP_PASS,
        },
      },
    });

    // Create verification URL
    const verificationUrl = `${APP_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    // Create professional HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🎓 Verify Your UniNest Account</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .email-wrapper { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .urgent-banner { background: linear-gradient(90deg, #ff6b6b, #feca57); color: white; padding: 15px; text-align: center; font-weight: bold; margin-bottom: 30px; border-radius: 8px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); }
          .timer { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .benefits { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; }
          .benefits ul { margin: 10px 0; padding-left: 20px; }
          .benefits li { margin: 8px 0; color: #1976d2; }
          .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 14px; }
          .security-note { background: #ffebee; border: 1px solid #ffcdd2; border-radius: 8px; padding: 15px; margin: 20px 0; color: #c62828; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <div class="header">
              <h1>🏠 UniNest</h1>
              <p>Your University Housing Platform</p>
            </div>
            <div class="content">
              <div class="urgent-banner">
                ⚡ ACTION REQUIRED: Verify your account now!
              </div>
              
              <h2 style="color: #333; margin-top: 0;">Welcome to UniNest! 🎉</h2>
              <p style="font-size: 16px; color: #555;">You're just one click away from accessing the best university housing platform. <strong>Verify your email to get started:</strong></p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="cta-button">✅ Verify My Email Now</a>
              </div>
              
              <div class="timer">
                <strong>⏰ Time Sensitive:</strong> This verification link expires in <strong>15 minutes</strong> for your security.
              </div>
              
              <div class="benefits">
                <h3 style="margin-top: 0; color: #1976d2;">🚀 What you'll get access to:</h3>
                <ul>
                  <li><strong>🏠 Premium Listings</strong> - Find verified university housing</li>
                  <li><strong>🎓 Student Network</strong> - Connect with verified classmates</li>
                  <li><strong>💬 Direct Messaging</strong> - Chat safely with other students</li>
                  <li><strong>🔒 Verified Community</strong> - University-only verified users</li>
                </ul>
              </div>
              
              <p><strong>Can't click the button?</strong> Copy and paste this link:</p>
              <div style="background: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 15px; margin: 15px 0; font-family: monospace; font-size: 14px; word-break: break-all;">${verificationUrl}</div>
              
              <div class="security-note">
                <strong>🔒 Security Notice:</strong> If you didn't create this account, please ignore this email. Your security is our priority.
              </div>
              
              <p style="margin-top: 30px;">Questions? Reply to this email or contact <strong>support@uninest.us</strong></p>
            </div>
            <div class="footer">
              <p style="margin: 0;">© 2025 UniNest - University Housing Made Simple</p>
              <p style="margin: 5px 0 0 0;">
                <a href="#" style="color: #667eea; text-decoration: none;">Privacy Policy</a> | 
                <a href="#" style="color: #667eea; text-decoration: none;">Terms of Service</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Welcome to UniNest! 🎉

You're just one click away from accessing the best university housing platform. 
Verify your email to get started: ${verificationUrl}

⏰ Time Sensitive: This verification link expires in 15 minutes for your security.

🚀 What you'll get access to:
• 🏠 Premium Listings - Find verified university housing
• 🎓 Student Network - Connect with verified classmates  
• 💬 Direct Messaging - Chat safely with other students
• 🔒 Verified Community - University-only verified users

Questions? Reply to this email or contact support@uninest.us

🔒 Security Notice: If you didn't create this account, please ignore this email.

© 2025 UniNest - University Housing Made Simple
    `.trim();

    // Send email using Office 365 SMTP
    try {
      await client.send({
        from: `UniNest Team <${FROM_EMAIL}>`,
        to: email,
        subject: '🎓 Verify Your UniNest Account - Action Required',
        content: htmlContent,
        html: htmlContent,
      });

      console.log('✅ Email sent successfully via Office 365 SMTP to:', email);
    } catch (emailError) {
      console.error('❌ Office 365 SMTP error:', emailError);
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Email delivery failed: ${emailError.message}`,
        note: "Database insert succeeded but email failed"
      }), {
        headers: corsHeaders,
        status: 500,
      });
    } finally {
      // Close SMTP connection
      await client.close();
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Verification email sent successfully via Office 365 SMTP!",
      details: {
        tokenCreated: true,
        emailSent: true,
        emailProvider: "Office 365 SMTP",
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