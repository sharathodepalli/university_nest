# 🔒 Security Setup Guide for UniNest

## ⚠️ IMPORTANT SECURITY NOTICE

This repository does NOT contain any API keys or secrets. All sensitive information has been removed and must be configured locally.

## 🚀 Quick Setup for Development

### 1. Clone the Repository

```bash
git clone https://github.com/sharathodepalli/university_nest.git
cd university_nest
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example file and add your real values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://xiqcdrjwfovlvppokicw.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key

# SendGrid Configuration
SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key
VITE_FROM_EMAIL=noreply@yourdomain.com

# Optional
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. Get Your Supabase Keys

1. Go to: https://supabase.com/dashboard/project/xiqcdrjwfovlvppokicw/settings/api
2. Copy the `URL` and `anon` key
3. Paste them into your `.env.local` file

### 5. Set Up SendGrid

1. Create a SendGrid account
2. Generate an API key
3. Verify your sending domain/email
4. Add the API key to your `.env.local` file

### 6. Start Development

```bash
npm run dev
```

## 🚀 Production Deployment

### For Netlify:

Set these environment variables in your Netlify dashboard:

**Required:**

- `VITE_SUPABASE_URL` = https://xiqcdrjwfovlvppokicw.supabase.co
- `VITE_SUPABASE_ANON_KEY` = your_production_anon_key
- `SENDGRID_API_KEY` = your_production_sendgrid_key
- `VITE_FROM_EMAIL` = noreply@uninest.com
- `NODE_ENV` = production

**Optional:**

- `VITE_GOOGLE_MAPS_API_KEY` = your_google_maps_key
- `VITE_APP_NAME` = UniNest
- `VITE_SUPPORT_EMAIL` = support@uninest.com

### For Supabase Edge Functions:

Set secrets for your Edge Functions:

```bash
supabase secrets set SENDGRID_API_KEY=your_actual_sendgrid_api_key
supabase secrets set FROM_EMAIL=noreply@uninest.com
```

## 🛡️ Security Best Practices

1. **Never commit .env files** - They are gitignored for security
2. **Use different keys for development and production**
3. **Regularly rotate your API keys**
4. **Keep your Supabase project dashboard secure**
5. **Monitor API usage in SendGrid and Supabase dashboards**

## 📋 Environment Variables Reference

| Variable                   | Required | Description                          |
| -------------------------- | -------- | ------------------------------------ |
| `VITE_SUPABASE_URL`        | Yes      | Your Supabase project URL            |
| `VITE_SUPABASE_ANON_KEY`   | Yes      | Your Supabase anonymous key          |
| `SENDGRID_API_KEY`         | Yes      | Your SendGrid API key for emails     |
| `VITE_FROM_EMAIL`          | Yes      | Verified sender email address        |
| `VITE_GOOGLE_MAPS_API_KEY` | No       | For address validation features      |
| `NODE_ENV`                 | No       | Environment (development/production) |

## 🆘 Need Help?

1. Check that all environment variables are set correctly
2. Verify your Supabase project is running
3. Confirm your SendGrid API key is valid
4. Ensure your sending email is verified in SendGrid

## 🔍 Verification

Test your setup:

```bash
# Check Supabase connection
npm run dev

# Check if environment variables are loaded
console.log(import.meta.env.VITE_SUPABASE_URL)
```
