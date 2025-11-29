-- Migration: Fix Organization Creation RLS Policies
-- Purpose: Fix RLS policies to allow organization creation and initial owner setup
-- Phase: 7 - Fixes
-- Created: 2025-12-07
-- Dependencies: 20251203000003_create_org_members_rls_policies.sql

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Check if user is organization owner
CREATE OR REPLACE FUNCTION public.is_org_owner(target_org_id UUID)
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
      AND role = 'owner'
  );
END;
$$;

COMMENT ON FUNCTION public.is_org_owner(UUID) IS
'Returns true if auth.uid() is an owner of the specified organization.
Uses SECURITY DEFINER with row_security = off to avoid RLS recursion.';

GRANT EXECUTE ON FUNCTION public.is_org_owner(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_org_owner(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_org_owner(UUID) FROM public;

-- Function: Check if organization has members
CREATE OR REPLACE FUNCTION public.organization_has_members(target_org_id UUID)
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
  );
END;
$$;

COMMENT ON FUNCTION public.organization_has_members(UUID) IS
'Returns true if the organization already has at least one member.
Uses SECURITY DEFINER with row_security = off to avoid RLS recursion.';

GRANT EXECUTE ON FUNCTION public.organization_has_members(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.organization_has_members(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.organization_has_members(UUID) FROM public;

-- ============================================================================
-- FIX ACCOUNTS INSERT POLICY FOR ORGANIZATIONS
-- ============================================================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "users_insert_own_user_account" ON public.accounts;
DROP POLICY IF EXISTS "authenticated_users_create_organizations" ON public.accounts;

-- Combine User and Organization INSERT policies into one
-- For Users: requires auth_user_id = auth.uid()
-- For Organizations: auth_user_id is optional (can be NULL or set for creator tracking)
CREATE POLICY "authenticated_insert_accounts"
ON public.accounts
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  status != 'deleted' AND
  (
    -- User accounts require auth_user_id = auth.uid()
    (type = 'User' AND auth_user_id = auth.uid())
    OR
    -- Organizations can be created by any authenticated user
    -- auth_user_id can be NULL or set to creator for tracking
    (type = 'Organization' AND (auth_user_id IS NULL OR auth_user_id = auth.uid()))
  )
);

COMMENT ON POLICY "authenticated_insert_accounts" ON public.accounts IS
'Authenticated users can create User accounts (with matching auth_user_id) or Organization accounts.';

-- ============================================================================
-- UPDATE SELECT POLICY TO INCLUDE CREATOR
-- ============================================================================

-- Drop and recreate SELECT policy to include organizations where user is creator
DROP POLICY IF EXISTS "users_view_own_user_account" ON public.accounts;

CREATE POLICY "users_view_accounts"
ON public.accounts
FOR SELECT
USING (
  status != 'deleted' AND
  (
    -- Can see own User account
    (type = 'User' AND auth_user_id = auth.uid())
    OR
    -- Can see Organizations where user is a member
    (type = 'Organization' AND public.is_org_member(id))
    OR
    -- Can see Organizations where user is the creator (for newly created orgs)
    (type = 'Organization' AND auth_user_id = auth.uid())
    OR
    -- Can see other Users in same organization
    (type = 'User' AND EXISTS (
      SELECT 1 FROM public.organization_members om1
      INNER JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.account_id = accounts.id
        AND om2.auth_user_id = auth.uid()
    ))
  )
);

COMMENT ON POLICY "users_view_accounts" ON public.accounts IS
'Users can view their own account, organizations they belong to or created, and other users in the same organization.';

-- ============================================================================
-- FIX ORGANIZATION MEMBERS INSERT POLICY
-- ============================================================================

-- Drop existing insert policies
DROP POLICY IF EXISTS "org_admins_insert" ON public.organization_members;
DROP POLICY IF EXISTS "org_owners_add_members" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;

-- Create single comprehensive INSERT policy
CREATE POLICY "org_members_insert"
ON public.organization_members
FOR INSERT
WITH CHECK (
  -- Organization admins can add members
  public.is_org_admin(organization_id)
  OR
  -- Organization owners can add members
  public.is_org_owner(organization_id)
  OR
  -- Allow initial organization owner on creation (when no members exist yet)
  -- This is triggered automatically by add_creator_as_org_owner function
  (role = 'owner' AND auth_user_id = auth.uid() AND NOT public.organization_has_members(organization_id))
);

COMMENT ON POLICY "org_members_insert" ON public.organization_members IS
'Organization admins and owners can add members. First owner is allowed during organization creation.';

-- ============================================================================
-- VERIFY GRANTS
-- ============================================================================

GRANT ALL ON TABLE public.accounts TO authenticated;
GRANT ALL ON TABLE public.organization_members TO authenticated;
