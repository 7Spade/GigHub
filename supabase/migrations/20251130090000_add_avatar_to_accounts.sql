-- Migration: Add `avatar` column to accounts
-- Purpose: Some clients expect `accounts.avatar` while schema currently has `avatar_url`.
-- Created: 2025-11-30

BEGIN;

-- Add a nullable `avatar` column (text) to avoid breaking clients that query `accounts.avatar`.
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Backfill from existing `avatar_url` values for existing rows.
UPDATE public.accounts
SET avatar = avatar_url
WHERE avatar IS NULL AND avatar_url IS NOT NULL;

COMMIT;

-- NOTE:
-- 1) This is a backward-compatible migration: it adds `avatar` and copies values from
--    `avatar_url`. Future work: standardize on one column (rename to `avatar`) and
--    remove duplicate column after clients are updated.
-- 2) After applying this migration, PostgREST/Supabase schema cache may need a restart
--    or refresh so the new column is visible to the REST API (see instructions below).
