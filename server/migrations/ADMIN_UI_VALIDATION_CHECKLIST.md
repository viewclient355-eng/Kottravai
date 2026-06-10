-- ADMIN LEADS VIEW VALIDATION CHECKLIST
-- This checklist validates the Admin Dashboard "Leads" view functionality

## Validation Scope
- Admin Dashboard `/admin` → "Leads" view
- Server endpoints: `/api/leads` (JSON list) and `/api/leads/export` (CSV)
- Authentication: Admin session + x-admin-secret header
- Frontend: React components, filters, export button

---

## PRE-TEST SETUP
1. Start server: `npm start` (from server directory)
2. Start frontend: `npm run dev` (from root directory)
3. Login to admin panel: `/admin/login`
4. Admin password: `Admin!Kottravai2025%100`
5. Create test leads via contact form or API if DB is empty

---

## TEST 1: Navigation & View Loading
**Objective:** Verify the Leads view renders and loads data

- [ ] Navigate to `/admin`
- [ ] Confirm admin is authenticated (sidebar shows "Active Access")
- [ ] In sidebar, scroll to "Commerce Lab" section
- [ ] Click on "Leads" button (with MessageSquareQuote icon)
- [ ] View changes to "Leads"
- [ ] Header text shows "Leads"
- [ ] Leads table loads without errors
- [ ] No console errors in DevTools

**Expected Result:** Leads view displays with table containing leads from database

---

## TEST 2: Leads Table Display
**Objective:** Verify table columns and data display correctly

- [ ] Table displays columns: Name, Email, Phone, Priority, Score, UTM Source, Created At
- [ ] Data rows populate if leads exist in database
- [ ] If no leads exist, table shows empty state or "No data"
- [ ] Lead names are readable and clickable (future: detail view)
- [ ] Emails displayed without truncation
- [ ] Phone numbers displayed correctly
- [ ] Priority shows: 'high', 'medium', 'low' (color-coded if possible)
- [ ] Lead Score shows numeric value (0-100)
- [ ] UTM Source shows correctly (or empty if not provided)
- [ ] Created At shows formatted timestamp (readable format)

**Expected Result:** All columns render correctly with valid data

---

## TEST 3: Data Freshness
**Objective:** Verify leads load from API and reflect recent changes

- [ ] Leads list includes all leads created in the past 24 hours
- [ ] If a new lead was created while viewing, refresh and list updates (manual refresh for now)
- [ ] If a lead was updated (e.g., priority changed), the view reflects it

**Expected Result:** Data is current and reflects database state

---

## TEST 4: Export CSV Button
**Objective:** Verify CSV export generates and downloads correctly

- [ ] "Export CSV" button exists in top-right of Leads section
- [ ] Click "Export CSV" button
- [ ] Browser triggers file download
- [ ] Downloaded file is named "leads.csv"
- [ ] Open CSV in Excel or text editor
- [ ] CSV header row matches: ID,Name,Email,Phone,Company,Source,Lead Type,Priority,Lead Score,UTM Source,UTM Medium,UTM Campaign,Last Contacted At,Next Followup At,Created At,Status
- [ ] Data rows in CSV match table display
- [ ] New columns are populated: priority, lead_score, utm_source, utm_medium, utm_campaign, last_contacted_at, next_followup_at
- [ ] Special characters (quotes, commas) are escaped correctly in CSV

**Expected Result:** CSV exports with all new fields and data is valid

---

## TEST 5: Authentication & Security
**Objective:** Verify admin access control is enforced

- [ ] Logout from admin panel
- [ ] Try accessing `/api/leads` directly in browser (or via curl without header)
- [ ] Confirm 401 or 403 error (Unauthorized/Forbidden)
- [ ] Try accessing `/api/leads/export` without admin secret
- [ ] Confirm error response (not data)
- [ ] Login again, confirm access returns data
- [ ] Check browser DevTools → Network → verify request includes `x-admin-secret` header

**Expected Result:** Only authenticated admins can access leads data

---

## TEST 6: Error Handling
**Objective:** Verify graceful error handling

- [ ] Simulate API failure: Stop server temporarily, try loading leads
- [ ] Frontend shows error message or fallback UI (not blank/crash)
- [ ] Resume server, refresh, data loads again
- [ ] Check browser console for meaningful error messages (no raw stack traces visible to user)
- [ ] If CSV export fails, admin sees error toast/alert

**Expected Result:** Errors handled gracefully without crashes

---

## TEST 7: Performance
**Objective:** Verify view performs well with multiple leads

- [ ] Load view with 50+ leads in database
- [ ] Table renders within 2 seconds
- [ ] No lag when scrolling through table
- [ ] CSV export completes within 5 seconds (even with 200+ leads)
- [ ] No memory leaks or excessive API calls

**Expected Result:** View performs efficiently

---

## TEST 8: New Field Validation
**Objective:** Verify new columns are present and populated

- [ ] Create a test lead via frontend form (contact page) with all UTM params
  Example URL: `http://localhost:5173/contact?utm_source=google&utm_medium=cpc&utm_campaign=summer`
- [ ] Submit form
- [ ] Wait 2 seconds
- [ ] Refresh admin Leads view
- [ ] Find the new lead
- [ ] Verify utm_source='google', utm_medium='cpc', utm_campaign='summer' in table and CSV

**Expected Result:** New fields capture and display correctly

---

## TEST 9: Backward Compatibility
**Objective:** Verify old leads (without new fields) still display

- [ ] Create a lead WITHOUT UTM params
- [ ] In admin Leads view, verify the lead displays (doesn't error)
- [ ] New fields show empty/null for old leads
- [ ] CSV export shows empty values for those columns

**Expected Result:** Old leads display without errors

---

## TEST 10: Browser Compatibility
**Objective:** Test on multiple browsers

- [ ] Test on Chrome/Chromium
- [ ] Test on Firefox
- [ ] Test on Safari (if available)
- [ ] Verify table layout is responsive on desktop and tablet (768px width)
- [ ] Export button remains accessible

**Expected Result:** View works on all major browsers

---

## VALIDATION SUMMARY TEMPLATE

### Passed Tests
- [ ] TEST 1: Navigation & View Loading
- [ ] TEST 2: Leads Table Display
- [ ] TEST 3: Data Freshness
- [ ] TEST 4: Export CSV Button
- [ ] TEST 5: Authentication & Security
- [ ] TEST 6: Error Handling
- [ ] TEST 7: Performance
- [ ] TEST 8: New Field Validation
- [ ] TEST 9: Backward Compatibility
- [ ] TEST 10: Browser Compatibility

### Failed Tests
(If any tests fail, document here with error details)

### Issues Found
1. 
2. 
3. 

### Sign-Off
- QA Tester: _________________
- Date: _________________
- Status: ☐ PASS / ☐ FAIL
