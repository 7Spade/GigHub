-- Migration: Create Accounts Table
-- Purpose: Create the accounts table for User/Organization/Bot entities
-- Phase: 1 - Core Schema
-- Created: 2025-12-01
-- Dependencies: 20251201000003_create_utility_functions.sql
-- Source: migrations-old/database_export.sql

-- ============================================================================
-- ACCOUNTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,
  type TEXT NOT NULL DEFAULT 'User' CHECK (type IN ('User', 'Organization', 'Bot')),
  name VARCHAR(255),
  email VARCHAR(255),
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  settings JSONB DEFAULT '{}' NOT NULL,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.accounts IS
'Unified accounts table supporting User, Organization, and Bot types.
- User: Personal accounts linked to auth.users via auth_user_id
- Organization: Company/team accounts
- Bot: Automated service accounts';

COMMENT ON COLUMN public.accounts.auth_user_id IS 'Reference to auth.users for User type accounts';
COMMENT ON COLUMN public.accounts.type IS 'Account type: User, Organization, or Bot';
COMMENT ON COLUMN public.accounts.status IS 'Account status: active, suspended, deleted';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_accounts_auth_user_id ON public.accounts(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON public.accounts(status) WHERE status != 'deleted';
CREATE INDEX IF NOT EXISTS idx_accounts_email ON public.accounts(email) WHERE email IS NOT NULL;

-- Partial unique index: only enforce uniqueness for User type
-- This allows each auth.users to have exactly one User account,
-- while Organizations and Bots can store creator auth_user_id for access control
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_auth_user_id 
ON public.accounts (auth_user_id) 
WHERE type = 'User';

COMMENT ON INDEX public.unique_user_auth_user_id IS
'Ensures each auth.users has exactly one User account. Organizations and Bots can store creator auth_user_id for access control.';

-- ============================================================================
-- TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON TABLE public.accounts TO authenticated;
GRANT ALL ON TABLE public.accounts TO service_role;
