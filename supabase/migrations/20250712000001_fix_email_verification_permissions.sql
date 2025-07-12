-- Create email_verification_tokens table and set up permissions
-- This table is needed for email verification flow

-- Create the table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  email text not null,
  token_hash text not null,
  created_at timestamp with time zone null default now(),
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone null,
  status text null default 'pending'::text,
  constraint email_verification_tokens_pkey primary key (id),
  constraint email_verification_tokens_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
);

-- Enable RLS on the table
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to service_role (for Edge Functions)
GRANT ALL ON public.email_verification_tokens TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant permissions to authenticated users (for reading their own tokens)
GRANT SELECT, INSERT, UPDATE ON public.email_verification_tokens TO authenticated;

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

-- Policy for users to insert their own tokens (needed for signup flow)
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
