# Manual QA Test Plan for Critical Bug Fixes

## Test Suite 1: Email Verification Bypass Fix

### Test Case 1.1: New User Registration

**Objective**: Verify that new users are NOT marked as verified before clicking verification link

**Steps**:

1. Open application in incognito browser
2. Navigate to registration page
3. Fill out registration form with .edu email
4. Submit registration
5. **Check database/profile**: User should have `verified: false`, `student_verified: false`, `verification_status: 'unverified'`
6. Check email inbox for verification email
7. **BEFORE clicking link**: Refresh page, check profile still shows unverified
8. Click verification link in email
9. **After clicking link**: User should now be marked verified

**Expected Results**:

- ❌ **Before fix**: User was marked verified immediately after registration
- ✅ **After fix**: User is only marked verified after clicking email link

**Critical Checkpoints**:

- [ ] Database shows `verified: false` immediately after registration
- [ ] Profile page shows "Email not verified" badge initially
- [ ] Only after clicking link: verification status changes to verified

### Test Case 1.2: Cross-Device Verification

**Objective**: Verify that verification works across different devices

**Steps**:

1. Register on Device A (laptop)
2. Receive verification email
3. Open verification link on Device B (phone)
4. Return to Device A and refresh
5. Check if verification status is updated

**Expected Results**:

- ✅ Verification should work regardless of which device clicks the link
- ✅ All devices should show updated verification status after refresh

### Test Case 1.3: Expired/Invalid Token Handling

**Objective**: Verify proper handling of invalid verification scenarios

**Steps**:

1. Register new account
2. Get verification email
3. Manually modify the token in the URL
4. Try to verify with invalid token
5. Also test with expired token (if possible)

**Expected Results**:

- ❌ Invalid/expired tokens should show error message
- ❌ User should remain unverified
- ✅ User can request new verification email

---

## Test Suite 2: Tab-Switch Loading Glitch Fix

### Test Case 2.1: Profile Page Tab Switch

**Objective**: Verify Profile page loads correctly after tab switch

**Steps**:

1. Login to application
2. Navigate to Profile page
3. Wait for page to fully load
4. Switch to another browser tab for 30+ seconds
5. Switch back to application tab
6. Observe loading behavior

**Expected Results**:

- ❌ **Before fix**: Page stuck on "Loading..." indefinitely
- ✅ **After fix**: Page loads normally or refreshes data automatically

### Test Case 2.2: Messages Page Tab Switch

**Objective**: Verify Messages page loads correctly after tab switch

**Steps**:

1. Login and navigate to Messages page
2. Wait for conversations to load
3. Switch to another tab for 30+ seconds
4. Switch back to application
5. Observe loading behavior and conversation display

**Expected Results**:

- ✅ Messages should load without requiring page refresh
- ✅ New messages received while tab was inactive should appear

### Test Case 2.3: Favorites Page Tab Switch

**Objective**: Verify Favorites page loads correctly after tab switch

**Steps**:

1. Add some listings to favorites
2. Navigate to Favorites page
3. Wait for favorites to load
4. Switch away from tab for 30+ seconds
5. Return to tab and observe behavior

**Expected Results**:

- ✅ Favorites should display without infinite loading
- ✅ Any changes made while tab was inactive should be reflected

### Test Case 2.4: Extended Inactivity Test

**Objective**: Test behavior after very long periods of inactivity

**Steps**:

1. Login and navigate to any main page
2. Leave tab inactive for 10+ minutes
3. Return to tab
4. Try to navigate to different pages
5. Check if user session is still valid

**Expected Results**:

- ✅ Page should recover gracefully from long inactivity
- ✅ Loading states should have timeout protection (max 10 seconds)
- ✅ If session expired, user should be redirected to login

---

## Test Suite 3: Integration & Performance Tests

### Test Case 3.1: Combined Scenario Test

**Objective**: Test both fixes working together

**Steps**:

1. Register new account (verification test)
2. Switch tabs during registration process
3. Complete email verification from different tab
4. Return to original tab and navigate between pages
5. Verify everything works smoothly

**Expected Results**:

- ✅ Email verification works correctly
- ✅ Tab switching doesn't break any functionality
- ✅ User experience is smooth throughout

### Test Case 3.2: Network Interruption Test

**Objective**: Test robustness under poor network conditions

**Steps**:

1. Login to application
2. Navigate to Messages page
3. Disable network for 30 seconds
4. Re-enable network
5. Switch tabs and return
6. Observe recovery behavior

**Expected Results**:

- ✅ Application should recover gracefully from network interruption
- ✅ Loading states should not get stuck
- ✅ Data should refresh when network returns

### Test Case 3.3: Cache Clearance Test

**Objective**: Verify cache handling improvements

**Steps**:

1. Use application normally for several minutes
2. Check browser developer tools > Application > Local Storage
3. Look for any `uninest_verification_` keys
4. Switch tabs multiple times
5. Observe if stale cache entries are cleaned up

**Expected Results**:

- ✅ Old cache entries should be automatically cleaned up
- ✅ Cache timestamps should be reasonable (< 5 minutes for active use)
- ✅ No corrupted cache entries should remain

---

## Performance Benchmarks

### Before Fix Metrics (Expected Issues):

- 🐌 **Tab Switch Recovery Time**: 30+ seconds or infinite loading
- 🚨 **Email Verification Bypass Rate**: 100% (all users marked verified immediately)
- 📊 **User Completion Rate**: Low due to loading issues

### After Fix Metrics (Target Goals):

- ⚡ **Tab Switch Recovery Time**: < 3 seconds
- 🔒 **Email Verification Bypass Rate**: 0% (proper verification flow)
- 📈 **User Completion Rate**: Improved user experience

---

## Browser Compatibility Testing

Test on multiple browsers and devices:

- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop & Mobile)
- [ ] Edge (Desktop)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

---

## Deployment Verification

After deploying fixes:

1. **Smoke Test**: Register test account and verify basic functionality
2. **Monitor Logs**: Check for any new errors in browser console or server logs
3. **User Feedback**: Monitor support channels for any reported issues
4. **Analytics**: Track user completion rates and session durations

---

## Rollback Plan

If issues are discovered after deployment:

1. **Immediate**: Revert to previous stable commit
2. **Analyze**: Review error logs and user reports
3. **Fix**: Address any new issues found
4. **Re-test**: Run full test suite again
5. **Re-deploy**: Deploy updated fixes

---

## Success Criteria

✅ **Email Verification Fix Successful When**:

- New users are NOT automatically marked as verified
- Email verification only happens after clicking link
- Verification works across devices and browsers

✅ **Tab-Switch Fix Successful When**:

- No infinite loading states after tab switches
- Data refreshes properly when tab becomes active
- Loading states have timeout protection

✅ **Overall Success When**:

- User registration completion rate improves
- Support tickets about loading issues decrease
- User session duration increases
