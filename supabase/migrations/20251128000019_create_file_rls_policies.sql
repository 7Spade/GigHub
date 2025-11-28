-- ============================================================================
-- Migration: Create File RLS Policies
-- Description: Row Level Security policies for file tables
-- Specification: docs/specs/setc/08-file-module.setc.md
-- ============================================================================

-- Enable RLS on files
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- SELECT: Blueprint members can view files
CREATE POLICY "blueprint_members_can_view_files" ON files FOR SELECT
USING (is_blueprint_member(blueprint_id));

-- INSERT: Members and above can upload files
CREATE POLICY "blueprint_members_can_upload_files" ON files FOR INSERT
WITH CHECK (
  is_blueprint_member(blueprint_id) AND
  get_user_role_in_blueprint(blueprint_id) IN ('owner', 'admin', 'member')
);

-- UPDATE: Creators or admins can modify files
CREATE POLICY "file_owners_can_update" ON files FOR UPDATE
USING (
  created_by = get_user_account_id()
  OR get_user_role_in_blueprint(blueprint_id) IN ('owner', 'admin')
);

-- DELETE: Admins and above can delete files
CREATE POLICY "blueprint_admins_can_delete_files" ON files FOR DELETE
USING (get_user_role_in_blueprint(blueprint_id) IN ('owner', 'admin'));

-- Enable RLS on file_versions
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;

-- SELECT: Inherit from files permissions
CREATE POLICY "file_versions_select" ON file_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM files f 
    WHERE f.id = file_versions.file_id 
    AND is_blueprint_member(f.blueprint_id)
  )
);

-- INSERT: Can create versions for own files or as admin
CREATE POLICY "file_versions_insert" ON file_versions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM files f 
    WHERE f.id = file_versions.file_id 
    AND (
      f.created_by = get_user_account_id()
      OR get_user_role_in_blueprint(f.blueprint_id) IN ('owner', 'admin')
    )
  )
);

-- Enable RLS on file_shares
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can view share info (for validation)
CREATE POLICY "file_shares_select" ON file_shares FOR SELECT
USING (true);

-- INSERT: Members can create shares
CREATE POLICY "file_shares_insert" ON file_shares FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM files f 
    WHERE f.id = file_shares.file_id 
    AND is_blueprint_member(f.blueprint_id)
  )
);

-- UPDATE: Creators can update shares
CREATE POLICY "file_shares_update" ON file_shares FOR UPDATE
USING (created_by = get_user_account_id());

-- DELETE: Creators can delete shares
CREATE POLICY "file_shares_delete" ON file_shares FOR DELETE
USING (created_by = get_user_account_id());
