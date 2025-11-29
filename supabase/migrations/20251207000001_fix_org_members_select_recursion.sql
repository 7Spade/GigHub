-- Migration: Fix organization_members SELECT policy infinite recursion
-- Purpose: Fix RLS infinite recursion in org_members_select policy
-- Phase: 3 - RLS Policy Fix
-- Created: 2025-12-07
-- Issue: The org_members_select policy contains a self-referencing subquery
--        that causes infinite recursion (PostgreSQL error 42P17).
--
-- Root Cause: The policy uses:
--   organization_id IN (
--     SELECT om.organization_id FROM public.organization_members om
--     WHERE om.auth_user_id = auth.uid()
--   )
-- This subquery triggers RLS on organization_members, which evaluates the
-- same policy, creating an infinite loop.
--
-- Solution: Use the is_org_member() function which has SECURITY DEFINER
-- and row_security = off, bypassing RLS when checking membership.

-- ============================================================================
-- DROP EXISTING POLICY
-- ============================================================================

DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;

-- ============================================================================
-- CREATE FIXED SELECT POLICY
-- ============================================================================

CREATE POLICY "org_members_select"
ON public.organization_members
FOR SELECT
USING (
  -- Allow users to query their own memberships directly (no recursion)
  auth_user_id = auth.uid()
  OR
  -- Allow viewing other members of organizations they belong to
  -- Uses is_org_member() which has SECURITY DEFINER and row_security = off
  -- to avoid RLS recursion
  public.is_org_member(organization_id)
);

COMMENT ON POLICY "org_members_select" ON public.organization_members IS
'Members can view their own membership and all members of organizations they belong to.
Uses auth_user_id directly for own membership check (no recursion).
Uses is_org_member() for organization membership check (SECURITY DEFINER bypasses RLS).
This fixes the infinite recursion error (42P17) that occurred with direct subqueries.';
