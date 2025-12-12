-- =============================================
-- GigHub Database Schema Initialization
-- 工地施工進度追蹤管理系統資料庫初始化腳本
-- =============================================
-- Description: Complete database schema for GigHub
-- Created: 2025-12-12
-- Author: GigHub Development Team
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Blueprints Table (藍圖表)
-- =============================================
CREATE TABLE IF NOT EXISTS public.blueprints (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic information
    name VARCHAR(200) NOT NULL,
    description TEXT,
    code VARCHAR(50) UNIQUE,
    
    -- Organization reference
    organization_id UUID,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    
    -- Audit fields
    creator_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_blueprints_organization_id ON public.blueprints(organization_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_creator_id ON public.blueprints(creator_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_status ON public.blueprints(status);

-- =============================================
-- Construction Logs Table (工地施工日誌表)
-- =============================================
CREATE TABLE IF NOT EXISTS public.construction_logs (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to blueprints
    blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
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
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for construction_logs
CREATE INDEX IF NOT EXISTS idx_construction_logs_blueprint_id ON public.construction_logs(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_construction_logs_date ON public.construction_logs(date);
CREATE INDEX IF NOT EXISTS idx_construction_logs_creator_id ON public.construction_logs(creator_id);
CREATE INDEX IF NOT EXISTS idx_construction_logs_deleted_at ON public.construction_logs(deleted_at);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on blueprints
ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;

-- Enable RLS on construction_logs
ALTER TABLE public.construction_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all blueprints
CREATE POLICY "Allow authenticated users to read blueprints" 
ON public.blueprints FOR SELECT 
TO authenticated 
USING (deleted_at IS NULL);

-- Policy: Allow authenticated users to insert blueprints
CREATE POLICY "Allow authenticated users to insert blueprints" 
ON public.blueprints FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy: Allow users to update their own blueprints
CREATE POLICY "Allow users to update own blueprints" 
ON public.blueprints FOR UPDATE 
TO authenticated 
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

-- Policy: Allow authenticated users to read construction logs
CREATE POLICY "Allow authenticated users to read logs" 
ON public.construction_logs FOR SELECT 
TO authenticated 
USING (deleted_at IS NULL);

-- Policy: Allow authenticated users to insert construction logs
CREATE POLICY "Allow authenticated users to insert logs" 
ON public.construction_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy: Allow users to update construction logs
CREATE POLICY "Allow users to update logs" 
ON public.construction_logs FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Policy: Allow users to delete construction logs (soft delete)
CREATE POLICY "Allow users to delete logs" 
ON public.construction_logs FOR DELETE 
TO authenticated 
USING (true);

-- =============================================
-- Storage Bucket for Construction Photos
-- =============================================

-- Note: Storage buckets are typically created via Supabase Dashboard or API
-- This is a reference for the required bucket configuration:
-- 
-- Bucket name: construction-photos
-- Public: true (for easy access to photos)
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- =============================================
-- Sample Data (Optional - for testing)
-- =============================================

-- Insert a sample blueprint
INSERT INTO public.blueprints (id, name, description, code, creator_id, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '範例工地專案',
    '這是一個用於測試的範例工地專案',
    'SAMPLE-001',
    '00000000-0000-0000-0000-000000000001',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- Insert a sample construction log
INSERT INTO public.construction_logs (
    blueprint_id, 
    date, 
    title, 
    description, 
    work_hours, 
    workers,
    weather,
    temperature,
    creator_id
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    '測試施工日誌',
    '這是一條測試施工日誌記錄',
    8.5,
    5,
    '晴天',
    25.0,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- =============================================
-- Utility Functions
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for blueprints
DROP TRIGGER IF EXISTS update_blueprints_updated_at ON public.blueprints;
CREATE TRIGGER update_blueprints_updated_at
    BEFORE UPDATE ON public.blueprints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for construction_logs
DROP TRIGGER IF EXISTS update_construction_logs_updated_at ON public.construction_logs;
CREATE TRIGGER update_construction_logs_updated_at
    BEFORE UPDATE ON public.construction_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- End of Schema Initialization
-- =============================================
