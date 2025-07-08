# ⚙️ Set Environment Variables in Supabase Dashboard

## Required Environment Variables for Edge Function

Go to: https://supabase.com/dashboard/project/xiqcdrjwfovlvppokicw/functions

1. Click on "send-verification-email" function
2. Go to "Settings" tab
3. Add these environment variables:

### Required Variables:

```
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
FROM_EMAIL=sharathodepalli@gmail.com
APP_URL=http://localhost:3000
```

### For Production:

```
APP_URL=https://your-production-domain.com
```

## After Setting Variables:

The function should work immediately. Test by trying the email verification again in your app.

## Troubleshooting:

- Make sure all 3 variables are set correctly
- Check that SendGrid API key has "Mail Send" permissions
- Verify the FROM_EMAIL is verified in SendGrid
