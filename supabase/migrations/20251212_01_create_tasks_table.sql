-- ============================================
-- Migration: Create Tasks Table
-- Created: 2025-12-12
-- Description: 建立任務表格，用於工地施工進度追蹤
-- ============================================

-- Drop table if exists (for development only)
-- DROP TABLE IF EXISTS public.tasks CASCADE;

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

-- ============================================
-- Indexes for Performance
-- ============================================

-- Index on blueprint_id for filtering tasks by blueprint
CREATE INDEX IF NOT EXISTS idx_tasks_blueprint_id ON public.tasks(blueprint_id);

-- Index on creator_id for filtering tasks by creator
CREATE INDEX IF NOT EXISTS idx_tasks_creator_id ON public.tasks(creator_id);

-- Index on assignee_id for filtering tasks by assignee
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);

-- Index on status for filtering by task status
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Index on due_date for sorting and filtering by deadline
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- Index on created_at for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- Index on deleted_at for filtering active/deleted tasks
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON public.tasks(deleted_at) WHERE deleted_at IS NULL;

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_blueprint_status ON public.tasks(blueprint_id, status) WHERE deleted_at IS NULL;

-- ============================================
-- Triggers for Updated At
-- ============================================

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

-- ============================================
-- Comments for Documentation
-- ============================================

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

-- ============================================
-- Grant Permissions
-- ============================================

-- Grant permissions to authenticated users
-- Note: Actual access is controlled by RLS policies (see next migration)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon;

-- ============================================
-- Migration Complete
-- ============================================

-- Verify table creation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public') THEN
        RAISE NOTICE 'Migration 20251212_01_create_tasks_table completed successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create tasks table';
    END IF;
END $$;
