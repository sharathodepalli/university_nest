-- Fix Email Verification Function v2
-- Run this in your Supabase SQL Editor to fix the parameter name issue

-- Drop existing function
DROP FUNCTION IF EXISTS public.verify_email_token(TEXT);

-- Create the correct verification function with parameter name that matches Supabase's expectation
CREATE OR REPLACE FUNCTION public.verify_email_token(token_input TEXT)
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
  WHERE ev.token::TEXT = token_input
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
  
  -- Update user profile with new verification fields
  UPDATE public.profiles 
  SET 
    verified = TRUE,           -- Update legacy field
    student_verified = TRUE,   -- Update new field
    student_email = verification_record.email,
    verification_status = 'verified',
    verification_method = 'email',
    verified_at = NOW()
  WHERE id = verification_record.user_id;
  
  -- Return success
  RETURN QUERY SELECT TRUE, 'Email verified successfully'::TEXT, verification_record.user_id, verification_record.email::VARCHAR(255);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO anon;

-- Test the function exists
SELECT 'verify_email_token function created successfully with token_input parameter! ✅' as status;

-- Show function signature
SELECT 
  routines.routine_name,
  parameters.parameter_name,
  parameters.data_type
FROM information_schema.routines 
LEFT JOIN information_schema.parameters ON routines.specific_name = parameters.specific_name
WHERE routines.routine_name = 'verify_email_token'
  AND routines.routine_schema = 'public'
ORDER BY parameters.ordinal_position;
