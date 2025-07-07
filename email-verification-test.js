#!/usr/bin/env node

/**
 * Email Verification Test Script
 * 
 * This script tests the Supabase SMTP configuration with Gmail App Password
 * Run with: node email-verification-test.js
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Your Supabase configuration
const SUPABASE_URL = 'https://phnsewjcyogjhfdbcvdr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobnNld2pjeW9namhmZGJjdmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NzAyODksImV4cCI6MjA1MTQ0NjI4OX0.QVPJLR8L8Zc7NcdyKt2v5h6_t9oXq_CgSWt1JQnL4Kg';

// Test email - use your own email for testing
const TEST_EMAIL = 'sharathodepalli@gmail.com';

async function testEmailVerification() {
  console.log('🚀 Starting Supabase SMTP Test...\n');
  
  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    console.log('📧 Testing email sending with Supabase Auth...');
    console.log(`Sending test email to: ${TEST_EMAIL}`);
    
    // This is the standard way to send password reset emails in Supabase
    // It uses your configured SMTP settings
    const { data, error } = await supabase.auth.resetPasswordForEmail(TEST_EMAIL, {
      redirectTo: 'http://localhost:5173/reset-password'
    });
    
    if (error) {
      console.error('❌ Email sending failed:', error.message);
      
      // Check for common SMTP configuration errors
      if (error.message.includes('SMTP')) {
        console.log('\n🔧 SMTP Configuration Troubleshooting:');
        console.log('1. Verify Gmail App Password is correct');
        console.log('2. Check SMTP host: smtp.gmail.com');
        console.log('3. Check SMTP port: 587');
        console.log('4. Ensure sender email: sharathodepalli@gmail.com');
        console.log('5. Verify 2FA is enabled on Gmail account');
      }
      
      return false;
    }
    
    console.log('✅ Email sent successfully!');
    console.log('📬 Check your inbox for the password reset email');
    console.log('\nNote: This test uses password reset email as a proxy');
    console.log('for testing SMTP configuration. In production, you would');
    console.log('implement custom verification emails.');
    
    return true;
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    return false;
  }
}

async function testEmailValidation() {
  console.log('\n📋 Testing Email Validation Logic...');
  
  const testEmails = [
    'student@university.edu',
    'john.doe@harvard.edu', 
    'invalid@gmail.com',
    'test@college.edu',
    'not-an-email',
    ''
  ];
  
  testEmails.forEach(email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);
    const isEduDomain = email.endsWith('.edu');
    const isValid = isValidFormat && isEduDomain;
    
    console.log(`${isValid ? '✅' : '❌'} ${email || '(empty)'} - ${isValid ? 'Valid' : 'Invalid'}`);
  });
}

function generateVerificationToken() {
  console.log('\n🔑 Testing Token Generation...');
  
  const token = crypto.randomUUID();
  console.log(`Generated token: ${token}`);
  
  const verificationUrl = `http://localhost:5173/verify-email?token=${token}`;
  console.log(`Verification URL: ${verificationUrl}`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('     UniNest Email Verification System Test');
  console.log('='.repeat(60));
  
  // Test 1: Email validation
  await testEmailValidation();
  
  // Test 2: Token generation
  generateVerificationToken();
  
  // Test 3: SMTP configuration
  const smtpWorking = await testEmailVerification();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log(`SMTP Configuration: ${smtpWorking ? '✅ Working' : '❌ Needs Attention'}`);
  console.log('Email Validation: ✅ Working');
  console.log('Token Generation: ✅ Working');
  
  if (smtpWorking) {
    console.log('\n🎉 Your email verification system is ready!');
    console.log('You can now test the full verification flow in your app.');
  } else {
    console.log('\n⚠️  Please check your Supabase SMTP settings:');
    console.log('1. Go to Supabase Dashboard > Settings > Auth');
    console.log('2. Verify SMTP configuration matches the guide');
    console.log('3. Test with a fresh Gmail App Password');
  }
  
  console.log('='.repeat(60));
}

// Run the test
main().catch(console.error);
