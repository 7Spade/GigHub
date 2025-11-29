-- Migration: Create Blueprint Helper Functions
-- Purpose: Create helper functions for blueprint RLS policies
-- Phase: 5 - Blueprint System
-- Created: 2025-12-01
-- Dependencies: 20251205000002_create_blueprint_members_table.sql

-- ============================================================================
-- IS_BLUEPRINT_MEMBER FUNCTION
-- ============================================================================

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
Uses SECURITY DEFINER with row_security = off to avoid RLS recursion.';

GRANT EXECUTE ON FUNCTION public.is_blueprint_member(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_member(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_member(UUID) FROM public;

-- ============================================================================
-- IS_BLUEPRINT_ADMIN FUNCTION
-- ============================================================================

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
'Returns true if auth.uid() is an admin or owner of the specified blueprint.
Uses SECURITY DEFINER with row_security = off to avoid RLS recursion.';

GRANT EXECUTE ON FUNCTION public.is_blueprint_admin(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_admin(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_admin(UUID) FROM public;

-- ============================================================================
-- IS_BLUEPRINT_OWNER FUNCTION
-- ============================================================================

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
'Returns true if auth.uid() is the owner of the specified blueprint.
Uses SECURITY DEFINER with row_security = off to avoid RLS recursion.';

GRANT EXECUTE ON FUNCTION public.is_blueprint_owner(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_owner(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_owner(UUID) FROM public;
