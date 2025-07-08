-- Create email verification system tables for production
-- This migration creates a robust verification system with proper indexes and policies

-- Enable RLS (Row Level Security) only if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    RAISE EXCEPTION 'profiles table does not exist. Please run the initial schema migration first.';
  END IF;

  -- Enable RLS on profiles if not already enabled
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace) THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create email_verifications table
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  verification_type VARCHAR(50) NOT NULL DEFAULT 'student_email',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'verified', 'expired', 'failed')),
  CONSTRAINT valid_verification_type CHECK (verification_type IN ('student_email', 'email_change', 'account_verification')),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON public.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON public.email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_status ON public.email_verifications(status);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON public.email_verifications(expires_at);

-- Add student verification fields to profiles table if they don't exist
DO $$ 
BEGIN
  -- Add student_verified column
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN student_verified BOOLEAN DEFAULT FALSE;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  -- Add student_email column
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN student_email VARCHAR(255);
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  -- Add verification_status column
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN verification_status VARCHAR(50) DEFAULT 'unverified';
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  -- Add verification_method column
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN verification_method VARCHAR(50);
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
  
  -- Add verified_at column
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- Add constraint to profiles table
DO $$
BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT valid_verification_status 
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_email_verifications_updated_at ON public.email_verifications;
CREATE TRIGGER update_email_verifications_updated_at
  BEFORE UPDATE ON public.email_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
  UPDATE public.email_verifications 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to verify email token
CREATE OR REPLACE FUNCTION verify_email_token(token_input TEXT)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  user_id UUID,
  email TEXT
) AS $$
DECLARE
  verification_record RECORD;
BEGIN
  -- Clean up expired tokens first
  PERFORM cleanup_expired_verifications();
  
  -- Find the verification record
  SELECT * INTO verification_record
  FROM public.email_verifications 
  WHERE token = token_input 
    AND status = 'pending'
    AND expires_at > NOW();
  
  -- Check if token exists and is valid
  IF verification_record IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invalid or expired verification token'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Update verification record
  UPDATE public.email_verifications 
  SET 
    status = 'verified',
    verified_at = NOW()
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

-- Row Level Security Policies
-- Users can only see their own verification records
CREATE POLICY "Users can view own email verifications" ON public.email_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own verification records
CREATE POLICY "Users can create own email verifications" ON public.email_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own verification records
CREATE POLICY "Users can update own email verifications" ON public.email_verifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create a view for easy querying of verification status
CREATE OR REPLACE VIEW public.user_verification_status AS
SELECT 
  p.id as user_id,
  p.student_verified,
  p.student_email,
  p.verification_status,
  p.verification_method,
  p.verified_at,
  ev.token,
  ev.expires_at,
  ev.created_at as verification_requested_at
FROM public.profiles p
LEFT JOIN public.email_verifications ev ON p.id = ev.user_id 
  AND ev.status = 'pending' 
  AND ev.verification_type = 'student_email'
WHERE p.id = auth.uid();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.email_verifications TO authenticated;
GRANT SELECT ON public.user_verification_status TO authenticated;
GRANT EXECUTE ON FUNCTION verify_email_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_verifications() TO authenticated;

-- Create indexes on profiles table for new columns
CREATE INDEX IF NOT EXISTS idx_profiles_student_verified ON public.profiles(student_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
