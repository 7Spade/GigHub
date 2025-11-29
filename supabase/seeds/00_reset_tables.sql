-- Seed: Reset Tables
-- Purpose: Reset all tables before seeding
-- Order: 00 (First to run)
-- Note: This seed file is for development/testing only

-- ============================================================================
-- RESET TABLES
-- ============================================================================

-- Disable RLS temporarily for cleanup
DO $$
BEGIN
  -- Reset task-related tables
  TRUNCATE public.tasks CASCADE;
  
  -- Reset blueprint-related tables
  TRUNCATE public.blueprint_members CASCADE;
  TRUNCATE public.blueprints CASCADE;
  
  -- Reset team-related tables
  TRUNCATE public.team_members CASCADE;
  TRUNCATE public.teams CASCADE;
  
  -- Reset organization-related tables
  TRUNCATE public.organization_members CASCADE;
  
  -- Reset accounts (except auth users)
  TRUNCATE public.accounts CASCADE;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Some tables may not exist yet: %', SQLERRM;
END $$;
