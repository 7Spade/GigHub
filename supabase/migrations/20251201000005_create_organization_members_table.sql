-- Migration: Create Organization Members Table
-- Purpose: Create the organization_members junction table
-- Phase: 1 - Core Schema
-- Created: 2025-12-01
-- Dependencies: 20251201000004_create_accounts_table.sql
-- Source: migrations-old/database_export.sql

-- ============================================================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  auth_user_id UUID,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (organization_id, account_id)
);

COMMENT ON TABLE public.organization_members IS
'Junction table for organization membership.
organization_id: The Organization account ID.
account_id: The member User account ID.
auth_user_id: Cached for RLS performance to avoid recursion.
role: owner, admin, or member.';

COMMENT ON COLUMN public.organization_members.auth_user_id IS 
'Cached auth.users ID for direct RLS checks without recursion';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_account_id ON public.organization_members(account_id);
CREATE INDEX IF NOT EXISTS idx_org_members_auth_user_id ON public.organization_members(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(role);

-- ============================================================================
-- TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_org_members_updated_at ON public.organization_members;
CREATE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON TABLE public.organization_members TO authenticated;
GRANT ALL ON TABLE public.organization_members TO service_role;
