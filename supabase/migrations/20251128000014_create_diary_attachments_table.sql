-- ============================================================================
-- Migration: Create Diary Attachments Table
-- Description: Manages photo attachments for construction diaries
-- Specification: docs/specs/setc/06-diary-module.setc.md
-- ============================================================================

-- Create diary_attachments table
CREATE TABLE diary_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id),
  caption TEXT,
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),
  taken_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_diary_attachments_diary_id ON diary_attachments(diary_id);

-- Add comments
COMMENT ON TABLE diary_attachments IS '日誌附件表 - 施工現場照片記錄';
COMMENT ON COLUMN diary_attachments.caption IS '照片說明';
COMMENT ON COLUMN diary_attachments.gps_latitude IS 'GPS 緯度';
COMMENT ON COLUMN diary_attachments.gps_longitude IS 'GPS 經度';
COMMENT ON COLUMN diary_attachments.taken_at IS '拍攝時間';
