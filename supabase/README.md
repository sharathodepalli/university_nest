# Supabase Configuration

## 📁 Directory Structure

```
supabase/
├── complete_database_setup.sql  # 🎯 THE ONLY SQL FILE YOU NEED
├── functions/                   # Edge Functions for email verification
└── supabase/                   # Supabase CLI config
```

## 🚀 Setup Instructions

### 1. Database Setup

Run `complete_database_setup.sql` in your Supabase SQL Editor. This single file contains:

- All database tables and schemas
- Row Level Security (RLS) policies
- Storage buckets and policies
- Required functions
- Proper permissions

### 2. Edge Function Secrets

Set these in Supabase Dashboard → Edge Functions → Manage secrets:

```
APP_URL = https://university-nest.vercel.app
SENDGRID_API_KEY = [your_sendgrid_api_key]
FROM_EMAIL = contact@thetrueshades.com
```

### 3. Auth Configuration

In Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://university-nest.vercel.app`
- Redirect URLs: `https://university-nest.vercel.app/**`

## ✅ That's It!

No other SQL files or setup needed. Your UniNest platform will be production-ready.
