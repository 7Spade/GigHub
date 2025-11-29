-- Migration: Create Teams Table
-- Purpose: Create the teams table for team management
-- Phase: 1 - Core Schema
-- Created: 2025-12-01
-- Dependencies: 20251201000004_create_accounts_table.sql
-- Source: migrations-old/database_export.sql

-- ============================================================================
-- TEAMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}' NOT NULL,
  created_by UUID NOT NULL REFERENCES public.accounts(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.teams IS
'Teams belong to organizations and group members for specific purposes.';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_teams_org_id ON public.teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON public.teams(created_by);

-- ============================================================================
-- TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON TABLE public.teams TO authenticated;
GRANT ALL ON TABLE public.teams TO service_role;
