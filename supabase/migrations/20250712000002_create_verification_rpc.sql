-- Create RPC function for inserting verification tokens
-- This bypasses RLS for service role

CREATE OR REPLACE FUNCTION insert_verification_token(
  p_user_id UUID,
  p_email TEXT,
  p_token_hash TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_id UUID;
BEGIN
  INSERT INTO email_verification_tokens (
    user_id,
    email,
    token_hash,
    expires_at,
    status
  ) VALUES (
    p_user_id,
    p_email,
    p_token_hash,
    p_expires_at,
    'pending'
  ) RETURNING id INTO token_id;
  
  RETURN token_id;
END;
$$;
