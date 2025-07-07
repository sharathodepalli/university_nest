# SendGrid Production Setup Guide

This guide walks you through setting up SendGrid for production email delivery in the UniNest email verification system.

## Prerequisites

1. SendGrid Account (free tier available)
2. Verified Sender Identity in SendGrid
3. API Key with Mail Send permissions

## Step 1: Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com/) and sign up for a free account
2. Complete email verification and account setup
3. Navigate to the SendGrid dashboard

## Step 2: Verify Sender Identity

### Option A: Single Sender Verification (Easiest)

1. Go to **Settings** > **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your sender details:
   - **From Name**: `UniNest`
   - **From Email**: `noreply@yourdomain.com` (use your actual domain)
   - **Reply To**: `support@yourdomain.com`
   - **Company**: `UniNest`
   - **Address**: Your company address
4. Click **Create** and verify the email sent to your address

### Option B: Domain Authentication (Recommended for Production)

1. Go to **Settings** > **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow the DNS configuration steps for your domain
4. Wait for domain verification (can take up to 48 hours)

## Step 3: Create API Key

1. Go to **Settings** > **API Keys**
2. Click **Create API Key**
3. Choose **Restricted Access**
4. Give it a name: `UniNest Production`
5. Under **Mail Send**, enable **Mail Send** permission
6. Click **Create & View**
7. **IMPORTANT**: Copy the API key immediately (you won't see it again)

## Step 4: Configure Environment Variables

### For Vite Frontend (.env.local)

```env
# SendGrid Configuration
VITE_SENDGRID_API_KEY=SG.your_api_key_here
VITE_FROM_EMAIL=noreply@yourdomain.com
VITE_TEST_EMAIL=your-test-email@example.com
```

### For Supabase Edge Functions

In your Supabase project dashboard:

1. Go to **Settings** > **Edge Functions**
2. Add these environment variables:
   - `SENDGRID_API_KEY`: Your SendGrid API key
   - `FROM_EMAIL`: Your verified sender email
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## Step 5: Test SendGrid Configuration

### Frontend Test

```typescript
import SendGridService from "./src/lib/sendgridService";

// Test SendGrid connection
const testResult = await SendGridService.testConnection();
console.log("SendGrid test result:", testResult);
```

### Manual API Test

```bash
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "personalizations": [
      {
        "to": [{"email": "test@example.com"}],
        "subject": "Test Email"
      }
    ],
    "from": {"email": "noreply@yourdomain.com"},
    "content": [
      {
        "type": "text/plain",
        "value": "Test email from SendGrid"
      }
    ]
  }'
```

## Step 6: Deploy Edge Function

```bash
# Deploy the SendGrid email function
npx supabase functions deploy send-verification-email-sendgrid

# Test the deployed function
npx supabase functions invoke send-verification-email-sendgrid \
  --data '{
    "email": "test@university.edu",
    "verificationToken": "test-token-123",
    "baseUrl": "https://yourdomain.com"
  }'
```

## Step 7: Update Frontend Configuration

Ensure your production build includes the correct environment variables:

```bash
# Build with production env vars
npm run build

# Deploy to your hosting provider (Vercel, Netlify, etc.)
```

## Step 8: Monitoring and Analytics

1. **SendGrid Dashboard**: Monitor email delivery stats
2. **Activity Feed**: Track email opens, clicks, bounces
3. **Alerts**: Set up alerts for delivery issues
4. **Reputation**: Monitor sender reputation

## Troubleshooting

### Common Issues

1. **API Key Invalid**

   - Verify the API key is correct
   - Check API key permissions include Mail Send
   - Ensure no extra spaces in environment variables

2. **Sender Not Verified**

   - Complete single sender verification
   - Check spam folder for verification email
   - Try domain authentication instead

3. **Emails Not Delivering**

   - Check SendGrid Activity Feed
   - Verify recipient email addresses
   - Check for bounces or spam reports

4. **Rate Limits**
   - Free tier: 100 emails/day
   - Check your SendGrid plan limits
   - Upgrade if needed

### Testing Commands

```bash
# Test environment variables
echo $VITE_SENDGRID_API_KEY

# Test edge function locally
npx supabase functions serve

# Test with curl
curl -X POST http://localhost:54321/functions/v1/send-verification-email-sendgrid \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@university.edu",
    "verificationToken": "test-123",
    "baseUrl": "http://localhost:5173"
  }'
```

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Monitor usage** for suspicious activity
5. **Use HTTPS** for all email links
6. **Implement rate limiting** on verification requests

## Production Checklist

- [ ] SendGrid account created and verified
- [ ] Sender identity verified (single sender or domain)
- [ ] API key created with Mail Send permissions
- [ ] Environment variables configured
- [ ] Edge function deployed
- [ ] Test emails sent successfully
- [ ] Monitoring and alerts configured
- [ ] SSL/HTTPS enabled for verification links
- [ ] Rate limiting implemented
- [ ] Error handling tested

## Support

- **SendGrid Documentation**: https://docs.sendgrid.com/
- **SendGrid Support**: Available in dashboard
- **API Reference**: https://docs.sendgrid.com/api-reference/mail-send/mail-send
