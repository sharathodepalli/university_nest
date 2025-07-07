-- Test Email Verification Setup
-- Run this in your Supabase SQL Editor to test email sending

-- First, create the verification_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL CHECK (method IN ('email', 'document', 'admin')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')),
    university_email VARCHAR(255),
    verification_token UUID DEFAULT gen_random_uuid(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT
);

-- Add RLS policies
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification requests" ON verification_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification requests" ON verification_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add verified column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Create function to complete email verification
CREATE OR REPLACE FUNCTION complete_email_verification(
  request_id UUID,
  user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update verification request
  UPDATE verification_requests 
  SET 
    status = 'verified',
    reviewed_at = NOW()
  WHERE id = request_id;
  
  -- Update user profile
  UPDATE profiles 
  SET 
    verified = true,
    verified_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Test query to see if table was created
SELECT 'verification_requests table created successfully' as status;
