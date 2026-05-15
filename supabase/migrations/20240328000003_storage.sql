-- Migration: Setup Storage Buckets and Policies

-- Insert buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('projects', 'projects', true),
  ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 1. Avatars
-- Allow public read access to avatars
CREATE POLICY "Avatar images are publicly accessible." 
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload their own avatars." 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars." 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'avatars');

-- 2. Projects
CREATE POLICY "Project images are publicly accessible." 
ON storage.objects FOR SELECT USING (bucket_id = 'projects');

CREATE POLICY "Authenticated users can upload project images." 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'projects');

CREATE POLICY "Authenticated users can update project images." 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'projects');

-- 3. Logos
CREATE POLICY "Logos are publicly accessible." 
ON storage.objects FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload logos." 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Authenticated users can update logos." 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'logos');
