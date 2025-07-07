# Privacy Settings Troubleshooting Guide

## 🔍 How to Test Privacy Settings

### Step 1: Understanding When Privacy Settings Apply

**Important:** Privacy settings only affect what **other users** see, not what you see on your own profile.

- ✅ **Your own profile**: You always see your own email/phone (even when privacy is on)
- ✅ **Other users viewing your profile**: They see "Email/Phone hidden by privacy settings" when you turn privacy off
- ✅ **Listing detail pages**: Host's contact info respects host's privacy settings

### Step 2: Quick Test Setup

1. **Open browser console** (F12 → Console tab)
2. **Run test setup**:
   ```javascript
   testPrivacy();
   ```
3. **Check your current settings**:
   ```javascript
   debugCurrentUserPrivacy();
   ```

### Step 3: Testing Privacy Controls

#### Test Your Own Privacy Settings:

1. Go to **Profile → Privacy Settings**
2. **Turn OFF** "Show Email Address" and "Show Phone Number"
3. **Save** settings
4. Go to another browser/incognito window
5. View a listing where you are the host
6. Click "Contact Info" - your email/phone should show as hidden

#### Test Messaging Privacy:

1. Set "Allow Messages" to "Verified users only"
2. Have an unverified user try to message you
3. The message button should be disabled with explanation

### Step 4: Detailed Testing

Run these commands in browser console:

```javascript
// Set up test scenarios
testPrivacy();

// Test specific privacy scenario
testPrivacyRealTime("currentUserId", "hostUserId", false); // false = unverified

// Validate all privacy combinations
validatePrivacyImplementation();

// Check current page privacy enforcement
checkCurrentPagePrivacy();
```

## 🎯 What Should Happen

### Profile Page (Your Own):

- **Email**: Always visible to you, even with privacy off
- **Phone**: Always visible to you, even with privacy off
- **Other users**: See "hidden by privacy settings" when your privacy is off

### Listing Detail Page:

- **Host email**: Hidden if host turned off email privacy
- **Host phone**: Hidden if host turned off phone privacy
- **Message button**: Disabled if host only allows verified users and you're unverified

### Contact Modal:

- Shows appropriate privacy messages
- Explains why messaging is disabled
- Respects host's privacy settings, not viewer's

## 🐛 Common Issues

### "I don't see privacy working":

- **Check**: Are you looking at your own profile? Privacy doesn't affect what you see of yourself
- **Check**: Are you testing with the same user account? Use different browsers/accounts

### "Email/phone still showing":

- **Check**: Clear browser cache and localStorage
- **Check**: Make sure you saved privacy settings properly
- **Check**: Are you the host? Hosts always see their own contact info

### "Message button still works":

- **Check**: Are you verified? Verified users can message "verified only" hosts
- **Check**: Are you the listing owner? Owners can't message themselves

## 🔧 Reset Privacy Settings

If things seem broken, reset everything:

```javascript
// Clear all privacy settings
Object.keys(localStorage).forEach((key) => {
  if (key.startsWith("privacy_settings_")) {
    localStorage.removeItem(key);
  }
});

// Reload page
location.reload();
```

## 📋 Quick Checklist

- [ ] Privacy settings save properly (check console for errors)
- [ ] Your own profile always shows your contact info to you
- [ ] Other users see "hidden by privacy settings" when viewing your profile
- [ ] Listing contact modals respect host's privacy settings
- [ ] Message buttons are disabled appropriately
- [ ] Clear explanations are shown for disabled features

## 💡 Pro Tips

1. **Use incognito/private browsing** to test as different users
2. **Check browser console** for privacy-related logs
3. **Test both verified and unverified user scenarios**
4. **Remember**: Privacy affects what others see, not what you see of yourself
