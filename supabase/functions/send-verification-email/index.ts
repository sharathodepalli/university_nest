// @ts-ignore: Deno imports
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Global Deno types for Edge Runtime
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, verificationToken, studentName } = await req.json()

    // Validate required fields
    if (!email || !verificationToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SendGrid configuration
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'verify@uninest.com'
    const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173'
    
    if (!SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured')
    }

    // Create verification link
    const verificationLink = `${APP_URL}/verify-email?token=${verificationToken}`

    // SendGrid email payload
    const emailData = {
      personalizations: [{
        to: [{ email: email, name: studentName || 'Student' }],
        subject: 'Verify Your UniNest Student Email'
      }],
      from: {
        email: FROM_EMAIL,
        name: 'UniNest Verification'
      },
      content: [{
        type: 'text/html',
        value: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Student Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #3B82F6;">
              <h1 style="color: #3B82F6; margin: 0; font-size: 28px;">UniNest</h1>
              <p style="color: #6B7280; margin: 5px 0;">Student Housing Platform</p>
            </div>
            
            <div style="padding: 30px 0;">
              <h2 style="color: #1F2937; margin-bottom: 20px;">Verify Your Student Email</h2>
              
              <p>Hi ${studentName || 'there'},</p>
              
              <p>Welcome to UniNest! To complete your student verification and access our platform, please verify your university email address.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" 
                   style="display: inline-block; background-color: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #6B7280; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationLink}" style="color: #3B82F6; word-break: break-all;">${verificationLink}</a>
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                <h3 style="color: #1F2937; font-size: 18px;">Why verify your email?</h3>
                <ul style="color: #6B7280;">
                  <li>🏠 Access exclusive student housing listings</li>
                  <li>✅ Get verified student status badge</li>
                  <li>💬 Message hosts and other students</li>
                  <li>🔒 Enhanced privacy and security features</li>
                </ul>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                This verification link will expire in 24 hours. If you didn't request this verification, you can safely ignore this email.
              </p>
            </div>
            
            <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center; color: #6B7280; font-size: 12px;">
              <p>© 2024 UniNest. All rights reserved.</p>
              <p>
                <a href="${APP_URL}/privacy" style="color: #3B82F6;">Privacy Policy</a> | 
                <a href="${APP_URL}/terms" style="color: #3B82F6;">Terms of Service</a>
              </p>
            </div>
          </body>
          </html>
        `
      }]
    }

    // Send email via SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SendGrid error:', errorText)
      throw new Error(`SendGrid API error: ${response.status}`)
    }

    // Log success (for monitoring)
    console.log(`Verification email sent to ${email}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent successfully',
        email: email
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending verification email:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send verification email',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
