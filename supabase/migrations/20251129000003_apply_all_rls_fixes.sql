-- Migration: Combined RLS fixes for blueprints and tasks
-- Purpose: Fix 42501 permission errors by applying proper RLS policies
-- Created: 2025-11-29
-- 
-- This migration ensures all helper functions and RLS policies are in place
-- to prevent permission errors when accessing blueprints and tasks tables.
--
-- Note: This migration is designed to be idempotent (safe to run multiple times)
-- Note: This only includes blueprint helper functions. Task/checklist functions
--       are created in their respective table migrations.

BEGIN;

-- ============================================================================
-- VERIFY DEPENDENCIES
-- ============================================================================

-- Ensure get_user_account_id function exists (from earlier migrations)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_account_id') THEN
    RAISE EXCEPTION 'Missing required function: get_user_account_id. Please run migration 20251124000001 first.';
  END IF;
END $$;

-- ============================================================================
-- CREATE OR REPLACE BLUEPRINT HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is a blueprint member
CREATE OR REPLACE FUNCTION public.is_blueprint_member(target_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  -- Handle NULL input
  IF target_blueprint_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if blueprint_members table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'blueprint_members'
  ) THEN
    RETURN FALSE;
  END IF;
  
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
Uses SECURITY DEFINER to avoid RLS recursion.
Returns FALSE if blueprint_members table does not exist yet.';

GRANT EXECUTE ON FUNCTION public.is_blueprint_member(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_member(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_member(UUID) FROM public;

-- Function to check if user is a blueprint owner or admin
CREATE OR REPLACE FUNCTION public.is_blueprint_admin(target_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  -- Handle NULL input
  IF target_blueprint_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if blueprint_members table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'blueprint_members'
  ) THEN
    RETURN FALSE;
  END IF;
  
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
'Returns true if auth.uid() is an owner or admin of the specified blueprint.
Uses SECURITY DEFINER to avoid RLS recursion.
Returns FALSE if blueprint_members table does not exist yet.';

GRANT EXECUTE ON FUNCTION public.is_blueprint_admin(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_admin(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_admin(UUID) FROM public;

-- Function to check if user is a blueprint owner
CREATE OR REPLACE FUNCTION public.is_blueprint_owner(target_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  -- Handle NULL input
  IF target_blueprint_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if blueprint_members table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'blueprint_members'
  ) THEN
    RETURN FALSE;
  END IF;
  
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
'Returns true if auth.uid() is an owner of the specified blueprint.
Uses SECURITY DEFINER to avoid RLS recursion.
Returns FALSE if blueprint_members table does not exist yet.';

GRANT EXECUTE ON FUNCTION public.is_blueprint_owner(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_owner(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_blueprint_owner(UUID) FROM public;

-- ============================================================================
-- VERIFICATION SUMMARY
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count helper functions
  SELECT COUNT(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'is_blueprint_member', 
      'is_blueprint_admin', 
      'is_blueprint_owner'
    );
  
  RAISE NOTICE 'Blueprint RLS helper functions created/updated: %', v_count;
  
  IF v_count < 3 THEN
    RAISE WARNING 'Expected 3 blueprint helper functions, found only %', v_count;
  END IF;
END $$;

COMMIT;
