-- =============================================
-- Construction Logs Complete Setup Script
-- 工地施工日誌完整設定腳本
-- =============================================
-- Description: Complete database setup for construction logs feature
-- Created: 2025-12-12
-- Author: GigHub Development Team
-- Usage: Execute this in Supabase SQL Editor
-- =============================================

-- ==================== STEP 1: CREATE TABLE ====================

-- Create construction_logs table
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
    
    -- Reserved for future extensions
    voice_records TEXT[],
    documents TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ==================== STEP 2: CREATE INDEXES ====================

-- Index on blueprint_id for fast lookups by project
CREATE INDEX IF NOT EXISTS idx_construction_logs_blueprint_id 
    ON public.construction_logs(blueprint_id);

-- Index on date for chronological queries
CREATE INDEX IF NOT EXISTS idx_construction_logs_date 
    ON public.construction_logs(date DESC);

-- Index on creator_id for user-specific queries
CREATE INDEX IF NOT EXISTS idx_construction_logs_creator 
    ON public.construction_logs(creator_id);

-- Partial index on non-deleted records (most common query)
CREATE INDEX IF NOT EXISTS idx_construction_logs_deleted 
    ON public.construction_logs(deleted_at) 
    WHERE deleted_at IS NULL;

-- Composite index for common query pattern: blueprint + date + not deleted
CREATE INDEX IF NOT EXISTS idx_construction_logs_blueprint_date_active
    ON public.construction_logs(blueprint_id, date DESC)
    WHERE deleted_at IS NULL;

-- ==================== STEP 3: ADD TABLE COMMENTS ====================

COMMENT ON TABLE public.construction_logs IS 'Construction site daily logs with photos and work details';
COMMENT ON COLUMN public.construction_logs.id IS 'Unique log identifier (UUID)';
COMMENT ON COLUMN public.construction_logs.blueprint_id IS 'Reference to parent blueprint (project)';
COMMENT ON COLUMN public.construction_logs.date IS 'Work date for this log entry';
COMMENT ON COLUMN public.construction_logs.title IS 'Log title (max 100 characters)';
COMMENT ON COLUMN public.construction_logs.description IS 'Detailed log content';
COMMENT ON COLUMN public.construction_logs.work_hours IS 'Total work hours for the day';
COMMENT ON COLUMN public.construction_logs.workers IS 'Number of workers on site';
COMMENT ON COLUMN public.construction_logs.equipment IS 'Equipment used (free text)';
COMMENT ON COLUMN public.construction_logs.weather IS 'Weather conditions';
COMMENT ON COLUMN public.construction_logs.temperature IS 'Temperature in Celsius';
COMMENT ON COLUMN public.construction_logs.photos IS 'JSONB array of photo objects with URLs and metadata';
COMMENT ON COLUMN public.construction_logs.creator_id IS 'User ID who created this log';
COMMENT ON COLUMN public.construction_logs.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN public.construction_logs.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN public.construction_logs.deleted_at IS 'Soft delete timestamp (NULL if active)';
COMMENT ON COLUMN public.construction_logs.voice_records IS 'Reserved: Future voice recording URLs';
COMMENT ON COLUMN public.construction_logs.documents IS 'Reserved: Future document URLs';
COMMENT ON COLUMN public.construction_logs.metadata IS 'Reserved: Extensible metadata storage';

-- ==================== STEP 4: ENABLE ROW LEVEL SECURITY ====================

-- Enable RLS on construction_logs table
ALTER TABLE public.construction_logs ENABLE ROW LEVEL SECURITY;

-- ==================== STEP 5: CREATE RLS POLICIES ====================

-- Policy 1: Allow authenticated users to read logs from accessible blueprints
CREATE POLICY "Users can read construction logs from accessible blueprints"
ON public.construction_logs
FOR SELECT
TO authenticated
USING (
    -- User can read if they have access to the blueprint
    EXISTS (
        SELECT 1 FROM public.blueprints
        WHERE blueprints.id = construction_logs.blueprint_id
        AND (
            -- User owns the blueprint
            blueprints.owner_id = auth.uid()
            -- OR blueprint is public
            OR blueprints.is_public = true
            -- OR user is a member of the blueprint
            OR EXISTS (
                SELECT 1 FROM public.blueprint_members
                WHERE blueprint_members.blueprint_id = blueprints.id
                AND blueprint_members.user_id = auth.uid()
            )
        )
    )
    -- AND log is not soft-deleted
    AND construction_logs.deleted_at IS NULL
);

-- Policy 2: Allow authenticated users to create logs in accessible blueprints
CREATE POLICY "Users can create construction logs in accessible blueprints"
ON public.construction_logs
FOR INSERT
TO authenticated
WITH CHECK (
    -- User must have write access to the blueprint
    EXISTS (
        SELECT 1 FROM public.blueprints
        WHERE blueprints.id = construction_logs.blueprint_id
        AND (
            -- User owns the blueprint
            blueprints.owner_id = auth.uid()
            -- OR user is an owner/editor member
            OR EXISTS (
                SELECT 1 FROM public.blueprint_members
                WHERE blueprint_members.blueprint_id = blueprints.id
                AND blueprint_members.user_id = auth.uid()
                AND blueprint_members.role IN ('owner', 'editor')
            )
        )
    )
    -- Creator must be the authenticated user
    AND construction_logs.creator_id = auth.uid()
);

-- Policy 3: Allow users to update their own logs
CREATE POLICY "Users can update their own construction logs"
ON public.construction_logs
FOR UPDATE
TO authenticated
USING (
    -- User created this log
    construction_logs.creator_id = auth.uid()
    -- Log is not deleted
    AND construction_logs.deleted_at IS NULL
)
WITH CHECK (
    -- Creator cannot be changed
    construction_logs.creator_id = auth.uid()
);

-- Policy 4: Allow users to soft delete their own logs
CREATE POLICY "Users can soft delete their own construction logs"
ON public.construction_logs
FOR UPDATE
TO authenticated
USING (
    -- User created this log
    construction_logs.creator_id = auth.uid()
)
WITH CHECK (
    -- Creator cannot be changed
    construction_logs.creator_id = auth.uid()
);

-- ==================== STEP 6: CREATE STORAGE POLICIES ====================

-- Note: Storage bucket 'construction-photos' must be created manually in Supabase Dashboard
-- Then execute these policies:

-- Policy: Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload construction photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'construction-photos'
    AND (storage.foldername(name))[1] IS NOT NULL  -- Must be in a folder structure
);

-- Policy: Allow public read access to construction photos
CREATE POLICY "Public read access for construction photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'construction-photos');

-- Policy: Allow users to delete photos they uploaded
CREATE POLICY "Users can delete their construction photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'construction-photos'
    -- Add additional checks based on your folder structure
);

-- ==================== STEP 7: CREATE HELPER FUNCTIONS ====================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.update_construction_log_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp on UPDATE
CREATE TRIGGER update_construction_log_timestamp_trigger
BEFORE UPDATE ON public.construction_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_construction_log_timestamp();

-- ==================== VERIFICATION QUERIES ====================

-- Verify table exists
SELECT 
    table_name, 
    table_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'construction_logs' 
            AND rowsecurity = true
        ) THEN 'RLS Enabled ✓'
        ELSE 'RLS Not Enabled ✗'
    END as rls_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'construction_logs';

-- Verify indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'construction_logs'
ORDER BY indexname;

-- Verify RLS policies
SELECT 
    policyname,
    cmd as command,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END as check_clause
FROM pg_policies 
WHERE tablename = 'construction_logs'
ORDER BY policyname;

-- ==================== SUCCESS MESSAGE ====================

DO $$
BEGIN
    RAISE NOTICE '✓ Construction logs table setup completed successfully!';
    RAISE NOTICE '✓ Table: public.construction_logs created';
    RAISE NOTICE '✓ Indexes: 5 indexes created for optimal performance';
    RAISE NOTICE '✓ RLS: Row Level Security enabled with 4 policies';
    RAISE NOTICE '✓ Trigger: auto-update timestamp trigger created';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Create storage bucket "construction-photos" in Supabase Dashboard';
    RAISE NOTICE '2. Test the feature in the application';
    RAISE NOTICE '3. Verify data access with different user roles';
    RAISE NOTICE '';
    RAISE NOTICE 'For detailed setup guide, see: docs/database/SETUP_CONSTRUCTION_LOGS.md';
END $$;
