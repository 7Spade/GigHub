-- Migration: Create Blueprint RLS Policies
-- Purpose: Define RLS policies for blueprints and blueprint_members tables
-- Phase: 5 - Blueprint System
-- Created: 2025-12-01
-- Dependencies: 20251205000003_create_blueprint_helper_functions.sql

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprint_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BLUEPRINTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "blueprint_members_view" ON public.blueprints;
DROP POLICY IF EXISTS "authenticated_create" ON public.blueprints;
DROP POLICY IF EXISTS "blueprint_admins_update" ON public.blueprints;
DROP POLICY IF EXISTS "blueprint_owners_delete" ON public.blueprints;

-- SELECT
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
  )
);

COMMENT ON POLICY "blueprint_members_view" ON public.blueprints IS
'Blueprints can be viewed by members, owners, or if public.';

-- INSERT
CREATE POLICY "authenticated_create"
ON public.blueprints
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

COMMENT ON POLICY "authenticated_create" ON public.blueprints IS
'Any authenticated user can create a blueprint.';

-- UPDATE
CREATE POLICY "blueprint_admins_update"
ON public.blueprints
FOR UPDATE
USING (
  public.is_blueprint_admin(id)
  OR
  owner_id = public.get_user_account_id()
)
WITH CHECK (
  public.is_blueprint_admin(id)
  OR
  owner_id = public.get_user_account_id()
);

COMMENT ON POLICY "blueprint_admins_update" ON public.blueprints IS
'Blueprint admins and owners can update blueprint settings.';

-- DELETE (soft delete)
CREATE POLICY "blueprint_owners_delete"
ON public.blueprints
FOR DELETE
USING (
  public.is_blueprint_owner(id)
  OR
  owner_id = public.get_user_account_id()
);

COMMENT ON POLICY "blueprint_owners_delete" ON public.blueprints IS
'Only blueprint owners can delete blueprints.';

-- ============================================================================
-- BLUEPRINT MEMBERS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "blueprint_members_select" ON public.blueprint_members;
DROP POLICY IF EXISTS "blueprint_admins_insert" ON public.blueprint_members;
DROP POLICY IF EXISTS "blueprint_admins_update_members" ON public.blueprint_members;
DROP POLICY IF EXISTS "blueprint_admins_delete_members" ON public.blueprint_members;

-- SELECT
CREATE POLICY "blueprint_members_select"
ON public.blueprint_members
FOR SELECT
USING (
  auth_user_id = auth.uid()
  OR
  public.is_blueprint_member(blueprint_id)
);

COMMENT ON POLICY "blueprint_members_select" ON public.blueprint_members IS
'Members can view their own membership and all members of blueprints they belong to.';

-- INSERT
CREATE POLICY "blueprint_admins_insert"
ON public.blueprint_members
FOR INSERT
WITH CHECK (
  public.is_blueprint_admin(blueprint_id)
  OR
  -- Allow initial owner insert (for trigger)
  NOT EXISTS (SELECT 1 FROM public.blueprint_members bm WHERE bm.blueprint_id = blueprint_id)
);

COMMENT ON POLICY "blueprint_admins_insert" ON public.blueprint_members IS
'Blueprint admins can add members. First member is allowed for initial owner setup.';

-- UPDATE
CREATE POLICY "blueprint_admins_update_members"
ON public.blueprint_members
FOR UPDATE
USING (
  public.is_blueprint_admin(blueprint_id)
)
WITH CHECK (
  public.is_blueprint_admin(blueprint_id)
);

COMMENT ON POLICY "blueprint_admins_update_members" ON public.blueprint_members IS
'Blueprint admins can update member roles.';

-- DELETE
CREATE POLICY "blueprint_admins_delete_members"
ON public.blueprint_members
FOR DELETE
USING (
  public.is_blueprint_admin(blueprint_id)
  OR
  auth_user_id = auth.uid()  -- Members can remove themselves
);

COMMENT ON POLICY "blueprint_admins_delete_members" ON public.blueprint_members IS
'Blueprint admins can remove members. Members can remove themselves.';
