-- Create storage buckets for image uploads
-- This migration sets up the required storage buckets and RLS policies

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('stableimages', 'stableimages', true, 10485760, '{"image/jpeg","image/jpg","image/png","image/webp"}'),
  ('boximages', 'boximages', true, 10485760, '{"image/jpeg","image/jpg","image/png","image/webp"}'),
  ('service-photos', 'service-photos', true, 10485760, '{"image/jpeg","image/jpg","image/png","image/webp"}')
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload images to their own folders
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('stableimages', 'boximages', 'service-photos')
);

-- Policy: Allow public read access to images
CREATE POLICY "Allow public read access to images" ON storage.objects
FOR SELECT TO public
USING (
  bucket_id IN ('stableimages', 'boximages', 'service-photos')
);

-- Policy: Allow users to delete their own images
CREATE POLICY "Allow users to delete their own images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id IN ('stableimages', 'boximages', 'service-photos')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to update their own images
CREATE POLICY "Allow users to update their own images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id IN ('stableimages', 'boximages', 'service-photos')
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id IN ('stableimages', 'boximages', 'service-photos')
  AND auth.uid()::text = (storage.foldername(name))[1]
);