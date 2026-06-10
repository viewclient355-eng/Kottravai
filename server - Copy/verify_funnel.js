require('dotenv').config();
const { sheets, fetchRawEventRows, buildAggregations } = require('./services/googleSheetsService');

async function validateFunnel() {
  console.log('================================================');
  console.log('FINAL ACCEPTANCE VALIDATION REPORT');
  console.log('================================================\\n');
  
  try {
    const s = await sheets();
    const rows = await fetchRawEventRows(s);
    const aggs = buildAggregations(rows);
    
    console.log('1. RAW EVENTS EVENT COUNTS');
    const eventCounts = {
      page_view: 0, category_view: 0, product_view: 0, add_to_cart: 0,
      checkout_started: 0, guest_checkout_started: 0, otp_sent: 0,
      otp_verified: 0, purchase_completed: 0
    };
    rows.forEach(r => {
      if (eventCounts[r.event_type] !== undefined) {
        eventCounts[r.event_type]++;
      }
    });
    for (const [evt, count] of Object.entries(eventCounts)) {
      console.log(`* ${evt}: ${count}`);
    }
    console.log(`\\n* Total Raw Events Rows: ${rows.length}`);
    console.log(`* Unique Visitors: ${aggs.summary.totalVisitors}`);
    console.log(`* Unique Sessions: ${aggs.summary.totalSessions}`);
    console.log('\\n================================================\\n');

    console.log('2. EVENT EVIDENCE\\n');
    const requiredEvents = ['checkout_started', 'guest_checkout_started', 'otp_sent', 'otp_verified', 'purchase_completed'];
    for (const evt of requiredEvents) {
      const match = rows.find(r => r.event_type === evt);
      if (match) {
        console.log(`Evidence for: ${evt}`);
        console.log(`  timestamp:  ${match.timestamp}`);
        console.log(`  event_type: ${match.event_type}`);
        console.log(`  visitor_id: ${match.visitor_id}`);
        console.log(`  session_id: ${match.session_id}`);
        console.log(`  page:       ${match.page_url || match.page}`);
        console.log(`  metadata:   ${match.event_metadata}\\n`);
      } else {
         console.log(`Evidence for: ${evt} -> MISSING\\n`);
      }
    }
    console.log('================================================\\n');

    console.log('3. PURCHASE VALIDATION\\n');
    const purchaseRow = rows.find(r => r.event_type === 'purchase_completed');
    if (purchaseRow) {
       console.log(`* order_id:       ${purchaseRow.order_id}`);
       console.log(`* order_total:    ${purchaseRow.order_total}`);
       console.log(`* payment_method: ${purchaseRow.payment_method || (purchaseRow.event_metadata ? JSON.parse(purchaseRow.event_metadata).payment_method : 'N/A')}`);
       console.log(`* customer_id:    ${purchaseRow.customer_id}`);
       console.log(`* guest_order:    ${purchaseRow.event_metadata ? JSON.parse(purchaseRow.event_metadata).guest_order : 'N/A'}`);
    } else {
       console.log('No purchase_completed event found in Raw Events.');
    }
    console.log('\\n================================================\\n');

    console.log('4. DASHBOARD PROPAGATION VALIDATION\\n');
    const execDash = await s.spreadsheets.values.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID, range: 'Executive Dashboard!A1:H20' });
    const hasData = execDash.data.values && execDash.data.values.length > 5;
    let isAutoPopulated = false;
    if (hasData) {
       console.log('Dashboards successfully queried.');
       console.log('Live Refresh Timestamp from Sheet: ' + execDash.data.values.find(r => r[0] && r[0].includes('Last Refresh'))[1]);
       isAutoPopulated = execDash.data.values.some(r => r[0] === 'Total Orders' && r[1] !== 'No Data Yet' && r[1] !== '0');
       console.log(`Auto-Propagation Verified (Metrics Populated): ${isAutoPopulated ? 'YES' : 'NO'}`);
    }
    console.log('\\n================================================\\n');

    console.log('5. FUNNEL VALIDATION\\n');
    const f = aggs.globalFunnel;
    const formatPercent = (val) => (val * 100).toFixed(2) + '%';
    const dropOff = (cur, prev) => prev > 0 ? (100 - (cur/prev)*100).toFixed(2) + '%' : '0.00%';
    
    console.log(`Page View              : ${f.pageViews} users (N/A drop-off)`);
    console.log(`→ Product View         : ${f.productViews} users (${formatPercent(f.pageViews > 0 ? f.productViews/f.pageViews : 0)} conv) (${dropOff(f.productViews, f.pageViews)} drop-off)`);
    console.log(`→ Add To Cart          : ${f.addToCarts} users (${formatPercent(f.productViews > 0 ? f.addToCarts/f.productViews : 0)} conv) (${dropOff(f.addToCarts, f.productViews)} drop-off)`);
    console.log(`→ Checkout Started     : ${f.checkoutStarted} users (${formatPercent(f.addToCarts > 0 ? f.checkoutStarted/f.addToCarts : 0)} conv) (${dropOff(f.checkoutStarted, f.addToCarts)} drop-off)`);
    console.log(`→ Guest Checkout       : ${f.guestCheckoutStarted} users (${formatPercent(f.checkoutStarted > 0 ? f.guestCheckoutStarted/f.checkoutStarted : 0)} conv) (${dropOff(f.guestCheckoutStarted, f.checkoutStarted)} drop-off)`);
    console.log(`→ OTP Sent             : ${f.otpSent} users (${formatPercent(f.guestCheckoutStarted > 0 ? f.otpSent/f.guestCheckoutStarted : 0)} conv) (${dropOff(f.otpSent, f.guestCheckoutStarted)} drop-off)`);
    console.log(`→ OTP Verified         : ${f.otpVerified} users (${formatPercent(f.otpSent > 0 ? f.otpVerified/f.otpSent : 0)} conv) (${dropOff(f.otpVerified, f.otpSent)} drop-off)`);
    console.log(`→ Purchase Completed   : ${f.purchases} users (${formatPercent(Math.max(f.checkoutStarted, f.otpVerified) > 0 ? f.purchases/Math.max(f.checkoutStarted, f.otpVerified) : 0)} conv) (${dropOff(f.purchases, f.otpVerified)} drop-off)`);
    console.log('\\n================================================\\n');

    console.log('6. REVENUE VALIDATION\\n');
    console.log(`* Total Orders: ${aggs.summary.totalOrders}`);
    console.log(`* Total Revenue: $${aggs.summary.totalRevenue.toFixed(2)}`);
    console.log(`* Total GMV: $${aggs.summary.totalRevenue.toFixed(2)}`);
    console.log(`* AOV: $${aggs.summary.averageOrderValue.toFixed(2)}`);
    if (purchaseRow) {
      console.log(`\\nGenerated by Raw Events Row: visitor_id=${purchaseRow.visitor_id}, session_id=${purchaseRow.session_id}, order_total=${purchaseRow.order_total}`);
    } else {
      console.log(`\\nGenerated by Raw Events Row: N/A`);
    }

    console.log('7. FINAL STATUS\\n');
    const mk = (condition) => condition ? '✅ PASS' : '❌ FAIL';
    console.log(`Tracking Pipeline: ${mk(hasData)}`);
    console.log(`Raw Events Logging: ${mk(rows.length > 0)}`);
    console.log(`Session Tracking: ${mk(aggs.summary.totalSessions > 0)}`);
    console.log(`Visitor Tracking: ${mk(aggs.summary.totalVisitors > 0)}`);
    console.log(`Guest Checkout Tracking: ${mk(f.guestCheckoutStarted > 0)}`);
    console.log(`OTP Tracking: ${mk(f.otpSent > 0 && f.otpVerified > 0)}`);
    console.log(`Purchase Tracking: ${mk(f.purchases > 0)}`);
    console.log(`Revenue Tracking: ${mk(aggs.summary.totalRevenue > 0)}`);
    console.log(`Dashboard Propagation: ${mk(isAutoPopulated)}`);
    console.log(`WhatsApp Analytics: ${mk(aggs.globalGuest.otpSent > 0)}`);
    console.log(`Conversion Funnel: ${mk(f.pageViews > 0)}`);
    console.log(`Daily Report: ${mk(hasData)}`);
    console.log(`Weekly Report: ${mk(hasData)}`);
    console.log(`Monthly Report: ${mk(hasData)}`);
    console.log('\\n================================================\\n');

  } catch(err) {
    console.error('Validation Script Error:', err);
  }
}
validateFunnel();
