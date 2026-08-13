CREATE POLICY "Allow public uploads to videos bucket" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'videos');
CREATE POLICY "Allow public read to videos bucket" ON storage.objects FOR SELECT TO public USING (bucket_id = 'videos');
CREATE POLICY "Allow public update to videos bucket" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'videos');
CREATE POLICY "Allow public delete to videos bucket" ON storage.objects FOR DELETE TO public USING (bucket_id = 'videos');
