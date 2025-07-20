-- Setup storage buckets for images
-- Create buckets for stable and box images

-- Create stableimages bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stableimages',
  'stableimages',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Create boximages bucket  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'boximages', 
  'boximages',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']  
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for stableimages bucket
-- Allow anyone to view images (public bucket)
CREATE POLICY "Anyone can view stable images"
ON storage.objects FOR SELECT
USING (bucket_id = 'stableimages');

-- Allow authenticated users to upload stable images
CREATE POLICY "Authenticated users can upload stable images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'stableimages');

-- Allow users to update their own uploaded stable images
CREATE POLICY "Users can update their own stable images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'stableimages' AND auth.uid() = owner);

-- Allow users to delete their own uploaded stable images
CREATE POLICY "Users can delete their own stable images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'stableimages' AND auth.uid() = owner);

-- Storage policies for boximages bucket
-- Allow anyone to view images (public bucket)
CREATE POLICY "Anyone can view box images"
ON storage.objects FOR SELECT
USING (bucket_id = 'boximages');

-- Allow authenticated users to upload box images
CREATE POLICY "Authenticated users can upload box images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'boximages');

-- Allow users to update their own uploaded box images
CREATE POLICY "Users can update their own box images"  
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'boximages' AND auth.uid() = owner);

-- Allow users to delete their own uploaded box images
CREATE POLICY "Users can delete their own box images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'boximages' AND auth.uid() = owner);