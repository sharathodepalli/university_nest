-- Debug User Verification Status
-- Run this in your Supabase SQL Editor to check current verification status

-- Check the specific user's verification status
SELECT 
  id,
  name,
  email,
  verified as legacy_verified,
  student_verified,
  student_email,
  verification_status,
  verification_method,
  verified_at,
  created_at,
  updated_at
FROM public.profiles 
WHERE id = '0fd7cc2a-59be-405d-a1ff-be22fdc4b3ce'
   OR email = 'sharathodepalli@gmail.com'
   OR name = 'sha';

-- Check if there are any verification records for this user
SELECT 
  id,
  user_id,
  email,
  status,
  token,
  created_at,
  expires_at,
  verified_at
FROM public.email_verifications 
WHERE user_id = '0fd7cc2a-59be-405d-a1ff-be22fdc4b3ce'
   OR email = 'sharathodepalli@gmail.com'
ORDER BY created_at DESC;

-- Check all users with verification status
SELECT 
  name,
  verified as legacy_verified,
  student_verified,
  verification_status,
  student_email
FROM public.profiles 
WHERE verified = TRUE OR student_verified = TRUE
ORDER BY name;
