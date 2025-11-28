-- ============================================================================
-- Migration: Create Diary RLS Policies
-- Description: Row Level Security policies for diary tables
-- Specification: docs/specs/setc/06-diary-module.setc.md
-- ============================================================================

-- Enable RLS on diaries
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

-- SELECT: Blueprint members can view diaries
CREATE POLICY "blueprint_members_can_view_diaries" ON diaries FOR SELECT
USING (is_blueprint_member(blueprint_id));

-- INSERT: Members and above can create diaries
CREATE POLICY "blueprint_members_can_create_diaries" ON diaries FOR INSERT
WITH CHECK (
  is_blueprint_member(blueprint_id) AND
  get_user_role_in_blueprint(blueprint_id) IN ('owner', 'admin', 'member')
);

-- UPDATE: Creators can update draft/rejected diaries, admins can update any
CREATE POLICY "diary_creators_can_update" ON diaries FOR UPDATE
USING (
  (created_by = get_user_account_id() AND status IN ('draft', 'rejected'))
  OR get_user_role_in_blueprint(blueprint_id) IN ('owner', 'admin')
);

-- DELETE: Admins and above can delete diaries
CREATE POLICY "blueprint_admins_can_delete_diaries" ON diaries FOR DELETE
USING (get_user_role_in_blueprint(blueprint_id) IN ('owner', 'admin'));

-- Enable RLS on diary_tasks
ALTER TABLE diary_tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: Inherit from diary permissions
CREATE POLICY "diary_tasks_select" ON diary_tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM diaries d 
    WHERE d.id = diary_tasks.diary_id 
    AND is_blueprint_member(d.blueprint_id)
  )
);

-- INSERT: Can add tasks to own diaries or as admin
CREATE POLICY "diary_tasks_insert" ON diary_tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM diaries d 
    WHERE d.id = diary_tasks.diary_id 
    AND (
      d.created_by = get_user_account_id()
      OR get_user_role_in_blueprint(d.blueprint_id) IN ('owner', 'admin')
    )
  )
);

-- UPDATE: Can update own diary tasks
CREATE POLICY "diary_tasks_update" ON diary_tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM diaries d 
    WHERE d.id = diary_tasks.diary_id 
    AND (
      d.created_by = get_user_account_id()
      OR get_user_role_in_blueprint(d.blueprint_id) IN ('owner', 'admin')
    )
  )
);

-- DELETE: Can delete own diary tasks
CREATE POLICY "diary_tasks_delete" ON diary_tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM diaries d 
    WHERE d.id = diary_tasks.diary_id 
    AND (
      d.created_by = get_user_account_id()
      OR get_user_role_in_blueprint(d.blueprint_id) IN ('owner', 'admin')
    )
  )
);

-- Enable RLS on diary_attachments
ALTER TABLE diary_attachments ENABLE ROW LEVEL SECURITY;

-- SELECT: Inherit from diary permissions
CREATE POLICY "diary_attachments_select" ON diary_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM diaries d 
    WHERE d.id = diary_attachments.diary_id 
    AND is_blueprint_member(d.blueprint_id)
  )
);

-- INSERT: Can add attachments to own diaries or as admin
CREATE POLICY "diary_attachments_insert" ON diary_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM diaries d 
    WHERE d.id = diary_attachments.diary_id 
    AND (
      d.created_by = get_user_account_id()
      OR get_user_role_in_blueprint(d.blueprint_id) IN ('owner', 'admin')
    )
  )
);

-- UPDATE: Can update own diary attachments
CREATE POLICY "diary_attachments_update" ON diary_attachments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM diaries d 
    WHERE d.id = diary_attachments.diary_id 
    AND (
      d.created_by = get_user_account_id()
      OR get_user_role_in_blueprint(d.blueprint_id) IN ('owner', 'admin')
    )
  )
);

-- DELETE: Can delete own diary attachments
CREATE POLICY "diary_attachments_delete" ON diary_attachments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM diaries d 
    WHERE d.id = diary_attachments.diary_id 
    AND (
      d.created_by = get_user_account_id()
      OR get_user_role_in_blueprint(d.blueprint_id) IN ('owner', 'admin')
    )
  )
);
