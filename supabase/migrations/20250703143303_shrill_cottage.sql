/*
  # Fix profiles table foreign key constraint

  1. Changes
    - Remove the invalid foreign key constraint that references non-existent users table
    - The profiles table should directly reference auth.users(id) which is handled by Supabase Auth

  2. Security
    - Maintain existing RLS policies
    - No changes to security model
*/

-- Remove the invalid foreign key constraint
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END $$;

-- The profiles table already has the correct reference to auth.users(id) 
-- via the PRIMARY KEY constraint, so no need to add a new foreign key