const fs = require('fs');
const file = 'services/googleSheetsService.js';
let content = fs.readFileSync(file, 'utf8');

const newFunc = `async function buildDashboardSheets(s) {
  const formatCurrency = (value) => getSafeNumber(value).toFixed(2);
  const formatPercent = (value) => (getSafeNumber(value) * 100).toFixed(2) + '%';
  const formatMins = (value) => getSafeNumber(value).toFixed(1) + 'm';
  const createEmpty = () => ['', '', '', '', '', '', ''];

  const spreadsheet = await getSpreadsheetMetadata(s);
  await createMissingSheets(s, spreadsheet);
  await ensureRawEventsSheetExists(s, spreadsheet);
  const refreshed = await getSpreadsheetMetadata(s);
  await createMissingSheets(s, refreshed);
  
  const getSheetId = (title) => refreshed.data.sheets.find(sh => sh.properties.title === title)?.properties?.sheetId;

  const rows = await fetchRawEventRows(s);
  const aggregation = buildAggregations(rows);
  const ts = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' });

  const appendMeta = (vals) => {
    vals.push(createEmpty(), ['---', '---'], ['Last Refresh (IST)', ts], ['Data Source', 'Raw Events (Single Source of Truth)']);
    return vals;
  };

  // 1. EXECUTIVE DASHBOARD
  const execVals = appendMeta([
    ['EXECUTIVE DASHBOARD - PERFORMANCE SUMMARY'], createEmpty(),
    ['KEY PERFORMANCE INDICATORS', 'Current Period', '', 'GUEST METRICS', 'Current Period'],
    ['Total Visitors', aggregation.summary.totalVisitors, '', 'Guest Orders', aggregation.globalGuest.orders],
    ['Total Sessions', aggregation.dailyRows.reduce((a,b)=>a+b.visitors, 0), '', 'Guest Revenue', formatCurrency(aggregation.globalGuest.revenue)],
    ['Total Orders', aggregation.summary.totalOrders, '', 'Guest Conv %', formatPercent(aggregation.globalGuest.guestCheckouts > 0 ? aggregation.globalGuest.orders/aggregation.globalGuest.guestCheckouts : 0)],
    ['Total Revenue', formatCurrency(aggregation.summary.totalRevenue), '', '', ''],
    ['GMV', formatCurrency(aggregation.summary.totalRevenue), '', 'VISITOR METRICS', ''],
    ['AOV', formatCurrency(aggregation.summary.averageOrderValue), '', 'Repeat Ratio', formatPercent(aggregation.executiveSummary.month.repeatRatio)],
    ['Conversion Rate', formatPercent(aggregation.summary.overallConversionRate), '', '', '']
  ]);

  // 2. VISITOR INTELLIGENCE
  const visitorVals = appendMeta([
    ['VISITOR INTELLIGENCE'], createEmpty(),
    ['METRIC', 'Value'],
    ['New Visitors (All Time)', aggregation.dailyRows.reduce((sum, r) => sum + r.newVisitors, 0)],
    ['Repeat Visitors', aggregation.dailyRows.reduce((sum, r) => sum + r.repeatVisitors, 0)],
    ['Average Session Duration', formatMins(aggregation.executiveSummary.month.avgSessionDurationMins)],
    ['Global Bounce Rate', formatPercent(aggregation.executiveSummary.month.bounceRate)],
    createEmpty(), ['TOP EXIT PAGES', 'Exits'],
    ...aggregation.topExitPages.map(r => [r.page, r.count])
  ]);

  // 3. WHATSAPP ANALYTICS
  const waVals = appendMeta([
    ['WHATSAPP CHECKOUT ANALYTICS'], createEmpty(),
    ['METRIC', 'Value'],
    ['WhatsApp Button Clicks', aggregation.leadData.whatsappClicks],
    ['OTP Sent', aggregation.globalGuest.otpSent],
    ['OTP Verified', aggregation.globalGuest.otpVerified],
    ['OTP Success %', formatPercent(aggregation.globalGuest.otpSent > 0 ? aggregation.globalGuest.otpVerified / aggregation.globalGuest.otpSent : 0)],
    ['Guest Orders', aggregation.globalGuest.orders],
    ['Guest Revenue', formatCurrency(aggregation.globalGuest.revenue)]
  ]);

  // 4. PRODUCT ANALYTICS
  const prodVals = appendMeta([
    ['PRODUCT ANALYTICS'], createEmpty(),
    ['TOP PERFORMING PRODUCTS', 'Views', 'Carts', 'Purchases', 'Revenue', 'Conv Rate'],
    ...aggregation.productRows.slice(0, 20).map(p => [p.productName, p.views, p.carts, p.purchases, formatCurrency(p.revenue), formatPercent(p.views > 0 ? p.purchases/p.views : 0)]),
    createEmpty(),
    ['LOW CONVERSION PRODUCTS (High views, low purchases)', 'Views', 'Purchases', 'Conv Rate'],
    ...aggregation.productRows.filter(p => p.views > 10 && (p.views > 0 ? (p.purchases/p.views) : 0) < 0.02).map(p => [p.productName, p.views, p.purchases, formatPercent(p.views > 0 ? p.purchases/p.views : 0)])
  ]);

  // 5. CONVERSION FUNNEL
  const funnelVals = appendMeta([
    ['CONVERSION FUNNEL'], createEmpty(),
    ['FUNNEL STAGE', 'Users/Events', 'Drop-off'],
    ['Page View', aggregation.globalFunnel.pageViews, '-'],
    ['Product View', aggregation.globalFunnel.productViews, formatPercent(aggregation.globalFunnel.pageViews > 0 ? aggregation.globalFunnel.productViews/aggregation.globalFunnel.pageViews : 0)],
    ['Add To Cart', aggregation.globalFunnel.addToCarts, formatPercent(aggregation.globalFunnel.productViews > 0 ? aggregation.globalFunnel.addToCarts/aggregation.globalFunnel.productViews : 0)],
    ['Checkout Started', aggregation.globalFunnel.checkoutStarted, formatPercent(aggregation.globalFunnel.addToCarts > 0 ? aggregation.globalFunnel.checkoutStarted/aggregation.globalFunnel.addToCarts : 0)],
    ['Guest Checkout Started', aggregation.globalFunnel.guestCheckoutStarted, formatPercent(aggregation.globalFunnel.checkoutStarted > 0 ? aggregation.globalFunnel.guestCheckoutStarted/aggregation.globalFunnel.checkoutStarted : 0)],
    ['OTP Sent', aggregation.globalFunnel.otpSent, formatPercent(aggregation.globalFunnel.guestCheckoutStarted > 0 ? aggregation.globalFunnel.otpSent/aggregation.globalFunnel.guestCheckoutStarted : 0)],
    ['OTP Verified', aggregation.globalFunnel.otpVerified, formatPercent(aggregation.globalFunnel.otpSent > 0 ? aggregation.globalFunnel.otpVerified/aggregation.globalFunnel.otpSent : 0)],
    ['Purchase Completed', aggregation.globalFunnel.purchases, formatPercent(aggregation.globalFunnel.checkouts > 0 || aggregation.globalFunnel.otpVerified > 0 ? aggregation.globalFunnel.purchases/Math.max(aggregation.globalFunnel.checkoutStarted, aggregation.globalFunnel.otpVerified) : 0)]
  ]);

  // 6. TRAFFIC ANALYTICS
  const trafficVals = appendMeta([
    ['TRAFFIC SOURCE ANALYTICS'], createEmpty(),
    ['Source', 'Visitors', 'Orders', 'Revenue', 'Conv Rate'],
    ...aggregation.utmRows.map(u => [u.source, u.visitors, u.orders, formatCurrency(u.revenue), formatPercent(u.conversionRate)])
  ]);

  // 7. TIME BASED REPORTS
  const reportHeaders = ['Date', 'Visitors', 'New', 'Repeat', 'Orders', 'Revenue', 'AOV', 'Conv Rate', 'Avg Duration (m)', 'Bounce Rate'];
  const mapReport = r => [r.date, r.visitors, r.newVisitors, r.repeatVisitors, r.orders, formatCurrency(r.revenue), formatCurrency(r.aov), formatPercent(r.purchaseConversionRate), formatMins(r.avgSessionDurationMins), formatPercent(r.bounceRate)];
  
  const dailyVals = appendMeta([['DAILY REPORT'], createEmpty(), reportHeaders, ...aggregation.dailyRows.map(mapReport)]);
  const weeklyVals = appendMeta([['WEEKLY REPORT'], createEmpty(), reportHeaders, ...aggregation.weeklyRows.map(mapReport)]);
  const monthlyVals = appendMeta([['MONTHLY REPORT'], createEmpty(), reportHeaders, ...aggregation.monthlyRows.map(mapReport)]);

  // OTHERS
  const revVals = appendMeta([['REVENUE ANALYTICS'], createEmpty(), reportHeaders, ...aggregation.dailyRows.map(mapReport)]);
  const custVals = appendMeta([
    ['CUSTOMER ANALYTICS'], createEmpty(), 
    ['Customer Type', 'Count', 'Revenue'], 
    ['New Customers', aggregation.dailyRows.reduce((s, r)=>s+r.newVisitors,0), ''],
    ['Returning Customers', aggregation.dailyRows.reduce((s, r)=>s+r.repeatVisitors,0), ''],
    ['Guest Customers', aggregation.globalGuest.orders, formatCurrency(aggregation.globalGuest.revenue)]
  ]);
  const leadVals = appendMeta([['LEAD ANALYTICS'], createEmpty(), ['Lead Type', 'Count'], ['Contact Forms', aggregation.leadData.contactForms], ['WhatsApp Clicks', aggregation.leadData.whatsappClicks]]);

  const sheetWrites = [
    { sheet: EXECUTIVE_DASHBOARD_SHEET, values: execVals },
    { sheet: VISITOR_INTELLIGENCE_SHEET, values: visitorVals },
    { sheet: TRAFFIC_ANALYTICS_SHEET, values: trafficVals },
    { sheet: PRODUCT_ANALYTICS_SHEET, values: prodVals },
    { sheet: REVENUE_ANALYTICS_SHEET, values: revVals },
    { sheet: CUSTOMER_ANALYTICS_SHEET, values: custVals },
    { sheet: WHATSAPP_ANALYTICS_SHEET, values: waVals },
    { sheet: CONVERSION_FUNNEL_SHEET, values: funnelVals },
    { sheet: DAILY_REPORT_SHEET, values: dailyVals },
    { sheet: WEEKLY_REPORT_SHEET, values: weeklyVals },
    { sheet: MONTHLY_REPORT_SHEET, values: monthlyVals },
    { sheet: LEAD_ANALYTICS_SHEET, values: leadVals }
  ];

  for (const sheetWrite of sheetWrites) {
    await clearSheet(s, sheetWrite.sheet);
    await writeSheetValues(s, sheetWrite.sheet, 'A1', sheetWrite.values);
  }

  console.log('[DASHBOARD] Injecting charts via batchUpdate...');
  try {
    const chartRequests = [];
    
    // Clear all existing charts in these sheets
    for (const sh of refreshed.data.sheets) {
      if (sh.charts && DATA_SHEET_ORDER.includes(sh.properties.title)) {
        for (const chart of sh.charts) {
          chartRequests.push({ deleteChart: { chartId: chart.chartId } });
        }
      }
    }

    const execId = getSheetId(EXECUTIVE_DASHBOARD_SHEET);
    const dailyId = getSheetId(DAILY_REPORT_SHEET);
    const trafficId = getSheetId(TRAFFIC_ANALYTICS_SHEET);
    const funnelId = getSheetId(CONVERSION_FUNNEL_SHEET);
    
    // 1. Executive Dashboard (Revenue Trend)
    if(execId !== undefined && dailyId !== undefined && aggregation.dailyRows.length > 0) {
       chartRequests.push(chartBuilder.buildLineChart(execId, 'Revenue Trend (Daily)', 
          chartBuilder.createRange(dailyId, 2, 2 + aggregation.dailyRows.length, 0, 1), // Date
          [chartBuilder.createRange(dailyId, 2, 2 + aggregation.dailyRows.length, 5, 6)], // Revenue
          12, 0, 500, 300
       ));
       chartRequests.push(chartBuilder.buildLineChart(execId, 'Visitors Trend (Daily)', 
          chartBuilder.createRange(dailyId, 2, 2 + aggregation.dailyRows.length, 0, 1),
          [chartBuilder.createRange(dailyId, 2, 2 + aggregation.dailyRows.length, 1, 2)], // Visitors
          12, 5, 500, 300
       ));
    }
    
    // 2. Traffic Sources (Pie)
    if(trafficId !== undefined && aggregation.utmRows.length > 0) {
       chartRequests.push(chartBuilder.buildPieChart(execId, 'Traffic Sources', 
          chartBuilder.createRange(trafficId, 2, 2 + aggregation.utmRows.length, 0, 1),
          chartBuilder.createRange(trafficId, 2, 2 + aggregation.utmRows.length, 1, 2),
          22, 0, 400, 300
       ));
    }

    // 3. Conversion Funnel (Bar/Column)
    if(funnelId !== undefined) {
       chartRequests.push(chartBuilder.buildColumnChart(funnelId, 'Conversion Funnel', 
          chartBuilder.createRange(funnelId, 2, 11, 0, 1), // stages
          [chartBuilder.createRange(funnelId, 2, 11, 1, 2)], // values
          2, 4, 600, 400
       ));
       // Add funnel to exec dashboard too
       chartRequests.push(chartBuilder.buildColumnChart(execId, 'Conversion Funnel', 
          chartBuilder.createRange(funnelId, 2, 11, 0, 1),
          [chartBuilder.createRange(funnelId, 2, 11, 1, 2)],
          22, 4, 600, 300
       ));
    }

    if (chartRequests.length > 0) {
      await s.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { requests: chartRequests }
      });
      console.log('[DASHBOARD] Charts injected successfully.');
    }
  } catch(err) {
    console.error('[DASHBOARD_CHART_ERROR]', err.message);
  }
}`;

const startIndex = content.indexOf('async function buildDashboardSheets(s) {');
const endIndex = content.indexOf('async function populateDashboardSheet(s) {');

if (startIndex > -1 && endIndex > -1) {
  content = content.substring(0, startIndex) + newFunc + '\n' + content.substring(endIndex);
  fs.writeFileSync(file, content);
  console.log('Successfully replaced buildDashboardSheets');
} else {
  console.error('Could not find function boundaries');
}
