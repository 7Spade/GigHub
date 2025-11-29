-- Migration: Create Blueprint Members Table
-- Purpose: Create the blueprint_members junction table
-- Phase: 5 - Blueprint System
-- Created: 2025-12-01
-- Dependencies: 20251205000001_create_blueprints_table.sql
-- Source: migrations-old/20251129000001_create_blueprints_table.sql

-- ============================================================================
-- BLUEPRINT MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blueprint_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES public.blueprints(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  auth_user_id UUID,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  business_role TEXT,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  invited_by UUID REFERENCES public.accounts(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (blueprint_id, account_id)
);

COMMENT ON TABLE public.blueprint_members IS
'Blueprint membership with owner, admin, member, viewer roles.
auth_user_id is used for direct RLS checks to avoid recursion.';

COMMENT ON COLUMN public.blueprint_members.auth_user_id IS 
'Cached auth.users ID for direct RLS checks without recursion';

COMMENT ON COLUMN public.blueprint_members.business_role IS 
'Business role within the blueprint (e.g., Project Manager, Site Director, Worker)';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_blueprint_members_blueprint_id ON public.blueprint_members(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_members_account_id ON public.blueprint_members(account_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_members_auth_user_id ON public.blueprint_members(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_members_role ON public.blueprint_members(role);

-- ============================================================================
-- TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_blueprint_members_updated_at ON public.blueprint_members;
CREATE TRIGGER update_blueprint_members_updated_at
  BEFORE UPDATE ON public.blueprint_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON TABLE public.blueprint_members TO authenticated;
GRANT ALL ON TABLE public.blueprint_members TO service_role;
