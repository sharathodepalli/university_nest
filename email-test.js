// Test Email Sending with Supabase Auth
// Run this in your browser console on your app to test email sending

async function testEmailSending() {
  console.log('🧪 Testing email verification...');
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Test email address (use your university email)
    const testUniversityEmail = 'odepalsa@mail.uc.edu'; // Change this to your actual university email
    
    console.log(`📧 Sending test verification email to: ${testUniversityEmail}`);
    
    // Send verification email using Supabase Auth
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: testUniversityEmail,
      options: {
        data: {
          user_email: user.email,
          verification_type: 'student_verification',
          redirect_to: `${window.location.origin}/verify-email?test=true`
        }
      }
    });
    
    if (error) {
      console.error('❌ Email sending failed:', error);
      return;
    }
    
    console.log('✅ Email sent successfully!', data);
    console.log('📬 Check your university email inbox for the verification link');
    
    return data;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Also test with Supabase Edge Functions approach
async function testWithEdgeFunction() {
  console.log('🧪 Testing with Edge Function approach...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ User not authenticated');
      return;
    }
    
    // This would call your Edge Function (if you create one)
    const { data, error } = await supabase.functions.invoke('send-verification-email', {
      body: {
        userEmail: user.email,
        universityEmail: 'odepalsa@mail.uc.edu', // Change this
        userId: user.id
      }
    });
    
    if (error) {
      console.error('❌ Edge function failed:', error);
      return;
    }
    
    console.log('✅ Edge function worked!', data);
    
  } catch (error) {
    console.error('❌ Edge function test failed:', error);
  }
}

// Run the test
console.log('📧 Email Verification Test Suite');
console.log('Run: testEmailSending() or testWithEdgeFunction()');

// Uncomment the line below to run immediately
// testEmailSending();
