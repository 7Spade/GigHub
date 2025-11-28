-- ============================================================================
-- Migration: Create Links Table
-- Description: External resource links management
-- Specification: docs/specs/setc/09-link-module.setc.md
-- ============================================================================

-- Create links table
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title VARCHAR(500),
  description TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN (
    'document', 'design', 'reference', 'tool', 'other'
  )),
  thumbnail_url TEXT,
  site_name VARCHAR(255),
  favicon_url TEXT,
  is_valid BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_links_blueprint_id ON links(blueprint_id);
CREATE INDEX idx_links_category ON links(category);
CREATE INDEX idx_links_created_by ON links(created_by);

-- Add comments
COMMENT ON TABLE links IS '連結主表 - 外部資源連結管理';
COMMENT ON COLUMN links.url IS '連結 URL';
COMMENT ON COLUMN links.title IS '連結標題';
COMMENT ON COLUMN links.category IS '連結分類: document/design/reference/tool/other';
COMMENT ON COLUMN links.is_valid IS '連結是否有效';

-- Enable RLS
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- SELECT: Blueprint members can view links
CREATE POLICY "blueprint_members_can_view_links" ON links FOR SELECT
USING (is_blueprint_member(blueprint_id));

-- INSERT: Members can create links
CREATE POLICY "blueprint_members_can_create_links" ON links FOR INSERT
WITH CHECK (is_blueprint_member(blueprint_id));

-- UPDATE: Creators or admins can update links
CREATE POLICY "link_owners_can_update" ON links FOR UPDATE
USING (
  created_by = get_user_account_id()
  OR get_user_role_in_blueprint(blueprint_id) IN ('owner', 'admin')
);

-- DELETE: Admins can delete links
CREATE POLICY "blueprint_admins_can_delete_links" ON links FOR DELETE
USING (get_user_role_in_blueprint(blueprint_id) IN ('owner', 'admin'));
