-- ============================================================================
-- Migration: Create File Shares Table
-- Description: External file sharing with access control
-- Specification: docs/specs/setc/08-file-module.setc.md
-- ============================================================================

-- Create file_shares table
CREATE TABLE file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  max_access_count INTEGER,
  created_by UUID NOT NULL REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX idx_file_shares_share_token ON file_shares(share_token);

-- Add comments
COMMENT ON TABLE file_shares IS '檔案分享表 - 外部分享連結';
COMMENT ON COLUMN file_shares.share_token IS '分享 Token (唯一)';
COMMENT ON COLUMN file_shares.password_hash IS '存取密碼雜湊';
COMMENT ON COLUMN file_shares.expires_at IS '過期時間';
COMMENT ON COLUMN file_shares.max_access_count IS '最大存取次數';
