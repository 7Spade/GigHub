-- ============================================================================
-- Migration: Create Diary Tasks Table
-- Description: Links diaries to tasks for work hour tracking
-- Specification: docs/specs/setc/06-diary-module.setc.md
-- ============================================================================

-- Create diary_tasks table
CREATE TABLE diary_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  work_hours DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (diary_id, task_id)
);

-- Create indexes
CREATE INDEX idx_diary_tasks_diary_id ON diary_tasks(diary_id);
CREATE INDEX idx_diary_tasks_task_id ON diary_tasks(task_id);

-- Add comments
COMMENT ON TABLE diary_tasks IS '日誌任務關聯表 - 記錄各任務的工時投入';
COMMENT ON COLUMN diary_tasks.work_hours IS '該任務工時';
COMMENT ON COLUMN diary_tasks.notes IS '工作備註';
