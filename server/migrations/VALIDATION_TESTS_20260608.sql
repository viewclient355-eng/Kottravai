-- STAGING VALIDATION SCRIPT for 20260608_add_lead_fields Migration
-- Run this against your staging database after applying the migration

-- ============================================================================
-- TEST 1: Verify New Columns Exist
-- ============================================================================
SELECT 
  column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('priority', 'lead_score', 'utm_source', 'utm_medium', 'utm_campaign', 'last_contacted_at', 'next_followup_at')
ORDER BY ordinal_position;

-- Expected output: 7 rows with column definitions

-- ============================================================================
-- TEST 2: Verify Indexes Exist
-- ============================================================================
SELECT 
  schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename = 'leads'
  AND indexname IN (
    'idx_leads_next_followup_at',
    'idx_leads_priority',
    'idx_leads_utm_source',
    'idx_leads_lead_type',
    'idx_leads_status',
    'idx_leads_created_at'
  )
ORDER BY indexname;

-- Expected output: 6 rows

-- ============================================================================
-- TEST 3: Verify Check Constraint Exists
-- ============================================================================
SELECT 
  constraint_name, constraint_type, check_clause
FROM information_schema.table_constraints
WHERE table_name = 'leads' AND constraint_type = 'CHECK';

-- Expected output: at least 1 row with leads_priority_check

-- ============================================================================
-- TEST 4: Test Existing Lead Insert (backward compatibility)
-- ============================================================================
INSERT INTO leads (name, email, phone, source)
VALUES ('Test User Old', 'test.old@example.com', '9999999999', 'contact_form')
RETURNING id, name, email, priority, lead_score, utm_source, created_at;

-- Expected output: 1 row, with priority='medium' (default), lead_score=0 (default), utm_source=NULL

-- ============================================================================
-- TEST 5: Test New Lead Insert with All New Fields
-- ============================================================================
INSERT INTO leads (
  name, email, phone, company_name, source,
  lead_type, priority, lead_score,
  utm_source, utm_medium, utm_campaign,
  last_contacted_at, next_followup_at
)
VALUES (
  'Test User New',
  'test.new@example.com',
  '9888888888',
  'Acme Corp',
  'b2b_inquiry',
  'corporate_gifting',
  'high',
  85,
  'google_ads',
  'paid_search',
  'summer_2026',
  NOW(),
  NOW() + INTERVAL '7 days'
)
RETURNING id, name, email, priority, lead_score, utm_source, utm_medium, utm_campaign, last_contacted_at, next_followup_at, created_at;

-- Expected output: 1 row with all fields populated

-- ============================================================================
-- TEST 6: Test Priority Check Constraint
-- ============================================================================
-- This should FAIL with a constraint violation:
INSERT INTO leads (name, email, phone, source, priority)
VALUES ('Invalid Priority', 'invalid@example.com', '9777777777', 'contact_form', 'invalid_priority');

-- Expected output: ERROR - violates check constraint "leads_priority_check"

-- ============================================================================
-- TEST 7: Verify RLS Status
-- ============================================================================
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'leads';

-- Expected output: 1 row with rowsecurity=true (if RLS enabled)

-- ============================================================================
-- TEST 8: List RLS Policies
-- ============================================================================
SELECT 
  policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'leads'
ORDER BY policyname;

-- Expected output: RLS policies (if RLS enabled)

-- ============================================================================
-- CLEANUP (Run after validation if needed)
-- ============================================================================
-- DELETE FROM leads WHERE name LIKE 'Test User%';
-- DELETE FROM leads WHERE email LIKE 'test.%@example.com';

-- ============================================================================
-- VALIDATION SUMMARY
-- ============================================================================
-- Run all tests above and confirm:
-- [✓] TEST 1: All 7 new columns exist with correct data types
-- [✓] TEST 2: All 6 indexes created
-- [✓] TEST 3: Check constraint for priority exists
-- [✓] TEST 4: Old inserts still work (backward compatible)
-- [✓] TEST 5: New inserts with all fields work
-- [✓] TEST 6: Invalid priority rejected (constraint enforced)
-- [✓] TEST 7: RLS status confirmed
-- [✓] TEST 8: RLS policies listed and reviewed
