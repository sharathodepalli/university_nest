-- Sync Legacy Verified Field with New Verification System
-- Run this in your Supabase SQL Editor to keep legacy field in sync

-- Update the legacy verified field to match student_verified field
UPDATE public.profiles 
SET verified = student_verified 
WHERE student_verified IS NOT NULL;

-- For future updates, we can create a trigger to keep them in sync
CREATE OR REPLACE FUNCTION sync_verification_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- When student_verified changes, update the legacy verified field
  IF NEW.student_verified IS DISTINCT FROM OLD.student_verified THEN
    NEW.verified = NEW.student_verified;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync verification fields
DROP TRIGGER IF EXISTS sync_verification_trigger ON public.profiles;
CREATE TRIGGER sync_verification_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_verification_fields();

SELECT 'Legacy verified field synced with student_verified! ✅' as status;

-- Show current verification status for all users
SELECT 
  name,
  verified as legacy_verified,
  student_verified,
  verification_status,
  student_email,
  verified_at
FROM public.profiles 
ORDER BY name;
