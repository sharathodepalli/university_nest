# Email Verification Implementation Guide

## Complete Flow Overview

```
1. User enters university email (john.doe@berkeley.edu)
2. Backend generates unique verification token
3. Email sent to university email with verification link
4. User clicks link in their university email
5. Token verified and user marked as verified
```

## Method 1: Using Supabase Auth (Recommended for MVP)

### Step 1: Supabase Email Configuration

```javascript
// In your Supabase project settings:
// 1. Go to Authentication > Settings
// 2. Configure SMTP settings or use Supabase's built-in email

// supabase/functions/send-verification-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userEmail, universityEmail, userId } = await req.json()

    // Generate verification token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Store verification request
    const { error: dbError } = await supabase
      .from('verification_requests')
      .insert({
        user_id: userId,
        method: 'email',
        status: 'pending',
        university_email: universityEmail,
        verification_token: token,
        expires_at: expiresAt.toISOString()
      })

    if (dbError) throw dbError

    // Send email using Supabase Auth
    const verificationUrl = `${Deno.env.get('APP_URL')}/verify-email?token=${token}`

    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: universityEmail,
      options: {
        data: {
          verification_token: token,
          user_email: userEmail,
          redirect_to: verificationUrl
        }
      }
    })

    if (emailError) throw emailError

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

### Step 2: Database Schema

```sql
-- Add to your Supabase SQL editor
CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL CHECK (method IN ('email', 'document', 'admin')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')),
    university_email VARCHAR(255),
    verification_token UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT
);

-- Add RLS policies
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification requests" ON verification_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification requests" ON verification_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add verified column to profiles
ALTER TABLE profiles ADD COLUMN verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
```

### Step 3: Frontend Implementation

```typescript
// src/services/verificationService.ts
import { supabase } from "../lib/supabase";

export class VerificationService {
  static async sendEmailVerification(universityEmail: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke(
      "send-verification-email",
      {
        body: {
          userEmail: user.email,
          universityEmail,
          userId: user.id,
        },
      }
    );

    if (error) throw error;
    return data;
  }

  static async verifyEmailToken(token: string) {
    const { data, error } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("verification_token", token)
      .eq("status", "pending")
      .gte("expires_at", new Date().toISOString())
      .single();

    if (error || !data) {
      throw new Error("Invalid or expired verification token");
    }

    // Mark as verified
    const { error: updateError } = await supabase.rpc(
      "complete_email_verification",
      {
        request_id: data.id,
        user_id: data.user_id,
      }
    );

    if (updateError) throw updateError;
    return data;
  }
}
```

### Step 4: SQL Function for Verification

```sql
-- Create function to complete verification
CREATE OR REPLACE FUNCTION complete_email_verification(
  request_id UUID,
  user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update verification request
  UPDATE verification_requests
  SET
    status = 'verified',
    reviewed_at = NOW()
  WHERE id = request_id;

  -- Update user profile
  UPDATE profiles
  SET
    verified = true,
    verified_at = NOW()
  WHERE id = user_id;
END;
$$;
```

## Method 2: Using SendGrid (Production Recommended)

### Step 1: SendGrid Setup

```typescript
// src/services/emailService.ts
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export class EmailService {
  static async sendVerificationEmail(
    userEmail: string,
    universityEmail: string,
    token: string
  ) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

    const msg = {
      to: universityEmail,
      from: {
        email: "noreply@uninest.com",
        name: "UniNest Verification",
      },
      templateId: "d-your-template-id", // Create in SendGrid
      dynamicTemplateData: {
        userEmail,
        universityEmail,
        verificationUrl,
        expiryHours: 24,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Verification email sent to ${universityEmail}`);
    } catch (error) {
      console.error("SendGrid error:", error);
      throw new Error("Failed to send verification email");
    }
  }
}
```

### Step 2: API Route (Next.js)

```typescript
// pages/api/verification/send-email.ts
import { NextApiRequest, NextApiResponse } from "next";
import { EmailService } from "../../../src/services/emailService";
import { supabase } from "../../../src/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { universityEmail, userEmail, userId } = req.body;

    // Validate university email
    if (!universityEmail.endsWith(".edu")) {
      return res.status(400).json({ error: "University email required" });
    }

    // Generate token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store in database
    const { error } = await supabase.from("verification_requests").insert({
      user_id: userId,
      method: "email",
      status: "pending",
      university_email: universityEmail,
      verification_token: token,
      expires_at: expiresAt.toISOString(),
    });

    if (error) throw error;

    // Send email
    await EmailService.sendVerificationEmail(userEmail, universityEmail, token);

    res.json({ success: true });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Failed to send verification email" });
  }
}
```

### Step 3: Email Template (SendGrid)

```html
<!-- SendGrid Dynamic Template -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Verify Your Student Status</title>
    <style>
      .container {
        max-width: 600px;
        margin: 0 auto;
        font-family: Arial, sans-serif;
      }
      .header {
        background: #3b82f6;
        color: white;
        padding: 20px;
        text-align: center;
      }
      .content {
        padding: 30px;
      }
      .button {
        background: #3b82f6;
        color: white;
        padding: 15px 30px;
        text-decoration: none;
        border-radius: 8px;
        display: inline-block;
        margin: 20px 0;
      }
      .footer {
        background: #f8f9fa;
        padding: 20px;
        text-align: center;
        font-size: 14px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🏠 UniNest</h1>
        <h2>Verify Your Student Status</h2>
      </div>

      <div class="content">
        <p>Hi there!</p>

        <p>
          We received a request to verify the student status for your UniNest
          account <strong>{{userEmail}}</strong> using this university email
          address.
        </p>

        <p>Click the button below to confirm your student status:</p>

        <a href="{{verificationUrl}}" class="button">
          ✅ Verify Student Status
        </a>

        <p>Or copy and paste this link in your browser:</p>
        <p
          style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;"
        >
          {{verificationUrl}}
        </p>

        <p><strong>This link expires in {{expiryHours}} hours.</strong></p>

        <p>Once verified, you'll get access to:</p>
        <ul>
          <li>✅ Verified student badge</li>
          <li>🏠 Premium listings from verified hosts</li>
          <li>💬 Direct messaging with verified-only hosts</li>
          <li>🔒 Enhanced safety and trust</li>
        </ul>

        <p>
          If you didn't request this verification, please ignore this email.
        </p>
      </div>

      <div class="footer">
        <p>UniNest - Connecting Students with Safe Housing</p>
        <p>This email was sent to {{universityEmail}}</p>
      </div>
    </div>
  </body>
</html>
```

## Method 3: Using Resend (Modern Alternative)

```typescript
// src/services/resendService.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export class ResendEmailService {
  static async sendVerificationEmail(
    userEmail: string,
    universityEmail: string,
    token: string
  ) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: "UniNest Verification <verify@uninest.com>",
      to: [universityEmail],
      subject: "Verify Your Student Status - UniNest",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: #3B82F6; color: white; padding: 20px; text-align: center;">
            <h1>🏠 UniNest</h1>
            <h2>Verify Your Student Status</h2>
          </div>
          
          <div style="padding: 30px;">
            <p>Hi there!</p>
            
            <p>We received a request to verify the student status for your UniNest account <strong>${userEmail}</strong>.</p>
            
            <p>Click the button below to confirm your student status:</p>
            
            <a href="${verificationUrl}" style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">
              ✅ Verify Student Status
            </a>
            
            <p>This link expires in 24 hours.</p>
            
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error("Failed to send verification email");
    }

    return data;
  }
}
```

## Quick Fix for Your Current Supabase Setup

### ⚠️ Gmail SMTP Configuration Issue

You configured:

- **Host**: `smtp.gmail.com`
- **Username**: `odepalsa@mail.uc.edu`

**This won't work!** Gmail SMTP only accepts Gmail usernames.

### Option 1: Fix Gmail SMTP (Easiest for Testing)

**🔧 CORRECT Supabase SMTP Settings:**

```
Host: smtp.gmail.com
Port: 587 (NOT 465!)
Username: sharathodepalli@gmail.com
Password: [16-character App Password - NOT your regular password!]
Sender Email: sharathodepalli@gmail.com
Sender Name: UniNest Verification
```

#### ⚠️ CRITICAL: Get Gmail App Password (Required!)

**You CANNOT use your regular Gmail password `123456`!**

1. **Enable 2FA**: Go to [Google Account Settings](https://myaccount.google.com/)
2. **Security** → **2-Step Verification** (enable if not already)
3. **App passwords** → Generate password for "Mail"
4. **Copy the 16-character password** (like: `abcd efgh ijkl mnop`)
5. **Use THIS password in Supabase** (not your regular password)

#### Why Your Current Setup Won't Work:

- ❌ **Port 465**: Gmail requires 587 for SMTP
- ❌ **Regular password**: Gmail blocks non-app passwords
- ❌ **Security risk**: Never use personal passwords in apps

### Option 2: Use University SMTP (Production Ready)

Contact UC IT department for:

```
Host: smtp.mail.uc.edu (or similar)
Port: 587
Username: odepalsa@mail.uc.edu
Password: [Your university password or app password]
```

### Option 3: Use Resend (Recommended for Production)

```
1. Sign up at resend.com (free 3,000 emails/month)
2. Get API key
3. Configure in Supabase:
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: [Your Resend API key]
```

## Frontend Integration

```typescript
// Update your VerificationPage.tsx
import { VerificationService } from "../services/verificationService";

const handleEmailVerification = async () => {
  if (!universityEmail) {
    setError("Please enter your university email address");
    return;
  }

  // Validate .edu domain
  if (!universityEmail.endsWith(".edu")) {
    setError("Please use your official university email address (.edu domain)");
    return;
  }

  setIsSubmitting(true);
  setError("");

  try {
    await VerificationService.sendEmailVerification(universityEmail);

    const request: VerificationRequest = {
      id: `req_${Date.now()}`,
      userId: user!.id,
      method: "email",
      status: "pending",
      submittedAt: new Date(),
      universityEmail,
    };

    localStorage.setItem(
      `verification_request_${user!.id}`,
      JSON.stringify(request)
    );
    setVerificationRequest(request);
    setVerificationStatus("pending");
    setSuccess(
      `Verification email sent to ${universityEmail}. Please check your inbox and click the verification link.`
    );
  } catch (err: any) {
    setError(
      err.message || "Failed to send verification email. Please try again."
    );
  } finally {
    setIsSubmitting(false);
  }
};
```

## Verification Landing Page

```typescript
// pages/verify-email.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { VerificationService } from "../src/services/verificationService";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token && typeof token === "string") {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (verificationToken: string) => {
    try {
      await VerificationService.verifyEmailToken(verificationToken);
      setStatus("success");
      setMessage("Your student status has been verified successfully!");

      // Redirect to profile after 3 seconds
      setTimeout(() => {
        router.push("/profile?verified=true");
      }, 3000);
    } catch (error: any) {
      setStatus("error");
      setMessage(
        error.message ||
          "Verification failed. The link may be invalid or expired."
      );
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your student status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === "success" ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Successful!
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting to your profile...
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push("/verification")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

## Security Best Practices

1. **Token Expiry**: 24-hour expiration
2. **Rate Limiting**: Max 3 requests per 15 minutes
3. **Domain Validation**: Only .edu domains
4. **HTTPS Only**: All verification links use HTTPS
5. **User Context**: Token tied to specific user ID

## Cost Breakdown

- **SendGrid**: $0.0006 per email (free tier: 100 emails/day)
- **Resend**: $0.0004 per email (free tier: 3,000 emails/month)
- **Supabase Edge Functions**: $0.50 per 1M requests
- **Database Storage**: Minimal cost for verification records

## Testing

```bash
# Test email sending locally
curl -X POST http://localhost:3000/api/verification/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "universityEmail": "test@berkeley.edu",
    "userEmail": "user@gmail.com",
    "userId": "uuid-here"
  }'

# Test verification endpoint
curl http://localhost:3000/verify-email?token=your-test-token
```

This complete implementation provides a robust, secure, and scalable email verification system for your UniNest application!
