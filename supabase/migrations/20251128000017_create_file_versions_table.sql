-- ============================================================================
-- Migration: Create File Versions Table
-- Description: Version control for files
-- Specification: docs/specs/setc/08-file-module.setc.md
-- ============================================================================

-- Create file_versions table
CREATE TABLE file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT,
  change_notes TEXT,
  created_by UUID NOT NULL REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (file_id, version)
);

-- Create indexes
CREATE INDEX idx_file_versions_file_id ON file_versions(file_id);

-- Add comments
COMMENT ON TABLE file_versions IS '檔案版本表 - 版本控制歷史';
COMMENT ON COLUMN file_versions.version IS '版本號';
COMMENT ON COLUMN file_versions.change_notes IS '版本更新說明';
