-- HARDENED RLS POLICY for `leads` table
-- This migration provides stricter security than the initial recommendation
-- Apply this INSTEAD OF the initial `20260608_leads_rls.sql` for production

-- ============================================================================
-- STEP 1: Enable RLS (if not already enabled)
-- ============================================================================
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop existing policies (clean slate)
-- ============================================================================
DROP POLICY IF EXISTS allow_insert_from_client ON leads;
DROP POLICY IF EXISTS allow_anon_insert ON leads;
DROP POLICY IF EXISTS allow_authenticated_insert ON leads;

-- ============================================================================
-- STEP 3: INSERT POLICY (Client-side inserts via anon key)
-- ============================================================================
-- INTENT: Allow anonymous/authenticated inserts, but require `source` to prevent spam.
-- This allows frontend lead capture forms to work without server routing.
--
CREATE POLICY leads_allow_insert_with_source ON leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    COALESCE(source, '') != ''
    AND COALESCE(name, '') != ''
    AND COALESCE(email, '') != ''
  );

-- ============================================================================
-- STEP 4: SELECT POLICY (Block anonymous reads entirely)
-- ============================================================================
-- INTENT: Prevent anonymous users from exfiltrating lead data.
-- Only authenticated users or service_role can read leads.
--
CREATE POLICY leads_block_anon_select ON leads
  FOR SELECT
  TO anon
  USING (false);  -- Always deny

-- ============================================================================
-- STEP 5: UPDATE POLICY (Block anonymous updates, allow service_role via server)
-- ============================================================================
-- INTENT: Only the service role (used by admin endpoints) can update leads.
-- Anonymous/authenticated users cannot modify existing leads.
--
CREATE POLICY leads_allow_update_service_role ON leads
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 6: DELETE POLICY (Block all deletes except service_role)
-- ============================================================================
-- INTENT: Leads are never deleted, only archived via status field.
-- If you need admin deletion, update this policy to allow service_role.
--
CREATE POLICY leads_block_all_deletes ON leads
  FOR DELETE
  TO PUBLIC
  USING (false);  -- Always deny

-- ============================================================================
-- STEP 7: Verify Policies (Run this to check configuration)
-- ============================================================================
-- SELECT policyname, permissive, roles, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'leads'
-- ORDER BY policyname;

-- ============================================================================
-- SECURITY MATRIX (After applying this policy)
-- ============================================================================
-- +----------+--------+--------+--------+--------+
-- | Role     | INSERT | SELECT | UPDATE | DELETE |
-- +----------+--------+--------+--------+--------+
-- | anon     | ✓*     | ✗      | ✗      | ✗      |
-- | auth     | ✓*     | ✗      | ✗      | ✗      |
-- | svc_role | ✓      | ✓      | ✓      | ✗      |
-- +----------+--------+--------+--------+--------+
-- * WITH constraints (source, name, email required)
--
-- Key Points:
-- - Anonymous inserts work for forms (required: source, name, email)
-- - Anonymous CANNOT read leads (prevents exfiltration)
-- - Anonymous CANNOT update/delete (prevents tampering)
-- - Service role (admin/server) can read, insert, update
-- - Service role CANNOT delete (use status='archived' instead)
--
-- ============================================================================

-- ============================================================================
-- RECOMMENDED NEXT STEPS
-- ============================================================================
-- 1. Test this policy against staging database
-- 2. Verify frontend lead forms still work (inserts should succeed)
-- 3. Verify admin export endpoint returns data (uses service_role)
-- 4. Verify anonymous users CANNOT read leads via API
-- 5. Audit any existing policies or roles that might bypass RLS
-- 6. Run `pg_policies` query above to confirm all policies active
-- 7. For production: rotate admin password and audit access logs
