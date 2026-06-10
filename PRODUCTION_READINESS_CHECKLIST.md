# PRODUCTION READINESS CHECKLIST
## Lead Capture & Qualification System v1.0
**Date:** 2026-06-08  
**Owner:** Santhosh (You)

---

## PHASE 1: STAGING VALIDATION ⏳

### 1.1 Database Validation
- [ ] **Migration Executes Successfully**
  - Run: `psql "$DATABASE_URL" -f server/migrations/20260608_add_lead_fields.sql`
  - Expected: No errors, statements complete
  - Time: < 2 minutes

- [ ] **New Columns Exist**
  - Run: `\d leads` in psql
  - Verify: All 7 columns present (priority, lead_score, utm_source, utm_medium, utm_campaign, last_contacted_at, next_followup_at)
  - Data types: Match expected (text, integer, timestamptz)

- [ ] **Indexes Created**
  - Run: `SELECT * FROM pg_indexes WHERE tablename = 'leads';`
  - Verify: 6 new indexes exist
  - All named `idx_leads_*`

- [ ] **Check Constraint Enforced**
  - Run: `INSERT INTO leads (name, email, phone, source, priority) VALUES ('Test', 'test@example.com', '9999999999', 'contact_form', 'invalid');`
  - Expected: Error "violates check constraint leads_priority_check"

- [ ] **Existing Lead Inserts Work (Backward Compatibility)**
  - Run: `INSERT INTO leads (name, email, phone, source) VALUES ('Old Lead', 'old@example.com', '9888888888', 'contact_form') RETURNING id, priority, lead_score;`
  - Expected: SUCCESS, priority defaults to 'medium', lead_score defaults to 0

- [ ] **New Lead Inserts Work**
  - Run: Insert with all new fields (see VALIDATION_TESTS_20260608.sql)
  - Expected: SUCCESS, all fields populated
  - Result: Log the inserted lead ID

**Validation Passed:** ☐ YES / ☐ NO  
**Tester:** ________________  
**Date:** ________________

---

### 1.2 Security & RLS Validation

- [ ] **Enable RLS and Apply Hardened Policy**
  - Run: `psql "$DATABASE_URL" -f server/migrations/20260608_leads_rls_hardened.sql`
  - Expected: Policy creation messages, no errors

- [ ] **RLS is Enabled**
  - Run: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'leads';`
  - Expected: `t` (true)

- [ ] **All Policies Listed and Correct**
  - Run: `SELECT policyname, permissive, roles, qual, with_check FROM pg_policies WHERE tablename = 'leads' ORDER BY policyname;`
  - Expected: 4 policies (allow_insert_with_source, allow_update_service_role, block_anon_select, block_all_deletes)
  - Document policy details in table below:

| Policy Name | Permissive | Roles | Purpose | Status |
|-------------|-----------|-------|---------|--------|
| leads_allow_insert_with_source | t | anon, authenticated | Allow form inserts | ☐ |
| leads_block_anon_select | f | anon | Block reads | ☐ |
| leads_allow_update_service_role | t | service_role | Admin updates | ☐ |
| leads_block_all_deletes | f | PUBLIC | Prevent deletes | ☐ |

- [ ] **Test Anonymous Insert (Frontend Form Submission)**
  - Use: `VITE_SUPABASE_ANON_KEY` from .env
  - Simulate: Frontend lead form with Supabase.from('leads').insert()
  - Expected: SUCCESS (insert accepted because source, name, email provided)
  - Document: Lead ID inserted: ________________

- [ ] **Test Anonymous SELECT (Should Fail)**
  - Use: `VITE_SUPABASE_ANON_KEY`
  - Simulate: `supabase.from('leads').select('*')`
  - Expected: FAILURE (403 Forbidden)
  - Error message: ________________

- [ ] **Test Service Role READ**
  - Use: `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
  - Run: Server endpoint `/api/leads` with admin header
  - Expected: SUCCESS, returns JSON array of leads
  - Count returned: ________________

- [ ] **Test Service Role UPDATE**
  - Use: Service role key
  - Update: A lead's priority from 'medium' to 'high'
  - Expected: SUCCESS
  - Lead ID updated: ________________

- [ ] **Verify Admin Token Authentication**
  - Test: Call `/api/leads` WITHOUT `x-admin-secret` header
  - Expected: FAILURE (401/403 error)
  - Test: Call WITH invalid token value
  - Expected: FAILURE

**RLS Validation Passed:** ☐ YES / ☐ NO  
**Tester:** ________________  
**Date:** ________________

---

### 1.3 Backend Endpoint Validation

- [ ] **GET `/api/leads` Endpoint**
  - URL: `http://localhost:5000/api/leads`
  - Header: `x-admin-secret: Admin!Kottravai2025%100`
  - Expected: 200 OK, JSON array with leads
  - Sample response (paste first lead):
    ```json
    
    ```
  - Columns present: ☐ id, ☐ name, ☐ email, ☐ priority, ☐ lead_score, ☐ utm_source, ☐ created_at

- [ ] **GET `/api/leads/export` Endpoint**
  - URL: `http://localhost:5000/api/leads/export`
  - Header: `x-admin-secret: Admin!Kottravai2025%100`
  - Response Type: text/csv
  - Expected: CSV file downloads as "leads.csv"
  - File size: ________________ bytes
  - CSV header (paste): ________________

- [ ] **CSV Content Validation**
  - Open downloaded CSV in Excel
  - Verify columns:
    - ☐ ID
    - ☐ Name
    - ☐ Email
    - ☐ Phone
    - ☐ Priority
    - ☐ Lead Score
    - ☐ UTM Source
    - ☐ UTM Medium
    - ☐ UTM Campaign
    - ☐ Last Contacted At
    - ☐ Next Followup At
    - ☐ Created At
    - ☐ Status
  - Verify data rows match database (spot-check 3 rows)
  - Sample row (paste first data row): ________________

- [ ] **Error Handling**
  - Stop database
  - Call endpoint
  - Expected: 500 error, meaningful message (not crash)
  - Error message: ________________
  - Restart database

**Backend Validation Passed:** ☐ YES / ☐ NO  
**Tester:** ________________  
**Date:** ________________

---

### 1.4 Frontend/Admin UI Validation

Follow: `ADMIN_UI_VALIDATION_CHECKLIST.md`

**Checklist Items Completed:** _______ of 10  
**Failed Tests:**
```
(Paste any failed tests)
```

**UI Validation Passed:** ☐ YES / ☐ NO  
**Tester:** ________________  
**Date:** ________________

---

### 1.5 Integration End-to-End Test

- [ ] **Submit Lead via Contact Form**
  - Navigate: `http://localhost:5173/contact`
  - Fill form: Name, Email, Phone, Message
  - URL: Add UTM params: `?utm_source=google&utm_medium=cpc&utm_campaign=test_validation`
  - Submit form
  - Expected: Toast confirmation message

- [ ] **Verify Lead Appears in Admin Dashboard**
  - Navigate: `/admin`
  - Login if needed
  - Go to "Leads" view
  - Refresh page
  - Expected: New lead appears in table
  - Verify:
    - Name matches form submission: ☐
    - Email matches: ☐
    - UTM Source = 'google': ☐
    - Priority assigned: ☐
    - Lead Score assigned: ☐

- [ ] **Export CSV and Verify New Lead**
  - Click "Export CSV" button
  - Download and open in Excel
  - Find the new lead row
  - Verify all fields populated correctly: ☐

- [ ] **Verify Analytics Event Tracked**
  - Open Browser DevTools → Network → Fetch/XHR
  - Look for POST to `/api/track/event` or similar
  - Event payload should include: event_type, lead_type, lead_score, utm_source, etc.
  - Event logged: ☐

**E2E Test Passed:** ☐ YES / ☐ NO  
**Tester:** ________________  
**Date:** ________________

---

## PHASE 2: PRODUCTION DEPLOYMENT ⏳

### 2.1 Pre-Deployment Checklist

- [ ] **Rotate Admin Password**
  - Current: `Admin!Kottravai2025%100` (exposed in .env, must change)
  - New password: ________________ (store in secrets manager)
  - Update: `VITE_ADMIN_PASSWORD` in production `.env`

- [ ] **Backup Production Database**
  - Run: `pg_dump "$DATABASE_URL" > leads_backup_$(date +%Y%m%d_%H%M%S).sql`
  - File saved: ________________
  - Size: ________________
  - Verify: Can restore successfully ☐

- [ ] **Code Review**
  - Reviewed: Migration files ☐
  - Reviewed: RLS policies ☐
  - Reviewed: Backend endpoints ☐
  - Reviewed: Frontend changes ☐
  - No security vulnerabilities: ☐
  - No syntax errors: ☐

- [ ] **TypeScript Compilation**
  - Run: `npm run build`
  - Expected: No errors, all types valid
  - Build output: ________________

- [ ] **Deploy to Staging (Pre-Production)**
  - Deploy code to staging environment
  - Run migration: `psql "$STAGING_DATABASE_URL" -f server/migrations/20260608_add_lead_fields.sql`
  - Apply RLS: `psql "$STAGING_DATABASE_URL" -f server/migrations/20260608_leads_rls_hardened.sql`
  - Deploy backend and frontend
  - Test contact form → admin dashboard (full E2E)
  - All tests pass: ☐

- [ ] **Documentation Updated**
  - Runbook includes RLS decision: ☐
  - Team notified of new admin endpoints: ☐
  - On-call engineer briefed: ☐

**Pre-Deployment Passed:** ☐ YES / ☐ NO  
**Approver:** ________________  
**Date:** ________________

---

### 2.2 Deployment Steps

1. [ ] **Scheduled Maintenance Window**
   - Date/Time: ________________
   - Duration: ~30 minutes
   - Stakeholders notified: ☐

2. [ ] **Run Core Migration**
   ```bash
   psql "$DATABASE_URL" -f server/migrations/20260608_add_lead_fields.sql
   ```
   - Status: ☐ SUCCESS / ☐ FAILED
   - Error (if any): ________________
   - Time taken: ________________

3. [ ] **Apply RLS Policy**
   ```bash
   psql "$DATABASE_URL" -f server/migrations/20260608_leads_rls_hardened.sql
   ```
   - Status: ☐ SUCCESS / ☐ FAILED
   - Error (if any): ________________
   - Time taken: ________________

4. [ ] **Deploy Backend**
   - Deploy new `server/index.js` with `/api/leads` endpoints
   - Status: ☐ SUCCESS / ☐ FAILED
   - Health check passed: ☐

5. [ ] **Deploy Frontend**
   - Deploy updated `AdminDashboard.tsx` and `leadService.ts`
   - Status: ☐ SUCCESS / ☐ FAILED
   - Bundle size: ________________ KB

6. [ ] **Verify Rollback Plan**
   - Rollback script prepared: ☐
   - Database backup accessible: ☐
   - Rollback time estimate: ________________

**Deployment Completed:** ☐ YES / ☐ NO / ☐ ROLLED BACK  
**DevOps Lead:** ________________  
**Date/Time:** ________________

---

### 2.3 Post-Deployment Validation (CRITICAL)

- [ ] **Smoke Test: Submit Contact Form**
  - Navigate: Production contact form
  - Submit lead
  - Expected: No errors, acknowledgment email sent
  - Lead visible in admin UI within 5 seconds: ☐

- [ ] **Monitor Error Rates**
  - Check server logs for errors
  - Constraint violations: ________________ (target: 0)
  - Failed inserts: ________________ (target: 0)
  - API errors: ________________ (target: <0.1%)

- [ ] **Check Export Performance**
  - Admin: Export CSV
  - Download time: ________________ seconds (target: <5 sec)
  - File integrity: ☐

- [ ] **Verify RLS Enforcement**
  - Attempt anonymous read of `/api/leads` API (should fail): ☐
  - Verify form inserts still work (anon key): ☐
  - Verify admin export works (service role): ☐

- [ ] **Monitor Database Performance**
  - Query the new indexes
  - Index size: ________________ MB
  - Query time (with index): ________________ ms
  - Query time (without index): ________________ ms (baseline)

- [ ] **Check Logs for Warnings**
  - Review: Application logs, database logs, error tracking (Sentry, etc.)
  - Warnings: ________________ (expected: none)
  - Critical issues: ________________ (expected: none)

- [ ] **Verify Analytics Integration**
  - Check Google Sheets for new lead events
  - Events logged: ________________ (expect contact form submissions)
  - UTM tracking working: ☐

**Post-Deployment Validation Passed:** ☐ YES / ☐ NO  
**Validator:** ________________  
**Date/Time:** ________________

---

### 2.4 Final Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | ________________ | ________________ | ☐ |
| QA/Tester | ________________ | ________________ | ☐ |
| DevOps/Deploy | ________________ | ________________ | ☐ |
| Product/Business | ________________ | ________________ | ☐ |

---

## PHASE 3: MONITORING & FOLLOW-UP

### 3.1 Post-Deployment Monitoring (First 24 Hours)

- [ ] **Hour 1-4:** Continuous monitoring
  - Error rate: < 0.1%
  - Response time: < 500ms
  - Check email delivery (contact form acknowledgments)

- [ ] **Hour 4-12:** Periodic checks
  - Daily analytics: Leads captured, events tracked
  - No RLS violations logged
  - Admin export performance stable

- [ ] **Hour 12-24:** Final verification
  - Run full test suite again
  - Spot-check admin UI functionality
  - Verify all new fields present in data

### 3.2 Weekly Checks (First Month)

- [ ] Check conversion metrics for new leads
- [ ] Verify RLS policies still in place (no unauthorized access)
- [ ] Monitor index performance, no bloat
- [ ] Archive old test leads

### 3.3 Phase 2 Planning

- [ ] Schedule: AI Lead Scoring refinement
- [ ] Schedule: Automated follow-up system
- [ ] Schedule: Sales Agent integration

---

## RISK MITIGATION DURING PRODUCTION

### If Migration Fails
**Action:** Rollback
```bash
# Restore from backup
psql "$DATABASE_URL" -f leads_backup_YYYYMMDD_HHMMSS.sql
```
**Notification:** Immediately notify team

### If RLS Breaks Form Submissions
**Action:** Temporarily disable RLS
```bash
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
```
**Investigation:** Review policy, apply corrected version
**Resolution:** Re-enable RLS

### If Admin Export Breaks
**Action:** Export directly from database
```bash
COPY (SELECT * FROM leads ORDER BY created_at DESC) TO STDOUT WITH CSV HEADER;
```

### If Performance Degrades
**Action:** Check index usage
```bash
SELECT * FROM pg_stat_user_indexes WHERE relname = 'leads';
```

---

## FINAL CHECKLIST SUMMARY

**Database:** ☐ PASS / ☐ FAIL  
**Security:** ☐ PASS / ☐ FAIL  
**Backend:** ☐ PASS / ☐ FAIL  
**Frontend:** ☐ PASS / ☐ FAIL  
**Integration:** ☐ PASS / ☐ FAIL  

**OVERALL PRODUCTION READINESS:**  
# ☐ READY FOR PRODUCTION / ☐ NOT READY (blocking issues below)

**Blocking Issues (if any):**
```
1.
2.
3.
```

**Sign-Off:**  
**Prepared by:** Santhosh  
**Date:** 2026-06-08  
**Next Checkpoint:** Staging validation completion (target: TBD)

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-08  
**Review Cycle:** Before each phase transition
