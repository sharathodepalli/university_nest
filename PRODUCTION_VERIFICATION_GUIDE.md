# Production Verification System Implementation Guide

## Overview

UniNest uses a **two-stage email system** which is the industry standard for university applications:

1. **Registration Email**: Any email (Gmail, Yahoo, personal) for account access
2. **Verification Email**: University .edu email for student status confirmation

This approach provides **maximum accessibility** while ensuring **verified student status**.

## Why This Approach?

### ✅ Benefits

- **User-friendly**: Students can use their preferred email for daily access
- **Flexible**: Works even if university email is delayed/unavailable
- **Secure**: Separates account access from verification status
- **Industry Standard**: Used by LinkedIn, GitHub Student, Spotify Student, etc.

### 🏫 Real-World Use Cases

- Student registers with `john.doe@gmail.com` during orientation week
- University email `john.doe@berkeley.edu` activates 2 weeks later
- Student can use the app immediately, gets verified when ready

## Production Implementation Requirements

### 1. Backend Database Schema

```sql
-- Add verification system tables
CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL CHECK (method IN ('email', 'document', 'admin')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')),
    university_email VARCHAR(255),
    documents TEXT[], -- Array of document URLs
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id),
    rejection_reason TEXT,
    admin_notes TEXT
);

-- Add verification status to profiles
ALTER TABLE profiles ADD COLUMN verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN verification_method VARCHAR(20);

-- Indexes for performance
CREATE INDEX idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_profiles_verified ON profiles(verified);
```

### 2. Email Verification Service

```typescript
// Email verification service
import { createTransport } from "nodemailer";

export class EmailVerificationService {
  private transporter = createTransport({
    // Configure with your email provider (SendGrid, AWS SES, etc.)
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendVerificationEmail(
    userEmail: string,
    universityEmail: string,
    token: string
  ) {
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: universityEmail,
      subject: "Verify Your Student Status - UniNest",
      html: `
        <h2>Verify Your Student Status</h2>
        <p>Click the link below to verify your student status for your UniNest account (${userEmail}):</p>
        <a href="${verificationUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Verify Student Status
        </a>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
      `,
    });
  }
}
```

### 3. API Endpoints

```typescript
// Verification API endpoints
import { supabase } from "./supabase";
import { EmailVerificationService } from "./email-service";

const emailService = new EmailVerificationService();

// Submit email verification request
export async function submitEmailVerification(req: Request, res: Response) {
  const { userId, universityEmail } = req.body;

  // Validate .edu domain
  if (!universityEmail.endsWith(".edu")) {
    return res.status(400).json({ error: "University email required" });
  }

  // Generate verification token
  const token = crypto.randomUUID();

  // Save verification request
  const { data, error } = await supabase.from("verification_requests").insert({
    user_id: userId,
    method: "email",
    status: "pending",
    university_email: universityEmail,
    verification_token: token,
  });

  if (error) throw error;

  // Send verification email
  await emailService.sendVerificationEmail(
    req.user.email,
    universityEmail,
    token
  );

  res.json({ success: true });
}

// Verify email token
export async function verifyEmailToken(req: Request, res: Response) {
  const { token } = req.query;

  // Find and validate token
  const { data: request, error } = await supabase
    .from("verification_requests")
    .select("*")
    .eq("verification_token", token)
    .eq("status", "pending")
    .gte("submitted_at", new Date(Date.now() - 24 * 60 * 60 * 1000)) // 24 hours
    .single();

  if (error || !request) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  // Update verification status
  await supabase.transaction(async (tx) => {
    // Mark request as verified
    await tx
      .from("verification_requests")
      .update({
        status: "verified",
        reviewed_at: new Date(),
      })
      .eq("id", request.id);

    // Update user profile
    await tx
      .from("profiles")
      .update({
        verified: true,
        verified_at: new Date(),
        verification_method: "email",
      })
      .eq("id", request.user_id);
  });

  res.redirect(`${process.env.APP_URL}/verification?success=true`);
}
```

### 4. Document Verification System

```typescript
// Document upload and review system
import multer from "multer";
import AWS from "aws-sdk";

const s3 = new AWS.S3();
const upload = multer({ memory: true });

export async function uploadVerificationDocuments(req: Request, res: Response) {
  upload.array("documents", 3)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const files = req.files as Express.Multer.File[];
    const documentUrls: string[] = [];

    // Upload files to S3
    for (const file of files) {
      const key = `verification/${req.user.id}/${Date.now()}-${
        file.originalname
      }`;
      await s3
        .upload({
          Bucket: process.env.S3_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
        .promise();

      documentUrls.push(
        `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`
      );
    }

    // Save verification request
    await supabase.from("verification_requests").insert({
      user_id: req.user.id,
      method: "document",
      status: "pending",
      documents: documentUrls,
    });

    res.json({ success: true });
  });
}
```

### 5. Admin Review Interface

```typescript
// Admin dashboard for document review
export function AdminVerificationDashboard() {
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const approveRequest = async (requestId: string) => {
    await supabase.rpc("approve_verification", { request_id: requestId });
    fetchPendingRequests();
  };

  const rejectRequest = async (requestId: string, reason: string) => {
    await supabase.rpc("reject_verification", {
      request_id: requestId,
      rejection_reason: reason,
    });
    fetchPendingRequests();
  };

  return (
    <div className="admin-dashboard">
      <h2>Pending Verification Requests</h2>
      {pendingRequests.map((request) => (
        <VerificationRequestCard
          key={request.id}
          request={request}
          onApprove={() => approveRequest(request.id)}
          onReject={(reason) => rejectRequest(request.id, reason)}
        />
      ))}
    </div>
  );
}
```

### 6. Security Considerations

#### Rate Limiting

```typescript
// Prevent abuse
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 verification attempts per window
  message: "Too many verification attempts",
});

app.use("/api/verification", rateLimiter);
```

#### Domain Validation

```typescript
// Enhanced domain validation
const VALID_EDU_DOMAINS = new Set([
  // Load from database or config
  "berkeley.edu",
  "stanford.edu",
  "mit.edu", // ... etc
]);

const SUSPICIOUS_DOMAINS = new Set([
  "tempmail.edu",
  "fakeedu.edu", // Block known fake domains
]);

function validateUniversityDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();

  if (!domain?.endsWith(".edu")) return false;
  if (SUSPICIOUS_DOMAINS.has(domain)) return false;

  // Additional checks for valid .edu format
  return domain.split(".").length >= 2;
}
```

### 7. Monitoring and Analytics

```typescript
// Track verification metrics
export async function trackVerificationMetrics() {
  const metrics = await supabase.from("verification_requests").select(`
      method,
      status,
      submitted_at,
      reviewed_at
    `);

  // Send to analytics service
  analytics.track("verification_request_submitted", {
    method: "email",
    success_rate: calculateSuccessRate(metrics),
    avg_processing_time: calculateAvgTime(metrics),
  });
}
```

## Environment Variables Required

```env
# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
FROM_EMAIL=noreply@uninest.com

# Storage
S3_BUCKET=uninest-verification-docs
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# App
APP_URL=https://uninest.com
VERIFICATION_TOKEN_EXPIRY=24h
```

## Deployment Checklist

- [ ] Database schema updated
- [ ] Email service configured
- [ ] File storage setup (S3/CloudFlare R2)
- [ ] Admin review interface deployed
- [ ] Rate limiting configured
- [ ] Monitoring setup
- [ ] Legal compliance (FERPA for student data)
- [ ] Backup verification method (phone/SMS)

## Cost Estimates

- **Email**: ~$0.001 per verification email
- **Storage**: ~$0.02 per GB for documents
- **Admin Review**: ~2-5 minutes per document review
- **Total**: ~$0.10-0.50 per verification request

## Success Metrics

- **Email Verification**: 85-95% success rate
- **Document Review**: 1-2 day turnaround
- **User Satisfaction**: >90% completion rate
- **False Positives**: <1% incorrect verifications

This production implementation provides a robust, scalable, and user-friendly verification system that maintains security while maximizing accessibility for students.
