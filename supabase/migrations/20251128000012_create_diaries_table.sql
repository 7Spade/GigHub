-- ============================================================================
-- Migration: Create Diaries Table
-- Description: Implements diary system for daily construction records
-- Specification: docs/specs/setc/06-diary-module.setc.md
-- ============================================================================

-- Create diaries table
CREATE TABLE diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  work_summary TEXT,
  work_hours DECIMAL(5,2) DEFAULT 0,
  worker_count INTEGER DEFAULT 0,
  weather TEXT CHECK (weather IN (
    'sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy'
  )),
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'approved', 'rejected'
  )),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES accounts(id),
  rejection_reason TEXT,
  created_by UUID NOT NULL REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (blueprint_id, work_date)
);

-- Create indexes
CREATE INDEX idx_diaries_blueprint_id ON diaries(blueprint_id);
CREATE INDEX idx_diaries_work_date ON diaries(work_date);
CREATE INDEX idx_diaries_status ON diaries(status);
CREATE INDEX idx_diaries_created_by ON diaries(created_by);

-- Add comments
COMMENT ON TABLE diaries IS '施工日誌主表 - 每日施工記錄';
COMMENT ON COLUMN diaries.work_date IS '施工日期';
COMMENT ON COLUMN diaries.work_summary IS '工作摘要';
COMMENT ON COLUMN diaries.work_hours IS '施工工時';
COMMENT ON COLUMN diaries.worker_count IS '施工人數';
COMMENT ON COLUMN diaries.weather IS '天氣狀況';
COMMENT ON COLUMN diaries.status IS '日誌狀態: draft/submitted/approved/rejected';
