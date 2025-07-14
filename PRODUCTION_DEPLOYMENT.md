# Production Deployment Security Guide

## 🚨 CRITICAL SECURITY STEPS BEFORE DEPLOYMENT

### 1. Environment Variables Setup

**⚠️ IMPORTANT:** The `.env` file contains hardcoded API keys and should NOT be deployed to production.

#### Required Environment Variables for Production:

Set these in your deployment platform (Vercel, Netlify, etc.):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key

# Email Service
SENDGRID_API_KEY=your_production_sendgrid_key
VITE_FROM_EMAIL=your_production_email@yourdomain.com

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_production_google_maps_key

# App Configuration
VITE_APP_NAME=UniNest
VITE_SUPPORT_EMAIL=support@yourdomain.com
VITE_APP_URL=https://yourdomain.com
VITE_ENVIRONMENT=production
```

### 2. Remove Sensitive Files

Before deploying, ensure these files are in `.gitignore` and not committed:

- `.env` (contains development secrets)
- Any local database files
- Development certificates

### 3. API Key Security

- **Supabase Keys**: Use separate production project with proper RLS policies
- **Google Maps API**: Restrict to your production domain
- **SendGrid API**: Use separate production API key

### 4. Security Checklist

- [ ] All API keys moved to environment variables
- [ ] Production Supabase project configured with RLS
- [ ] Google Maps API restricted to production domain
- [ ] Email service configured for production domain
- [ ] Error tracking configured (remove console.logs)
- [ ] HTTPS enforced
- [ ] Content Security Policy configured

### 5. Performance Optimizations

- [ ] Build optimization enabled (`npm run build`)
- [ ] PWA service worker configured
- [ ] Image optimization enabled
- [ ] CDN configured for static assets

### 6. Database Security

Ensure your Supabase production database has:

- Row Level Security (RLS) enabled on all tables
- Proper authentication policies
- No test data in production
- Regular backups configured

## Deployment Commands

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## Environment-Specific Notes

### Development (.env)

- Contains development API keys
- Points to development Supabase instance
- localhost URLs for testing

### Production (Platform Environment Variables)

- Must use production API keys
- Points to production Supabase instance
- Production URLs and domains

## Post-Deployment Verification

1. Test user registration and login
2. Verify address autocomplete functionality
3. Test image uploads
4. Check email notifications
5. Verify PWA installation
6. Test offline functionality

## Security Monitoring

- Monitor API usage for abuse
- Set up error tracking (Sentry, etc.)
- Regular security audits
- Monitor authentication attempts
