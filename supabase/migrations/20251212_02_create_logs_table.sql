-- ============================================
-- Migration: Create Logs Table
-- Created: 2025-12-12
-- Description: 建立日誌表格，用於工地施工日誌記錄
-- ============================================

-- Drop table if exists (for development only)
-- DROP TABLE IF EXISTS public.logs CASCADE;

-- Create logs table
CREATE TABLE IF NOT EXISTS public.logs (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    blueprint_id UUID NOT NULL,
    creator_id UUID NOT NULL,
    
    -- Log Information
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Work Details
    work_hours NUMERIC(5, 2),
    workers INTEGER DEFAULT 0,
    equipment TEXT,
    
    -- Weather & Environment
    weather VARCHAR(50),
    temperature NUMERIC(4, 1),
    
    -- Media & Attachments
    photos JSONB DEFAULT '[]'::jsonb,
    voice_records JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT logs_work_hours_positive CHECK (work_hours IS NULL OR work_hours >= 0),
    CONSTRAINT logs_workers_positive CHECK (workers >= 0)
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Index on blueprint_id for filtering logs by blueprint
CREATE INDEX IF NOT EXISTS idx_logs_blueprint_id ON public.logs(blueprint_id);

-- Index on creator_id for filtering logs by creator
CREATE INDEX IF NOT EXISTS idx_logs_creator_id ON public.logs(creator_id);

-- Index on date for filtering and sorting by log date
CREATE INDEX IF NOT EXISTS idx_logs_date ON public.logs(date DESC);

-- Index on created_at for sorting by creation timestamp
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs(created_at DESC);

-- Index on deleted_at for filtering active/deleted logs
CREATE INDEX IF NOT EXISTS idx_logs_deleted_at ON public.logs(deleted_at) WHERE deleted_at IS NULL;

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_logs_blueprint_date ON public.logs(blueprint_id, date DESC) WHERE deleted_at IS NULL;

-- GIN index for JSONB columns (photos, documents metadata search)
CREATE INDEX IF NOT EXISTS idx_logs_photos_gin ON public.logs USING gin(photos);
CREATE INDEX IF NOT EXISTS idx_logs_documents_gin ON public.logs USING gin(documents);
CREATE INDEX IF NOT EXISTS idx_logs_metadata_gin ON public.logs USING gin(metadata);

-- ============================================
-- Triggers for Updated At
-- ============================================

-- Reuse the update_updated_at_column function created in previous migration
-- If not exists, create it
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
DROP TRIGGER IF EXISTS update_logs_updated_at ON public.logs;
CREATE TRIGGER update_logs_updated_at
    BEFORE UPDATE ON public.logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Triggers for Photo Count Statistics
-- ============================================

-- Function to update photo statistics
CREATE OR REPLACE FUNCTION public.update_log_photo_stats()
RETURNS TRIGGER AS $$
DECLARE
    photo_count INTEGER;
BEGIN
    -- Count photos in the JSONB array
    photo_count := jsonb_array_length(COALESCE(NEW.photos, '[]'::jsonb));
    
    -- Store in metadata
    NEW.metadata := jsonb_set(
        COALESCE(NEW.metadata, '{}'::jsonb),
        '{photo_count}',
        to_jsonb(photo_count)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update photo statistics
DROP TRIGGER IF EXISTS update_log_photo_stats_trigger ON public.logs;
CREATE TRIGGER update_log_photo_stats_trigger
    BEFORE INSERT OR UPDATE OF photos ON public.logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_log_photo_stats();

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE public.logs IS '日誌表格：用於記錄工地施工日誌與進度';
COMMENT ON COLUMN public.logs.id IS '日誌唯一識別碼';
COMMENT ON COLUMN public.logs.blueprint_id IS '關聯藍圖 ID（外鍵）';
COMMENT ON COLUMN public.logs.creator_id IS '日誌建立者 ID（對應 Firebase Auth UID）';
COMMENT ON COLUMN public.logs.date IS '日誌日期';
COMMENT ON COLUMN public.logs.title IS '日誌標題';
COMMENT ON COLUMN public.logs.description IS '日誌詳細描述';
COMMENT ON COLUMN public.logs.work_hours IS '工作時數';
COMMENT ON COLUMN public.logs.workers IS '工作人數';
COMMENT ON COLUMN public.logs.equipment IS '使用設備';
COMMENT ON COLUMN public.logs.weather IS '天氣狀況';
COMMENT ON COLUMN public.logs.temperature IS '溫度（攝氏度）';
COMMENT ON COLUMN public.logs.photos IS '照片資訊陣列（JSONB 格式）';
COMMENT ON COLUMN public.logs.voice_records IS '語音記錄陣列（JSONB 格式）';
COMMENT ON COLUMN public.logs.documents IS '文件資訊陣列（JSONB 格式）';
COMMENT ON COLUMN public.logs.metadata IS '額外元資料（JSONB 格式，包含 photo_count 等統計）';
COMMENT ON COLUMN public.logs.deleted_at IS '軟刪除時間戳記（NULL 表示未刪除）';

-- ============================================
-- Grant Permissions
-- ============================================

-- Grant permissions to authenticated users
-- Note: Actual access is controlled by RLS policies (see next migration)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logs TO anon;

-- ============================================
-- Migration Complete
-- ============================================

-- Verify table creation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'logs' AND table_schema = 'public') THEN
        RAISE NOTICE 'Migration 20251212_02_create_logs_table completed successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create logs table';
    END IF;
END $$;
