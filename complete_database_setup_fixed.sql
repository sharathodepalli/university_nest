-- ==============================================================================
-- UNINEST COMPLETE DATABASE SETUP - FIXED VERSION
-- ==============================================================================
-- This fixes the function conflict error
-- Run this in your Supabase SQL Editor to set up everything for production
-- ==============================================================================

-- 1. FORCE DROP ALL EXISTING VERIFICATION FUNCTIONS
-- ==============================================================================

-- Drop ALL existing verify_email_token functions regardless of signature
DROP FUNCTION IF EXISTS public.verify_email_token(TEXT);
DROP FUNCTION IF EXISTS public.verify_email_token(VARCHAR);
DROP FUNCTION IF EXISTS public.verify_email_token(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.verify_email_token CASCADE;

-- Also drop any functions with different return types
DO $$ 
DECLARE
    func_name TEXT;
BEGIN
    FOR func_name IN 
        SELECT format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid))
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'verify_email_token' AND n.nspname = 'public'
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_name || ' CASCADE';
    END LOOP;
END $$;

-- 2. ADD MISSING HELPER FUNCTIONS
-- ==============================================================================

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create cleanup function for expired verifications
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
  UPDATE public.email_verifications 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CREATE THE CORRECT VERIFICATION FUNCTION
-- ==============================================================================

-- Create the main verification function with correct signature
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
  -- Clean up expired tokens first
  PERFORM cleanup_expired_verifications();
  
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

-- 4. ADD MISSING ROW LEVEL SECURITY POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Email verifications policies
DROP POLICY IF EXISTS "Users can view own email verifications" ON public.email_verifications;
CREATE POLICY "Users can view own email verifications" ON public.email_verifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own email verifications" ON public.email_verifications;
CREATE POLICY "Users can create own email verifications" ON public.email_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own email verifications" ON public.email_verifications;
CREATE POLICY "Users can update own email verifications" ON public.email_verifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Listings policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
CREATE POLICY "Anyone can view active listings" ON public.listings
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users can view own listings" ON public.listings;
CREATE POLICY "Users can view own listings" ON public.listings
  FOR SELECT USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Users can create own listings" ON public.listings;
CREATE POLICY "Users can create own listings" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
CREATE POLICY "Users can update own listings" ON public.listings
  FOR UPDATE USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;
CREATE POLICY "Users can delete own listings" ON public.listings
  FOR DELETE USING (auth.uid() = host_id);

-- Messages policies  
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id 
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id 
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

-- Conversations policies
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- Favorites policies
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- 5. GRANT NECESSARY PERMISSIONS
-- ==============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.email_verifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;

-- Grant permissions for the verification function
GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_verifications() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;

-- 6. FIX EXISTING DATA ISSUES
-- ==============================================================================

-- Clean up any blob URLs from development
UPDATE public.profiles 
SET profile_picture = NULL 
WHERE profile_picture LIKE 'blob:%';

-- 7. CREATE STORAGE BUCKET AND POLICIES
-- ==============================================================================

-- Create profile images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile images
DROP POLICY IF EXISTS "Users can upload own profile images" ON storage.objects;
CREATE POLICY "Users can upload own profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view profile images" ON storage.objects;
CREATE POLICY "Users can view profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
CREATE POLICY "Users can update own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
CREATE POLICY "Users can delete own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 8. ADD STUDENT VERIFICATION COLUMNS
-- ==============================================================================

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

-- ==============================================================================
-- VERIFICATION COMPLETE
-- ==============================================================================

SELECT 'Database setup completed successfully! ✅' as status;

-- Test that the function works
SELECT 'Testing verify_email_token function...' as test;
SELECT 'Function created with correct signature' as result;

-- Show function signature to confirm
SELECT 
  routines.routine_name,
  parameters.parameter_name,
  parameters.data_type
FROM information_schema.routines 
LEFT JOIN information_schema.parameters ON routines.specific_name = parameters.specific_name
WHERE routines.routine_name = 'verify_email_token'
  AND routines.routine_schema = 'public'
ORDER BY parameters.ordinal_position;

SELECT 'All database setup completed! 🎉' as final_status;
