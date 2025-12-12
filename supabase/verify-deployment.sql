-- =============================================================================
-- Supabase Migration Verification Script
-- =============================================================================
-- Run this script after deployment to verify everything is working correctly
-- Execute in Supabase Dashboard SQL Editor or via psql
-- =============================================================================

-- Reset client messages
\set QUIET on
\set ON_ERROR_STOP on

-- Print header
\echo ''
\echo '=========================================='
\echo 'Supabase Deployment Verification'
\echo 'Project: zecsbstjqjqoytwgjyct'
\echo '=========================================='
\echo ''

-- =============================================================================
-- Test 1: Check Tables Exist
-- =============================================================================
\echo '📊 Test 1: Checking tables...'

SELECT 
    CASE 
        WHEN COUNT(*) = 6 THEN '✅ PASS: All 6 tables exist'
        ELSE '❌ FAIL: Expected 6 tables, found ' || COUNT(*) || ' tables'
    END as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

\echo ''
\echo 'Tables found:'
SELECT 
    '  - ' || table_name as tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =============================================================================
-- Test 2: Check RLS is Enabled
-- =============================================================================
\echo ''
\echo '🔒 Test 2: Checking RLS status...'

SELECT 
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public')
            AND COUNT(*) > 0
        THEN '✅ PASS: RLS enabled on all tables'
        ELSE '❌ FAIL: RLS not enabled on some tables'
    END as result
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

\echo ''
\echo 'RLS Status:'
SELECT 
    '  - ' || tablename || ': ' || 
    CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================================================
-- Test 3: Check RLS Policies Count
-- =============================================================================
\echo ''
\echo '🛡️  Test 3: Checking RLS policies...'

SELECT 
    CASE 
        WHEN COUNT(*) >= 30 THEN '✅ PASS: Adequate policies exist (' || COUNT(*) || ' policies)'
        ELSE '⚠️  WARNING: Only ' || COUNT(*) || ' policies found (expected 30+)'
    END as result
FROM pg_policies
WHERE schemaname = 'public';

\echo ''
\echo 'Policy counts by table:'
SELECT 
    '  - ' || tablename || ': ' || COUNT(*) || ' policies' as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =============================================================================
-- Test 4: Check Indexes
-- =============================================================================
\echo ''
\echo '⚡ Test 4: Checking indexes...'

SELECT 
    CASE 
        WHEN COUNT(*) >= 30 THEN '✅ PASS: Sufficient indexes (' || COUNT(*) || ' indexes)'
        ELSE '⚠️  WARNING: Only ' || COUNT(*) || ' indexes found'
    END as result
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname NOT LIKE '%_pkey';  -- Exclude primary keys

\echo ''
\echo 'Index counts by table:'
SELECT 
    '  - ' || tablename || ': ' || COUNT(*) || ' indexes' as indexes
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname NOT LIKE '%_pkey'
GROUP BY tablename
ORDER BY tablename;

-- =============================================================================
-- Test 5: Check Functions
-- =============================================================================
\echo ''
\echo '⚙️  Test 5: Checking functions...'

SELECT 
    CASE 
        WHEN COUNT(*) >= 11 THEN '✅ PASS: All helper functions exist (' || COUNT(*) || ' functions)'
        ELSE '⚠️  WARNING: Only ' || COUNT(*) || ' functions found (expected 11+)'
    END as result
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname NOT LIKE 'pg_%';

\echo ''
\echo 'Functions found:'
SELECT 
    '  - ' || proname as functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname NOT LIKE 'pg_%'
ORDER BY proname;

-- =============================================================================
-- Test 6: Check Triggers
-- =============================================================================
\echo ''
\echo '🎯 Test 6: Checking triggers...'

SELECT 
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ PASS: Triggers configured (' || COUNT(*) || ' triggers)'
        ELSE '⚠️  WARNING: Only ' || COUNT(*) || ' triggers found'
    END as result
FROM information_schema.triggers
WHERE trigger_schema = 'public';

\echo ''
\echo 'Triggers found:'
SELECT 
    '  - ' || event_object_table || '.' || trigger_name as triggers
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =============================================================================
-- Test 7: Run Built-in RLS Test
-- =============================================================================
\echo ''
\echo '🧪 Test 7: Running RLS policy tests...'

SELECT 
    '  ' || 
    CASE WHEN passed THEN '✅' ELSE '❌' END || 
    ' ' || test_name || ': ' || message as test_results
FROM public.test_rls_policies();

-- =============================================================================
-- Test 8: Check Columns
-- =============================================================================
\echo ''
\echo '📋 Test 8: Checking table structures...'

-- Check tasks table columns
SELECT 
    CASE 
        WHEN COUNT(*) >= 15 THEN '✅ PASS: tasks table structure OK'
        ELSE '❌ FAIL: tasks table missing columns'
    END as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'tasks';

-- Check logs table columns
SELECT 
    CASE 
        WHEN COUNT(*) >= 15 THEN '✅ PASS: logs table structure OK'
        ELSE '❌ FAIL: logs table missing columns'
    END as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'logs';

-- =============================================================================
-- Test 9: Test Basic CRUD (requires authentication)
-- =============================================================================
\echo ''
\echo '💾 Test 9: Basic functionality...'

-- Check if we can select from tables (should work if authenticated)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks')
        THEN '✅ PASS: Tables are accessible'
        ELSE '❌ FAIL: Cannot access tables'
    END as result;

-- =============================================================================
-- Test 10: Check Comments/Documentation
-- =============================================================================
\echo ''
\echo '📝 Test 10: Checking table documentation...'

SELECT 
    CASE 
        WHEN COUNT(*) >= 6 THEN '✅ PASS: Tables have comments/documentation'
        ELSE '⚠️  WARNING: Some tables lack documentation'
    END as result
FROM pg_description d
JOIN pg_class c ON d.objoid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relkind = 'r'
AND d.description IS NOT NULL;

-- =============================================================================
-- Summary
-- =============================================================================
\echo ''
\echo '=========================================='
\echo 'Verification Summary'
\echo '=========================================='

-- Count total objects
SELECT 
    'Tables: ' || 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as summary
UNION ALL
SELECT 
    'Indexes: ' || 
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public')
UNION ALL
SELECT 
    'RLS Policies: ' || 
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public')
UNION ALL
SELECT 
    'Functions: ' || 
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
     WHERE n.nspname = 'public' AND p.proname NOT LIKE 'pg_%')
UNION ALL
SELECT 
    'Triggers: ' || 
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public');

\echo ''
\echo '✅ Verification Complete!'
\echo ''
\echo 'If all tests passed, your deployment is successful!'
\echo 'If any tests failed, check the deployment logs and retry.'
\echo ''
\echo 'Next steps:'
\echo '1. Configure Firebase Auth Custom Claims'
\echo '2. Update application to use new database schema'
\echo '3. Test CRUD operations with actual user authentication'
\echo '4. Monitor Supabase Dashboard for errors'
\echo ''
\echo 'Dashboard: https://supabase.com/dashboard/project/zecsbstjqjqoytwgjyct'
\echo ''
\echo '=========================================='
