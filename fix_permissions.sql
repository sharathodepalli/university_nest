-- Direct SQL to fix permissions on existing email_verification_tokens table
-- Run this in Supabase SQL editor

-- Enable RLS on the table
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to service_role (for Edge Functions)
GRANT ALL ON public.email_verification_tokens TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.email_verification_tokens TO authenticated;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Service role can manage all email verification tokens" ON public.email_verification_tokens;
DROP POLICY IF EXISTS "Users can view their own email verification tokens" ON public.email_verification_tokens;
DROP POLICY IF EXISTS "Users can insert their own email verification tokens" ON public.email_verification_tokens;
DROP POLICY IF EXISTS "Users can update their own email verification tokens" ON public.email_verification_tokens;

-- Create RLS policies
-- Policy for service_role (bypass RLS entirely)
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

-- Policy for users to update their own tokens
CREATE POLICY "Users can update their own email verification tokens"
ON public.email_verification_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
