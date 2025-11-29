-- ============================================================================
-- Migration: Create blueprints and tasks tables with RLS
-- Purpose: Create the blueprints and tasks tables with proper RLS policies
--          to allow users to create and manage blueprints and tasks.
-- Date: 2025-11-29
-- ============================================================================

BEGIN;

-- ============================================================================
-- CREATE BLUEPRINTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived', 'deleted')),
  owner_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.blueprints IS 'Blueprints are logical containers for tasks and other data. They provide data isolation between projects.';

-- ============================================================================
-- CREATE BLUEPRINT_MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blueprint_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  auth_user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blueprint_id, account_id)
);

COMMENT ON TABLE public.blueprint_members IS 'Blueprint membership linking accounts to blueprints with roles.';

-- ============================================================================
-- CREATE TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'in_review', 'completed', 'cancelled', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('lowest', 'low', 'medium', 'high', 'highest')),
  task_type TEXT NOT NULL DEFAULT 'task' CHECK (task_type IN ('task', 'milestone', 'bug', 'feature', 'improvement')),
  assignee_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  due_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tasks IS 'Tasks within blueprints. Supports hierarchical task structures with parent_id.';

-- ============================================================================
-- CREATE TASK_ATTACHMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.task_attachments IS 'File attachments for tasks.';

-- ============================================================================
-- CREATE CHECKLISTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.checklists IS 'Reusable checklists for quality acceptance.';

-- ============================================================================
-- CREATE CHECKLIST_ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.checklist_items IS 'Individual items within a checklist.';

-- ============================================================================
-- CREATE TASK_ACCEPTANCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.task_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES public.checklist_items(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'conditional')),
  notes TEXT,
  accepted_by UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.task_acceptances IS 'Quality acceptance records for tasks.';

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_blueprints_owner ON public.blueprints(owner_account_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_status ON public.blueprints(status);
CREATE INDEX IF NOT EXISTS idx_blueprint_members_blueprint ON public.blueprint_members(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_members_account ON public.blueprint_members(account_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_members_auth_user ON public.blueprint_members(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_blueprint ON public.tasks(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON public.tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON public.task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_checklists_blueprint ON public.checklists(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON public.checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_task_acceptances_task ON public.task_acceptances(task_id);

-- ============================================================================
-- HELPER FUNCTIONS FOR BLUEPRINT RLS
-- ============================================================================

-- Function to check if user is a blueprint member
CREATE OR REPLACE FUNCTION public.is_blueprint_member(target_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.blueprint_members
    WHERE blueprint_id = target_blueprint_id
      AND auth_user_id = auth.uid()
  );
END;
$$;

COMMENT ON FUNCTION public.is_blueprint_member(UUID) IS
'Returns true if auth.uid() is a member of the specified blueprint.
Uses SECURITY DEFINER to avoid RLS recursion.';

GRANT EXECUTE ON FUNCTION public.is_blueprint_member(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_member(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_member(UUID) FROM public;

-- Function to check if user is a blueprint owner or admin
CREATE OR REPLACE FUNCTION public.is_blueprint_admin(target_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.blueprint_members
    WHERE blueprint_id = target_blueprint_id
      AND auth_user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
END;
$$;

COMMENT ON FUNCTION public.is_blueprint_admin(UUID) IS
'Returns true if auth.uid() is an owner or admin of the specified blueprint.
Uses SECURITY DEFINER to avoid RLS recursion.';

GRANT EXECUTE ON FUNCTION public.is_blueprint_admin(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_admin(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_admin(UUID) FROM public;

-- Function to check if user is a blueprint owner
CREATE OR REPLACE FUNCTION public.is_blueprint_owner(target_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.blueprint_members
    WHERE blueprint_id = target_blueprint_id
      AND auth_user_id = auth.uid()
      AND role = 'owner'
  );
END;
$$;

COMMENT ON FUNCTION public.is_blueprint_owner(UUID) IS
'Returns true if auth.uid() is an owner of the specified blueprint.
Uses SECURITY DEFINER to avoid RLS recursion.';

GRANT EXECUTE ON FUNCTION public.is_blueprint_owner(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_owner(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_owner(UUID) FROM public;

-- ============================================================================
-- AUTO-ADD CREATOR AS BLUEPRINT OWNER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.add_blueprint_creator_as_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $$
DECLARE
  v_user_account_id UUID;
BEGIN
  -- Get creator's account_id
  SELECT id INTO v_user_account_id
  FROM public.accounts
  WHERE auth_user_id = auth.uid()
    AND type = 'User'
    AND status != 'deleted'
  LIMIT 1;

  -- Add creator as blueprint owner
  IF v_user_account_id IS NOT NULL THEN
    INSERT INTO public.blueprint_members (
      blueprint_id,
      account_id,
      auth_user_id,
      role,
      invited_by
    ) VALUES (
      NEW.id,
      v_user_account_id,
      auth.uid(),
      'owner',
      v_user_account_id
    )
    ON CONFLICT (blueprint_id, account_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.add_blueprint_creator_as_owner() IS
'Automatically adds the blueprint creator as owner when a new blueprint is created.';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS add_blueprint_creator_as_owner_trigger ON public.blueprints;

CREATE TRIGGER add_blueprint_creator_as_owner_trigger
  AFTER INSERT ON public.blueprints
  FOR EACH ROW
  EXECUTE FUNCTION public.add_blueprint_creator_as_owner();

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprint_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_acceptances ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BLUEPRINTS RLS POLICIES
-- ============================================================================

-- SELECT: Members can view their blueprints, public blueprints visible to all
CREATE POLICY "blueprint_members_can_view" ON public.blueprints
FOR SELECT
TO authenticated
USING (
  status != 'deleted'
  AND (
    -- User is a member of this blueprint
    public.is_blueprint_member(id)
    OR
    -- Public blueprints are visible to all authenticated users
    visibility = 'public'
    OR
    -- User created this blueprint
    created_by = public.get_user_account_id()
  )
);

COMMENT ON POLICY "blueprint_members_can_view" ON public.blueprints IS
'Allows blueprint members to view their blueprints. Public blueprints visible to all authenticated users.';

-- INSERT: Authenticated users can create blueprints
CREATE POLICY "authenticated_users_create_blueprints" ON public.blueprints
FOR INSERT
TO authenticated
WITH CHECK (
  status != 'deleted'
);

COMMENT ON POLICY "authenticated_users_create_blueprints" ON public.blueprints IS
'Allows authenticated users to create blueprints.
The trigger add_blueprint_creator_as_owner will add them as owner.';

-- UPDATE: Blueprint admins/owners can update blueprints
CREATE POLICY "blueprint_admins_update" ON public.blueprints
FOR UPDATE
TO authenticated
USING (
  status != 'deleted'
  AND public.is_blueprint_admin(id)
)
WITH CHECK (
  status != 'deleted'
  AND public.is_blueprint_admin(id)
);

COMMENT ON POLICY "blueprint_admins_update" ON public.blueprints IS
'Allows blueprint owners and admins to update blueprint settings.';

-- DELETE: Blueprint owners can delete (soft delete via status='deleted')
CREATE POLICY "blueprint_owners_delete" ON public.blueprints
FOR DELETE
TO authenticated
USING (
  public.is_blueprint_owner(id)
);

COMMENT ON POLICY "blueprint_owners_delete" ON public.blueprints IS
'Allows blueprint owners to delete blueprints. Use soft delete (status=deleted) instead.';

-- ============================================================================
-- BLUEPRINT_MEMBERS RLS POLICIES
-- ============================================================================

-- SELECT: Users can view members of their blueprints or their own membership
CREATE POLICY "blueprint_members_view" ON public.blueprint_members
FOR SELECT
TO authenticated
USING (
  -- User is a member of this blueprint
  public.is_blueprint_member(blueprint_id)
  OR
  -- User's own membership record (for self-discovery)
  auth_user_id = auth.uid()
);

COMMENT ON POLICY "blueprint_members_view" ON public.blueprint_members IS
'Allows users to view members of blueprints they belong to, or their own membership record.';

-- INSERT: Blueprint admins can add members, or first owner
CREATE POLICY "blueprint_admins_add_members" ON public.blueprint_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Blueprint admins can add members
  public.is_blueprint_admin(blueprint_id)
  OR
  -- Allow initial owner insertion (no members exist yet)
  (
    role = 'owner'
    AND auth_user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.blueprint_members bm
      WHERE bm.blueprint_id = blueprint_members.blueprint_id
    )
  )
);

COMMENT ON POLICY "blueprint_admins_add_members" ON public.blueprint_members IS
'Allows blueprint admins to add new members. Also allows initial owner insertion.';

-- UPDATE: Blueprint admins can update member roles
CREATE POLICY "blueprint_admins_update_members" ON public.blueprint_members
FOR UPDATE
TO authenticated
USING (
  public.is_blueprint_admin(blueprint_id)
)
WITH CHECK (
  public.is_blueprint_admin(blueprint_id)
);

COMMENT ON POLICY "blueprint_admins_update_members" ON public.blueprint_members IS
'Allows blueprint admins to update member roles.';

-- DELETE: Blueprint admins can remove members, users can leave
CREATE POLICY "blueprint_admins_remove_members" ON public.blueprint_members
FOR DELETE
TO authenticated
USING (
  -- Blueprint admins can remove members
  public.is_blueprint_admin(blueprint_id)
  OR
  -- Users can remove themselves (leave blueprint)
  auth_user_id = auth.uid()
);

COMMENT ON POLICY "blueprint_admins_remove_members" ON public.blueprint_members IS
'Allows blueprint admins to remove members. Users can also leave blueprints themselves.';

-- ============================================================================
-- TASKS RLS POLICIES
-- ============================================================================

-- Helper function to check task access
CREATE OR REPLACE FUNCTION public.can_access_task(target_task_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_blueprint_id UUID;
BEGIN
  SELECT blueprint_id INTO v_blueprint_id
  FROM public.tasks
  WHERE id = target_task_id
    AND deleted_at IS NULL;
  
  IF v_blueprint_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN public.is_blueprint_member(v_blueprint_id);
END;
$$;

COMMENT ON FUNCTION public.can_access_task(UUID) IS
'Returns true if auth.uid() can access the specified task (via blueprint membership).';

GRANT EXECUTE ON FUNCTION public.can_access_task(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_task(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_access_task(UUID) FROM public;

-- SELECT: Blueprint members can view tasks
CREATE POLICY "blueprint_members_view_tasks" ON public.tasks
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND public.is_blueprint_member(blueprint_id)
);

COMMENT ON POLICY "blueprint_members_view_tasks" ON public.tasks IS
'Allows blueprint members to view tasks.';

-- INSERT: Blueprint members can create tasks
CREATE POLICY "blueprint_members_create_tasks" ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_blueprint_member(blueprint_id)
);

COMMENT ON POLICY "blueprint_members_create_tasks" ON public.tasks IS
'Allows blueprint members to create tasks.';

-- UPDATE: Blueprint members can update tasks
CREATE POLICY "blueprint_members_update_tasks" ON public.tasks
FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL
  AND public.is_blueprint_member(blueprint_id)
)
WITH CHECK (
  public.is_blueprint_member(blueprint_id)
);

COMMENT ON POLICY "blueprint_members_update_tasks" ON public.tasks IS
'Allows blueprint members to update tasks.';

-- DELETE: Blueprint admins can delete tasks
CREATE POLICY "blueprint_admins_delete_tasks" ON public.tasks
FOR DELETE
TO authenticated
USING (
  public.is_blueprint_admin(blueprint_id)
);

COMMENT ON POLICY "blueprint_admins_delete_tasks" ON public.tasks IS
'Allows blueprint admins to delete tasks. Prefer soft delete via deleted_at.';

-- ============================================================================
-- TASK_ATTACHMENTS RLS POLICIES
-- ============================================================================

-- SELECT: Users who can access the task can view attachments
CREATE POLICY "task_access_view_attachments" ON public.task_attachments
FOR SELECT
TO authenticated
USING (
  public.can_access_task(task_id)
);

COMMENT ON POLICY "task_access_view_attachments" ON public.task_attachments IS
'Allows users with task access to view task attachments.';

-- INSERT: Users who can access the task can add attachments
CREATE POLICY "task_access_create_attachments" ON public.task_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_access_task(task_id)
);

COMMENT ON POLICY "task_access_create_attachments" ON public.task_attachments IS
'Allows users with task access to create task attachments.';

-- DELETE: Users who can access the task can delete attachments
CREATE POLICY "task_access_delete_attachments" ON public.task_attachments
FOR DELETE
TO authenticated
USING (
  public.can_access_task(task_id)
);

COMMENT ON POLICY "task_access_delete_attachments" ON public.task_attachments IS
'Allows users with task access to delete task attachments.';

-- ============================================================================
-- CHECKLISTS RLS POLICIES
-- ============================================================================

-- SELECT: Blueprint members can view checklists
CREATE POLICY "blueprint_members_view_checklists" ON public.checklists
FOR SELECT
TO authenticated
USING (
  public.is_blueprint_member(blueprint_id)
);

COMMENT ON POLICY "blueprint_members_view_checklists" ON public.checklists IS
'Allows blueprint members to view checklists.';

-- INSERT: Blueprint admins can create checklists
CREATE POLICY "blueprint_admins_create_checklists" ON public.checklists
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_blueprint_admin(blueprint_id)
);

COMMENT ON POLICY "blueprint_admins_create_checklists" ON public.checklists IS
'Allows blueprint admins to create checklists.';

-- UPDATE: Blueprint admins can update checklists
CREATE POLICY "blueprint_admins_update_checklists" ON public.checklists
FOR UPDATE
TO authenticated
USING (
  public.is_blueprint_admin(blueprint_id)
)
WITH CHECK (
  public.is_blueprint_admin(blueprint_id)
);

COMMENT ON POLICY "blueprint_admins_update_checklists" ON public.checklists IS
'Allows blueprint admins to update checklists.';

-- DELETE: Blueprint admins can delete checklists
CREATE POLICY "blueprint_admins_delete_checklists" ON public.checklists
FOR DELETE
TO authenticated
USING (
  public.is_blueprint_admin(blueprint_id)
);

COMMENT ON POLICY "blueprint_admins_delete_checklists" ON public.checklists IS
'Allows blueprint admins to delete checklists.';

-- ============================================================================
-- CHECKLIST_ITEMS RLS POLICIES
-- ============================================================================

-- Helper function to check checklist access
CREATE OR REPLACE FUNCTION public.can_access_checklist(target_checklist_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_blueprint_id UUID;
BEGIN
  SELECT blueprint_id INTO v_blueprint_id
  FROM public.checklists
  WHERE id = target_checklist_id;
  
  IF v_blueprint_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN public.is_blueprint_member(v_blueprint_id);
END;
$$;

COMMENT ON FUNCTION public.can_access_checklist(UUID) IS
'Returns true if auth.uid() can access the specified checklist (via blueprint membership).';

GRANT EXECUTE ON FUNCTION public.can_access_checklist(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_checklist(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_access_checklist(UUID) FROM public;

-- Helper function to check if user is checklist admin
CREATE OR REPLACE FUNCTION public.is_checklist_admin(target_checklist_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_blueprint_id UUID;
BEGIN
  SELECT blueprint_id INTO v_blueprint_id
  FROM public.checklists
  WHERE id = target_checklist_id;
  
  IF v_blueprint_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN public.is_blueprint_admin(v_blueprint_id);
END;
$$;

COMMENT ON FUNCTION public.is_checklist_admin(UUID) IS
'Returns true if auth.uid() is an admin of the blueprint containing the checklist.';

GRANT EXECUTE ON FUNCTION public.is_checklist_admin(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_checklist_admin(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_checklist_admin(UUID) FROM public;

-- SELECT: Users who can access the checklist can view items
CREATE POLICY "checklist_access_view_items" ON public.checklist_items
FOR SELECT
TO authenticated
USING (
  public.can_access_checklist(checklist_id)
);

COMMENT ON POLICY "checklist_access_view_items" ON public.checklist_items IS
'Allows users with checklist access to view checklist items.';

-- INSERT: Blueprint admins can create checklist items
CREATE POLICY "checklist_admins_create_items" ON public.checklist_items
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_checklist_admin(checklist_id)
);

COMMENT ON POLICY "checklist_admins_create_items" ON public.checklist_items IS
'Allows blueprint admins to create checklist items.';

-- UPDATE: Blueprint admins can update checklist items
CREATE POLICY "checklist_admins_update_items" ON public.checklist_items
FOR UPDATE
TO authenticated
USING (
  public.is_checklist_admin(checklist_id)
)
WITH CHECK (
  public.is_checklist_admin(checklist_id)
);

COMMENT ON POLICY "checklist_admins_update_items" ON public.checklist_items IS
'Allows blueprint admins to update checklist items.';

-- DELETE: Blueprint admins can delete checklist items
CREATE POLICY "checklist_admins_delete_items" ON public.checklist_items
FOR DELETE
TO authenticated
USING (
  public.is_checklist_admin(checklist_id)
);

COMMENT ON POLICY "checklist_admins_delete_items" ON public.checklist_items IS
'Allows blueprint admins to delete checklist items.';

-- ============================================================================
-- TASK_ACCEPTANCES RLS POLICIES
-- ============================================================================

-- SELECT: Users who can access the task can view acceptances
CREATE POLICY "task_access_view_acceptances" ON public.task_acceptances
FOR SELECT
TO authenticated
USING (
  public.can_access_task(task_id)
);

COMMENT ON POLICY "task_access_view_acceptances" ON public.task_acceptances IS
'Allows users with task access to view task acceptances.';

-- INSERT: Users who can access the task can create acceptances
CREATE POLICY "task_access_create_acceptances" ON public.task_acceptances
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_access_task(task_id)
);

COMMENT ON POLICY "task_access_create_acceptances" ON public.task_acceptances IS
'Allows users with task access to create task acceptances.';

-- UPDATE: Users who can access the task can update acceptances
CREATE POLICY "task_access_update_acceptances" ON public.task_acceptances
FOR UPDATE
TO authenticated
USING (
  public.can_access_task(task_id)
)
WITH CHECK (
  public.can_access_task(task_id)
);

COMMENT ON POLICY "task_access_update_acceptances" ON public.task_acceptances IS
'Allows users with task access to update task acceptances.';

-- DELETE: Blueprint admins can delete acceptances
CREATE POLICY "task_admins_delete_acceptances" ON public.task_acceptances
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_acceptances.task_id
      AND public.is_blueprint_admin(t.blueprint_id)
  )
);

COMMENT ON POLICY "task_admins_delete_acceptances" ON public.task_acceptances IS
'Allows blueprint admins to delete task acceptances.';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON TABLE public.blueprints TO authenticated;
GRANT ALL ON TABLE public.blueprints TO service_role;
GRANT ALL ON TABLE public.blueprint_members TO authenticated;
GRANT ALL ON TABLE public.blueprint_members TO service_role;
GRANT ALL ON TABLE public.tasks TO authenticated;
GRANT ALL ON TABLE public.tasks TO service_role;
GRANT ALL ON TABLE public.task_attachments TO authenticated;
GRANT ALL ON TABLE public.task_attachments TO service_role;
GRANT ALL ON TABLE public.checklists TO authenticated;
GRANT ALL ON TABLE public.checklists TO service_role;
GRANT ALL ON TABLE public.checklist_items TO authenticated;
GRANT ALL ON TABLE public.checklist_items TO service_role;
GRANT ALL ON TABLE public.task_acceptances TO authenticated;
GRANT ALL ON TABLE public.task_acceptances TO service_role;

COMMIT;
