-- COPY AND PASTE THIS INTO YOUR SUPABASE SQL EDITOR
-- This will fix the permissions for the email_verification_tokens table

-- Enable RLS (if not already enabled)
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Grant permissions to service_role for Edge Functions
GRANT ALL ON public.email_verification_tokens TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant basic permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.email_verification_tokens TO authenticated;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Service role can manage all email verification tokens" ON public.email_verification_tokens;
DROP POLICY IF EXISTS "Users can view their own email verification tokens" ON public.email_verification_tokens;
DROP POLICY IF EXISTS "Users can insert their own email verification tokens" ON public.email_verification_tokens;
DROP POLICY IF EXISTS "Users can update their own email verification tokens" ON public.email_verification_tokens;

-- Create RLS policies
-- Policy for service_role (bypass RLS entirely - CRITICAL for Edge Functions)
CREATE POLICY "Service role can manage all email verification tokens"
ON public.email_verification_tokens
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Policy for authenticated users (can only see their own tokens)
CREATE POLICY "Users can view their own email verification tokens"
ON public.email_verification_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for users to insert their own tokens
CREATE POLICY "Users can insert their own email verification tokens"
ON public.email_verification_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own tokens (marking as used)
CREATE POLICY "Users can update their own email verification tokens"
ON public.email_verification_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RPC function for email verification (without pgcrypto dependency)
-- This function verifies an email token and updates user status

-- First, drop the existing function if it exists with different signature
DROP FUNCTION IF EXISTS verify_email_token(text);
DROP FUNCTION IF EXISTS verify_email_token(TEXT);

-- Create the new function using built-in sha256 function
CREATE OR REPLACE FUNCTION verify_email_token(token_input TEXT)
RETURNS TABLE(status TEXT, message TEXT, user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_record email_verification_tokens%ROWTYPE;
  token_hash_computed TEXT;
BEGIN
  -- Compute hash of the input token using built-in sha256
  SELECT encode(sha256(token_input::bytea), 'hex') INTO token_hash_computed;
  
  -- Find ANY token with this hash first
  SELECT evt.* INTO token_record
  FROM email_verification_tokens evt
  WHERE evt.token_hash = token_hash_computed;

  -- Check if token exists at all
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'error'::TEXT, 'Invalid verification token'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if token has already been used
  IF token_record.status = 'verified' THEN
    RETURN QUERY SELECT 'error'::TEXT, 'Token has already been used'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if token has expired
  IF token_record.expires_at <= NOW() THEN
    RETURN QUERY SELECT 'expired'::TEXT, 'Token has expired'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if token is in pending status (should be if we got here)
  IF token_record.status != 'pending' THEN
    RETURN QUERY SELECT 'error'::TEXT, 'Token is in invalid state'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Token is valid - mark it as used
  UPDATE email_verification_tokens
  SET 
    status = 'verified',
    used_at = NOW()
  WHERE id = token_record.id;

  -- Update user email verification status in auth.users
  UPDATE auth.users
  SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = token_record.user_id;

  -- Update user profile verification status
  UPDATE profiles
  SET 
    verified = TRUE,
    verification_status = 'verified',
    verified_at = NOW(),
    updated_at = NOW()
  WHERE id = token_record.user_id;

  -- Return success
  RETURN QUERY SELECT 'verified'::TEXT, 'Email verified successfully!'::TEXT, token_record.user_id;
END;
$$;

-- Show confirmation
SELECT 'Database permissions and verify_email_token function have been created successfully!' as message;

-- If sha256 doesn't work, use this alternative function that enables pgcrypto first:
/*
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP FUNCTION IF EXISTS verify_email_token(text);

CREATE OR REPLACE FUNCTION verify_email_token(token_input TEXT)
RETURNS TABLE(status TEXT, message TEXT, user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_record email_verification_tokens%ROWTYPE;
  token_hash_computed TEXT;
BEGIN
  SELECT encode(digest(token_input::text, 'sha256'), 'hex') INTO token_hash_computed;
  
  SELECT * INTO token_record
  FROM email_verification_tokens
  WHERE token_hash = token_hash_computed
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'error'::TEXT, 'Invalid or expired verification token'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  UPDATE email_verification_tokens
  SET status = 'verified', used_at = NOW()
  WHERE id = token_record.id;

  UPDATE profiles
  SET verified = TRUE, verification_status = 'verified', verified_at = NOW(), updated_at = NOW()
  WHERE id = token_record.user_id;

  RETURN QUERY SELECT 'verified'::TEXT, 'Email verified successfully!'::TEXT, token_record.user_id;
END;
$$;
*/
