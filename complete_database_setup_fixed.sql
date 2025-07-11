-- DANGER! This script will drop all existing tables, functions, and policies.
-- Use ONLY for fresh setup or complete reset.
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;

-- USERS TABLE (Supabase Auth handles this, but this is a conceptual representation)
-- No need to create explicitly, Supabase Auth manages auth.users

-- PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    university TEXT DEFAULT 'Not specified',
    year TEXT DEFAULT 'Not specified',
    bio TEXT,
    phone TEXT,
    profile_picture TEXT,
    location TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    matching_preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- New fields for verification
    verified BOOLEAN DEFAULT FALSE, -- Legacy field, use student_verified
    student_verified BOOLEAN DEFAULT FALSE,
    student_email TEXT UNIQUE, -- Stores the email used for student verification
    verification_status TEXT DEFAULT 'unverified', -- 'unverified', 'pending', 'verified', 'rejected'
    verification_method TEXT, -- 'email', 'id_card', etc.
    verified_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT USING (true);

-- Allow authenticated users to insert their own profile
-- This is crucial for the 400 error. auth.uid() is the ID of the currently authenticated user.
CREATE POLICY "Allow users to insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- LISTINGS TABLE
CREATE TABLE public.listings (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    location TEXT NOT NULL,
    room_type TEXT NOT NULL, -- e.g., 'private', 'shared'
    amenities TEXT[],
    images TEXT[],
    available_from DATE NOT NULL,
    available_to DATE,
    max_occupants INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'available', -- 'available', 'rented', 'pending'
    preferences JSONB DEFAULT '{}'::jsonb, -- e.g., 'gender_preference', 'pet_friendly'
    rules TEXT[],
    deposit NUMERIC,
    utilities JSONB -- e.g., 'included', 'extra', 'estimated_cost'
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Policies for listings
CREATE POLICY "Listings are viewable by everyone."
  ON public.listings FOR SELECT USING (true);

-- Allow authenticated users to create listings
CREATE POLICY "Allow authenticated users to create listings."
  ON public.listings FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Allow listing hosts to update their own listings
CREATE POLICY "Allow listing hosts to update their own listings."
  ON public.listings FOR UPDATE USING (auth.uid() = host_id);

-- Allow listing hosts to delete their own listings
CREATE POLICY "Allow listing hosts to delete their own listings."
  ON public.listings FOR DELETE USING (auth.uid() = host_id);

-- CONVERSATIONS TABLE
CREATE TABLE public.conversations (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    participant_1 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    participant_2 UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure unique conversation between two participants for a specific listing
    UNIQUE (listing_id, participant_1, participant_2)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Participants can view their conversations."
  ON public.conversations FOR SELECT USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

CREATE POLICY "Authenticated users can create conversations."
  ON public.conversations FOR INSERT WITH CHECK (
    auth.uid() = participant_1 OR auth.uid() = participant_2
  );

-- MESSAGES TABLE
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    message_type TEXT DEFAULT 'text' -- 'text', 'image', 'system'
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Participants can view messages in their conversations."
  ON public.messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND (participant_1 = auth.uid() OR participant_2 = auth.uid()))
  );

CREATE POLICY "Participants can send messages in their conversations."
  ON public.messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND (participant_1 = auth.uid() OR participant_2 = auth.uid()))
  );

-- Allow participants to mark messages as read
CREATE POLICY "Participants can update messages in their conversations."
  ON public.messages FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND (participant_1 = auth.uid() OR participant_2 = auth.uid()))
  );

-- EMAIL VERIFICATION TOKENS TABLE
-- This table stores tokens for email verification outside of Supabase's built-in email confirmation.
CREATE TABLE public.email_verification_tokens (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL, -- The student email to be verified
    token_hash TEXT NOT NULL, -- Hashed token
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE, -- When the token was successfully used
    status TEXT DEFAULT 'pending' -- 'pending', 'used', 'expired', 'invalid', 'rejected' (if email claimed by another user)
);

ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Allow only the owner to insert a token for their user_id, or if user is anon.
-- This policy should be carefully considered; typically, tokens are inserted by a service_role key or an Edge Function.
CREATE POLICY "Allow own token insert by authenticated" ON public.email_verification_tokens
FOR INSERT WITH CHECK (auth.uid() = user_id);
-- For the Edge Function generating tokens (which uses service_role key usually), RLS is bypassed.

CREATE POLICY "Allow own token update by authenticated" ON public.email_verification_tokens
FOR UPDATE USING (auth.uid() = user_id);

-- RPC function to verify email token and update profile status
-- This function is called by the Edge Function 'verify-email-token'
CREATE OR REPLACE FUNCTION public.verify_email_token(token_hash TEXT)
RETURNS TABLE(status TEXT, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: This allows the function to bypass RLS policies for update operations
AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
    v_token_id UUID;
BEGIN
    -- Find the token
    SELECT id, user_id, email
    INTO v_token_id, v_user_id, v_email
    FROM public.email_verification_tokens
    WHERE email_verification_tokens.token_hash = verify_email_token.token_hash
      AND expires_at > NOW()
      AND used_at IS NULL
      AND status = 'pending';

    IF v_token_id IS NULL THEN
        RETURN QUERY SELECT 'error'::TEXT, 'Invalid, expired, or already used token.'::TEXT;
        RETURN;
    END IF;

    -- Check if another verified profile already exists with this student email
    -- This handles the case where someone tries to verify an email already verified by another user
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE student_email = v_email AND student_verified = TRUE AND id != v_user_id
    ) THEN
        -- Mark token as rejected because email is claimed by another verified user
        UPDATE public.email_verification_tokens
        SET used_at = NOW(), status = 'rejected'
        WHERE id = v_token_id;

        RETURN QUERY SELECT 'rejected'::TEXT, 'Email already verified by another user.'::TEXT;
        RETURN;
    END IF;

    -- Update the profile to mark student email as verified
    UPDATE public.profiles
    SET
        student_verified = TRUE,
        verification_status = 'verified',
        student_email = v_email,
        verification_method = 'email',
        verified_at = NOW(),
        updated_at = NOW()
    WHERE id = v_user_id;

    -- Mark the token as used
    UPDATE public.email_verification_tokens
    SET used_at = NOW(), status = 'used'
    WHERE id = v_token_id;

    RETURN QUERY SELECT 'verified'::TEXT, 'Email successfully verified.'::TEXT;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error verifying email token: %', SQLERRM;
        RETURN QUERY SELECT 'error'::TEXT, 'An unexpected error occurred during verification.'::TEXT;
END;
$$;


-- Triggers
-- Function to update updated_at timestamp for profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

-- Function to update updated_at timestamp for listings
CREATE OR REPLACE FUNCTION update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_listings_updated_at_trigger
BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION update_listings_updated_at();

-- Function to update updated_at timestamp for conversations
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at_trigger
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION update_conversations_updated_at();

-- Function to update conversation's updated_at when a new message is inserted
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_new_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_on_new_message();

-- Initial data (optional, for development/testing)
-- COMMENTED OUT: These inserts require a user with the specified ID to exist in auth.users first.
-- You should create users via Supabase Auth (e.g., app registration) or manually in the Supabase dashboard.
-- INSERT INTO public.profiles (id, email, name, university)
-- VALUES
--     ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'test@example.com', 'Test User', 'University A')
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO public.listings (host_id, title, description, price, location, room_type, available_from)
-- VALUES
--     ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cozy Room Near Campus', 'A lovely room close to the university.', 500, '123 University St', 'private', '2025-08-01')
-- ON CONFLICT DO NOTHING;