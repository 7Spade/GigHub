-- Migration: Create Add Creator as Org Owner Trigger
-- Purpose: Automatically add organization creator as owner
-- Phase: 4 - Triggers
-- Created: 2025-12-01
-- Dependencies: 20251204000001_create_handle_new_user_trigger.sql
-- Source: migrations-old/20251124000008_update_add_creator_trigger.sql
-- Source: migrations-old/20251124000009_simplify_org_insert_policy.sql

-- ============================================================================
-- ADD CREATOR AS ORG OWNER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.add_creator_as_org_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $$
DECLARE
  v_user_account_id UUID;
BEGIN
  -- Only process Organization type accounts
  IF NEW.type = 'Organization' AND TG_OP = 'INSERT' THEN
    -- Get the creator's User account ID
    SELECT id INTO v_user_account_id
    FROM public.accounts
    WHERE auth_user_id = auth.uid()
      AND type = 'User'
      AND status != 'deleted'
    LIMIT 1;

    -- Add creator as organization owner
    IF v_user_account_id IS NOT NULL THEN
      INSERT INTO public.organization_members (
        organization_id,
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
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.add_creator_as_org_owner() IS
'Trigger function that automatically adds the organization creator as an owner in organization_members table.
Uses SECURITY DEFINER with row_security = off to bypass RLS during insert.';

-- ============================================================================
-- TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS add_org_creator_trigger ON public.accounts;
CREATE TRIGGER add_org_creator_trigger
  AFTER INSERT ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.add_creator_as_org_owner();
