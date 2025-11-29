-- Migration: Create Utility Functions
-- Purpose: Create common utility functions used across the application
-- Phase: 1 - Core Schema
-- Created: 2025-12-01
-- Dependencies: 20251201000002_create_enums.sql

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS
'Trigger function to automatically update updated_at timestamp on row update.';
