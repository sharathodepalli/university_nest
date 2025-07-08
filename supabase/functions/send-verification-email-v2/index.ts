// Production-ready edge function for email verification
// @ts-ignore: Deno imports
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

// Deno environment types
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface EmailRequest {
  email: string;
  verificationToken: string;
  studentName?: string;
}

interface SendGridResponse {
  success: boolean;
  message?: string;
  error?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Parse request body
    const requestData: EmailRequest = await req.json()
    const { email, verificationToken, studentName } = requestData

    // Validate required fields
    if (!email || !verificationToken) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: 'Email and verification token are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid email format',
          details: 'Please provide a valid email address'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate .edu domain
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain?.endsWith('.edu')) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid email domain',
          details: 'Only .edu email addresses are allowed'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'verify@uninest.com'
    const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:3001'
    
    // Validate environment configuration
    if (!SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured')
      return new Response(
        JSON.stringify({ 
          error: 'Email service not configured',
          details: 'SendGrid API key is missing'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create verification link
    const verificationLink = `${APP_URL}/verify-email?token=${verificationToken}`

    // Send email via SendGrid
    const emailResult = await sendVerificationEmail({
      email,
      verificationLink,
      studentName: studentName || 'Student',
      fromEmail: FROM_EMAIL,
      apiKey: SENDGRID_API_KEY
    })

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)

      return new Response(
        JSON.stringify({ 
          error: 'Failed to send verification email',
          details: emailResult.error || 'Unknown error occurred'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log success
    console.log(`Verification email sent successfully to ${email}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent successfully',
        email: email,
        expiresIn: '24 hours'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-verification-email function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/**
 * Send verification email via SendGrid
 */
async function sendVerificationEmail({
  email,
  verificationLink,
  studentName,
  fromEmail,
  apiKey
}: {
  email: string;
  verificationLink: string;
  studentName: string;
  fromEmail: string;
  apiKey: string;
}): Promise<SendGridResponse> {
  try {
    const emailData = {
      personalizations: [{
        to: [{ email: email, name: studentName }],
        subject: 'Verify Your UniNest Student Email'
      }],
      from: {
        email: fromEmail,
        name: 'UniNest Verification'
      },
      content: [{
        type: 'text/html',
        value: generateEmailTemplate(verificationLink, studentName)
      }]
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'UniNest/1.0'
      },
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`SendGrid API error (${response.status}):`, errorText)
      
      // Parse SendGrid error response
      let errorMessage = `SendGrid API error: ${response.status}`
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.errors?.[0]?.message || errorMessage
      } catch {
        // Use default error message if parsing fails
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }

    return {
      success: true,
      message: 'Email sent successfully'
    }

  } catch (error) {
    console.error('SendGrid request error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate HTML email template
 */
function generateEmailTemplate(verificationLink: string, studentName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Student Email</title>
      <style>
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; padding: 10px !important; }
          .button { padding: 12px 20px !important; font-size: 14px !important; }
        }
      </style>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div class="container" style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #3B82F6;">
          <h1 style="color: #3B82F6; margin: 0; font-size: 28px;">UniNest</h1>
          <p style="color: #6B7280; margin: 5px 0; font-size: 14px;">Student Housing Platform</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px 0;">
          <h2 style="color: #1F2937; margin-bottom: 20px; font-size: 24px;">Verify Your Student Email</h2>
          
          <p style="margin-bottom: 15px;">Hi ${studentName},</p>
          
          <p style="margin-bottom: 20px;">Welcome to UniNest! To complete your student verification and access our platform, please verify your university email address by clicking the button below.</p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               class="button"
               style="display: inline-block; background-color: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">
              Verify Email Address
            </a>
          </div>
          
          <!-- Alternative Link -->
          <p style="color: #6B7280; font-size: 14px; margin-bottom: 25px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationLink}" style="color: #3B82F6; word-break: break-all; text-decoration: underline;">${verificationLink}</a>
          </p>
          
          <!-- Benefits -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            <h3 style="color: #1F2937; font-size: 18px; margin-bottom: 15px;">Why verify your email?</h3>
            <ul style="color: #6B7280; padding-left: 20px;">
              <li style="margin-bottom: 8px;">🏠 Access exclusive student housing listings</li>
              <li style="margin-bottom: 8px;">✅ Get verified student status badge</li>
              <li style="margin-bottom: 8px;">💬 Message hosts and other students</li>
              <li style="margin-bottom: 8px;">🔒 Enhanced privacy and security features</li>
            </ul>
          </div>
          
          <!-- Security Notice -->
          <div style="margin-top: 25px; padding: 15px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
            <p style="color: #92400E; font-size: 14px; margin: 0;">
              <strong>Security Notice:</strong> This verification link will expire in 24 hours. If you didn't request this verification, you can safely ignore this email.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center; color: #6B7280; font-size: 12px;">
          <p style="margin-bottom: 10px;">© ${new Date().getFullYear()} UniNest. All rights reserved.</p>
          <p style="margin: 0;">
            <a href="#" style="color: #3B82F6; text-decoration: none;">Privacy Policy</a> | 
            <a href="#" style="color: #3B82F6; text-decoration: none;">Terms of Service</a> |
            <a href="#" style="color: #3B82F6; text-decoration: none;">Contact Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
