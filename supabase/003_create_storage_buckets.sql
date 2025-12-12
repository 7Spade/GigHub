-- =============================================
-- Storage Buckets Configuration
-- 儲存桶配置
-- =============================================
-- Description: Create storage buckets for construction photos
-- Created: 2025-12-12
-- Author: GigHub Development Team
-- =============================================

-- Create construction-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'construction-photos',
    'construction-photos',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies
CREATE POLICY "Allow authenticated users to upload construction photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'construction-photos' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.blueprints 
        WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Allow public read access to construction photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'construction-photos');

CREATE POLICY "Allow users to delete their construction photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'construction-photos' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.blueprints 
        WHERE created_by = auth.uid()
    )
);

-- Add comment
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads';
