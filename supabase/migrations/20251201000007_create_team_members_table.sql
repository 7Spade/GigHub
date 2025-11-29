-- Migration: Create Team Members Table
-- Purpose: Create the team_members junction table
-- Phase: 1 - Core Schema
-- Created: 2025-12-01
-- Dependencies: 20251201000006_create_teams_table.sql
-- Source: migrations-old/database_export.sql

-- ============================================================================
-- TEAM MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  auth_user_id UUID,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (team_id, account_id)
);

COMMENT ON TABLE public.team_members IS
'Junction table for team membership.
team_id: The team ID.
account_id: The member User account ID.
auth_user_id: Cached for RLS performance to avoid recursion.
role: leader or member.';

COMMENT ON COLUMN public.team_members.auth_user_id IS 
'Cached auth.users ID for direct RLS checks without recursion';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_account_id ON public.team_members(account_id);
CREATE INDEX IF NOT EXISTS idx_team_members_auth_user_id ON public.team_members(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);

-- ============================================================================
-- TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON TABLE public.team_members TO authenticated;
GRANT ALL ON TABLE public.team_members TO service_role;
