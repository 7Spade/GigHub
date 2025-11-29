-- Migration: Create is_org_member Function
-- Purpose: Check if the current user is a member of an organization
-- Phase: 2 - Helper Functions
-- Created: 2025-12-01
-- Dependencies: 20251202000001_create_get_user_account_id_function.sql
-- Source: migrations-old/20251124000003_rewrite_organization_rls_policies.sql

-- ============================================================================
-- IS_ORG_MEMBER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
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
    FROM public.organization_members
    WHERE organization_id = target_org_id
      AND auth_user_id = auth.uid()
  );
END;
$$;

COMMENT ON FUNCTION public.is_org_member(UUID) IS
'Returns true if auth.uid() is a member of the specified organization.
Uses SECURITY DEFINER with row_security = off to avoid RLS recursion.';

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_org_member(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_member(UUID) FROM public;
