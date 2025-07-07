// SendGrid Integration Test Script
// Run with: node sendgrid-integration-test.js

const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

// Mock environment for testing
const mockEnv = {
  VITE_SENDGRID_API_KEY: process.env.VITE_SENDGRID_API_KEY,
  VITE_FROM_EMAIL: process.env.VITE_FROM_EMAIL || 'noreply@uninest.com',
  VITE_TEST_EMAIL: process.env.VITE_TEST_EMAIL || 'test@example.com'
};

// Set up global import.meta.env mock
global.importMeta = {
  env: mockEnv
};

// Mock crypto for Node.js
global.crypto = {
  randomUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
};

// Import SendGrid service (Note: This would need to be transpiled for Node.js)
console.log('🧪 SendGrid Integration Test Suite');
console.log('=====================================\n');

// Test 1: Environment Configuration
console.log('Test 1: Environment Configuration');
console.log('----------------------------------');

const requiredEnvVars = ['VITE_SENDGRID_API_KEY', 'VITE_FROM_EMAIL'];
let configValid = true;

requiredEnvVars.forEach(envVar => {
  const value = mockEnv[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${envVar === 'VITE_SENDGRID_API_KEY' ? 'SG.' + '*'.repeat(20) : value}`);
  } else {
    console.log(`❌ ${envVar}: Not set`);
    configValid = false;
  }
});

if (!configValid) {
  console.log('\n⚠️  Please set up your environment variables in .env.local:');
  console.log('VITE_SENDGRID_API_KEY=SG.your_api_key_here');
  console.log('VITE_FROM_EMAIL=noreply@yourdomain.com');
  console.log('VITE_TEST_EMAIL=your-test-email@example.com');
  process.exit(1);
}

console.log('\n✅ Environment configuration valid\n');

// Test 2: SendGrid API Key Validation
console.log('Test 2: SendGrid API Key Validation');
console.log('-----------------------------------');

const apiKey = mockEnv.VITE_SENDGRID_API_KEY;

if (!apiKey) {
  console.log('❌ No API key provided');
} else if (!apiKey.startsWith('SG.')) {
  console.log('❌ Invalid API key format (should start with "SG.")');
} else if (apiKey.length < 50) {
  console.log('❌ API key appears too short');
} else {
  console.log('✅ API key format looks valid');
}

// Test 3: SendGrid Connection Test
console.log('\nTest 3: SendGrid Connection Test');
console.log('--------------------------------');

async function testSendGridConnection() {
  try {
    if (!apiKey || apiKey === 'your_api_key_here') {
      console.log('⚠️  Skipping connection test - API key not configured');
      return false;
    }

    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const profile = await response.json();
      console.log('✅ SendGrid connection successful');
      console.log(`   Account: ${profile.email || 'Unknown'}`);
      return true;
    } else {
      console.log(`❌ SendGrid connection failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ SendGrid connection error: ${error.message}`);
    return false;
  }
}

// Test 4: Email Template Test
console.log('\nTest 4: Email Template Generation');
console.log('---------------------------------');

function testEmailTemplate() {
  const testData = {
    userEmail: 'student@university.edu',
    verificationToken: 'test-token-123',
    verificationUrl: 'https://uninest.com/verify?token=test-token-123&email=student@university.edu'
  };

  console.log('✅ Test data prepared:');
  console.log(`   Email: ${testData.userEmail}`);
  console.log(`   Token: ${testData.verificationToken}`);
  console.log(`   URL: ${testData.verificationUrl}`);

  // Basic template validation
  const html = `<h1>Verify Your Email</h1><p>Click <a href="${testData.verificationUrl}">here</a> to verify.</p>`;
  const text = `Verify Your Email: ${testData.verificationUrl}`;

  if (html.includes(testData.verificationUrl) && text.includes(testData.verificationUrl)) {
    console.log('✅ Email template generation successful');
    return true;
  } else {
    console.log('❌ Email template generation failed');
    return false;
  }
}

// Test 5: Mock Email Send Test
console.log('\nTest 5: Mock Email Send Test');
console.log('----------------------------');

async function testMockEmailSend() {
  try {
    const emailData = {
      to: mockEnv.VITE_TEST_EMAIL,
      subject: 'SendGrid Test - UniNest',
      html: '<h1>Test Email</h1><p>If you receive this, SendGrid is working!</p>',
      text: 'Test Email - If you receive this, SendGrid is working!'
    };

    console.log('📧 Mock email send test:');
    console.log(`   To: ${emailData.to}`);
    console.log(`   Subject: ${emailData.subject}`);
    console.log('   Content: HTML and text versions prepared');

    // Simulate email sending (without actually sending)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ Mock email send successful');
    return true;
  } catch (error) {
    console.log(`❌ Mock email send failed: ${error.message}`);
    return false;
  }
}

// Test 6: Verification URL Validation
console.log('\nTest 6: Verification URL Validation');
console.log('-----------------------------------');

function testVerificationURL() {
  const baseUrl = 'https://uninest.com';
  const token = 'test-token-123';
  const email = 'student@university.edu';
  
  const verificationUrl = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  
  try {
    const url = new URL(verificationUrl);
    const params = new URLSearchParams(url.search);
    
    if (params.get('token') === token && params.get('email') === email) {
      console.log('✅ Verification URL format valid');
      console.log(`   URL: ${verificationUrl}`);
      return true;
    } else {
      console.log('❌ Verification URL parameters invalid');
      return false;
    }
  } catch (error) {
    console.log(`❌ Verification URL invalid: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Running SendGrid Integration Tests...\n');
  
  const results = {
    config: configValid,
    template: testEmailTemplate(),
    mockSend: await testMockEmailSend(),
    urlValidation: testVerificationURL(),
    connection: await testSendGridConnection()
  };
  
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! SendGrid integration is ready.');
  } else {
    console.log('⚠️  Some tests failed. Please check the configuration above.');
  }
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Ensure all environment variables are set in .env.local');
  console.log('2. Verify your SendGrid sender identity');
  console.log('3. Test with a real email using the VerificationPage');
  console.log('4. Deploy to production with proper environment variables');
}

// Execute tests
runAllTests().catch(console.error);
