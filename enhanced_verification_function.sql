-- Enhanced verification function with duplicate email prevention
-- Run this AFTER the fix_verification_issues.sql

DROP FUNCTION IF EXISTS verify_email_token(TEXT);

CREATE OR REPLACE FUNCTION verify_email_token(token_input TEXT)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  user_id UUID,
  email VARCHAR(255)
) AS $$
DECLARE
  verification_record RECORD;
  existing_user_id UUID;
BEGIN
  -- Clean up expired tokens first
  PERFORM cleanup_expired_verifications();
  
  -- Find the verification record
  SELECT * INTO verification_record
  FROM public.email_verifications 
  WHERE token::TEXT = token_input::TEXT
    AND status = 'pending'
    AND expires_at > NOW();
  
  -- Check if token exists and is valid
  IF verification_record IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invalid or expired verification token'::TEXT, NULL::UUID, NULL::VARCHAR(255);
    RETURN;
  END IF;
  
  -- Check if this email is already verified by another user
  SELECT id INTO existing_user_id
  FROM public.profiles 
  WHERE student_email = verification_record.email 
    AND student_verified = TRUE
    AND id != verification_record.user_id;
  
  IF existing_user_id IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'This email address is already verified by another user'::TEXT, NULL::UUID, NULL::VARCHAR(255);
    RETURN;
  END IF;
  
  -- Update verification record
  UPDATE public.email_verifications 
  SET 
    status = 'verified',
    verified_at = NOW(),
    updated_at = NOW()
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
  RETURN QUERY SELECT TRUE, 'Email verified successfully'::TEXT, verification_record.user_id, verification_record.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION verify_email_token(TEXT) TO authenticated;

SELECT 'Enhanced verification function with duplicate prevention updated!' as status;
