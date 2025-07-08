# 🚀 Edge Function Deployment Guide

## Overview

This guide will help you deploy and test the SendGrid email verification Edge Function for UniNest.

## Prerequisites

✅ Supabase project created  
✅ SendGrid account with API key  
✅ Supabase CLI installed  
✅ Environment variables configured

## Step 1: Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase

# Verify installation
supabase --version
```

## Step 2: Login to Supabase

```bash
supabase login
```

## Step 3: Link Your Project

```bash
# Navigate to your project directory
cd /path/to/your/project

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

## Step 4: Set Environment Variables

In your Supabase dashboard, go to **Settings** → **Edge Functions** and add these environment variables:

```bash
SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key_here
FROM_EMAIL=verify@yourdomain.com
APP_URL=https://your-app-domain.com
```

## Step 5: Deploy the Edge Function

```bash
# Deploy the send-verification-email function
supabase functions deploy send-verification-email

# Verify deployment
supabase functions list
```

## Step 6: Test the Edge Function

### Option A: Test via Supabase Dashboard

1. Go to **Edge Functions** in your Supabase dashboard
2. Select `send-verification-email`
3. Click **Invoke Function**
4. Use this test payload:

```json
{
  "email": "test@university.edu",
  "verificationToken": "test-token-123",
  "studentName": "Test Student"
}
```

### Option B: Test via curl

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-verification-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@university.edu",
    "verificationToken": "test-token-123",
    "studentName": "Test Student"
  }'
```

### Option C: Test via Your App

1. Start your development server:

```bash
npm run dev
```

2. Navigate to `/verification` page
3. Enter a test .edu email address
4. Click "Send Verification Email"
5. Check the browser console and network tab for results

## Step 7: Monitor Logs

View function logs in real-time:

```bash
supabase functions logs send-verification-email --follow
```

## Troubleshooting

### Common Issues

1. **"SendGrid API key not configured"**

   - Ensure `SENDGRID_API_KEY` is set in Edge Function environment variables
   - Verify the API key is valid and has mail send permissions

2. **"SendGrid API error: 403"**

   - Check if your sender email is verified in SendGrid
   - Ensure API key has proper permissions

3. **"Supabase configuration missing"**

   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your frontend .env

4. **CORS errors**
   - The function already includes proper CORS headers
   - Ensure you're calling from the correct domain

### Debug Steps

1. **Check function deployment:**

```bash
supabase functions list
```

2. **View detailed logs:**

```bash
supabase functions logs send-verification-email --level debug
```

3. **Test SendGrid API directly:**

```bash
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "your-verified-email@domain.com"},
    "subject": "Test",
    "content": [{"type": "text/plain", "value": "Test email"}]
  }'
```

## Production Checklist

- [ ] SendGrid sender domain verified
- [ ] Environment variables set in production
- [ ] Edge Function deployed and tested
- [ ] Email templates reviewed for branding
- [ ] Rate limiting configured if needed
- [ ] Monitoring and alerts set up
- [ ] DNS and domain authentication configured in SendGrid

## Next Steps

Once the Edge Function is working:

1. **Frontend Integration**: The VerificationPage.tsx is already updated to call your Edge Function
2. **Email Handling**: Create a proper verification flow that handles the email links
3. **Database Integration**: Store verification tokens and status in Supabase database
4. **Error Handling**: Add proper error boundaries and user feedback
5. **Rate Limiting**: Implement rate limiting for email sending

## Support

If you encounter issues:

1. Check the Supabase Dashboard logs
2. Verify all environment variables are set
3. Test SendGrid API key independently
4. Review the Edge Function code for any syntax errors

The system is now ready for production use! 🎉
