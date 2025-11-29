-- Migration: Create Handle New User Trigger
-- Purpose: Automatically create account when new auth.users is created
-- Phase: 4 - Triggers
-- Created: 2025-12-01
-- Dependencies: Phase 3 (RLS Policies)
-- Source: migrations-old/database_export.sql

-- ============================================================================
-- HANDLE NEW USER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.accounts (
    auth_user_id,
    type,
    email,
    name,
    avatar_url,
    status
  ) VALUES (
    NEW.id,
    'User',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'active'
  )
  ON CONFLICT (auth_user_id) WHERE type = 'User' DO NOTHING;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
'Trigger function to automatically create a User account when auth.users is created.';

-- ============================================================================
-- TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
