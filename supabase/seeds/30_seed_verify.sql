-- Seed: Verify
-- Purpose: Verify seed data was properly inserted
-- Order: 30 (Last to run)
-- Dependencies: All previous seed files

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_account_count INT;
  v_org_member_count INT;
  v_team_count INT;
  v_blueprint_count INT;
  v_task_count INT;
BEGIN
  SELECT COUNT(*) INTO v_account_count FROM public.accounts;
  SELECT COUNT(*) INTO v_org_member_count FROM public.organization_members;
  SELECT COUNT(*) INTO v_team_count FROM public.teams;
  SELECT COUNT(*) INTO v_blueprint_count FROM public.blueprints;
  SELECT COUNT(*) INTO v_task_count FROM public.tasks;
  
  RAISE NOTICE 'Seed verification:';
  RAISE NOTICE '  - Accounts: %', v_account_count;
  RAISE NOTICE '  - Organization Members: %', v_org_member_count;
  RAISE NOTICE '  - Teams: %', v_team_count;
  RAISE NOTICE '  - Blueprints: %', v_blueprint_count;
  RAISE NOTICE '  - Tasks: %', v_task_count;
END $$;
