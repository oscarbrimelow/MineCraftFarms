-- Storage policies for farm-images bucket
-- Run this in Supabase SQL Editor to allow image uploads

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'farm-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update files in their own folder
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'farm-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'farm-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete files from their own folder
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'farm-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public to read all files (for displaying images)
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'farm-images');

