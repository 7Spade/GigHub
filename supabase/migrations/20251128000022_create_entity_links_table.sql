-- ============================================================================
-- Migration: Create Entity Links Table
-- Description: Cross-module entity relationships
-- Specification: docs/specs/setc/11-module-integration.setc.md
-- ============================================================================

-- Create entity_links table
CREATE TABLE entity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  link_type TEXT DEFAULT 'reference',
  created_by UUID NOT NULL REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (source_type, source_id, target_type, target_id)
);

-- Create indexes
CREATE INDEX idx_entity_links_source ON entity_links(source_type, source_id);
CREATE INDEX idx_entity_links_target ON entity_links(target_type, target_id);
CREATE INDEX idx_entity_links_blueprint ON entity_links(blueprint_id);

-- Add comments
COMMENT ON TABLE entity_links IS '實體關聯表 - 跨模組資源關聯';
COMMENT ON COLUMN entity_links.source_type IS '來源類型 (task, diary 等)';
COMMENT ON COLUMN entity_links.target_type IS '目標類型 (file, link 等)';
COMMENT ON COLUMN entity_links.link_type IS '關聯類型 (reference, attachment 等)';

-- Enable RLS
ALTER TABLE entity_links ENABLE ROW LEVEL SECURITY;

-- SELECT: Blueprint members can view entity links
CREATE POLICY "blueprint_members_can_view_entity_links" ON entity_links FOR SELECT
USING (is_blueprint_member(blueprint_id));

-- INSERT: Members can create entity links
CREATE POLICY "blueprint_members_can_create_entity_links" ON entity_links FOR INSERT
WITH CHECK (is_blueprint_member(blueprint_id));

-- DELETE: Creators or admins can delete entity links
CREATE POLICY "entity_link_creators_can_delete" ON entity_links FOR DELETE
USING (
  created_by = get_user_account_id()
  OR get_user_role_in_blueprint(blueprint_id) IN ('owner', 'admin')
);
