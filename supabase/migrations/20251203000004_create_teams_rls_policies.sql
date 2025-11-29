-- Migration: Create Teams RLS Policies
-- Purpose: Define RLS policies for teams table
-- Phase: 3 - RLS Policies
-- Created: 2025-12-01
-- Dependencies: 20251203000003_create_org_members_rls_policies.sql
-- Source: migrations-old/20251124000005_create_team_rls_policies.sql

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "org_members_view_teams" ON public.teams;
DROP POLICY IF EXISTS "org_admins_create_teams" ON public.teams;
DROP POLICY IF EXISTS "team_leaders_update_teams" ON public.teams;
DROP POLICY IF EXISTS "org_admins_delete_teams" ON public.teams;

-- ============================================================================
-- SELECT POLICY
-- ============================================================================

CREATE POLICY "org_members_view_teams"
ON public.teams
FOR SELECT
USING (
  public.is_org_member(organization_id)
);

COMMENT ON POLICY "org_members_view_teams" ON public.teams IS
'Organization members can view all teams in their organization.';

-- ============================================================================
-- INSERT POLICY
-- ============================================================================

CREATE POLICY "org_admins_create_teams"
ON public.teams
FOR INSERT
WITH CHECK (
  public.is_org_admin(organization_id)
);

COMMENT ON POLICY "org_admins_create_teams" ON public.teams IS
'Only organization owners/admins can create teams.';

-- ============================================================================
-- UPDATE POLICY
-- ============================================================================

CREATE POLICY "team_leaders_update_teams"
ON public.teams
FOR UPDATE
USING (
  public.is_org_admin(organization_id)
  OR
  public.is_team_leader(id)
)
WITH CHECK (
  public.is_org_admin(organization_id)
  OR
  public.is_team_leader(id)
);

COMMENT ON POLICY "team_leaders_update_teams" ON public.teams IS
'Organization admins and team leaders can update team settings.';

-- ============================================================================
-- DELETE POLICY
-- ============================================================================

CREATE POLICY "org_admins_delete_teams"
ON public.teams
FOR DELETE
USING (
  public.is_org_admin(organization_id)
);

COMMENT ON POLICY "org_admins_delete_teams" ON public.teams IS
'Only organization owners/admins can delete teams.';
