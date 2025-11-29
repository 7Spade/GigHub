-- Migration: Create Blueprint Triggers
-- Purpose: Trigger to add creator as blueprint owner
-- Phase: 5 - Blueprint System
-- Created: 2025-12-01
-- Dependencies: 20251205000004_create_blueprint_rls_policies.sql

-- ============================================================================
-- ADD CREATOR AS BLUEPRINT OWNER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.add_creator_as_blueprint_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $$
DECLARE
  v_user_account_id UUID;
BEGIN
  -- Get the creator's User account ID
  SELECT id INTO v_user_account_id
  FROM public.accounts
  WHERE auth_user_id = auth.uid()
    AND type = 'User'
    AND status != 'deleted'
  LIMIT 1;

  -- Add creator as blueprint owner
  IF v_user_account_id IS NOT NULL THEN
    INSERT INTO public.blueprint_members (
      blueprint_id,
      account_id,
      role,
      auth_user_id
    ) VALUES (
      NEW.id,
      v_user_account_id,
      'owner',
      auth.uid()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.add_creator_as_blueprint_owner() IS
'Trigger function that automatically adds the blueprint creator as an owner in blueprint_members table.
Uses SECURITY DEFINER with row_security = off to bypass RLS during insert.';

-- ============================================================================
-- TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS add_blueprint_creator_trigger ON public.blueprints;
CREATE TRIGGER add_blueprint_creator_trigger
  AFTER INSERT ON public.blueprints
  FOR EACH ROW
  EXECUTE FUNCTION public.add_creator_as_blueprint_owner();
