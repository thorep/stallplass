-- Storage policies for part-loan-horse bucket
-- Run this in Supabase Studio SQL Editor after creating the part-loan-horse bucket

-- Policies for part-loan-horse bucket
CREATE POLICY "part-loan-horse-public-read" ON storage.objects FOR SELECT USING (bucket_id = 'part-loan-horse');
CREATE POLICY "part-loan-horse-auth-insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'part-loan-horse' AND auth.role() = 'authenticated');
CREATE POLICY "part-loan-horse-auth-update" ON storage.objects FOR UPDATE USING (bucket_id = 'part-loan-horse' AND auth.role() = 'authenticated');
CREATE POLICY "part-loan-horse-auth-delete" ON storage.objects FOR DELETE USING (bucket_id = 'part-loan-horse' AND auth.role() = 'authenticated');