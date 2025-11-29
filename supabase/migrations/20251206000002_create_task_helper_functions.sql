-- Migration: Create Task Helper Functions
-- Purpose: Create helper functions for task RLS policies
-- Phase: 6 - Task System
-- Created: 2025-12-01
-- Dependencies: 20251206000001_create_tasks_table.sql

-- ============================================================================
-- CAN_ACCESS_TASK FUNCTION
-- ============================================================================

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
  -- Get the blueprint ID for the task
  SELECT blueprint_id INTO v_blueprint_id
  FROM public.tasks
  WHERE id = target_task_id
    AND deleted_at IS NULL;

  IF v_blueprint_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user is a member of the blueprint
  RETURN public.is_blueprint_member(v_blueprint_id);
END;
$$;

COMMENT ON FUNCTION public.can_access_task(UUID) IS
'Returns true if auth.uid() can access the specified task.
Uses SECURITY DEFINER with row_security = off to avoid RLS recursion.';

GRANT EXECUTE ON FUNCTION public.can_access_task(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_task(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_access_task(UUID) FROM public;
