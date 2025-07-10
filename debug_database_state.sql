-- Debug script to check current database state
-- Run this to see what's missing in your database

-- Check if verify_email_token function exists
SELECT 'Checking verify_email_token function...' as status;

SELECT 
  routines.routine_name,
  routines.routine_type,
  parameters.parameter_name,
  parameters.data_type
FROM information_schema.routines 
LEFT JOIN information_schema.parameters ON routines.specific_name = parameters.specific_name
WHERE routines.routine_name = 'verify_email_token'
  AND routines.routine_schema = 'public'
ORDER BY parameters.ordinal_position;

-- If no results above, the function doesn't exist!

-- Check if email_verifications table exists
SELECT 'Checking email_verifications table...' as status;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'email_verifications'
ORDER BY ordinal_position;

-- Check if profiles table has new verification columns
SELECT 'Checking profiles table verification columns...' as status;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('student_verified', 'student_email', 'verification_status', 'verification_method', 'verified_at')
ORDER BY ordinal_position;

-- Check if there are any verification records
SELECT 'Checking existing verification records...' as status;

SELECT COUNT(*) as total_verifications
FROM public.email_verifications;

-- Check profiles with verification data
SELECT 'Checking profiles with verification data...' as status;

SELECT 
  name,
  email,
  verified,
  student_verified,
  verification_status,
  student_email
FROM public.profiles 
WHERE student_verified = TRUE OR verification_status != 'unverified'
LIMIT 5;

SELECT 'Database state check completed!' as final_status;
