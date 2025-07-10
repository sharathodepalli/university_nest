-- Check current user profile verification status and fix issues
-- Run this in your Supabase SQL Editor

-- 1. Check the current profile verification status
SELECT 'Current profile verification status:' as step;
SELECT 
  id,
  name,
  email,
  student_verified,
  student_email,
  verification_status,
  verified_at
FROM public.profiles 
WHERE id = '399761a4-b6aa-4749-bdf2-781a721297db';

-- 2. Check if there are multiple users with the same email
SELECT 'Checking for duplicate email usage:' as step;
SELECT 
  student_email,
  COUNT(*) as user_count,
  array_agg(id) as user_ids
FROM public.profiles 
WHERE student_email = 'odepalsa@mail.uc.edu'
GROUP BY student_email;

-- 3. Update the profile to reflect the verification
SELECT 'Updating profile verification status:' as step;
UPDATE public.profiles 
SET 
  student_verified = TRUE,
  verification_status = 'verified',
  verification_method = 'email',
  verified_at = NOW()
WHERE id = '399761a4-b6aa-4749-bdf2-781a721297db';

-- 4. Add unique constraint to prevent duplicate emails
SELECT 'Adding unique constraint for student emails:' as step;
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_student_email 
UNIQUE (student_email);

-- 5. Verify the update
SELECT 'Updated profile status:' as step;
SELECT 
  id,
  name,
  email,
  student_verified,
  student_email,
  verification_status,
  verified_at
FROM public.profiles 
WHERE id = '399761a4-b6aa-4749-bdf2-781a721297db';
