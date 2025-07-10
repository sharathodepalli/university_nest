-- COMPREHENSIVE VERIFICATION SYSTEM FIX
-- Run this ENTIRE script in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: RESET ALL VERIFICATION DATA (SECURITY FIX)
-- ============================================================================

-- Check current state
SELECT 'BEFORE FIX - Current verification state:' as status;
SELECT 
  name,
  email,
  verified as legacy_verified,
  student_verified,
  verification_status,
  student_email
FROM public.profiles 
ORDER BY name;

-- Reset ALL verifications to ensure clean state
UPDATE public.profiles 
SET 
  verified = FALSE,
  student_verified = FALSE,
  student_email = NULL,
  verification_status = 'unverified',
  verification_method = NULL,
  verified_at = NULL;

-- Clear all email verification records
DELETE FROM public.email_verifications;

-- ============================================================================
-- STEP 2: FIX DATABASE DEFAULTS
-- ============================================================================

-- Ensure correct defaults for new users
ALTER TABLE public.profiles 
ALTER COLUMN verified SET DEFAULT FALSE,
ALTER COLUMN student_verified SET DEFAULT FALSE,
ALTER COLUMN verification_status SET DEFAULT 'unverified';

-- ============================================================================
-- STEP 3: CREATE PROPER VERIFICATION FUNCTION
-- ============================================================================

-- Drop any existing verification functions
DROP FUNCTION IF EXISTS public.verify_email_token(TEXT);
DROP FUNCTION IF EXISTS public.verify_email_token(VARCHAR);

-- Create the correct verification function
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
    verified = TRUE,
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO anon;

-- ============================================================================
-- STEP 4: CREATE SECURE SYNC TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_verification_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if student_verified changes and we have valid data
  IF NEW.student_verified IS DISTINCT FROM OLD.student_verified THEN
    -- Only set legacy verified if student_verified is TRUE AND we have student_email
    IF NEW.student_verified = TRUE AND NEW.student_email IS NOT NULL THEN
      NEW.verified = TRUE;
    ELSE
      NEW.verified = FALSE;
    END IF;
  END IF;
  
  -- If student_verified is FALSE, reset everything
  IF NEW.student_verified = FALSE THEN
    NEW.verified = FALSE;
    NEW.verification_status = 'unverified';
    NEW.verification_method = NULL;
    NEW.verified_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS sync_verification_trigger ON public.profiles;
CREATE TRIGGER sync_verification_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_verification_fields();

-- ============================================================================
-- STEP 5: VERIFY FIX WORKED
-- ============================================================================

SELECT 'AFTER FIX - All users reset to unverified:' as status;
SELECT 
  name,
  email,
  verified as legacy_verified,
  student_verified,
  verification_status,
  student_email
FROM public.profiles 
ORDER BY name;

-- Test function exists
SELECT 'verify_email_token function created successfully! ✅' as function_status;

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

SELECT 'COMPREHENSIVE VERIFICATION FIX COMPLETED ✅' as final_status;
