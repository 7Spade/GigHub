-- Migration: Create User Account RLS Policies
-- Purpose: Define RLS policies for User type accounts
-- Phase: 3 - RLS Policies
-- Created: 2025-12-01
-- Dependencies: 20251203000001_enable_rls_core_tables.sql
-- Source: migrations-old/20251124000002_rewrite_user_rls_policies.sql

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "users_view_own_user_account" ON public.accounts;
DROP POLICY IF EXISTS "users_insert_own_user_account" ON public.accounts;
DROP POLICY IF EXISTS "users_update_own_user_account" ON public.accounts;

-- ============================================================================
-- SELECT POLICY
-- ============================================================================

CREATE POLICY "users_view_own_user_account"
ON public.accounts
FOR SELECT
USING (
  status != 'deleted' AND
  (
    -- Can see own User account
    (type = 'User' AND auth_user_id = auth.uid())
    OR
    -- Can see Organizations they are members of
    (type = 'Organization' AND public.is_org_member(id))
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

COMMENT ON POLICY "users_view_own_user_account" ON public.accounts IS
'Users can view their own account, organizations they belong to, and other users in the same organization.';

-- ============================================================================
-- INSERT POLICY
-- ============================================================================

CREATE POLICY "users_insert_own_user_account"
ON public.accounts
FOR INSERT
WITH CHECK (
  (type = 'User' AND auth_user_id = auth.uid())
  OR
  (type = 'Organization' AND auth_user_id = auth.uid())
);

COMMENT ON POLICY "users_insert_own_user_account" ON public.accounts IS
'Users can create their own User account or new Organizations.';

-- ============================================================================
-- UPDATE POLICY
-- ============================================================================

CREATE POLICY "users_update_own_user_account"
ON public.accounts
FOR UPDATE
USING (
  (type = 'User' AND auth_user_id = auth.uid())
  OR
  (type = 'Organization' AND public.is_org_admin(id))
)
WITH CHECK (
  (type = 'User' AND auth_user_id = auth.uid())
  OR
  (type = 'Organization' AND public.is_org_admin(id))
);

COMMENT ON POLICY "users_update_own_user_account" ON public.accounts IS
'Users can update their own account or organizations they admin.';
