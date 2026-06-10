const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'services/googleSheetsService.js');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Replace constants
const constantsStart = content.indexOf("const DASHBOARD_SHEET_TITLE = 'Dashboard';");
const constantsEnd = content.indexOf("];", constantsStart) + 2;

const newConstants = `const EXECUTIVE_DASHBOARD_SHEET = 'Executive Dashboard';
const VISITOR_INTELLIGENCE_SHEET = 'Visitor Intelligence';
const TRAFFIC_ANALYTICS_SHEET = 'Traffic Analytics';
const PRODUCT_ANALYTICS_SHEET = 'Product Analytics';
const REVENUE_ANALYTICS_SHEET = 'Revenue Analytics';
const CUSTOMER_ANALYTICS_SHEET = 'Customer Analytics';
const WHATSAPP_ANALYTICS_SHEET = 'WhatsApp Analytics';
const CONVERSION_FUNNEL_SHEET = 'Conversion Funnel';
const DAILY_REPORT_SHEET = 'Daily Report';
const WEEKLY_REPORT_SHEET = 'Weekly Report';
const MONTHLY_REPORT_SHEET = 'Monthly Report';
const LEAD_ANALYTICS_SHEET = 'Lead Analytics';
const RAW_EVENTS_SHEET_TITLE = 'Raw Events';

const DATA_SHEET_ORDER = [
  EXECUTIVE_DASHBOARD_SHEET,
  VISITOR_INTELLIGENCE_SHEET,
  TRAFFIC_ANALYTICS_SHEET,
  PRODUCT_ANALYTICS_SHEET,
  REVENUE_ANALYTICS_SHEET,
  CUSTOMER_ANALYTICS_SHEET,
  WHATSAPP_ANALYTICS_SHEET,
  CONVERSION_FUNNEL_SHEET,
  DAILY_REPORT_SHEET,
  WEEKLY_REPORT_SHEET,
  MONTHLY_REPORT_SHEET,
  LEAD_ANALYTICS_SHEET,
  RAW_EVENTS_SHEET_TITLE
];`;
content = content.substring(0, constantsStart) + newConstants + content.substring(constantsEnd);

// 2. Replace buildAggregations
const buildAggStart = content.indexOf('function buildAggregations(rows) {');
const buildAggEnd = content.indexOf('async function fetchRawEventRows(s) {');

const newBuildAggregations = `function buildAggregations(rows) {
  const sessions = new Map();
  const visitorFirstSeen = new Map();
  const products = new Map();
  const daily = new Map();
  const weekly = new Map();
  const monthly = new Map();
  const exitPages = new Map();
  const utmSources = new Map();
  
  const globalFunnel = {
    pageViews: 0,
    productViews: 0,
    addToCarts: 0,
    checkoutStarted: 0,
    guestCheckoutStarted: 0,
    otpSent: 0,
    otpVerified: 0,
    purchases: 0
  };

  const globalGuest = {
    guestCheckouts: 0,
    orders: 0,
    revenue: 0,
    otpSent: 0,
    otpVerified: 0
  };

  const leadData = {
    whatsappClicks: 0,
    contactForms: 0
  };

  // 1. Process rows sequentially
  rows.forEach(row => {
    const timestampStr = row['Timestamp'];
    if (!timestampStr) return;
    const time = new Date(timestampStr).getTime();
    if (isNaN(time)) return;

    const visitorId = row['Visitor ID'];
    const sessionId = row['Session ID'];
    const eventType = row['Event Type'];
    const revenue = getSafeNumber(row['Order Total']);
    const productId = row['Product ID'];
    const productName = row['Product Name'];
    const pageUrl = row['Page'];
    
    // Default categorizations
    let source = normalizeValue(row['UTM Source']);
    if (!source || source === 'direct' || source === '') {
        if (row['Referrer'] && row['Referrer'].includes('google')) source = 'google';
        else if (row['Referrer'] && row['Referrer'].includes('instagram')) source = 'instagram';
        else if (row['Referrer'] && row['Referrer'].includes('facebook')) source = 'facebook';
        else if (row['Referrer'] && row['Referrer'].includes('whatsapp')) source = 'whatsapp';
        else if (row['Referrer'] && !row['Referrer'].includes('kottravai') && !row['Referrer'].includes('localhost')) source = 'referral';
        else source = 'direct';
    }

    if (visitorId && (!visitorFirstSeen.has(visitorId) || time < visitorFirstSeen.get(visitorId))) {
      visitorFirstSeen.set(visitorId, time);
    }

    if (sessionId) {
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          sessionId, visitorId,
          minTime: time, maxTime: time,
          events: 0, purchases: 0, revenue: 0,
          productViews: 0, addToCarts: 0, checkouts: 0,
          guestCheckouts: 0, otpSent: 0, otpVerified: 0, whatsappClicks: 0,
          exitPage: pageUrl, source,
          hasPurchase: false
        });
      }
      const sess = sessions.get(sessionId);
      sess.events++;
      if (time < sess.minTime) sess.minTime = time;
      if (time > sess.maxTime) {
        sess.maxTime = time;
        sess.exitPage = pageUrl;
      }
      
      if (eventType === 'purchase_completed' && !sess.hasPurchase) {
        sess.purchases++;
        sess.revenue += revenue;
        sess.hasPurchase = true; // Prevent double counting in same session if duplicate event
      }
      if (eventType === 'product_view') sess.productViews++;
      if (eventType === 'add_to_cart') sess.addToCarts++;
      if (eventType === 'checkout_started') sess.checkouts++;
      if (eventType === 'guest_checkout_started') sess.guestCheckouts++;
      if (eventType === 'otp_sent') sess.otpSent++;
      if (eventType === 'otp_verified') sess.otpVerified++;
      if (eventType === 'whatsapp_click') sess.whatsappClicks++;
    }

    if (productId || productName) {
      const pKey = productId || productName;
      if (!products.has(pKey)) {
        products.set(pKey, { productName: productName || productId, views: 0, carts: 0, purchases: 0, revenue: 0 });
      }
      const p = products.get(pKey);
      if (eventType === 'product_view') p.views++;
      if (eventType === 'add_to_cart') p.carts++;
      if (eventType === 'purchase_completed') {
        p.purchases++;
        p.revenue += revenue;
      }
    }

    // Global Funnel directly from events (more accurate than session aggregation for raw funnels)
    if (eventType === 'page_view') globalFunnel.pageViews++;
    if (eventType === 'product_view') globalFunnel.productViews++;
    if (eventType === 'add_to_cart') globalFunnel.addToCarts++;
    if (eventType === 'checkout_started') globalFunnel.checkoutStarted++;
    if (eventType === 'guest_checkout_started') globalFunnel.guestCheckoutStarted++;
    if (eventType === 'otp_sent') globalFunnel.otpSent++;
    if (eventType === 'otp_verified') globalFunnel.otpVerified++;
    if (eventType === 'purchase_completed') globalFunnel.purchases++;
    
    if (eventType === 'whatsapp_click') leadData.whatsappClicks++;
    if (eventType === 'contact_form_submit') leadData.contactForms++;
  });

  // 2. Aggregate sessions
  Array.from(sessions.values()).forEach(sess => {
    const sessionDate = new Date(sess.minTime);
    const dateKey = getISTDateString(sessionDate);
    const weekKey = getWeekKeyIST(sessionDate);
    const monthKey = getMonthKeyIST(sessionDate);
    
    const firstSeen = visitorFirstSeen.get(sess.visitorId);
    const firstSeenDateKey = getISTDateString(new Date(firstSeen));
    const isNewToday = firstSeenDateKey === dateKey;
    const isNewThisMonth = getMonthKeyIST(new Date(firstSeen)) === monthKey;
    
    const ensureMapEntry = (map, key) => {
      if (!map.has(key)) {
        map.set(key, {
          date: key, visitors: new Set(), newVisitors: new Set(),
          sessions: 0, bounceSessions: 0, durationTotalMs: 0,
          orders: 0, revenue: 0, guestOrders: 0, guestRevenue: 0
        });
      }
      return map.get(key);
    };

    const dBucket = ensureMapEntry(daily, dateKey);
    const wBucket = ensureMapEntry(weekly, weekKey);
    const mBucket = ensureMapEntry(monthly, monthKey);

    [dBucket, wBucket, mBucket].forEach((b, i) => {
      b.visitors.add(sess.visitorId);
      let isNew = false;
      if (i === 0) isNew = isNewToday;
      else if (i === 1) isNew = (getWeekKeyIST(new Date(firstSeen)) === weekKey);
      else if (i === 2) isNew = isNewThisMonth;
      if (isNew) b.newVisitors.add(sess.visitorId);

      b.sessions++;
      if (sess.events === 1) b.bounceSessions++;
      b.durationTotalMs += (sess.maxTime - sess.minTime);
      
      if (sess.purchases > 0) {
        b.orders++;
        b.revenue += sess.revenue;
      }
      
      if (sess.guestCheckouts > 0 && sess.purchases > 0) {
        b.guestOrders++;
        b.guestRevenue += sess.revenue;
      }
    });

    if (sess.guestCheckouts > 0) {
      globalGuest.guestCheckouts++;
      if (sess.purchases > 0) {
        globalGuest.orders++;
        globalGuest.revenue += sess.revenue;
      }
    }
    if (sess.otpSent > 0) globalGuest.otpSent++;
    if (sess.otpVerified > 0) globalGuest.otpVerified++;

    if (sess.exitPage) {
      exitPages.set(sess.exitPage, (exitPages.get(sess.exitPage) || 0) + 1);
    }

    const srcName = sess.source.toLowerCase();
    if (!utmSources.has(srcName)) {
      utmSources.set(srcName, { source: srcName, visitors: new Set(), orders: 0, revenue: 0 });
    }
    const src = utmSources.get(srcName);
    src.visitors.add(sess.visitorId);
    if (sess.purchases > 0) {
      src.orders++;
      src.revenue += sess.revenue;
    }
  });

  const sortedMap = (map, comparator) => Array.from(map.values()).sort(comparator);
  
  const mapBucketToRow = (b) => {
    const repeatVis = b.visitors.size - b.newVisitors.size;
    return {
      date: b.date,
      visitors: b.visitors.size,
      newVisitors: b.newVisitors.size,
      repeatVisitors: repeatVis,
      repeatRatio: b.visitors.size > 0 ? (repeatVis / b.visitors.size) : 0,
      sessions: b.sessions,
      avgSessionDurationMins: b.sessions > 0 ? ((b.durationTotalMs / b.sessions) / 60000) : 0,
      bounceRate: b.sessions > 0 ? (b.bounceSessions / b.sessions) : 0,
      orders: b.orders,
      revenue: b.revenue,
      aov: b.orders > 0 ? (b.revenue / b.orders) : 0,
      revPerVisitor: b.visitors.size > 0 ? (b.revenue / b.visitors.size) : 0,
      purchaseConversionRate: b.visitors.size > 0 ? (b.orders / b.visitors.size) : 0,
      guestOrders: b.guestOrders,
      guestRevenue: b.guestRevenue
    };
  };

  const dailyRows = sortedMap(daily, (a, b) => a.date.localeCompare(b.date)).map(mapBucketToRow);
  const weeklyRows = sortedMap(weekly, (a, b) => a.date.localeCompare(b.date)).map(mapBucketToRow);
  const monthlyRows = sortedMap(monthly, (a, b) => a.date.localeCompare(b.date)).map(mapBucketToRow);

  const productRows = Array.from(products.values())
    .sort((a, b) => b.revenue - a.revenue || b.views - a.views);

  const utmRows = Array.from(utmSources.values())
    .map(src => ({
      source: src.source,
      visitors: src.visitors.size,
      orders: src.orders,
      revenue: src.revenue,
      conversionRate: src.visitors.size > 0 ? (src.orders / src.visitors.size) : 0
    }))
    .sort((a, b) => b.revenue - a.revenue || b.visitors - a.visitors);

  const topExitPages = Array.from(exitPages.entries())
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  let totalVisitors = visitorFirstSeen.size;
  let totalSessions = sessions.size;
  let totalOrders = Array.from(sessions.values()).filter(s => s.purchases > 0).length;
  let totalRevenue = Array.from(sessions.values()).reduce((sum, s) => sum + s.revenue, 0);

  const todayStr = getISTDateString(new Date());
  const weekStr = getWeekKeyIST(new Date());
  const monthStr = getMonthKeyIST(new Date());

  const getBucketOrZero = (rowsArray, key) => rowsArray.find(r => r.date === key) || { 
    visitors: 0, newVisitors: 0, repeatRatio: 0, avgSessionDurationMins: 0, bounceRate: 0,
    orders: 0, revenue: 0, purchaseConversionRate: 0, guestOrders: 0, guestRevenue: 0, aov: 0 
  };

  return {
    dailyRows,
    weeklyRows,
    monthlyRows,
    productRows,
    utmRows,
    topExitPages,
    globalFunnel,
    globalGuest,
    leadData,
    executiveSummary: {
      today: getBucketOrZero(dailyRows, todayStr),
      week: getBucketOrZero(weeklyRows, weekStr),
      month: getBucketOrZero(monthlyRows, monthStr)
    },
    summary: {
      totalVisitors,
      totalSessions,
      totalOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders) : 0,
      revenuePerVisitor: totalVisitors > 0 ? (totalRevenue / totalVisitors) : 0,
      overallConversionRate: totalVisitors > 0 ? (totalOrders / totalVisitors) : 0,
      overallRepeatRatio: totalVisitors > 0 ? ((totalVisitors - Array.from(visitorFirstSeen.entries()).filter(([v,t]) => getMonthKeyIST(new Date(t)) === monthStr).length) / totalVisitors) : 0
    }
  };
}
`;

content = content.substring(0, buildAggStart) + newBuildAggregations + content.substring(buildAggEnd);

// 3. Replace buildDashboardSheets
const buildDashStart = content.indexOf('async function buildDashboardSheets(s) {');
const buildDashEnd = content.indexOf('async function populateDashboardSheet(s) {');

const newBuildDashboardSheets = `async function buildDashboardSheets(s) {
  const spreadsheet = await getSpreadsheetMetadata(s);
  await createMissingSheets(s, spreadsheet);
  await ensureRawEventsSheetExists(s, spreadsheet);
  const refreshed = await getSpreadsheetMetadata(s);
  await createMissingSheets(s, refreshed);

  const rows = await fetchRawEventRows(s);
  const aggregation = buildAggregations(rows);

  const createEmpty = () => ['', '', '', '', '', '', ''];

  // 1. EXECUTIVE DASHBOARD
  const execVals = [
    ['EXECUTIVE DASHBOARD - PERFORMANCE SUMMARY'],
    createEmpty(),
    ['KEY PERFORMANCE INDICATORS', 'Current Period', '', 'GUEST METRICS', 'Current Period'],
    ['Total Visitors', aggregation.summary.totalVisitors, '', 'Guest Orders', aggregation.globalGuest.orders],
    ['Total Orders', aggregation.summary.totalOrders, '', 'Guest Revenue', formatCurrency(aggregation.globalGuest.revenue)],
    ['Total Revenue', formatCurrency(aggregation.summary.totalRevenue), '', 'Guest Conv %', formatPercent(aggregation.globalGuest.guestCheckouts > 0 ? aggregation.globalGuest.orders/aggregation.globalGuest.guestCheckouts : 0)],
    ['GMV', formatCurrency(aggregation.summary.totalRevenue), '', '', ''],
    ['AOV', formatCurrency(aggregation.summary.averageOrderValue), '', 'VISITOR METRICS', ''],
    ['Conversion Rate', formatPercent(aggregation.summary.overallConversionRate), '', 'Repeat Ratio', formatPercent(aggregation.executiveSummary.month.repeatRatio)]
  ];

  // 2. VISITOR INTELLIGENCE
  const visitorVals = [
    ['VISITOR INTELLIGENCE'],
    createEmpty(),
    ['METRIC', 'Value'],
    ['New Visitors (All Time)', aggregation.dailyRows.reduce((sum, r) => sum + r.newVisitors, 0)],
    ['Repeat Visitors', aggregation.dailyRows.reduce((sum, r) => sum + r.repeatVisitors, 0)],
    ['Average Session Duration', formatMins(aggregation.executiveSummary.month.avgSessionDurationMins)],
    ['Global Bounce Rate', formatPercent(aggregation.executiveSummary.month.bounceRate)],
    createEmpty(),
    ['TOP EXIT PAGES', 'Exits'],
    ...aggregation.topExitPages.map(r => [r.page, r.count])
  ];

  // 3. WHATSAPP ANALYTICS
  const waVals = [
    ['WHATSAPP CHECKOUT ANALYTICS'],
    createEmpty(),
    ['METRIC', 'Value'],
    ['WhatsApp Button Clicks', aggregation.leadData.whatsappClicks],
    ['OTP Sent', aggregation.globalGuest.otpSent],
    ['OTP Verified', aggregation.globalGuest.otpVerified],
    ['OTP Success %', formatPercent(aggregation.globalGuest.otpSent > 0 ? aggregation.globalGuest.otpVerified / aggregation.globalGuest.otpSent : 0)],
    ['Guest Orders', aggregation.globalGuest.orders],
    ['Guest Revenue', formatCurrency(aggregation.globalGuest.revenue)]
  ];

  // 4. PRODUCT ANALYTICS
  const prodVals = [
    ['PRODUCT ANALYTICS'],
    createEmpty(),
    ['TOP PERFORMING PRODUCTS', 'Views', 'Carts', 'Purchases', 'Revenue', 'Conv Rate'],
    ...aggregation.productRows.slice(0, 20).map(p => [
      p.productName, p.views, p.carts, p.purchases, formatCurrency(p.revenue), formatPercent(p.views > 0 ? p.purchases/p.views : 0)
    ]),
    createEmpty(),
    ['LOW CONVERSION PRODUCTS (High views, low purchases)', 'Views', 'Purchases', 'Conv Rate'],
    ...aggregation.productRows.filter(p => p.views > 10 && (p.views > 0 ? (p.purchases/p.views) : 0) < 0.02).map(p => [
      p.productName, p.views, p.purchases, formatPercent(p.views > 0 ? p.purchases/p.views : 0)
    ])
  ];

  // 5. CONVERSION FUNNEL
  const funnelVals = [
    ['CONVERSION FUNNEL (All Events)'],
    createEmpty(),
    ['FUNNEL STAGE', 'Users/Events', 'Drop-off from Previous'],
    ['Page View', aggregation.globalFunnel.pageViews, '-'],
    ['Product View', aggregation.globalFunnel.productViews, formatPercent(aggregation.globalFunnel.pageViews > 0 ? aggregation.globalFunnel.productViews/aggregation.globalFunnel.pageViews : 0)],
    ['Add To Cart', aggregation.globalFunnel.addToCarts, formatPercent(aggregation.globalFunnel.productViews > 0 ? aggregation.globalFunnel.addToCarts/aggregation.globalFunnel.productViews : 0)],
    ['Checkout Started', aggregation.globalFunnel.checkoutStarted, formatPercent(aggregation.globalFunnel.addToCarts > 0 ? aggregation.globalFunnel.checkoutStarted/aggregation.globalFunnel.addToCarts : 0)],
    ['Guest Checkout Started', aggregation.globalFunnel.guestCheckoutStarted, formatPercent(aggregation.globalFunnel.checkoutStarted > 0 ? aggregation.globalFunnel.guestCheckoutStarted/aggregation.globalFunnel.checkoutStarted : 0)],
    ['OTP Sent', aggregation.globalFunnel.otpSent, formatPercent(aggregation.globalFunnel.guestCheckoutStarted > 0 ? aggregation.globalFunnel.otpSent/aggregation.globalFunnel.guestCheckoutStarted : 0)],
    ['OTP Verified', aggregation.globalFunnel.otpVerified, formatPercent(aggregation.globalFunnel.otpSent > 0 ? aggregation.globalFunnel.otpVerified/aggregation.globalFunnel.otpSent : 0)],
    ['Purchase Completed', aggregation.globalFunnel.purchases, formatPercent(aggregation.globalFunnel.checkouts > 0 || aggregation.globalFunnel.otpVerified > 0 ? aggregation.globalFunnel.purchases/Math.max(aggregation.globalFunnel.checkoutStarted, aggregation.globalFunnel.otpVerified) : 0)]
  ];

  // 6. TRAFFIC ANALYTICS
  const trafficVals = [
    ['TRAFFIC SOURCE ANALYTICS'],
    createEmpty(),
    ['Source', 'Visitors', 'Orders', 'Revenue', 'Conv Rate'],
    ...aggregation.utmRows.map(u => [
      u.source, u.visitors, u.orders, formatCurrency(u.revenue), formatPercent(u.conversionRate)
    ])
  ];

  // 7. TIME BASED REPORTS
  const reportHeaders = ['Date', 'Visitors', 'New', 'Repeat', 'Orders', 'Revenue', 'AOV', 'Conv Rate', 'Avg Duration (m)', 'Bounce Rate'];
  const mapReport = r => [r.date, r.visitors, r.newVisitors, r.repeatVisitors, r.orders, formatCurrency(r.revenue), formatCurrency(r.aov), formatPercent(r.purchaseConversionRate), formatMins(r.avgSessionDurationMins), formatPercent(r.bounceRate)];
  
  const dailyVals = [['DAILY REPORT'], createEmpty(), reportHeaders, ...aggregation.dailyRows.map(mapReport)];
  const weeklyVals = [['WEEKLY REPORT'], createEmpty(), reportHeaders, ...aggregation.weeklyRows.map(mapReport)];
  const monthlyVals = [['MONTHLY REPORT'], createEmpty(), reportHeaders, ...aggregation.monthlyRows.map(mapReport)];

  // OTHERS
  const revVals = [['REVENUE ANALYTICS'], createEmpty(), ['Total Revenue', formatCurrency(aggregation.summary.totalRevenue)], ['AOV', formatCurrency(aggregation.summary.averageOrderValue)]];
  const custVals = [['CUSTOMER ANALYTICS'], createEmpty(), ['Total Visitors', aggregation.summary.totalVisitors]];
  const leadVals = [['LEAD ANALYTICS'], createEmpty(), ['Contact Forms Submitted', aggregation.leadData.contactForms]];

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
}
`;

content = content.substring(0, buildDashStart) + newBuildDashboardSheets + content.substring(buildDashEnd);

// 4. Update the helper that checks sheets to match exact names
const ensurePattern = /sh\.properties\.title === RAW_EVENTS_SHEET_TITLE \|\| sh\.properties\.title\.toLowerCase\(\) === RAW_EVENTS_SHEET_TITLE\.toLowerCase\(\) \|\| sh\.properties\.title\.toLowerCase\(\) === 'analytics'/g;
content = content.replace(ensurePattern, "sh.properties.title === RAW_EVENTS_SHEET_TITLE || DATA_SHEET_ORDER.includes(sh.properties.title)");

fs.writeFileSync(targetFile, content);
console.log('googleSheetsService.js updated successfully via indexOf boundaries!');
