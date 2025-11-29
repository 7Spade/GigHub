-- Migration: Create is_team_member Function
-- Purpose: Check if the current user is a member of a team
-- Phase: 2 - Helper Functions
-- Created: 2025-12-01
-- Dependencies: 20251202000003_create_is_org_admin_function.sql
-- Source: migrations-old/20251124000005_create_team_rls_policies.sql

-- ============================================================================
-- IS_TEAM_MEMBER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_team_member(target_team_id UUID)
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
    FROM public.team_members
    WHERE team_id = target_team_id
      AND auth_user_id = auth.uid()
  );
END;
$$;

COMMENT ON FUNCTION public.is_team_member(UUID) IS
'Returns true if auth.uid() is a member of the specified team.
Uses SECURITY DEFINER with row_security = off to avoid RLS recursion.';

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.is_team_member(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_team_member(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_team_member(UUID) FROM public;
