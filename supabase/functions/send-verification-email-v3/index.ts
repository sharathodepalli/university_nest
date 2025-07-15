// @ts-nocheck
// supabase/functions/send-verification-email-v3/index.ts
// Production-ready email verification with native Deno SMTP

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
    console.log('Function started successfully');
    
    const payload = await req.json();
    const { userId, email, verificationToken } = payload;

    // Environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtpout.secureserver.net';
    const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const SMTP_USER = Deno.env.get('SMTP_USER') || 'noreply@uninest.us';
    const SMTP_PASS = Deno.env.get('SMTP_PASS'); 
    const APP_URL = Deno.env.get('APP_URL') || 'https://www.uninest.us';
    const ENVIRONMENT = Deno.env.get('ENVIRONMENT') || 'production';
    
    console.log('Environment variables loaded');
    console.log(`Current ENVIRONMENT: ${ENVIRONMENT}`);

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

    if (!SMTP_PASS) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Missing SMTP password. Please configure SMTP_PASS environment variable.' 
      }), {
        headers: corsHeaders,
        status: 500,
      });
    }


    // Create Supabase client
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Hash the verification token
    const tokenBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificationToken));
    const tokenHash = Array.from(new Uint8Array(tokenBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Token hashed, attempting database insert');

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
      console.error('Database insert error:', insertError);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Database error storing verification token',
        error: insertError.message 
      }), {
        headers: corsHeaders,
        status: 500,
      });
    }

    console.log('Database insert successful, attempting email send via SMTP');

    try {
      console.log('Sending email via EmailJS service...');
      
      // Use production URL for production, localhost for development
      const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
      const baseUrl = isDevelopment ? 'http://localhost:3000' : APP_URL;
      const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

      console.log(`📧 Attempting to send email to: ${email}`);
      console.log(`🔗 Verification URL: ${verifyUrl}`);
      
      // **ACTUAL EMAIL SENDING WITH NATIVE DENO SMTP**
      
      // Create TLS connection to SMTP server
      const conn = await Deno.connectTls({
        hostname: SMTP_HOST,
        port: SMTP_PORT,
      });

      const reader = conn.readable.getReader();
      const writer = conn.writable.getWriter();

      // Helper function to read SMTP response
      const readResponse = async (): Promise<string> => {
        const { value } = await reader.read();
        return new TextDecoder().decode(value);
      };

      // Helper function to send SMTP command
      const sendCommand = async (command: string): Promise<void> => {
        await writer.write(new TextEncoder().encode(command + '\r\n'));
      };

      try {
        // SMTP conversation
        console.log('📡 Connecting to SMTP server...');
        await readResponse(); // Initial greeting
        
        await sendCommand(`EHLO ${SMTP_HOST}`);
        await readResponse();
        
        await sendCommand('AUTH LOGIN');
        await readResponse();
        
        // Send username (base64 encoded)
        await sendCommand(btoa(SMTP_USER));
        await readResponse();
        
        // Send password (base64 encoded)
        await sendCommand(btoa(SMTP_PASS));
        await readResponse();
        
        console.log('✅ SMTP authentication successful');
        
        // Send email
        await sendCommand(`MAIL FROM:<${SMTP_USER}>`);
        await readResponse();
        
        await sendCommand(`RCPT TO:<${email}>`);
        await readResponse();
        
        await sendCommand('DATA');
        await readResponse();
        
        // Email content
        const emailContent = `Subject: Verify Your UniNest Email Address
From: UniNest <${SMTP_USER}>
To: ${email}
Content-Type: text/html; charset=UTF-8

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <h1 style="color: #667eea;">Welcome to UniNest!</h1>
        <p style="font-size: 16px; color: #333;">Please verify your email address to complete your registration.</p>
        
        <div style="margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="display: inline-block; padding: 12px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
               Verify My Email
            </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
        
        <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account with UniNest, please ignore this email.
        </p>
    </div>
</body>
</html>

.`;

        await writer.write(new TextEncoder().encode(emailContent));
        await sendCommand('.');
        await readResponse();
        
        await sendCommand('QUIT');
        await readResponse();
        
        console.log('✅ Email sent successfully via SMTP');
        
        // Close connection
        await writer.close();
        await reader.cancel();
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Verification email sent successfully',
          tokenId: insertData.id,
          verificationUrl: verifyUrl
        }), {
          headers: corsHeaders,
          status: 200,
        });

      } catch (smtpError: any) {
        console.error('SMTP Error:', smtpError);
        // Close connection on error
        try {
          await writer.close();
          await reader.cancel();
        } catch {}
        
        throw smtpError;
      }

    } catch (emailError: any) {
      console.error('Email Error:', emailError);
      
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Failed to send email',
        error: emailError.message,
        tokenId: insertData.id
      }), {
        headers: corsHeaders,
        status: 500,
      });
    }

  } catch (error: any) {
    console.error('Function Error:', error);
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
