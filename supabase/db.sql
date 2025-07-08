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

create index IF not exists idx_conversations_participants on public.conversations using btree (participant_1, participant_2) TABLESPACE pg_default;

create trigger update_conversations_updated_at BEFORE
update on conversations for EACH row
execute FUNCTION update_updated_at_column ();



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

create index IF not exists idx_favorites_user_id on public.favorites using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_favorites_listing_id on public.favorites using btree (listing_id) TABLESPACE pg_default;


create table public.listings (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text not null,
  price integer not null,
  location jsonb not null,
  room_type text not null,
  amenities text[] null default '{}'::text[],
  images text[] null default '{}'::text[],
  available_from date not null,
  available_to date null,
  max_occupants integer not null default 1,
  host_id uuid not null,
  status text not null default 'active'::text,
  preferences jsonb null default '{}'::jsonb,
  rules text[] null default '{}'::text[],
  deposit integer null,
  utilities jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint listings_pkey primary key (id),
  constraint listings_host_id_fkey foreign KEY (host_id) references profiles (id) on delete CASCADE,
  constraint listings_room_type_check check (
    (
      room_type = any (
        array[
          'single'::text,
          'shared'::text,
          'studio'::text,
          'apartment'::text
        ]
      )
    )
  ),
  constraint listings_status_check check (
    (
      status = any (
        array['active'::text, 'inactive'::text, 'rented'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_listings_host_id on public.listings using btree (host_id) TABLESPACE pg_default;

create index IF not exists idx_listings_status on public.listings using btree (status) TABLESPACE pg_default;

create index IF not exists idx_listings_available_from on public.listings using btree (available_from) TABLESPACE pg_default;

create trigger update_listings_updated_at BEFORE
update on listings for EACH row
execute FUNCTION update_updated_at_column ();


create table public.messages (
  id uuid not null default gen_random_uuid (),
  conversation_id uuid not null,
  sender_id uuid not null,
  content text not null,
  message_type text not null default 'text'::text,
  read boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint messages_pkey primary key (id),
  constraint messages_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references profiles (id) on delete CASCADE,
  constraint messages_message_type_check check (
    (
      message_type = any (
        array['text'::text, 'image'::text, 'system'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_messages_conversation_id on public.messages using btree (conversation_id) TABLESPACE pg_default;

create index IF not exists idx_messages_created_at on public.messages using btree (created_at) TABLESPACE pg_default;


create table public.profiles (
  id uuid not null,
  name text not null,
  university text not null,
  year text not null,
  bio text null default ''::text,
  phone text null,
  verified boolean null default false,
  profile_picture text null,
  preferences jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  email text null,
  location jsonb null default '{}'::jsonb,
  "matchingPreferences" jsonb null default '{}'::jsonb,
  constraint profiles_pkey primary key (id)
) TABLESPACE pg_default;

create trigger update_profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION update_updated_at_column ();