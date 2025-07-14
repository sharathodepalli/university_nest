#!/bin/bash

# Deploy Office 365 SMTP Edge Function to Supabase
# Run this script to deploy the updated email function

echo "🚀 Deploying Office 365 SMTP Email Function to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Deploy the function
echo "📦 Deploying send-verification-email-v2 function..."
supabase functions deploy send-verification-email-v2

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Add these environment variables to your Supabase project:"
    echo "   - SMTP_HOST=smtp.office365.com"
    echo "   - SMTP_PORT=587"
    echo "   - SMTP_USER=noreply@uninest.us"
    echo "   - SMTP_PASS=your_office365_password"
    echo "   - APP_URL=https://www.uninest.us"
    echo ""
    echo "2. Set these via Supabase Dashboard:"
    echo "   Project Settings > Edge Functions > Environment Variables"
    echo ""
    echo "🎉 Office 365 SMTP is now ready for production!"
else
    echo "❌ Deployment failed. Please check your Supabase configuration."
    exit 1
fi
