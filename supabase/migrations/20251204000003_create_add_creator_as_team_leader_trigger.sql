-- Migration: Create Add Creator as Team Leader Trigger
-- Purpose: Automatically add team creator as leader
-- Phase: 4 - Triggers
-- Created: 2025-12-01
-- Dependencies: 20251204000002_create_add_creator_as_org_owner_trigger.sql
-- Source: migrations-old/20251124000014_auto_add_team_creator_as_leader.sql

-- ============================================================================
-- ADD CREATOR AS TEAM LEADER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.add_creator_as_team_leader()
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

  -- Add creator as team leader
  IF v_user_account_id IS NOT NULL THEN
    INSERT INTO public.team_members (
      team_id,
      account_id,
      role,
      auth_user_id
    ) VALUES (
      NEW.id,
      v_user_account_id,
      'leader',
      auth.uid()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.add_creator_as_team_leader() IS
'Trigger function that automatically adds the team creator as a leader in team_members table.
Uses SECURITY DEFINER with row_security = off to bypass RLS during insert.';

-- ============================================================================
-- TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS add_team_creator_trigger ON public.teams;
CREATE TRIGGER add_team_creator_trigger
  AFTER INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.add_creator_as_team_leader();
