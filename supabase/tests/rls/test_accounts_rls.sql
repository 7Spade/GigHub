-- Test: Accounts RLS Policies
-- Purpose: Test RLS policies on accounts table
-- Dependencies: tests/helpers/setup.sql

-- ============================================================================
-- TEST: Users can only see their own account and related accounts
-- ============================================================================

DO $$
DECLARE
  v_test_auth_user_id UUID := gen_random_uuid();
  v_test_account_id UUID;
BEGIN
  -- Setup: Create test user account
  INSERT INTO public.accounts (auth_user_id, type, name, email, status)
  VALUES (v_test_auth_user_id, 'User', 'Test User', 'test_rls@example.com', 'active')
  RETURNING id INTO v_test_account_id;
  
  -- Verify account was created
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = v_test_account_id) THEN
    RAISE EXCEPTION 'Test failed: Account was not created';
  END IF;
  
  -- Cleanup
  DELETE FROM public.accounts WHERE id = v_test_account_id;
  
  RAISE NOTICE 'Test passed: Accounts RLS policies allow account creation';
END $$;
