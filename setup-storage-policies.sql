-- Storage policies for Stallplass buckets
-- Run this in Supabase Studio SQL Editor (http://127.0.0.1:54323)

-- Policies for stableimages bucket
CREATE POLICY "stableimages-public-read" ON storage.objects FOR SELECT USING (bucket_id = 'stableimages');
CREATE POLICY "stableimages-auth-insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stableimages' AND auth.role() = 'authenticated');
CREATE POLICY "stableimages-auth-update" ON storage.objects FOR UPDATE USING (bucket_id = 'stableimages' AND auth.role() = 'authenticated');
CREATE POLICY "stableimages-auth-delete" ON storage.objects FOR DELETE USING (bucket_id = 'stableimages' AND auth.role() = 'authenticated');

-- Policies for boximages bucket  
CREATE POLICY "boximages-public-read" ON storage.objects FOR SELECT USING (bucket_id = 'boximages');
CREATE POLICY "boximages-auth-insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'boximages' AND auth.role() = 'authenticated');
CREATE POLICY "boximages-auth-update" ON storage.objects FOR UPDATE USING (bucket_id = 'boximages' AND auth.role() = 'authenticated');
CREATE POLICY "boximages-auth-delete" ON storage.objects FOR DELETE USING (bucket_id = 'boximages' AND auth.role() = 'authenticated');

-- Policies for service-photos bucket
CREATE POLICY "service-photos-public-read" ON storage.objects FOR SELECT USING (bucket_id = 'service-photos');
CREATE POLICY "service-photos-auth-insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'service-photos' AND auth.role() = 'authenticated');
CREATE POLICY "service-photos-auth-update" ON storage.objects FOR UPDATE USING (bucket_id = 'service-photos' AND auth.role() = 'authenticated');
CREATE POLICY "service-photos-auth-delete" ON storage.objects FOR DELETE USING (bucket_id = 'service-photos' AND auth.role() = 'authenticated');

-- Policies for part-loan-horse bucket
CREATE POLICY "part-loan-horse-public-read" ON storage.objects FOR SELECT USING (bucket_id = 'part-loan-horse');
CREATE POLICY "part-loan-horse-auth-insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'part-loan-horse' AND auth.role() = 'authenticated');
CREATE POLICY "part-loan-horse-auth-update" ON storage.objects FOR UPDATE USING (bucket_id = 'part-loan-horse' AND auth.role() = 'authenticated');
CREATE POLICY "part-loan-horse-auth-delete" ON storage.objects FOR DELETE USING (bucket_id = 'part-loan-horse' AND auth.role() = 'authenticated');