-- =============================================
-- GigHub Complete Database Setup
-- GigHub 完整資料庫設定
-- =============================================
-- Description: Complete database setup for GigHub construction management system
-- Created: 2025-12-12
-- Author: GigHub Development Team
-- 
-- This file combines all migration scripts for one-time execution
-- 本文件結合所有遷移腳本以供一次性執行
-- =============================================

-- =============================================
-- PART 1: Create Blueprints Table
-- 第一部分：建立藍圖表格
-- =============================================

-- Create owner_type enum if not exists
DO $$ BEGIN
    CREATE TYPE owner_type AS ENUM ('organization', 'personal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create blueprint_status enum if not exists
DO $$ BEGIN
    CREATE TYPE blueprint_status AS ENUM ('draft', 'active', 'archived', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create module_type enum if not exists
DO $$ BEGIN
    CREATE TYPE module_type AS ENUM ('task', 'log', 'quality', 'member', 'document', 'schedule');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create blueprints table
CREATE TABLE IF NOT EXISTS public.blueprints (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic information
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    cover_url TEXT,
    
    -- Ownership
    owner_id UUID NOT NULL,
    owner_type owner_type NOT NULL DEFAULT 'personal',
    
    -- Visibility and status
    is_public BOOLEAN NOT NULL DEFAULT false,
    status blueprint_status NOT NULL DEFAULT 'draft',
    enabled_modules module_type[] DEFAULT ARRAY['task', 'log']::module_type[],
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit fields
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT blueprints_slug_unique UNIQUE (slug)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blueprints_owner ON public.blueprints(owner_id, owner_type);
CREATE INDEX IF NOT EXISTS idx_blueprints_status ON public.blueprints(status);
CREATE INDEX IF NOT EXISTS idx_blueprints_slug ON public.blueprints(slug);
CREATE INDEX IF NOT EXISTS idx_blueprints_created_by ON public.blueprints(created_by);
CREATE INDEX IF NOT EXISTS idx_blueprints_deleted_at ON public.blueprints(deleted_at);

-- Enable Row Level Security
ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read for public blueprints" ON public.blueprints;
DROP POLICY IF EXISTS "Allow owner full access" ON public.blueprints;

-- Create RLS policies
CREATE POLICY "Allow public read for public blueprints" 
ON public.blueprints FOR SELECT 
USING (is_public = true AND deleted_at IS NULL);

CREATE POLICY "Allow owner full access" 
ON public.blueprints FOR ALL 
USING (created_by = auth.uid());

-- Add comment
COMMENT ON TABLE public.blueprints IS 'Core blueprints table for project management system';

-- =============================================
-- PART 2: Create Construction Logs Table
-- 第二部分：建立工地日誌表格
-- =============================================

-- Create construction_logs table
CREATE TABLE IF NOT EXISTS public.construction_logs (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to blueprints
    blueprint_id UUID NOT NULL,
    
    -- Log date (work date)
    date TIMESTAMPTZ NOT NULL,
    
    -- Basic information
    title VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Work details
    work_hours NUMERIC(5,2),
    workers INTEGER,
    equipment TEXT,
    
    -- Weather information
    weather VARCHAR(50),
    temperature NUMERIC(5,2),
    
    -- Photos (stored as JSONB array)
    photos JSONB DEFAULT '[]'::jsonb,
    
    -- Audit fields
    creator_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Reserved for future
    voice_records TEXT[],
    documents TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Foreign key constraint
    CONSTRAINT fk_construction_logs_blueprint 
        FOREIGN KEY (blueprint_id) 
        REFERENCES public.blueprints(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_construction_logs_blueprint ON public.construction_logs(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_construction_logs_date ON public.construction_logs(date);
CREATE INDEX IF NOT EXISTS idx_construction_logs_creator ON public.construction_logs(creator_id);
CREATE INDEX IF NOT EXISTS idx_construction_logs_deleted_at ON public.construction_logs(deleted_at);

-- Enable Row Level Security
ALTER TABLE public.construction_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to view logs from their blueprints" ON public.construction_logs;
DROP POLICY IF EXISTS "Allow users to create logs for their blueprints" ON public.construction_logs;
DROP POLICY IF EXISTS "Allow users to update logs from their blueprints" ON public.construction_logs;
DROP POLICY IF EXISTS "Allow users to delete logs from their blueprints" ON public.construction_logs;

-- Create RLS policies
CREATE POLICY "Allow users to view logs from their blueprints" 
ON public.construction_logs FOR SELECT 
USING (
    blueprint_id IN (
        SELECT id FROM public.blueprints 
        WHERE created_by = auth.uid() 
        AND deleted_at IS NULL
    )
);

CREATE POLICY "Allow users to create logs for their blueprints" 
ON public.construction_logs FOR INSERT 
WITH CHECK (
    blueprint_id IN (
        SELECT id FROM public.blueprints 
        WHERE created_by = auth.uid() 
        AND deleted_at IS NULL
    )
);

CREATE POLICY "Allow users to update logs from their blueprints" 
ON public.construction_logs FOR UPDATE 
USING (
    blueprint_id IN (
        SELECT id FROM public.blueprints 
        WHERE created_by = auth.uid() 
        AND deleted_at IS NULL
    )
);

CREATE POLICY "Allow users to delete logs from their blueprints" 
ON public.construction_logs FOR DELETE 
USING (
    blueprint_id IN (
        SELECT id FROM public.blueprints 
        WHERE created_by = auth.uid() 
        AND deleted_at IS NULL
    )
);

-- Add comments
COMMENT ON TABLE public.construction_logs IS 'Construction site daily logs with photos and work records';
COMMENT ON COLUMN public.construction_logs.photos IS 'JSONB array of photo objects with url, fileName, size, uploadedAt';

-- =============================================
-- PART 3: Create Storage Bucket
-- 第三部分：建立儲存桶
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

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload construction photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to construction photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their construction photos" ON storage.objects;

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

-- =============================================
-- VERIFICATION
-- 驗證
-- =============================================

-- Verify tables were created
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('blueprints', 'construction_logs')
ORDER BY tablename;

-- Verify enums were created
SELECT 
    t.typname AS enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('owner_type', 'blueprint_status', 'module_type')
GROUP BY t.typname
ORDER BY t.typname;

-- Verify storage bucket was created
SELECT 
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 AS size_limit_mb
FROM storage.buckets
WHERE id = 'construction-photos';

-- =============================================
-- SETUP COMPLETE
-- 設定完成
-- =============================================
-- 
-- Next steps:
-- 1. Verify all tables and buckets are created
-- 2. Test the application
-- 3. Create your first blueprint and construction log
--
-- 下一步：
-- 1. 驗證所有表格和儲存桶已建立
-- 2. 測試應用程式
-- 3. 建立您的第一個藍圖和工地日誌
-- =============================================
