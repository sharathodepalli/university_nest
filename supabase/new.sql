create table public.conversations (
  id uuid not null default gen_random_uuid (),
  listing_id uuid not null,
  participant_1 uuid not null,
  participant_2 uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint conversations_pkey primary key (id),
  constraint conversations_listing_id_participant_1_participant_2_key unique (listing_id, participant_1, participant_2),
  constraint conversations_listing_id_fkey foreign KEY (listing_id) references listings (id) on delete CASCADE,
  constraint conversations_participant_1_fkey foreign KEY (participant_1) references profiles (id) on delete CASCADE,
  constraint conversations_participant_2_fkey foreign KEY (participant_2) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_conversations_updated_at_trigger BEFORE
update on conversations for EACH row
execute FUNCTION update_conversations_updated_at ();

create table public.email_verification_tokens (
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
) TABLESPACE pg_default;



create table public.profiles (
  id uuid not null,
  email text not null,
  name text null,
  university text null default 'Not specified'::text,
  year text null default 'Not specified'::text,
  bio text null,
  phone text null,
  profile_picture text null,
  location jsonb null,
  preferences jsonb null default '{}'::jsonb,
  matching_preferences jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  verified boolean null default false,
  student_verified boolean null default false,
  student_email text null,
  verification_status text null default 'unverified'::text,
  verification_method text null,
  verified_at timestamp with time zone null,
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_student_email_key unique (student_email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_profiles_updated_at_trigger BEFORE
update on profiles for EACH row
execute FUNCTION update_profiles_updated_at ();


create table public.messages (
  id uuid not null default gen_random_uuid (),
  conversation_id uuid not null,
  sender_id uuid not null,
  content text not null,
  created_at timestamp with time zone null default now(),
  read boolean null default false,
  message_type text null default 'text'::text,
  constraint messages_pkey primary key (id),
  constraint messages_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_conversation_on_new_message_trigger
after INSERT on messages for EACH row
execute FUNCTION update_conversation_on_new_message ();


create table public.listings (
  id uuid not null default gen_random_uuid (),
  host_id uuid not null,
  title text not null,
  description text null,
  price numeric not null,
  location jsonb not null,
  room_type text not null,
  amenities text[] null,
  images text[] null,
  available_from date not null,
  available_to date null,
  max_occupants integer null default 1,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  status text null default 'active'::text,
  preferences jsonb null default '{}'::jsonb,
  rules text[] null,
  deposit numeric null,
  utilities jsonb null,
  constraint listings_pkey primary key (id),
  constraint listings_host_id_fkey foreign KEY (host_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_listings_updated_at_trigger BEFORE
update on listings for EACH row
execute FUNCTION update_listings_updated_at ();


create table public.favorites (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  listing_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint favorites_pkey primary key (id),
  constraint favorites_user_id_listing_id_key unique (user_id, listing_id),
  constraint favorites_listing_id_fkey foreign KEY (listing_id) references listings (id) on delete CASCADE,
  constraint favorites_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;