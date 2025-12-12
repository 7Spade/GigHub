-- =============================================
-- Construction Logs Table Schema
-- 工地施工日誌資料表結構
-- =============================================
-- Description: Store construction site daily logs with photos
-- Created: 2025-12-12
-- Author: GigHub Development Team
-- Dependencies: Requires blueprints table to exist
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
    
    -- Foreign key constraint (only if blueprints table exists)
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
