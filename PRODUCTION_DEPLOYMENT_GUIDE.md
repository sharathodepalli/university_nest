# 🚀 UniNest Production Deployment Guide

## Overview

This guide walks you through deploying UniNest to production with proper security, monitoring, and performance optimizations.

## Prerequisites Checklist

### ✅ Database Setup

- [ ] Supabase project created and configured
- [ ] Database schema deployed via `complete_verification_fix.sql`
- [ ] Row Level Security (RLS) policies enabled
- [ ] Storage buckets configured
- [ ] Edge Functions deployed

### ✅ Environment Variables

- [ ] All production environment variables set
- [ ] Secrets stored securely (not in code)
- [ ] CORS domains configured
- [ ] SendGrid API key configured

### ✅ Domain & SSL

- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] DNS records properly set

## Deployment Platforms

### 🔵 Vercel (Recommended)

1. **Connect Repository**

   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

2. **Set Environment Variables**

   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add VITE_APP_URL
   ```

3. **Deploy**
   ```bash
   npm run build:prod
   vercel --prod
   ```

### 🟠 Netlify

1. **Connect Repository**

   - Link GitHub repository in Netlify dashboard
   - Set build command: `npm run build:prod`
   - Set publish directory: `dist`

2. **Configure Environment Variables**
   - Add all VITE\_\* variables in Netlify dashboard
   - Enable form processing if needed

### 🐳 Docker (Self-Hosted)

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:prod

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Production Configuration

### 🔐 Security Setup

1. **Database Security**

   ```sql
   -- Run in Supabase SQL Editor
   \i complete_verification_fix.sql
   ```

2. **Edge Function Secrets**

   ```bash
   # Set in Supabase Dashboard > Edge Functions > Secrets
   SENDGRID_API_KEY=your_key_here
   APP_URL=https://yourdomain.com
   ```

3. **CORS Configuration**
   ```bash
   # Add your domain to Supabase Auth settings
   # URL patterns: https://yourdomain.com/*
   ```

### 📊 Monitoring Setup

1. **Health Checks**

   ```bash
   # Test your deployment
   npm run health-check
   ```

2. **Error Monitoring**

   - Set up Sentry or similar service
   - Configure error reporting in ProductionErrorBoundary

3. **Performance Monitoring**
   - Enable Web Vitals tracking
   - Set up uptime monitoring

### 🚀 Performance Optimization

1. **Build Optimization**

   ```bash
   # Use production build configuration
   npm run build:prod

   # Analyze bundle size
   npm run build:analyze
   ```

2. **CDN Configuration**
   - Enable Vercel/Netlify CDN
   - Configure proper cache headers
   - Optimize image delivery

## Post-Deployment Checklist

### ✅ Functional Testing

- [ ] User registration works
- [ ] Email verification works
- [ ] Login/logout functionality
- [ ] Listing creation and viewing
- [ ] Messaging system
- [ ] File uploads
- [ ] PWA installation

### ✅ Performance Testing

- [ ] Page load times < 3 seconds
- [ ] Lighthouse score > 90
- [ ] Mobile responsiveness
- [ ] Offline functionality

### ✅ Security Testing

- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No exposed API keys
- [ ] CORS properly configured
- [ ] XSS protection active

### ✅ SEO & Analytics

- [ ] Meta tags configured
- [ ] Sitemap generated
- [ ] Google Analytics setup
- [ ] Search Console configured

## Maintenance

### 🔄 Regular Updates

```bash
# Update dependencies monthly
npm update
npm audit fix

# Test in staging first
npm run build:prod
npm run health-check
```

### 📈 Monitoring

- Monitor error rates
- Track performance metrics
- Review security logs
- Update SSL certificates

### 🔄 Backup Strategy

- Database backups (Supabase handles this)
- Configuration backups
- Environment variable documentation

## Troubleshooting

### Common Issues

1. **White Screen on Deploy**

   - Check console for JavaScript errors
   - Verify environment variables
   - Check build logs

2. **Verification Emails Not Sending**

   - Check SendGrid configuration
   - Verify Edge Function logs
   - Test SMTP settings

3. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check CORS settings
   - Review RLS policies

### Debug Commands

```bash
# Check build
npm run build:prod

# Test locally
npm run preview

# Check health
npm run health-check

# View logs
vercel logs --prod
```

## Support

For production support:

1. Check Supabase dashboard for errors
2. Review deployment platform logs
3. Monitor error boundary reports
4. Check health check results

---

**🎉 Your UniNest application is now production-ready!**
