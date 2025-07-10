// Production-ready edge function for token verification
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

interface VerificationRequest {
  token: string;
}

interface VerificationResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
  };
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
    const requestData: VerificationRequest = await req.json()
    const { token } = requestData

    // Validate required fields
    if (!token) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: 'Verification token is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate token format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(token)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid token format',
          details: 'Token must be a valid UUID'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Supabase configuration
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Supabase configuration missing')
      return new Response(
        JSON.stringify({ 
          error: 'Service configuration error',
          details: 'Database connection not configured'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Call database function to verify token
    const result = await verifyTokenInDatabase(token, SUPABASE_URL, SUPABASE_SERVICE_KEY)

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Verification failed',
          details: result.message
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log success
    console.log(`Email verification successful for token: ${token.substring(0, 8)}...`)

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        data: result.data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in verify-email-token function:', error)
    
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
 * Verify token in database using Supabase REST API
 */
async function verifyTokenInDatabase(
  token: string, 
  supabaseUrl: string, 
  serviceKey: string
): Promise<VerificationResponse> {
  try {
    // Call the database function via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/verify_email_token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      },
      body: JSON.stringify({ token: token })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Database error (${response.status}):`, errorText)
      
      return {
        success: false,
        message: 'Database verification failed'
      }
    }

    const data = await response.json()
    
    // Handle array response from database function
    const result = Array.isArray(data) ? data[0] : data
    
    if (!result) {
      return {
        success: false,
        message: 'Invalid verification response'
      }
    }

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Invalid or expired verification token'
      }
    }

    return {
      success: true,
      message: result.message || 'Email verified successfully!',
      data: {
        userId: result.user_id,
        email: result.email
      }
    }

  } catch (error) {
    console.error('Database verification error:', error)
    return {
      success: false,
      message: 'Database connection failed'
    }
  }
}
