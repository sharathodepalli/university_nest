// Check what email verification tables exist in the database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xiqcdrjwfovlvppokicw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcWNkcmp3Zm92bHZwcG9raWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDY4NTIsImV4cCI6MjA2NzEyMjg1Mn0.cz64A8qVgGIO-20u8vpFBPRb2RNziJegwsI_1cTw6Wo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking what email verification tables exist...');
  
  // Try email_verifications
  try {
    const { data, error } = await supabase
      .from('email_verifications')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ email_verifications table error:', error.message);
    } else {
      console.log('✅ email_verifications table exists! Sample data:', data);
    }
  } catch (err) {
    console.log('❌ email_verifications error:', err.message);
  }
  
  // Try email_verification_tokens
  try {
    const { data, error } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ email_verification_tokens table error:', error.message);
    } else {
      console.log('✅ email_verification_tokens table exists! Sample data:', data);
    }
  } catch (err) {
    console.log('❌ email_verification_tokens error:', err.message);
  }
}

checkTables();
