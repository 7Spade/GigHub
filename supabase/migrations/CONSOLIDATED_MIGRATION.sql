-- ============================================
-- GigHub Consolidated Migration
-- Created: 2025-12-12
-- Source: PR #63
-- Description: 整合所有遷移檔案，用於一次性執行
-- ============================================
-- 
-- 此檔案整合了以下遷移：
--   1. 20251212_01_create_tasks_table.sql - Tasks 表格
--   2. 20251212_02_create_logs_table.sql - Logs 表格
--   3. 20251212_03_create_rls_policies.sql - RLS 政策
-- 
-- 執行方式：
--   1. 在 Supabase Dashboard SQL Editor 中貼上此檔案內容
--   2. 點擊 "Run" 執行
--   3. 檢查執行結果，確認沒有錯誤
--
-- 注意事項：
--   - 此腳本具有冪等性 (可重複執行)
--   - 使用 CREATE TABLE IF NOT EXISTS
--   - 使用 CREATE INDEX IF NOT EXISTS
--   - 使用 CREATE OR REPLACE FUNCTION
--   - 執行前會先 DROP 既有的觸發器
-- ============================================

-- ============================================
-- MIGRATION 1: Create Tasks Table
-- ============================================

BEGIN;

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    blueprint_id UUID NOT NULL,
    creator_id UUID NOT NULL,
    assignee_id UUID,
    
    -- Task Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'TODO',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    
    -- Dates
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT tasks_status_check CHECK (status IN ('TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT tasks_priority_check CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'))
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_tasks_blueprint_id ON public.tasks(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_creator_id ON public.tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON public.tasks(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_blueprint_status ON public.tasks(blueprint_id, status) WHERE deleted_at IS NULL;

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for Documentation
COMMENT ON TABLE public.tasks IS '任務表格：用於追蹤工地施工進度任務';
COMMENT ON COLUMN public.tasks.id IS '任務唯一識別碼';
COMMENT ON COLUMN public.tasks.blueprint_id IS '關聯藍圖 ID（外鍵）';
COMMENT ON COLUMN public.tasks.creator_id IS '任務建立者 ID（對應 Firebase Auth UID）';
COMMENT ON COLUMN public.tasks.assignee_id IS '任務負責人 ID（對應 Firebase Auth UID）';
COMMENT ON COLUMN public.tasks.title IS '任務標題';
COMMENT ON COLUMN public.tasks.description IS '任務詳細描述';
COMMENT ON COLUMN public.tasks.status IS '任務狀態：TODO, IN_PROGRESS, REVIEW, COMPLETED, CANCELLED';
COMMENT ON COLUMN public.tasks.priority IS '任務優先級：LOW, MEDIUM, HIGH, URGENT';
COMMENT ON COLUMN public.tasks.due_date IS '任務截止日期';
COMMENT ON COLUMN public.tasks.tags IS '任務標籤陣列';
COMMENT ON COLUMN public.tasks.attachments IS '附件資訊（JSONB 格式）';
COMMENT ON COLUMN public.tasks.metadata IS '額外元資料（JSONB 格式）';
COMMENT ON COLUMN public.tasks.deleted_at IS '軟刪除時間戳記（NULL 表示未刪除）';

-- Grant Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon;

RAISE NOTICE 'Migration 1: Tasks table created successfully';

COMMIT;

-- ============================================
-- MIGRATION 2: Create Logs Table
-- ============================================

BEGIN;

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

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_logs_blueprint_id ON public.logs(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_logs_creator_id ON public.logs(creator_id);
CREATE INDEX IF NOT EXISTS idx_logs_date ON public.logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_deleted_at ON public.logs(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_logs_blueprint_date ON public.logs(blueprint_id, date DESC) WHERE deleted_at IS NULL;

-- GIN index for JSONB columns
CREATE INDEX IF NOT EXISTS idx_logs_photos_gin ON public.logs USING gin(photos);
CREATE INDEX IF NOT EXISTS idx_logs_documents_gin ON public.logs USING gin(documents);
CREATE INDEX IF NOT EXISTS idx_logs_metadata_gin ON public.logs USING gin(metadata);

-- Create trigger to automatically update updated_at on row update
DROP TRIGGER IF EXISTS update_logs_updated_at ON public.logs;
CREATE TRIGGER update_logs_updated_at
    BEFORE UPDATE ON public.logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

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

-- Comments for Documentation
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

-- Grant Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logs TO anon;

RAISE NOTICE 'Migration 2: Logs table created successfully';

COMMIT;

-- ============================================
-- MIGRATION 3: Create RLS Policies
-- ============================================

BEGIN;

-- Enable RLS on tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

RAISE NOTICE 'RLS enabled on tasks and logs tables';

-- Helper Functions for RLS

-- Function to extract organization_id from JWT claims
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        current_setting('request.jwt.claims', true)::json->>'organization_id'
    )::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extract user_id (sub) from JWT claims
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        current_setting('request.jwt.claims', true)::json->>'sub'
    )::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extract user role from JWT claims
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('request.jwt.claims', true)::json->>'role';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'member';  -- Default role
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if blueprint belongs to user's organization
CREATE OR REPLACE FUNCTION public.is_blueprint_in_user_organization(blueprint_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_org_id UUID;
    blueprint_org_id UUID;
BEGIN
    user_org_id := public.get_user_organization_id();
    
    IF user_org_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Note: This assumes blueprints table exists with organization_id column
    SELECT organization_id INTO blueprint_org_id
    FROM public.blueprints
    WHERE id = blueprint_uuid;
    
    RETURN blueprint_org_id = user_org_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE 'Helper functions for RLS created successfully';

-- Tasks Table RLS Policies

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.tasks;
    DROP POLICY IF EXISTS "Users can create tasks in their organization" ON public.tasks;
    DROP POLICY IF EXISTS "Users can update tasks in their organization" ON public.tasks;
    DROP POLICY IF EXISTS "Admins can delete tasks in their organization" ON public.tasks;
    DROP POLICY IF EXISTS "Admins can view deleted tasks" ON public.tasks;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Policy 1: SELECT - Users can view tasks in their organization
CREATE POLICY "Users can view tasks in their organization"
ON public.tasks
FOR SELECT
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND deleted_at IS NULL
);

-- Policy 2: INSERT - Users can create tasks in their organization
CREATE POLICY "Users can create tasks in their organization"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND creator_id = public.get_user_id()
);

-- Policy 3: UPDATE - Users can update tasks in their organization
CREATE POLICY "Users can update tasks in their organization"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND deleted_at IS NULL
)
WITH CHECK (
    public.is_blueprint_in_user_organization(blueprint_id)
);

-- Policy 4: DELETE - Only admins can delete tasks
CREATE POLICY "Admins can delete tasks in their organization"
ON public.tasks
FOR DELETE
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND public.get_user_role() = 'admin'
);

-- Policy 5: SELECT (Soft Deleted) - Admins can view deleted tasks
CREATE POLICY "Admins can view deleted tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND deleted_at IS NOT NULL
    AND public.get_user_role() = 'admin'
);

RAISE NOTICE 'RLS policies for tasks table created successfully';

-- Logs Table RLS Policies

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view logs in their organization" ON public.logs;
    DROP POLICY IF EXISTS "Users can create logs in their organization" ON public.logs;
    DROP POLICY IF EXISTS "Users can update their own logs" ON public.logs;
    DROP POLICY IF EXISTS "Admins can update all logs in their organization" ON public.logs;
    DROP POLICY IF EXISTS "Users can delete their own logs or admins can delete all" ON public.logs;
    DROP POLICY IF EXISTS "Admins can view deleted logs" ON public.logs;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Policy 1: SELECT - Users can view logs in their organization
CREATE POLICY "Users can view logs in their organization"
ON public.logs
FOR SELECT
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND deleted_at IS NULL
);

-- Policy 2: INSERT - Users can create logs in their organization
CREATE POLICY "Users can create logs in their organization"
ON public.logs
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND creator_id = public.get_user_id()
);

-- Policy 3: UPDATE - Users can update their own logs
CREATE POLICY "Users can update their own logs"
ON public.logs
FOR UPDATE
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND creator_id = public.get_user_id()
    AND deleted_at IS NULL
)
WITH CHECK (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND creator_id = public.get_user_id()
);

-- Policy 4: UPDATE (Admin) - Admins can update all logs
CREATE POLICY "Admins can update all logs in their organization"
ON public.logs
FOR UPDATE
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND public.get_user_role() = 'admin'
    AND deleted_at IS NULL
)
WITH CHECK (
    public.is_blueprint_in_user_organization(blueprint_id)
);

-- Policy 5: DELETE - Users can delete their own logs, admins can delete all
CREATE POLICY "Users can delete their own logs or admins can delete all"
ON public.logs
FOR DELETE
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND (
        creator_id = public.get_user_id()
        OR public.get_user_role() = 'admin'
    )
);

-- Policy 6: SELECT (Soft Deleted) - Admins can view deleted logs
CREATE POLICY "Admins can view deleted logs"
ON public.logs
FOR SELECT
TO authenticated
USING (
    public.is_blueprint_in_user_organization(blueprint_id)
    AND deleted_at IS NOT NULL
    AND public.get_user_role() = 'admin'
);

RAISE NOTICE 'RLS policies for logs table created successfully';

-- Testing and Verification Function
CREATE OR REPLACE FUNCTION public.test_rls_policies()
RETURNS TABLE (
    test_name TEXT,
    passed BOOLEAN,
    message TEXT
) AS $$
BEGIN
    -- Test 1: Verify RLS is enabled
    RETURN QUERY
    SELECT 
        'RLS Enabled on Tasks'::TEXT,
        (SELECT relrowsecurity FROM pg_class WHERE relname = 'tasks')::BOOLEAN,
        'RLS should be enabled on tasks table'::TEXT;
    
    RETURN QUERY
    SELECT 
        'RLS Enabled on Logs'::TEXT,
        (SELECT relrowsecurity FROM pg_class WHERE relname = 'logs')::BOOLEAN,
        'RLS should be enabled on logs table'::TEXT;
    
    -- Test 2: Count policies
    RETURN QUERY
    SELECT 
        'Tasks Policies Count'::TEXT,
        (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'tasks') >= 5,
        'Should have at least 5 policies for tasks'::TEXT;
    
    RETURN QUERY
    SELECT 
        'Logs Policies Count'::TEXT,
        (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'logs') >= 6,
        'Should have at least 6 policies for logs'::TEXT;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE 'Migration 3: RLS policies created successfully';

COMMIT;

-- ============================================
-- Final Verification
-- ============================================

DO $$
DECLARE
    tasks_count INTEGER;
    logs_count INTEGER;
    tasks_policies_count INTEGER;
    logs_policies_count INTEGER;
BEGIN
    -- Check tables exist
    SELECT COUNT(*) INTO tasks_count 
    FROM information_schema.tables 
    WHERE table_name = 'tasks' AND table_schema = 'public';
    
    SELECT COUNT(*) INTO logs_count 
    FROM information_schema.tables 
    WHERE table_name = 'logs' AND table_schema = 'public';
    
    -- Count policies
    SELECT COUNT(*) INTO tasks_policies_count 
    FROM pg_policies 
    WHERE tablename = 'tasks';
    
    SELECT COUNT(*) INTO logs_policies_count 
    FROM pg_policies 
    WHERE tablename = 'logs';
    
    IF tasks_count = 1 AND logs_count = 1 THEN
        RAISE NOTICE '✅ All tables created successfully';
    ELSE
        RAISE WARNING '⚠️ Table creation may have failed';
    END IF;
    
    IF tasks_policies_count >= 5 AND logs_policies_count >= 6 THEN
        RAISE NOTICE '✅ All RLS policies created successfully';
        RAISE NOTICE 'Tasks policies: %, Logs policies: %', tasks_policies_count, logs_policies_count;
    ELSE
        RAISE WARNING '⚠️ RLS policies may not be fully configured';
        RAISE WARNING 'Tasks policies: %, Logs policies: %', tasks_policies_count, logs_policies_count;
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Consolidated Migration Completed';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Run: SELECT * FROM public.test_rls_policies();';
    RAISE NOTICE '2. Configure Firebase Auth custom claims (organization_id, role)';
    RAISE NOTICE '3. Create storage buckets: task-attachments, log-photos';
    RAISE NOTICE '4. Configure storage policies via Dashboard';
END $$;

-- Run tests automatically
SELECT * FROM public.test_rls_policies();
