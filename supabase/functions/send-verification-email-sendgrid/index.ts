import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerificationEmailRequest {
  email: string;
  verificationToken: string;
  baseUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@uninest.com'
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured')
    }

    // Parse request body
    const { email, verificationToken, baseUrl }: VerificationEmailRequest = await req.json()

    if (!email || !verificationToken || !baseUrl) {
      throw new Error('Missing required fields: email, verificationToken, baseUrl')
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Verify the token exists and is valid
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('token', verificationToken)
      .eq('email', email)
      .single()

    if (tokenError || !tokenData) {
      throw new Error('Invalid verification token')
    }

    // Check if token is expired (24 hours)
    const tokenCreated = new Date(tokenData.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - tokenCreated.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff > 24) {
      throw new Error('Verification token has expired')
    }

    // Construct verification URL
    const verificationUrl = `${baseUrl}/verification?token=${verificationToken}&email=${encodeURIComponent(email)}`

    // Prepare email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your University Email - UniNest</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #5a6fd8; }
          .token-box { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin: 20px 0; font-family: monospace; font-size: 16px; text-align: center; color: #495057; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 UniNest</h1>
            <p>Verify Your University Email</p>
          </div>
          <div class="content">
            <h2>Welcome to UniNest!</h2>
            <p>Thank you for registering with UniNest. To complete your university verification and access our platform, please verify your university email address.</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <div class="token-box">${verificationUrl}</div>
            
            <div class="warning">
              <strong>⚠️ Security Note:</strong> This verification link will expire in 24 hours for security reasons. If you didn't request this verification, please ignore this email.
            </div>
            
            <h3>What happens next?</h3>
            <ul>
              <li>✅ Click the verification link above</li>
              <li>🎓 Your university email will be verified</li>
              <li>🏠 You'll gain access to browse and post listings</li>
              <li>💬 Connect with verified students at your university</li>
            </ul>
            
            <p>Need help? Contact our support team at support@uninest.com</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>© 2024 UniNest. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const emailText = `
UniNest - Verify Your University Email

Welcome to UniNest! Please verify your university email address to complete your registration.

Verification Link: ${verificationUrl}

This link will expire in 24 hours for security reasons.

If you didn't request this verification, please ignore this email.

Need help? Contact support@uninest.com

© 2024 UniNest. All rights reserved.
    `

    // Send email using SendGrid
    const emailData = {
      personalizations: [
        {
          to: [{ email: email }],
          subject: 'Verify Your University Email - UniNest'
        }
      ],
      from: {
        email: FROM_EMAIL,
        name: 'UniNest Verification'
      },
      content: [
        {
          type: 'text/plain',
          value: emailText
        },
        {
          type: 'text/html',
          value: emailHtml
        }
      ]
    }

    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text()
      console.error('SendGrid error:', errorText)
      throw new Error(`SendGrid error: ${sendGridResponse.status} ${errorText}`)
    }

    // Update the email_verifications table to track that email was sent
    const { error: updateError } = await supabase
      .from('email_verifications')
      .update({ 
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('token', verificationToken)
      .eq('email', email)

    if (updateError) {
      console.error('Error updating email_verifications:', updateError)
    }

    console.log(`✅ Verification email sent successfully to: ${email}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent successfully',
        verificationUrl: verificationUrl // For development/testing
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in send-verification-email function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
