// Privacy Testing Utility
// This file helps you test privacy settings functionality

export const testPrivacyScenarios = () => {
  console.log("=== PRIVACY SETTINGS TEST SCENARIOS ===");
  
  // Simulate different user privacy settings
  const testUsers = [
    { id: "host1", name: "Alice (Host)", verified: true },
    { id: "user1", name: "Bob (Verified User)", verified: true },
    { id: "user2", name: "Charlie (Unverified User)", verified: false }
  ];

  // Test Scenario 1: Host with strict privacy (only verified messages, no contact info)
  const strictHostSettings = {
    profileVisibility: 'university',
    showEmail: false,
    showPhone: false,
    allowMessages: 'verified',
    showOnline: true,
    dataSharing: false,
    marketingEmails: false,
    pushNotifications: true,
  };

  // Test Scenario 2: Host with open privacy (everyone can message, show contact info)
  const openHostSettings = {
    profileVisibility: 'public',
    showEmail: true,
    showPhone: true,
    allowMessages: 'everyone',
    showOnline: true,
    dataSharing: false,
    marketingEmails: false,
    pushNotifications: true,
  };

  // Test Scenario 3: Host with no messaging (contact info visible but no messages)
  const noMessageHostSettings = {
    profileVisibility: 'university',
    showEmail: true,
    showPhone: true,
    allowMessages: 'none',
    showOnline: false,
    dataSharing: false,
    marketingEmails: false,
    pushNotifications: true,
  };

  // Save test settings to localStorage
  localStorage.setItem('privacy_settings_host1', JSON.stringify(strictHostSettings));
  localStorage.setItem('privacy_settings_user1', JSON.stringify(openHostSettings));
  localStorage.setItem('privacy_settings_user2', JSON.stringify(noMessageHostSettings));

  console.log("✅ Test privacy settings saved to localStorage");
  console.log("\n🧪 TEST SCENARIOS CREATED:");
  console.log("\n1. STRICT HOST (host1):");
  console.log("   - Email: HIDDEN");
  console.log("   - Phone: HIDDEN");
  console.log("   - Messages: VERIFIED USERS ONLY");
  console.log("   - Test: Verified user should be able to message, unverified should not");

  console.log("\n2. OPEN HOST (user1):");
  console.log("   - Email: VISIBLE");
  console.log("   - Phone: VISIBLE");
  console.log("   - Messages: EVERYONE");
  console.log("   - Test: Everyone should see contact info and can message");

  console.log("\n3. NO MESSAGE HOST (user2):");
  console.log("   - Email: VISIBLE");
  console.log("   - Phone: VISIBLE");
  console.log("   - Messages: DISABLED");
  console.log("   - Test: Contact info visible but messaging disabled for everyone");

  console.log("\n📋 HOW TO TEST:");
  console.log("1. Create listings with these different host IDs");
  console.log("2. View listing details and click 'Contact Info'");
  console.log("3. Try messaging hosts with different verification statuses");
  console.log("4. Check that privacy settings are respected");

  return { testUsers, strictHostSettings, openHostSettings, noMessageHostSettings };
};

// Test function to check message permissions
export const testMessagePermission = (senderVerified: boolean, hostId: string) => {
  const settings = JSON.parse(localStorage.getItem(`privacy_settings_${hostId}`) || '{}');
  
  switch (settings.allowMessages) {
    case 'everyone':
      return { canMessage: true, reason: 'Host accepts messages from everyone' };
    case 'verified':
      return { 
        canMessage: senderVerified, 
        reason: senderVerified ? 'Verified user can message' : 'Host only accepts verified users' 
      };
    case 'none':
      return { canMessage: false, reason: 'Host has disabled messaging' };
    default:
      return { canMessage: false, reason: 'Unknown messaging preference' };
  }
};

// Test function to check contact info visibility
export const testContactVisibility = (hostId: string) => {
  const settings = JSON.parse(localStorage.getItem(`privacy_settings_${hostId}`) || '{}');
  
  return {
    emailVisible: settings.showEmail || false,
    phoneVisible: settings.showPhone || false,
    emailMessage: settings.showEmail ? 'Email will be shown' : 'Email hidden by privacy settings',
    phoneMessage: settings.showPhone ? 'Phone will be shown' : 'Phone hidden by privacy settings'
  };
};

// New debugging functions
export const debugCurrentUserPrivacy = () => {
  console.log("\n=== DEBUGGING CURRENT USER'S PRIVACY SETTINGS ===");
  
  // Try to find current user's ID from various sources
  const possibleUserIds: string[] = [];
  
  // Check localStorage for common patterns
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('privacy_settings_')) {
      const userId = key.replace('privacy_settings_', '');
      possibleUserIds.push(userId);
    }
  });

  console.log("📱 Found privacy settings for user IDs:", possibleUserIds);
  
  possibleUserIds.forEach(userId => {
    const settings = JSON.parse(localStorage.getItem(`privacy_settings_${userId}`) || '{}');
    console.log(`\n👤 User ${userId} privacy settings:`, settings);
    console.log(`   📧 Email visible: ${settings.showEmail ? 'YES' : 'NO'}`);
    console.log(`   📞 Phone visible: ${settings.showPhone ? 'YES' : 'NO'}`);
    console.log(`   💬 Messages allowed: ${settings.allowMessages || 'default'}`);
  });

  return possibleUserIds;
};

export const testPrivacyRealTime = (currentUserId: string, viewingUserId: string, isViewerVerified: boolean = false) => {
  console.log(`\n=== REAL-TIME PRIVACY TEST ===`);
  console.log(`👁️  Current user: ${currentUserId}`);
  console.log(`👀 Viewing user: ${viewingUserId}`);
  console.log(`✓ Viewer verified: ${isViewerVerified}`);
  
  const contactVisibility = testContactVisibility(viewingUserId);
  const messagePermission = testMessagePermission(isViewerVerified, viewingUserId);
  
  console.log(`\n📧 Email visibility:`, contactVisibility.emailVisible ? "VISIBLE" : "HIDDEN");
  console.log(`📞 Phone visibility:`, contactVisibility.phoneVisible ? "VISIBLE" : "HIDDEN");
  console.log(`💬 Can message:`, messagePermission.canMessage ? "YES" : "NO");
  console.log(`💭 Reason:`, messagePermission.reason);
  
  return {
    emailVisible: contactVisibility.emailVisible,
    phoneVisible: contactVisibility.phoneVisible,
    canMessage: messagePermission.canMessage,
    reason: messagePermission.reason
  };
};

export const validatePrivacyImplementation = () => {
  console.log("\n=== PRIVACY IMPLEMENTATION VALIDATION ===");
  
  // Test all combinations
  const testCases = [
    { viewerId: 'user1', isVerified: true, hostId: 'host1', description: 'Verified user viewing strict host' },
    { viewerId: 'user2', isVerified: false, hostId: 'host1', description: 'Unverified user viewing strict host' },
    { viewerId: 'user1', isVerified: true, hostId: 'user1', description: 'User viewing open host' },
    { viewerId: 'user2', isVerified: false, hostId: 'user2', description: 'User viewing no-message host' },
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n🧪 Test ${index + 1}: ${testCase.description}`);
    testPrivacyRealTime(testCase.viewerId, testCase.hostId, testCase.isVerified);
  });
};

// Check if privacy settings are working on current page
export const checkCurrentPagePrivacy = () => {
  console.log("\n=== CURRENT PAGE PRIVACY CHECK ===");
  
  // Check if we're on a profile or listing page
  const currentUrl = window.location.pathname;
  console.log(`📍 Current page: ${currentUrl}`);
  
  if (currentUrl.includes('/profile')) {
    console.log("📄 On profile page - privacy should affect:");
    console.log("   - Email display (based on user's own settings)");
    console.log("   - Phone display (based on user's own settings)");
    console.log("   - Contact info section should show 'hidden by privacy settings' when turned off");
  } else if (currentUrl.includes('/listing/')) {
    console.log("📄 On listing detail page - privacy should affect:");
    console.log("   - Host contact info in Contact Modal");
    console.log("   - Message button availability");
    console.log("   - Host email/phone visibility based on host's settings");
  }
  
  // Check DOM elements
  const emailElements = document.querySelectorAll('[class*="Mail"], [class*="email"]');
  const phoneElements = document.querySelectorAll('[class*="Phone"], [class*="phone"]');
  const hiddenElements = document.querySelectorAll('*[class*="gray-500"]:contains("hidden")');
  
  console.log(`📧 Found ${emailElements.length} email-related elements`);
  console.log(`📞 Found ${phoneElements.length} phone-related elements`);
  console.log(`🙈 Found ${hiddenElements.length} potentially hidden elements`);
  
  return {
    currentUrl,
    emailElements: emailElements.length,
    phoneElements: phoneElements.length,
    hiddenElements: hiddenElements.length
  };
};

// Run in browser console to test
if (typeof window !== 'undefined') {
  (window as any).testPrivacy = testPrivacyScenarios;
  (window as any).testMessagePermission = testMessagePermission;
  (window as any).testContactVisibility = testContactVisibility;
  (window as any).debugCurrentUserPrivacy = debugCurrentUserPrivacy;
  (window as any).testPrivacyRealTime = testPrivacyRealTime;
  (window as any).validatePrivacyImplementation = validatePrivacyImplementation;
  (window as any).checkCurrentPagePrivacy = checkCurrentPagePrivacy;
  console.log("🔧 Privacy testing utilities loaded!");
  console.log("🚀 Available functions:");
  console.log("   - testPrivacy() - Set up test scenarios");
  console.log("   - debugCurrentUserPrivacy() - Check current user's settings");
  console.log("   - testPrivacyRealTime(currentUserId, viewingUserId, isVerified) - Test specific scenario");
  console.log("   - validatePrivacyImplementation() - Run all test cases");
  console.log("   - checkCurrentPagePrivacy() - Analyze current page");
}
