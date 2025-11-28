-- ============================================================================
-- Migration: Create Files Table
-- Description: File management system for blueprint documents
-- Specification: docs/specs/setc/08-file-module.setc.md
-- ============================================================================

-- Create files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES files(id),
  name VARCHAR(500) NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN (
    'folder', 'image', 'document', 'spreadsheet', 'cad', 'video', 'audio', 'other'
  )),
  mime_type VARCHAR(255),
  size_bytes BIGINT,
  storage_path TEXT,
  thumbnail_path TEXT,
  version INTEGER DEFAULT 1,
  current_version_id UUID,
  description TEXT,
  created_by UUID NOT NULL REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_files_blueprint_id ON files(blueprint_id);
CREATE INDEX idx_files_folder_id ON files(folder_id);
CREATE INDEX idx_files_name ON files(name);
CREATE INDEX idx_files_file_type ON files(file_type);
CREATE INDEX idx_files_created_by ON files(created_by);

-- Add comments
COMMENT ON TABLE files IS '檔案主表 - 藍圖文件管理';
COMMENT ON COLUMN files.folder_id IS '所屬資料夾ID (自關聯)';
COMMENT ON COLUMN files.file_type IS '檔案類型: folder/image/document/spreadsheet/cad/video/audio/other';
COMMENT ON COLUMN files.storage_path IS 'Supabase Storage 路徑';
COMMENT ON COLUMN files.thumbnail_path IS '縮圖路徑';
COMMENT ON COLUMN files.version IS '目前版本號';
