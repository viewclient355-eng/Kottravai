require('dotenv').config();
const { sheets, fetchRawEventRows, buildAggregations } = require('./services/googleSheetsService');

async function validate() {
  console.log('--- START VALIDATION ---');
  try {
    const s = await sheets();
    const rows = await fetchRawEventRows(s);
    const aggs = buildAggregations(rows);
    
    console.log('\\n=== RAW EVENTS VALIDATION ===');
    const eventCounts = {
      page_view: 0, category_view: 0, product_view: 0, add_to_cart: 0,
      checkout_started: 0, guest_checkout_started: 0, otp_sent: 0,
      otp_verified: 0, purchase_completed: 0, whatsapp_click: 0
    };
    rows.forEach(r => {
      if (eventCounts[r.event_type] !== undefined) {
        eventCounts[r.event_type]++;
      }
    });
    for (const [evt, count] of Object.entries(eventCounts)) {
      console.log(`${evt}: ${count}`);
    }

    console.log('\\n=== REVENUE VALIDATION ===');
    console.log(`Total Orders: ${aggs.summary.totalOrders}`);
    console.log(`Total Revenue: ${aggs.summary.totalRevenue}`);
    console.log(`Total GMV: ${aggs.summary.totalRevenue}`);
    
    console.log('\\n=== WHATSAPP VALIDATION ===');
    console.log(`WhatsApp Clicks: ${aggs.leadData.whatsappClicks}`);
    console.log(`OTP Sent: ${aggs.globalGuest.otpSent}`);
    console.log(`OTP Verified: ${aggs.globalGuest.otpVerified}`);
    console.log(`Guest Orders: ${aggs.globalGuest.orders}`);

    console.log('\\n=== CHART VALIDATION ===');
    const refreshed = await s.spreadsheets.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID, includeGridData: false });
    for (const sh of refreshed.data.sheets) {
      if (sh.charts) {
        sh.charts.forEach(c => {
          const spec = c.spec;
          let title = spec.title || 'Untitled Chart';
          let ranges = [];
          if (spec.basicChart) {
             spec.basicChart.domains.forEach(d => ranges.push(d.domain.sourceRange.sources));
             spec.basicChart.series.forEach(se => ranges.push(se.series.sourceRange.sources));
          } else if (spec.pieChart) {
             ranges.push(spec.pieChart.domain.sourceRange.sources);
             ranges.push(spec.pieChart.series.sourceRange.sources);
          }
          console.log(`Chart: ${title}`);
          console.log(`Sheet: ${sh.properties.title}`);
          console.log(`Ranges: ${JSON.stringify(ranges)}`);
        });
      }
    }

  } catch(err) {
    console.error(err);
  }
}
validate();
