-- Add Student Verification Columns to Existing Database
-- Run this in your Supabase SQL Editor to add verification features

-- Add student verification columns to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS student_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS student_email VARCHAR(255);

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified' 
CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_method VARCHAR(20);

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Add unique constraint to prevent duplicate student emails
-- Drop constraint if it exists to avoid errors
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_student_email;
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_student_email 
UNIQUE (student_email);

-- Update the verification function to check for existing emails
-- First drop the existing function to avoid return type conflicts
DROP FUNCTION IF EXISTS verify_email_token(TEXT);

CREATE OR REPLACE FUNCTION verify_email_token(token TEXT)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  user_id UUID,
  verified_email VARCHAR(255)
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  verification_record RECORD;
  existing_user_id UUID;
BEGIN
  -- Get verification record
  SELECT * INTO verification_record
  FROM public.email_verifications ev
  WHERE ev.token::TEXT = verify_email_token.token
    AND ev.status = 'pending'
    AND ev.expires_at > NOW();
  
  -- Check if verification record exists
  IF verification_record IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invalid or expired token'::TEXT, NULL::UUID, NULL::VARCHAR(255);
    RETURN;
  END IF;
  
  -- Check if this email is already verified by another user
  SELECT id INTO existing_user_id
  FROM public.profiles
  WHERE student_email = verification_record.email
    AND student_verified = TRUE
    AND id != verification_record.user_id;
  
  -- If email is already verified by another user, reject this verification
  IF existing_user_id IS NOT NULL THEN
    -- Update verification status to rejected
    UPDATE public.email_verifications 
    SET 
      status = 'rejected',
      verified_at = NOW()
    WHERE id = verification_record.id;
    
    RETURN QUERY SELECT FALSE, 'This email has already been verified by another user'::TEXT, NULL::UUID, NULL::VARCHAR(255);
    RETURN;
  END IF;
  
  -- Update verification record
  UPDATE public.email_verifications 
  SET 
    status = 'verified',
    verified_at = NOW()
  WHERE id = verification_record.id;
  
  -- Update user profile
  UPDATE public.profiles 
  SET 
    student_verified = TRUE,
    student_email = verification_record.email,
    verification_status = 'verified',
    verification_method = 'email',
    verified_at = NOW()
  WHERE id = verification_record.user_id;
  
  -- Return success
  RETURN QUERY SELECT TRUE, 'Email verified successfully'::TEXT, verification_record.user_id, verification_record.email::VARCHAR(255);
END;
$$;

SELECT 'Student verification columns and constraints added successfully! ✅' as status;
