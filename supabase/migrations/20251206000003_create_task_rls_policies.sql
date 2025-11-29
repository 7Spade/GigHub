-- Migration: Create Task RLS Policies
-- Purpose: Define RLS policies for tasks table
-- Phase: 6 - Task System
-- Created: 2025-12-01
-- Dependencies: 20251206000002_create_task_helper_functions.sql

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TASKS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "blueprint_members_view_tasks" ON public.tasks;
DROP POLICY IF EXISTS "blueprint_members_create_tasks" ON public.tasks;
DROP POLICY IF EXISTS "blueprint_members_update_tasks" ON public.tasks;
DROP POLICY IF EXISTS "blueprint_admins_delete_tasks" ON public.tasks;

-- SELECT
CREATE POLICY "blueprint_members_view_tasks"
ON public.tasks
FOR SELECT
USING (
  deleted_at IS NULL AND
  public.is_blueprint_member(blueprint_id)
);

COMMENT ON POLICY "blueprint_members_view_tasks" ON public.tasks IS
'Blueprint members can view all tasks in the blueprint.';

-- INSERT
CREATE POLICY "blueprint_members_create_tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  public.is_blueprint_member(blueprint_id)
);

COMMENT ON POLICY "blueprint_members_create_tasks" ON public.tasks IS
'Blueprint members can create tasks.';

-- UPDATE
CREATE POLICY "blueprint_members_update_tasks"
ON public.tasks
FOR UPDATE
USING (
  public.is_blueprint_member(blueprint_id)
)
WITH CHECK (
  public.is_blueprint_member(blueprint_id)
);

COMMENT ON POLICY "blueprint_members_update_tasks" ON public.tasks IS
'Blueprint members can update tasks.';

-- DELETE (soft delete via status update)
CREATE POLICY "blueprint_admins_delete_tasks"
ON public.tasks
FOR DELETE
USING (
  public.is_blueprint_admin(blueprint_id)
);

COMMENT ON POLICY "blueprint_admins_delete_tasks" ON public.tasks IS
'Only blueprint admins can hard delete tasks.';
