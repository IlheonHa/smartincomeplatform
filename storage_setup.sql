
-- Supabase Storage Bucket Setup for Tools
-- 1. Create the 'tools' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('tools', 'tools', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up Storage Policies
-- Allow public access to read files in the 'tools' bucket
DROP POLICY IF EXISTS "Public Access to Tools" ON storage.objects;
CREATE POLICY "Public Access to Tools"
ON storage.objects FOR SELECT
TO anon, authenticated
USING ( bucket_id = 'tools' );

-- Allow anyone (anon and authenticated) to upload files to the 'tools' bucket
-- In this specific environment, we use the anon key for everything.
DROP POLICY IF EXISTS "Admin Upload to Tools" ON storage.objects;
CREATE POLICY "Admin Upload to Tools"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK ( bucket_id = 'tools' );

-- Allow anyone to update/delete files in the 'tools' bucket
DROP POLICY IF EXISTS "Admin Update Tools" ON storage.objects;
CREATE POLICY "Admin Update Tools"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING ( bucket_id = 'tools' );

DROP POLICY IF EXISTS "Admin Delete Tools" ON storage.objects;
CREATE POLICY "Admin Delete Tools"
ON storage.objects FOR DELETE
TO anon, authenticated
USING ( bucket_id = 'tools' );
