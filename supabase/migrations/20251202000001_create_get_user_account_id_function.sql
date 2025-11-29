-- Migration: Create get_user_account_id Function
-- Purpose: Returns the current user's account ID without triggering RLS
-- Phase: 2 - Helper Functions
-- Created: 2025-12-01
-- Dependencies: Phase 1 (accounts table)
-- Source: migrations-old/20251124000001_create_get_user_account_id_function.sql

-- ============================================================================
-- GET_USER_ACCOUNT_ID FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_account_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  -- Query accounts table without triggering RLS (row_security = off)
  -- Only returns data for the current authenticated user (auth.uid())
  SELECT id INTO v_account_id
  FROM public.accounts
  WHERE auth_user_id = auth.uid()
    AND type = 'User'
    AND status != 'deleted'
  LIMIT 1;
  
  RETURN v_account_id;
END;
$$;

COMMENT ON FUNCTION public.get_user_account_id() IS
'Returns the current authenticated user account ID.
Uses SECURITY DEFINER with row_security = off to avoid RLS recursion.
This function is the key to preventing 42501 permission errors.';

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_user_account_id() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_account_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_account_id() FROM public;
