# Quick Deployment Guide - UniNest Email Verification

## 🚀 Deploy to Production (5 Steps)

### Step 1: Database Migration

```bash
# Navigate to your project
cd /path/to/your/project

# Apply the verification system migration
supabase db push
```

### Step 2: Deploy Edge Functions

```bash
# Deploy the new verification functions
supabase functions deploy send-verification-email-v2
supabase functions deploy verify-email-token

# Optional: Remove the old function
supabase functions delete send-verification-email
```

### Step 3: Set Environment Variables

In your Supabase dashboard → Project Settings → Edge Functions:

```bash
SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key
FROM_EMAIL=verify@yourdomain.com
APP_URL=https://yourdomain.com
```

### Step 4: Verify Frontend Build

```bash
# Test the build
npm run build

# Preview the build
npm run preview
```

### Step 5: Test Complete Flow

1. Visit `/verification` page
2. Enter a university email (ending in .edu)
3. Check email for verification link
4. Click verification link
5. Confirm user is marked as verified

## 🧪 Testing Commands

### Test Local Development

```bash
# Start local development
npm run dev

# Test verification flow at:
# http://localhost:3000/verification
```

### Test Edge Functions Locally

```bash
# Start Supabase local
supabase start

# Test functions at:
# http://localhost:54321/functions/v1/send-verification-email-v2
# http://localhost:54321/functions/v1/verify-email-token
```

### Test Database Migration

```bash
# Check migration status
supabase db status

# View migration history
supabase migration list
```

## ✅ Success Indicators

### Database

- [ ] `email_verifications` table exists
- [ ] RLS policies are active
- [ ] Triggers are functioning

### Edge Functions

- [ ] `send-verification-email-v2` deployed
- [ ] `verify-email-token` deployed
- [ ] Environment variables set

### Frontend

- [ ] No localStorage verification code
- [ ] Uses verification service
- [ ] Error-free build

### End-to-End

- [ ] Email sends successfully
- [ ] Verification link works
- [ ] User profile updates
- [ ] Verified badge appears

## 🔧 Troubleshooting

### Email Not Sending

1. Check SendGrid API key
2. Verify sender email is authenticated
3. Check Supabase function logs

### Verification Fails

1. Check token expiration (24 hours)
2. Verify database RPC functions
3. Check network connectivity

### Build Errors

1. Run `npm install` to update dependencies
2. Check TypeScript errors
3. Verify all imports are correct

## 📊 Monitoring

After deployment, monitor:

- Supabase function logs
- SendGrid delivery stats
- User verification completion rates
- Error rates in application logs

Your email verification system is now production-ready! 🎉
