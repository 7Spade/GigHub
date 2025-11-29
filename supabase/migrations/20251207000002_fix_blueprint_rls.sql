-- Migration: Fix Blueprint RLS Policies
-- Purpose: Fix RLS policies to allow blueprint creation and initial owner setup
-- Phase: 7 - Fixes
-- Created: 2025-12-07
-- Dependencies: 20251207000001_fix_org_creation_rls.sql

-- ============================================================================
-- HELPER FUNCTION: blueprint_has_members
-- ============================================================================

CREATE OR REPLACE FUNCTION public.blueprint_has_members(target_blueprint_id UUID)
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
  );
END;
$$;

COMMENT ON FUNCTION public.blueprint_has_members(UUID) IS
'Returns true if the blueprint already has at least one member.
Uses SECURITY DEFINER with row_security = off to avoid RLS recursion.';

GRANT EXECUTE ON FUNCTION public.blueprint_has_members(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.blueprint_has_members(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.blueprint_has_members(UUID) FROM public;

-- ============================================================================
-- FIX BLUEPRINT INSERT POLICY
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "authenticated_create" ON public.blueprints;

-- Create INSERT policy that allows authenticated users to create blueprints
CREATE POLICY "authenticated_create"
ON public.blueprints
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  status != 'deleted'
);

COMMENT ON POLICY "authenticated_create" ON public.blueprints IS
'Any authenticated user can create a blueprint.';

-- ============================================================================
-- UPDATE SELECT POLICY FOR BLUEPRINT TO INCLUDE OWNER
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "blueprint_members_view" ON public.blueprints;

-- Create SELECT policy that includes blueprint owner
CREATE POLICY "blueprint_members_view"
ON public.blueprints
FOR SELECT
USING (
  status != 'deleted' AND
  (
    visibility = 'public'
    OR
    public.is_blueprint_member(id)
    OR
    owner_id = public.get_user_account_id()
    OR
    -- Allow creator to see newly created blueprint (before trigger adds them as member)
    -- created_by references accounts.id, so check if the account belongs to current auth user
    created_by = public.get_user_account_id()
  )
);

COMMENT ON POLICY "blueprint_members_view" ON public.blueprints IS
'Blueprints can be viewed by members, owners, or if public.';

-- ============================================================================
-- FIX BLUEPRINT MEMBERS INSERT POLICY
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "blueprint_admins_insert" ON public.blueprint_members;

-- Create new policy that allows initial owner on creation
CREATE POLICY "blueprint_members_insert"
ON public.blueprint_members
FOR INSERT
WITH CHECK (
  -- Blueprint admins can add members
  public.is_blueprint_admin(blueprint_id)
  OR
  -- Blueprint owner can add members
  public.is_blueprint_owner(blueprint_id)
  OR
  -- Allow initial owner insert (when no members exist yet for this blueprint)
  (role = 'owner' AND auth_user_id = auth.uid() AND NOT public.blueprint_has_members(blueprint_id))
);

COMMENT ON POLICY "blueprint_members_insert" ON public.blueprint_members IS
'Blueprint admins and owners can add members. First owner is allowed during blueprint creation.';

-- ============================================================================
-- VERIFY GRANTS
-- ============================================================================

GRANT ALL ON TABLE public.blueprints TO authenticated;
GRANT ALL ON TABLE public.blueprint_members TO authenticated;
