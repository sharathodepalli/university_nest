# 🧪 Email Verification Testing Guide

## Overview

This guide provides step-by-step instructions to test the complete email verification system for UniNest.

## Test Environment Setup

### 1. Environment Variables

Ensure your `.env.local` file contains:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For the Edge Function environment (in Supabase Dashboard):

```bash
SENDGRID_API_KEY=SG.your_sendgrid_api_key
FROM_EMAIL=verify@yourdomain.com
APP_URL=https://your-app-domain.com
```

### 2. Deploy Edge Function

```bash
supabase functions deploy send-verification-email
```

## Testing Scenarios

### Scenario 1: Valid University Email Verification

**Steps:**

1. Navigate to `/verification` page
2. Select "Email Verification" method
3. Enter a valid .edu email (e.g., `test@stanford.edu`)
4. Click "Send Verification Email"

**Expected Results:**

- ✅ Success message: "Verification email sent to [email]"
- ✅ Email received in inbox within 1-2 minutes
- ✅ Email contains UniNest branding and verification button
- ✅ Console shows: "Verification email sent successfully via Edge Function"

**Verification:**

```javascript
// Check browser console for:
console.log(
  "✅ Verification email sent successfully via Edge Function:",
  result
);
```

### Scenario 2: Invalid Email Formats

**Test Cases:**

```javascript
// Test invalid formats
"invalid-email"; // → "Please enter a valid email address"
"test@gmail.com"; // → "Please use your official university email address (.edu domain)"
"test@yahoo.edu"; // → "Please use a valid university email address"
""; // → "Please enter your university email address"
```

**Expected Results:**

- ❌ Appropriate error messages for each case
- ❌ No API calls made for invalid formats

### Scenario 3: Email Link Verification

**Steps:**

1. Complete Scenario 1 to receive email
2. Click "Verify Email Address" button in email
3. Should redirect to `/verify-email?token=xxx`

**Expected Results:**

- ✅ Loading spinner appears
- ✅ After 2 seconds: "Email Verified!" success page
- ✅ Green checkmark icon displayed
- ✅ "Continue to UniNest" button available

### Scenario 4: Resend Verification Email

**Steps:**

1. Complete Scenario 1 (don't verify yet)
2. Go back to `/verification` page
3. Should show "Pending" status
4. Click "Resend Email" button

**Expected Results:**

- ✅ New verification email sent
- ✅ Success message: "Verification email resent successfully!"
- ✅ Console shows successful Edge Function call

### Scenario 5: Edge Function Error Handling

**Test Cases:**

**Missing SendGrid API Key:**

```bash
# Remove SENDGRID_API_KEY from Edge Function environment
# Test should return: "SendGrid API key not configured"
```

**Invalid API Key:**

```bash
# Set invalid SENDGRID_API_KEY
# Test should return: "SendGrid API error: 401"
```

**Network Issues:**

```javascript
// Simulate by blocking network requests in DevTools
// Should show: "Failed to send verification email"
```

## Manual Testing Checklist

### Frontend Tests

- [ ] Page loads without errors
- [ ] Email input validation works
- [ ] Submit button shows loading state
- [ ] Success/error messages display properly
- [ ] Resend functionality works
- [ ] Navigation works correctly

### Email Tests

- [ ] Email arrives in inbox (check spam folder)
- [ ] Subject line: "Verify Your UniNest Student Email"
- [ ] From name: "UniNest Verification"
- [ ] HTML formatting looks good
- [ ] Verification link is clickable
- [ ] Email contains user's name if available

### Edge Function Tests

- [ ] Function deploys successfully
- [ ] Returns 200 status for valid requests
- [ ] Returns 400 for missing fields
- [ ] Returns 500 for server errors
- [ ] CORS headers included in all responses
- [ ] Environment variables accessible

### Integration Tests

- [ ] Frontend → Edge Function communication works
- [ ] Edge Function → SendGrid API works
- [ ] SendGrid → Email delivery works
- [ ] Email link → Verification page works
- [ ] Token verification simulation works

## Automated Testing Scripts

### Test Edge Function Directly

```bash
#!/bin/bash
# test-edge-function.sh

SUPABASE_URL="your_supabase_url"
ANON_KEY="your_anon_key"

curl -X POST "${SUPABASE_URL}/functions/v1/send-verification-email" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@stanford.edu",
    "verificationToken": "test-token-123",
    "studentName": "Test Student"
  }' \
  -w "\nStatus Code: %{http_code}\n"
```

### Test Frontend API Call

```javascript
// Add to browser console on /verification page
async function testEdgeFunction() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/send-verification-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        email: "test@university.edu",
        verificationToken: "test-123",
        studentName: "Test User",
      }),
    }
  );

  const result = await response.json();
  console.log("Response:", result);
  console.log("Status:", response.status);
}

// Run the test
testEdgeFunction();
```

## Production Testing

### Before Going Live

1. **Test with real university emails**
2. **Verify sender domain authentication in SendGrid**
3. **Test email deliverability across providers** (Gmail, Outlook, etc.)
4. **Load test the Edge Function** with multiple concurrent requests
5. **Monitor function logs** for any errors

### Post-Deployment Monitoring

```bash
# Watch logs in real-time
supabase functions logs send-verification-email --follow

# Check function metrics
supabase functions list
```

## Troubleshooting Guide

### Common Issues

**Email Not Received:**

- Check spam/junk folders
- Verify SendGrid sender authentication
- Check SendGrid activity logs

**Edge Function Errors:**

- Verify environment variables are set
- Check function deployment status
- Review function logs for specific errors

**Frontend Errors:**

- Ensure Supabase URL/key are correct
- Check browser console for network errors
- Verify CORS is working

### Debug Commands

```bash
# Check function deployment
supabase functions list

# View function logs
supabase functions logs send-verification-email

# Test SendGrid API directly
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"verify@yourdomain.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'
```

## Success Criteria

The email verification system is working correctly when:

- ✅ Users can request verification emails
- ✅ Emails are delivered within 2 minutes
- ✅ Email formatting is professional and branded
- ✅ Verification links work correctly
- ✅ Error handling provides clear feedback
- ✅ System handles edge cases gracefully
- ✅ Logs show successful operations
- ✅ No security vulnerabilities present

## Next Steps

Once testing is complete:

1. Set up monitoring and alerts
2. Configure rate limiting if needed
3. Add email analytics tracking
4. Implement proper token expiration handling
5. Add admin verification tools for document-based verification

Happy testing! 🚀
