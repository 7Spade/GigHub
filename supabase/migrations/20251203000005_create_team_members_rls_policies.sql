-- Migration: Create Team Members RLS Policies
-- Purpose: Define RLS policies for team_members table
-- Phase: 3 - RLS Policies
-- Created: 2025-12-01
-- Dependencies: 20251203000004_create_teams_rls_policies.sql
-- Source: migrations-old/20251124000012_fix_team_members_insert_policy.sql
-- Source: migrations-old/20251124000013_fix_team_members_initial_leader_policy.sql

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
DROP POLICY IF EXISTS "team_leaders_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_leaders_update" ON public.team_members;
DROP POLICY IF EXISTS "team_leaders_delete" ON public.team_members;
DROP POLICY IF EXISTS "team_initial_leader_insert" ON public.team_members;

-- ============================================================================
-- SELECT POLICY
-- ============================================================================

-- Uses auth_user_id directly to avoid circular dependency
CREATE POLICY "team_members_select"
ON public.team_members
FOR SELECT
USING (
  auth_user_id = auth.uid()
  OR
  team_id IN (
    SELECT tm.team_id
    FROM public.team_members tm
    WHERE tm.auth_user_id = auth.uid()
  )
);

COMMENT ON POLICY "team_members_select" ON public.team_members IS
'Members can view their own membership and all members of teams they belong to.
Uses auth_user_id directly to avoid RLS recursion.';

-- ============================================================================
-- INSERT POLICY FOR LEADERS
-- ============================================================================

CREATE POLICY "team_leaders_insert"
ON public.team_members
FOR INSERT
WITH CHECK (
  -- Team leaders can add members
  public.is_team_leader(team_id)
  OR
  -- Org admins can add members
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id
      AND public.is_org_admin(t.organization_id)
  )
);

COMMENT ON POLICY "team_leaders_insert" ON public.team_members IS
'Team leaders and org admins can add new team members.';

-- ============================================================================
-- INSERT POLICY FOR INITIAL LEADER (via trigger)
-- ============================================================================

CREATE POLICY "team_initial_leader_insert"
ON public.team_members
FOR INSERT
WITH CHECK (
  -- Allow insert if this is the first member being added as leader
  -- This is used by the trigger that adds the creator as leader
  role = 'leader'
  AND
  NOT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_id
  )
);

COMMENT ON POLICY "team_initial_leader_insert" ON public.team_members IS
'Allows the first member to be added as leader (used by trigger).';

-- ============================================================================
-- UPDATE POLICY
-- ============================================================================

CREATE POLICY "team_leaders_update"
ON public.team_members
FOR UPDATE
USING (
  public.is_team_leader(team_id)
  OR
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id
      AND public.is_org_admin(t.organization_id)
  )
)
WITH CHECK (
  public.is_team_leader(team_id)
  OR
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id
      AND public.is_org_admin(t.organization_id)
  )
);

COMMENT ON POLICY "team_leaders_update" ON public.team_members IS
'Team leaders and org admins can update member roles.';

-- ============================================================================
-- DELETE POLICY
-- ============================================================================

CREATE POLICY "team_leaders_delete"
ON public.team_members
FOR DELETE
USING (
  public.is_team_leader(team_id)
  OR
  auth_user_id = auth.uid()  -- Members can remove themselves
  OR
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id
      AND public.is_org_admin(t.organization_id)
  )
);

COMMENT ON POLICY "team_leaders_delete" ON public.team_members IS
'Team leaders and org admins can remove members. Members can remove themselves.';
