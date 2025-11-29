-- Migration: Create Enums
-- Purpose: Define enumeration types for the application
-- Phase: 1 - Core Schema
-- Created: 2025-12-01
-- Dependencies: 20251201000001_create_extensions.sql

-- ============================================================================
-- ACCOUNT TYPE ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
    CREATE TYPE public.account_type AS ENUM ('User', 'Organization', 'Bot');
  END IF;
END $$;

COMMENT ON TYPE public.account_type IS 'Types of accounts: User (personal), Organization (company), Bot (automated)';

-- ============================================================================
-- ACCOUNT STATUS ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'deleted');
  END IF;
END $$;

COMMENT ON TYPE public.account_status IS 'Account status: active, suspended, or deleted';

-- ============================================================================
-- ORGANIZATION MEMBER ROLE ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_member_role') THEN
    CREATE TYPE public.org_member_role AS ENUM ('owner', 'admin', 'member');
  END IF;
END $$;

COMMENT ON TYPE public.org_member_role IS 'Organization member roles: owner, admin, member';

-- ============================================================================
-- TEAM MEMBER ROLE ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_member_role') THEN
    CREATE TYPE public.team_member_role AS ENUM ('leader', 'member');
  END IF;
END $$;

COMMENT ON TYPE public.team_member_role IS 'Team member roles: leader, member';

-- ============================================================================
-- BLUEPRINT STATUS ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blueprint_status') THEN
    CREATE TYPE public.blueprint_status AS ENUM ('draft', 'active', 'archived', 'deleted');
  END IF;
END $$;

COMMENT ON TYPE public.blueprint_status IS 'Blueprint lifecycle status';

-- ============================================================================
-- BLUEPRINT VISIBILITY ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blueprint_visibility') THEN
    CREATE TYPE public.blueprint_visibility AS ENUM ('private', 'internal', 'public');
  END IF;
END $$;

COMMENT ON TYPE public.blueprint_visibility IS 'Blueprint visibility: private, internal, public';

-- ============================================================================
-- BLUEPRINT MEMBER ROLE ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blueprint_member_role') THEN
    CREATE TYPE public.blueprint_member_role AS ENUM ('owner', 'admin', 'member', 'viewer');
  END IF;
END $$;

COMMENT ON TYPE public.blueprint_member_role IS 'Blueprint member roles: owner, admin, member, viewer';

-- ============================================================================
-- TASK STATUS ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'in_review', 'completed', 'cancelled', 'blocked');
  END IF;
END $$;

COMMENT ON TYPE public.task_status IS 'Task status: pending, in_progress, in_review, completed, cancelled, blocked';

-- ============================================================================
-- TASK PRIORITY ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE public.task_priority AS ENUM ('lowest', 'low', 'medium', 'high', 'highest');
  END IF;
END $$;

COMMENT ON TYPE public.task_priority IS 'Task priority levels';

-- ============================================================================
-- TASK TYPE ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN
    CREATE TYPE public.task_type AS ENUM ('task', 'milestone', 'bug', 'feature', 'improvement');
  END IF;
END $$;

COMMENT ON TYPE public.task_type IS 'Task types: task, milestone, bug, feature, improvement';

-- ============================================================================
-- ACCEPTANCE STATUS ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'acceptance_status') THEN
    CREATE TYPE public.acceptance_status AS ENUM ('pending', 'passed', 'failed', 'conditional');
  END IF;
END $$;

COMMENT ON TYPE public.acceptance_status IS 'Task acceptance status';
