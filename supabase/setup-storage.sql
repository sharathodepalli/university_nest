-- Supabase Storage Setup for ImageUpload Component
-- Run these commands in your Supabase SQL Editor to enable real-time image uploads

-- 1. Create storage buckets for images
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('listing-images', 'listing-images', true),
  ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS policies for listing images
CREATE POLICY "Allow public access to listing images" ON storage.objects
FOR SELECT USING (bucket_id = 'listing-images');

CREATE POLICY "Allow authenticated uploads to listing images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their listing images" ON storage.objects
FOR UPDATE USING (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to delete their listing images" ON storage.objects
FOR DELETE USING (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

-- 3. Set up RLS policies for profile images
CREATE POLICY "Allow public access to profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Allow authenticated uploads to profile images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their profile images" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to delete their profile images" ON storage.objects
FOR DELETE USING (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

-- 4. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
