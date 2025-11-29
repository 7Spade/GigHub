-- Migration: Create Organization Members RLS Policies
-- Purpose: Define RLS policies for organization_members table
-- Phase: 3 - RLS Policies
-- Created: 2025-12-01
-- Dependencies: 20251203000002_create_user_rls_policies.sql
-- Source: migrations-old/20251124000006_fix_membership_rls_policies.sql
-- Source: migrations-old/20251124000011_fix_org_members_select_circular_dependency.sql

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;
DROP POLICY IF EXISTS "org_admins_insert" ON public.organization_members;
DROP POLICY IF EXISTS "org_admins_update" ON public.organization_members;
DROP POLICY IF EXISTS "org_admins_delete" ON public.organization_members;

-- ============================================================================
-- SELECT POLICY
-- ============================================================================

-- Uses auth_user_id directly to avoid circular dependency
CREATE POLICY "org_members_select"
ON public.organization_members
FOR SELECT
USING (
  auth_user_id = auth.uid()
  OR
  organization_id IN (
    SELECT om.organization_id
    FROM public.organization_members om
    WHERE om.auth_user_id = auth.uid()
  )
);

COMMENT ON POLICY "org_members_select" ON public.organization_members IS
'Members can view their own membership and all members of organizations they belong to.
Uses auth_user_id directly to avoid RLS recursion.';

-- ============================================================================
-- INSERT POLICY
-- ============================================================================

CREATE POLICY "org_admins_insert"
ON public.organization_members
FOR INSERT
WITH CHECK (
  public.is_org_admin(organization_id)
);

COMMENT ON POLICY "org_admins_insert" ON public.organization_members IS
'Only organization owners/admins can add new members.';

-- ============================================================================
-- UPDATE POLICY
-- ============================================================================

CREATE POLICY "org_admins_update"
ON public.organization_members
FOR UPDATE
USING (
  public.is_org_admin(organization_id)
)
WITH CHECK (
  public.is_org_admin(organization_id)
);

COMMENT ON POLICY "org_admins_update" ON public.organization_members IS
'Only organization owners/admins can update member roles.';

-- ============================================================================
-- DELETE POLICY
-- ============================================================================

CREATE POLICY "org_admins_delete"
ON public.organization_members
FOR DELETE
USING (
  public.is_org_admin(organization_id)
  OR
  auth_user_id = auth.uid()  -- Members can remove themselves
);

COMMENT ON POLICY "org_admins_delete" ON public.organization_members IS
'Organization owners/admins can remove members. Members can remove themselves.';
