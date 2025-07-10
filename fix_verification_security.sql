-- CRITICAL SECURITY FIX: Reset Invalid Verifications
-- Run this in your Supabase SQL Editor to fix verification security issues

-- Step 1: Check current state before fix
SELECT 'BEFORE FIX - Current verification state:' as status;
SELECT 
  name,
  email,
  verified as legacy_verified,
  student_verified,
  verification_status,
  student_email
FROM public.profiles 
WHERE verified = TRUE OR student_verified = TRUE
ORDER BY name;

-- Step 2: Reset ALL verifications to ensure clean state
UPDATE public.profiles 
SET 
  verified = FALSE,
  student_verified = FALSE,
  student_email = NULL,
  verification_status = 'unverified',
  verification_method = NULL,
  verified_at = NULL
WHERE verified = TRUE OR student_verified = TRUE;

-- Step 3: Clear all email verification records to prevent confusion
DELETE FROM public.email_verifications;

-- Step 4: Update the sync trigger to be more secure
CREATE OR REPLACE FUNCTION sync_verification_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if student_verified changes and we have a valid student_email
  IF NEW.student_verified IS DISTINCT FROM OLD.student_verified THEN
    -- Only set legacy verified to TRUE if student_verified is TRUE AND we have a student_email
    IF NEW.student_verified = TRUE AND NEW.student_email IS NOT NULL THEN
      NEW.verified = TRUE;
    ELSE
      NEW.verified = FALSE;
    END IF;
  END IF;
  
  -- If student_verified is set to FALSE, ensure everything is reset
  IF NEW.student_verified = FALSE THEN
    NEW.verified = FALSE;
    NEW.verification_status = 'unverified';
    NEW.verification_method = NULL;
    NEW.verified_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Ensure profiles table has correct defaults
ALTER TABLE public.profiles 
ALTER COLUMN verified SET DEFAULT FALSE,
ALTER COLUMN student_verified SET DEFAULT FALSE,
ALTER COLUMN verification_status SET DEFAULT 'unverified';

-- Step 6: Verify fix worked
SELECT 'AFTER FIX - All verifications reset:' as status;
SELECT 
  name,
  email,
  verified as legacy_verified,
  student_verified,
  verification_status,
  student_email
FROM public.profiles 
ORDER BY name;

SELECT 'SECURITY FIX COMPLETED ✅' as status;
SELECT 'All users must now verify their .edu emails properly' as message;
