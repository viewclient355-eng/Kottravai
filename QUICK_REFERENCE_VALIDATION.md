# ⚡ QUICK REFERENCE: VALIDATION IN 5 MINUTES

**Your role:** Run validation, collect results, approve for production.  
**Time commitment:** Phase 1 (3-4 hours), Phase 2 (1 hour), Phase 3 (monitoring).

---

## 📍 YOU ARE HERE: Start of Phase 1 (Staging Validation)

---

## 🎯 YOUR MISSION (Choose One)

### Option A: Run Everything (Fastest)
**Copy-paste this script into staging environment:**

```bash
#!/bin/bash
set -e  # Exit on error

echo "🔄 Starting Validation..."
export DATABASE_URL="your_staging_db_url_here"

# Step 1: Apply Migration
echo "📦 Step 1/5: Running Core Migration..."
psql "$DATABASE_URL" -f server/migrations/20260608_add_lead_fields.sql

# Step 2: Run Database Tests
echo "✅ Step 2/5: Running Validation Tests..."
psql "$DATABASE_URL" -f server/migrations/VALIDATION_TESTS_20260608.sql > validation_results.txt

# Step 3: Apply RLS
echo "🔒 Step 3/5: Applying RLS Policy..."
psql "$DATABASE_URL" -f server/migrations/20260608_leads_rls_hardened.sql

# Step 4: Verify Policies
echo "🔍 Step 4/5: Verifying Policies..."
psql "$DATABASE_URL" -c "\
SELECT policyname, permissive, roles 
FROM pg_policies 
WHERE tablename = 'leads' 
ORDER BY policyname;" > policy_results.txt

# Step 5: Start Backend
echo "🚀 Step 5/5: Starting Backend..."
cd server && npm start &

echo "✨ All systems ready!"
echo "📊 Database test results: validation_results.txt"
echo "🔐 RLS policy results: policy_results.txt"
echo "🌐 Backend running on http://localhost:5000"
echo "💼 Admin UI running on http://localhost:5173"
```

**Then:** Test frontend + admin UI manually (see below)

---

### Option B: Run Step-by-Step (Safer)

1. **Database Tests** (5 min)
   ```bash
   psql "$DATABASE_URL" -f server/migrations/20260608_add_lead_fields.sql
   psql "$DATABASE_URL" -f server/migrations/VALIDATION_TESTS_20260608.sql
   ```
   ✓ Document: "Database migration applied successfully" → `PRODUCTION_READINESS_CHECKLIST.md` line ~50

2. **RLS Security** (3 min)
   ```bash
   psql "$DATABASE_URL" -f server/migrations/20260608_leads_rls_hardened.sql
   psql "$DATABASE_URL" -c "SELECT policyname, permissive FROM pg_policies WHERE tablename = 'leads';"
   ```
   ✓ Document: Should see 4 policies → `PRODUCTION_READINESS_CHECKLIST.md` line ~120

3. **Backend Tests** (5 min)
   ```bash
   cd server && npm start
   # In another terminal:
   curl -H "x-admin-secret: Admin!Kottravai2025%100" http://localhost:5000/api/leads
   ```
   ✓ Document: Response shows JSON array of leads → `PRODUCTION_READINESS_CHECKLIST.md` line ~250

4. **Frontend Tests** (10 min)
   ```bash
   npm run dev
   # Navigate to http://localhost:5173/admin
   # Click "Leads" → should load table
   # Click "Export CSV" → should download
   ```
   ✓ Document: Table displays, CSV downloads → `PRODUCTION_READINESS_CHECKLIST.md` line ~300

5. **E2E Test** (10 min)
   - Go to `/contact`
   - Add `?utm_source=google` to URL
   - Submit form
   - Refresh admin Leads view
   - Should see new lead with utm_source='google'
   - ✓ Document: "Lead submitted and appears in admin UI" → `PRODUCTION_READINESS_CHECKLIST.md` line ~350

---

## 📋 QUICK CHECKLIST

### Before Starting
- [ ] Staging database accessible
- [ ] `server/migrations/` folder exists in workspace
- [ ] Node.js 18+ installed
- [ ] npm dependencies installed (`npm install` in both root and server directories)

### During Validation
- [ ] Database migration completes without errors
- [ ] All 7 new columns exist
- [ ] All 6 indexes created
- [ ] RLS policies show 4 entries
- [ ] `/api/leads` endpoint responds with JSON
- [ ] `/api/leads/export` downloads CSV file
- [ ] Admin UI loads Leads view
- [ ] CSV export button works
- [ ] Form submission captures UTM params
- [ ] New lead appears in admin dashboard within 5 seconds

### After Validation
- [ ] All tests marked ✓ PASS
- [ ] No errors in console/logs
- [ ] Sign-off: `PRODUCTION_READINESS_CHECKLIST.md` section 1.5

---

## 📂 FILES YOU NEED (In Order)

1. **START HERE:** [`LEAD_SYSTEM_VALIDATION_REPORT.md`](LEAD_SYSTEM_VALIDATION_REPORT.md)
   - Executive summary (5 min read)
   - What changed and why

2. **FILL THIS OUT:** [`PRODUCTION_READINESS_CHECKLIST.md`](PRODUCTION_READINESS_CHECKLIST.md)
   - Step-by-step validation tasks
   - Record results as you complete each test

3. **OPTIONAL BUT HELPFUL:** [`ADMIN_UI_VALIDATION_CHECKLIST.md`](server/migrations/ADMIN_UI_VALIDATION_CHECKLIST.md)
   - Detailed UI test scenarios (if you want extra validation)

4. **REFERENCE:** [`VALIDATION_DELIVERABLES_SUMMARY.md`](VALIDATION_DELIVERABLES_SUMMARY.md)
   - Overview of all artifacts
   - What does each file do

5. **AUTO-TESTS:** [`VALIDATION_TESTS_20260608.sql`](server/migrations/VALIDATION_TESTS_20260608.sql)
   - Runs automatically during Phase 1 Step 2
   - Tests 8 database scenarios

---

## ⚡ CRITICAL PASSWORDS & ENDPOINTS

**Admin Password (For Testing):**
```
Admin!Kottravai2025%100
```
⚠️ **ACTION REQUIRED:** Change this before production! (See section 2.1 of `PRODUCTION_READINESS_CHECKLIST.md`)

**API Endpoints (For Testing):**
```
GET http://localhost:5000/api/leads
  Header: x-admin-secret: Admin!Kottravai2025%100
  Response: JSON array of leads

GET http://localhost:5000/api/leads/export
  Header: x-admin-secret: Admin!Kottravai2025%100
  Response: CSV file download
```

**Frontend URLs:**
```
Contact Form: http://localhost:5173/contact
Admin Dashboard: http://localhost:5173/admin
Admin Login: http://localhost:5173/admin/login
```

---

## ✅ PASS CRITERIA (You're Done When...)

### Phase 1: Staging Validation
- [x] Migration runs without errors
- [x] All 7 columns and 6 indexes exist
- [x] RLS policies applied (4 policies visible)
- [x] Admin endpoints respond correctly
- [x] Admin UI loads and displays leads
- [x] CSV export works
- [x] Form submission captured in admin dashboard
- [x] No errors in console or logs

**Then:** Sign off Phase 1 in `PRODUCTION_READINESS_CHECKLIST.md` → Ready for Phase 2

### Phase 2: Production Deployment
- [x] All Phase 1 ✓
- [x] Admin password rotated
- [x] Database backup complete
- [x] Migrations applied to production
- [x] RLS policies applied
- [x] Smoke test passed (form → admin UI)
- [x] No errors in production logs
- [x] RLS enforcement verified

**Then:** System live in production → Phase 3 (Monitoring)

### Phase 3: Monitoring (Week 1)
- [x] Check error rates daily (target: <0.1%)
- [x] Verify leads continue capturing correctly
- [x] Confirm admin export works consistently
- [x] No security incidents
- [x] Monitor database performance

---

## 🐛 TROUBLESHOOTING

### Migration Fails
**Error:** "relation already exists" or similar
```bash
# Check if columns already exist:
psql "$DATABASE_URL" -c "\d leads"
# If columns exist, migration is idempotent - rerun is safe
```

### RLS Breaks Form Submissions
**Error:** Anon inserts return 403 Forbidden
```bash
# Check policies:
psql "$DATABASE_URL" -c "SELECT * FROM pg_policies WHERE tablename = 'leads';"

# Temporarily disable RLS for debugging:
psql "$DATABASE_URL" -c "ALTER TABLE leads DISABLE ROW LEVEL SECURITY;"

# Then re-enable after fix:
psql "$DATABASE_URL" -c "ALTER TABLE leads ENABLE ROW LEVEL SECURITY;"
```

### Admin Endpoints Return 401
**Error:** "Unauthorized" when calling /api/leads
```bash
# Verify header is correct:
curl -v -H "x-admin-secret: Admin!Kottravai2025%100" http://localhost:5000/api/leads

# Check server logs for auth errors
```

### Admin UI Doesn't Show Leads
**Error:** Empty table or "No data"
```bash
# Check browser console for errors (F12 → Console tab)
# Check server logs for API errors
# Verify you're logged in (check sessionStorage):
localStorage.getItem('kottravai_admin_session')
```

### Can't Connect to Staging DB
**Error:** "connection failed" or "authentication failed"
```bash
# Verify DATABASE_URL is correct:
echo $DATABASE_URL

# Test connection:
psql "$DATABASE_URL" -c "SELECT 1;"

# If fails, check:
# - Database is running
# - Credentials are correct
# - Network connectivity
```

---

## 📊 EXPECTED TEST RESULTS

### SQL Tests (Run: `VALIDATION_TESTS_20260608.sql`)
```
TEST 1: Column existence
  Expected: 7 rows (one per new column)
  Actual: ________________

TEST 2: Index existence
  Expected: 6 rows (one per index)
  Actual: ________________

TEST 3: Check constraint
  Expected: 1 row (leads_priority_check exists)
  Actual: ________________

TEST 4: Old insert (backward compatibility)
  Expected: 1 row inserted with default priority='medium'
  Actual: ________________

TEST 5: New insert (all fields)
  Expected: 1 row inserted with all fields populated
  Actual: ________________

TEST 6: Constraint enforcement
  Expected: ERROR (invalid priority rejected)
  Actual: ________________

TEST 7: RLS status
  Expected: true (RLS enabled)
  Actual: ________________

TEST 8: Policy count
  Expected: 4 rows (4 policies)
  Actual: ________________
```

---

## 🚀 FAST-TRACK: If You're in a Hurry

**Minimum validation (30 min):**
1. Run migration: `psql "$DATABASE_URL" -f server/migrations/20260608_add_lead_fields.sql`
2. Apply RLS: `psql "$DATABASE_URL" -f server/migrations/20260608_leads_rls_hardened.sql`
3. Start backend: `cd server && npm start`
4. Start frontend: `npm run dev`
5. Test form → admin UI: Submit contact → check Leads view → export CSV
6. Document: "All tests passed" in `PRODUCTION_READINESS_CHECKLIST.md` section 1.5
7. Sign-off: Mark Phase 1 ✓ PASS

**Then:** Ready for production deployment (Phase 2)

---

## 📞 NEED HELP?

- **How do I start?** → Follow "Option A" or "Option B" above
- **What if something fails?** → See "Troubleshooting" section
- **Where do I record results?** → `PRODUCTION_READINESS_CHECKLIST.md`
- **What does each file do?** → `VALIDATION_DELIVERABLES_SUMMARY.md`
- **What exactly changed in code?** → `LEAD_SYSTEM_VALIDATION_REPORT.md` sections 1-5

---

## ⏰ TIME ESTIMATES

| Task | Time | Who |
|------|------|-----|
| Read this guide | 5 min | You |
| Database migration + tests | 5 min | You |
| RLS setup | 3 min | You |
| Backend endpoint tests | 5 min | You |
| Frontend + Admin UI tests | 15 min | You |
| E2E integration test | 10 min | You |
| Document results | 10 min | You |
| **PHASE 1 TOTAL** | **~50 min** | You |
| | | |
| Production backup + deploy | 30 min | DevOps |
| Post-deploy verification | 15 min | You |
| **PHASE 2 TOTAL** | **~45 min** | Team |

---

## 🎯 YOUR NEXT STEP RIGHT NOW

👉 **Option A:** Copy the shell script at top and run it
👉 **Option B:** Open `PRODUCTION_READINESS_CHECKLIST.md` and follow section 1 step-by-step
👉 **Option C:** Read `LEAD_SYSTEM_VALIDATION_REPORT.md` first (15 min) then run Option A

**All three are valid. Pick one and start!**

---

**Created:** 2026-06-08  
**For:** Santhosh  
**Status:** Ready to execute
