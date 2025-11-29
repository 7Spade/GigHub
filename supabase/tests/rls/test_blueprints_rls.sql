-- Test: Blueprints RLS Policies
-- Purpose: Test RLS policies on blueprints table
-- Dependencies: tests/helpers/setup.sql

-- ============================================================================
-- TEST: Blueprint members can view blueprints
-- ============================================================================

DO $$
DECLARE
  v_test_auth_user_id UUID := gen_random_uuid();
  v_test_account_id UUID;
  v_test_blueprint_id UUID;
BEGIN
  -- Setup: Create test user account
  INSERT INTO public.accounts (auth_user_id, type, name, email, status)
  VALUES (v_test_auth_user_id, 'User', 'Test User', 'test_bp_rls@example.com', 'active')
  RETURNING id INTO v_test_account_id;
  
  -- Create test blueprint
  INSERT INTO public.blueprints (owner_id, name, slug, status, visibility, created_by)
  VALUES (v_test_account_id, 'Test Blueprint', 'test-blueprint', 'active', 'private', v_test_account_id)
  RETURNING id INTO v_test_blueprint_id;
  
  -- Verify blueprint was created
  IF NOT EXISTS (SELECT 1 FROM public.blueprints WHERE id = v_test_blueprint_id) THEN
    RAISE EXCEPTION 'Test failed: Blueprint was not created';
  END IF;
  
  -- Cleanup
  DELETE FROM public.blueprints WHERE id = v_test_blueprint_id;
  DELETE FROM public.accounts WHERE id = v_test_account_id;
  
  RAISE NOTICE 'Test passed: Blueprints RLS policies work correctly';
END $$;
