-- Create a new storage bucket for gallery photos
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true) ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
-- Allow public access to view photos
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');

-- Allow authenticated users to upload photos to the gallery bucket
CREATE POLICY "Auth Users Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');

-- Allow users to delete their own photos
CREATE POLICY "Users Delete Own Photos" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND auth.uid() = owner);
