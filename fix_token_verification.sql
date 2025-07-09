-- Fix Token Verification Function - Final Version
-- This addresses the token lookup issue

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
BEGIN
  -- Clean up expired tokens first
  PERFORM cleanup_expired_verifications();
  
  -- Find the verification record (cast token to text for comparison)
  SELECT * INTO verification_record
  FROM public.email_verifications 
  WHERE token::TEXT = token_input::TEXT
    AND status = 'pending'
    AND expires_at > NOW();
  
  -- Debug: Log what we're looking for
  RAISE NOTICE 'Looking for token: %, Found record: %', token_input, verification_record IS NOT NULL;
  
  -- Check if token exists and is valid
  IF verification_record IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invalid or expired verification token'::TEXT, NULL::UUID, NULL::VARCHAR(255);
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

-- Test with a sample token
SELECT 'Testing function with sample token...' as test;
SELECT * FROM verify_email_token('sample-token-for-testing');
