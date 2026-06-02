const fs = require('fs');

const replacement = `
function getISTDateString(date) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  return \`\${istDate.getUTCFullYear()}-\${String(istDate.getUTCMonth() + 1).padStart(2, '0')}-\${String(istDate.getUTCDate()).padStart(2, '0')}\`;
}

function getWeekKeyIST(date) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  const tempDate = new Date(Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate()));
  tempDate.setUTCDate(tempDate.getUTCDate() + 3 - ((tempDate.getUTCDay() + 6) % 7));
  const week1 = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 4));
  const weekNo = Math.round(((tempDate - week1) / 86400000 - 3 + ((week1.getUTCDay() + 6) % 7)) / 7) + 1;
  return \`\${tempDate.getUTCFullYear()}-W\${String(weekNo).padStart(2, '0')}\`;
}

function getMonthKeyIST(date) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  return \`\${istDate.getUTCFullYear()}-\${String(istDate.getUTCMonth() + 1).padStart(2, '0')}\`;
}

function getSafeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

async function getSpreadsheetMetadata(s) {
  return s.spreadsheets.get({ spreadsheetId: SHEET_ID, includeGridData: false });
}

function findSheetByTitle(spreadsheet, title) {
  if (!spreadsheet || !spreadsheet.data || !spreadsheet.data.sheets) return null;
  return spreadsheet.data.sheets.find(sh => sh.properties.title?.toLowerCase() === title.toLowerCase());
}

async function createMissingSheets(s, spreadsheet) {
  const existingTitles = (spreadsheet.data.sheets || []).map(sh => sh.properties.title.toLowerCase());
  const requests = [];

  for (const title of DATA_SHEET_ORDER) {
    if (!existingTitles.includes(title.toLowerCase())) {
      requests.push({ addSheet: { properties: { title } } });
    }
  }

  if (requests.length) {
    await s.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests } });
  }

  const updatedSpreadsheet = await getSpreadsheetMetadata(s);
  const reorderRequests = [];

  for (let index = 0; index < DATA_SHEET_ORDER.length; index++) {
    const title = DATA_SHEET_ORDER[index];
    const sheet = findSheetByTitle(updatedSpreadsheet, title);
    if (sheet && sheet.properties.index !== index) {
      reorderRequests.push({
        updateSheetProperties: { properties: { sheetId: sheet.properties.sheetId, index }, fields: 'index' }
      });
    }
  }

  if (reorderRequests.length) {
    await s.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests: reorderRequests } });
  }
}

async function ensureRawEventsSheetExists(s, spreadsheetData) {
  const spreadsheet = spreadsheetData || await getSpreadsheetMetadata(s);
  let rawSheet = findSheetByTitle(spreadsheet, RAW_EVENTS_SHEET_TITLE);
  const analyticsSheet = findSheetByTitle(spreadsheet, 'Analytics');

  if (!rawSheet && analyticsSheet) {
    await s.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ updateSheetProperties: { properties: { sheetId: analyticsSheet.properties.sheetId, title: RAW_EVENTS_SHEET_TITLE }, fields: 'title' } }]
      }
    });
    const refreshed = await getSpreadsheetMetadata(s);
    rawSheet = findSheetByTitle(refreshed, RAW_EVENTS_SHEET_TITLE);
  }

  if (!rawSheet) {
    const response = await s.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: RAW_EVENTS_SHEET_TITLE, gridProperties: { frozenRowCount: 1 } } } }]
      }
    });
    rawSheet = response.data.replies[0].addSheet.properties;
  }

  await s.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: \`\${RAW_EVENTS_SHEET_TITLE}!A1:W1\`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [RAW_EVENTS_HEADER_ROW] }
  });

  await s.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{ updateSheetProperties: { properties: { sheetId: rawSheet.properties.sheetId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } }]
    }
  });

  return rawSheet;
}

async function clearSheet(s, sheetName) {
  await s.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: \`\${sheetName}!A1:Z1000\` });
}

async function writeSheetValues(s, sheetName, startCell, values) {
  if (!values || values.length === 0) return;
  await s.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: \`\${sheetName}!\${startCell}\`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });
}

function buildAggregations(rows) {
  // Session tracking (30m timeout)
  const sessions = new Map();
  // Visitor tracking
  const visitorFirstSeen = new Map();

  // Traffic Source & Product tracking
  const utmSources = new Map();
  const products = new Map();

  // Buckets
  const daily = new Map();
  const weekly = new Map();
  const monthly = new Map();
  
  // Sort rows by timestamp to accurately calculate durations and timeouts
  const sortedRows = [...rows].map(row => {
    const ts = parseDate(row.Timestamp || row.timestamp);
    return { ...row, _ts: ts, _tsTime: ts ? ts.getTime() : 0 };
  }).filter(r => r._ts).sort((a, b) => a._tsTime - b._tsTime);

  // Group into sessions with 30m timeout
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  
  sortedRows.forEach(row => {
    const rawSessionId = normalizeValue(row['Session ID'] || row.session_id);
    const visitorId = normalizeValue(row['Visitor ID'] || row.visitor_id) || rawSessionId || 'anonymous';
    const timestamp = row._ts;
    const timeMs = row._tsTime;
    
    const eventType = normalizeValue(row['Event Type'] || row.event_type || '').toLowerCase();
    const productName = normalizeValue(row['Product Name'] || row.product_name);
    const page = normalizeValue(row['Page'] || row.page);
    
    // Traffic Source Logic
    const rawUtmSource = normalizeValue(row['UTM Source'] || row.utm_source);
    const rawReferrer = normalizeValue(row['Referrer'] || row.referrer);
    let trafficSource = 'Direct';
    if (rawUtmSource) {
      trafficSource = rawUtmSource;
    } else if (rawReferrer) {
      try {
        const url = new URL(rawReferrer);
        trafficSource = url.hostname.replace('www.', '');
        if (trafficSource.includes('facebook.com')) trafficSource = 'Facebook';
        else if (trafficSource.includes('instagram.com')) trafficSource = 'Instagram';
        else if (trafficSource.includes('google')) trafficSource = 'Google';
        else if (trafficSource.includes('wa.me') || trafficSource.includes('whatsapp')) trafficSource = 'WhatsApp';
      } catch(e) {
        trafficSource = rawReferrer;
      }
    }
    const tl = trafficSource.toLowerCase();
    if (tl === 'direct') trafficSource = 'Direct';
    else if (tl === 'whatsapp') trafficSource = 'WhatsApp';
    else if (tl === 'google') trafficSource = 'Google';
    else if (tl === 'instagram') trafficSource = 'Instagram';
    else if (tl === 'facebook') trafficSource = 'Facebook';

    const price = getSafeNumber(row['price'] || 0);
    const quantity = getSafeNumber(row['quantity'] || 0);
    const orderTotal = getSafeNumber(row['Order Total'] || row.order_total || row.total_amount || (price * quantity));

    // Resolve true session ID (handling timeout splits)
    let sessionId = rawSessionId;
    if (sessions.has(sessionId)) {
      const existingSession = sessions.get(sessionId);
      if (timeMs - existingSession.maxTime > SESSION_TIMEOUT_MS) {
        // Split session
        sessionId = \`\${rawSessionId}_split_\${timeMs}\`;
      }
    }

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        id: sessionId,
        visitorId: visitorId,
        minTime: timeMs,
        maxTime: timeMs,
        events: 0,
        pageViews: 0,
        productViews: 0,
        addToCarts: 0,
        checkouts: 0,
        purchases: 0,
        guestCheckouts: 0,
        otpSent: 0,
        otpVerified: 0,
        revenue: 0,
        source: trafficSource,
        exitPage: page
      });
    }

    const sess = sessions.get(sessionId);
    sess.maxTime = timeMs;
    sess.events++;
    if (page) sess.exitPage = page; // Latest page becomes exit page
    
    if (eventType === 'page_view') sess.pageViews++;
    if (eventType === 'product_view') sess.productViews++;
    if (eventType === 'add_to_cart') sess.addToCarts++;
    if (eventType === 'checkout_started') sess.checkouts++;
    if (eventType === 'purchase_completed') {
      sess.purchases++;
      if (orderTotal > 0) sess.revenue += orderTotal;
    }
    if (eventType === 'guest_checkout_started') sess.guestCheckouts++;
    if (eventType === 'otp_sent') sess.otpSent++;
    if (eventType === 'otp_verified') sess.otpVerified++;

    // Record Visitor First Seen (using strict chronological sort)
    if (!visitorFirstSeen.has(visitorId)) {
      visitorFirstSeen.set(visitorId, timeMs);
    }

    // Product Metrics Update
    if (productName) {
      if (!products.has(productName)) {
        products.set(productName, { productName, views: 0, carts: 0, purchases: 0, revenue: 0 });
      }
      const p = products.get(productName);
      if (eventType === 'product_view') p.views++;
      if (eventType === 'add_to_cart') p.carts++;
      if (eventType === 'purchase_completed') {
        p.purchases++;
        if (orderTotal > 0) p.revenue += orderTotal;
      }
    }
  });

  // Now process sessions to build buckets
  const globalFunnel = {
    productViews: 0,
    addToCarts: 0,
    checkouts: 0,
    purchases: 0
  };

  const globalGuest = {
    visitors: new Set(),
    orders: 0,
    revenue: 0,
    otpSent: 0,
    otpVerified: 0,
    guestCheckouts: 0
  };

  const exitPages = new Map();

  Array.from(sessions.values()).forEach(sess => {
    const sessionDate = new Date(sess.minTime);
    const dateKey = getISTDateString(sessionDate);
    const weekKey = getWeekKeyIST(sessionDate);
    const monthKey = getMonthKeyIST(sessionDate);
    
    // Determine New vs Repeat Visitor for the session date
    const firstSeen = visitorFirstSeen.get(sess.visitorId);
    const firstSeenDateKey = getISTDateString(new Date(firstSeen));
    const isNewToday = firstSeenDateKey === dateKey;
    const firstSeenMonthKey = getMonthKeyIST(new Date(firstSeen));
    const isNewThisMonth = firstSeenMonthKey === monthKey;
    
    const ensureMapEntry = (map, key) => {
      if (!map.has(key)) {
        map.set(key, {
          date: key,
          visitors: new Set(),
          newVisitors: new Set(),
          sessions: 0,
          bounceSessions: 0,
          durationTotalMs: 0,
          orders: 0,
          revenue: 0,
          productViews: 0,
          addToCarts: 0,
          checkouts: 0,
          guestCheckouts: 0,
          guestOrders: 0,
          guestRevenue: 0,
          otpSent: 0,
          otpVerified: 0
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
      
      if (sess.productViews > 0) b.productViews++;
      if (sess.addToCarts > 0) b.addToCarts++;
      if (sess.checkouts > 0) b.checkouts++;
      
      if (sess.guestCheckouts > 0) b.guestCheckouts++;
      if (sess.guestCheckouts > 0 && sess.purchases > 0) {
        b.guestOrders++;
        b.guestRevenue += sess.revenue;
      }
      if (sess.otpSent > 0) b.otpSent++;
      if (sess.otpVerified > 0) b.otpVerified++;
    });

    // Global Funnel
    if (sess.productViews > 0) globalFunnel.productViews++;
    if (sess.addToCarts > 0) globalFunnel.addToCarts++;
    if (sess.checkouts > 0) globalFunnel.checkouts++;
    if (sess.purchases > 0) globalFunnel.purchases++;

    // Global Guest Metrics
    if (sess.guestCheckouts > 0) {
      globalGuest.visitors.add(sess.visitorId);
      globalGuest.guestCheckouts++;
      if (sess.purchases > 0) {
        globalGuest.orders++;
        globalGuest.revenue += sess.revenue;
      }
    }
    if (sess.otpSent > 0) globalGuest.otpSent++;
    if (sess.otpVerified > 0) globalGuest.otpVerified++;

    // Global Exit Pages
    if (sess.exitPage) {
      exitPages.set(sess.exitPage, (exitPages.get(sess.exitPage) || 0) + 1);
    }

    // Source Attribution
    if (!utmSources.has(sess.source)) {
      utmSources.set(sess.source, { source: sess.source, visitors: new Set(), orders: 0, revenue: 0 });
    }
    const src = utmSources.get(sess.source);
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
      
      productViewRate: b.sessions > 0 ? (b.productViews / b.sessions) : 0,
      addToCartRate: b.productViews > 0 ? (b.addToCarts / b.productViews) : 0,
      cartAbandonmentRate: b.addToCarts > 0 ? (1 - (b.purchases / b.addToCarts)) : 0,
      checkoutConversionRate: b.checkouts > 0 ? (b.orders / b.checkouts) : 0,
      purchaseConversionRate: b.sessions > 0 ? (b.orders / b.sessions) : 0,

      orders: b.orders,
      revenue: b.revenue,
      aov: b.orders > 0 ? (b.revenue / b.orders) : 0,
      revPerVisitor: b.visitors.size > 0 ? (b.revenue / b.visitors.size) : 0,

      guestVisitors: b.guestCheckouts,
      guestOrders: b.guestOrders,
      guestRevenue: b.guestRevenue,
      guestConversionRate: b.guestCheckouts > 0 ? (b.guestOrders / b.guestCheckouts) : 0,
      otpSuccessRate: b.otpSent > 0 ? (b.otpVerified / b.otpSent) : 0
    };
  };

  const dailyRows = sortedMap(daily, (a, b) => a.date.localeCompare(b.date)).map(mapBucketToRow);
  const weeklyRows = sortedMap(weekly, (a, b) => a.date.localeCompare(b.date)).map(mapBucketToRow);
  const monthlyRows = sortedMap(monthly, (a, b) => a.date.localeCompare(b.date)).map(mapBucketToRow);

  const productRows = Array.from(products.values())
    .map(p => ({
      productName: p.productName,
      productViews: p.views,
      cartAdds: p.carts,
      purchases: p.purchases,
      revenue: p.revenue,
      conversionRate: p.views > 0 ? (p.purchases / p.views) : 0
    }))
    .sort((a, b) => b.revenue - a.revenue || b.productViews - a.productViews)
    .slice(0, 50);
    
  const lowConversionProducts = Array.from(products.values())
    .map(p => ({
      productName: p.productName,
      productViews: p.views,
      conversionRate: p.views > 0 ? (p.purchases / p.views) : 0
    }))
    // High views but low conversion (<1% or 0)
    .filter(p => p.productViews > 5 && p.conversionRate < 0.01)
    .sort((a, b) => b.productViews - a.productViews)
    .slice(0, 20);

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

  // Global Summaries
  let totalVisitors = visitorFirstSeen.size;
  let totalSessions = sessions.size;
  let totalOrders = Array.from(sessions.values()).filter(s => s.purchases > 0).length;
  let totalRevenue = Array.from(sessions.values()).reduce((sum, s) => sum + s.revenue, 0);

  const todayStr = getISTDateString(new Date());
  const weekStr = getWeekKeyIST(new Date());
  const monthStr = getMonthKeyIST(new Date());

  const getBucketOrZero = (rowsArray, key) => rowsArray.find(r => r.date === key) || { 
    visitors: 0, orders: 0, revenue: 0, purchaseConversionRate: 0 
  };

  return {
    dailyRows,
    weeklyRows,
    monthlyRows,
    productRows,
    lowConversionProducts,
    utmRows,
    topExitPages,
    globalFunnel,
    globalGuest,
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
      revenuePerVisitor: totalVisitors > 0 ? (totalRevenue / totalVisitors) : 0
    }
  };
}

async function fetchRawEventRows(s) {
  const response = await s.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: DEFAULT_RANGE
  });
  const values = response.data.values || [];
  if (values.length === 0) return [];

  const headers = values[0].map(h => normalizeValue(h));
  return values.slice(1).map(row => {
    const result = {};
    headers.forEach((header, index) => {
      result[header] = row[index] !== undefined ? row[index] : '';
    });
    return result;
  });
}

function formatCurrency(value) {
  const num = getSafeNumber(value);
  return num.toFixed(2);
}

function formatPercent(value) {
  return \`\${(getSafeNumber(value) * 100).toFixed(2)}%\`;
}

function formatMins(value) {
  return \`\${getSafeNumber(value).toFixed(1)}m\`;
}

async function buildDashboardSheets(s) {
  const spreadsheet = await getSpreadsheetMetadata(s);
  await createMissingSheets(s, spreadsheet);
  await ensureRawEventsSheetExists(s, spreadsheet);
  const refreshed = await getSpreadsheetMetadata(s);
  await createMissingSheets(s, refreshed);

  const rows = await fetchRawEventRows(s);
  const aggregation = buildAggregations(rows);

  const dashboardValues = [
    ['Dashboard - Business Intelligence'],
    [],
    ['REVENUE METRICS', '', 'TRAFFIC METRICS', ''],
    ['GMV / Total Revenue', formatCurrency(aggregation.summary.totalRevenue), 'Total Visitors', aggregation.summary.totalVisitors],
    ['Total Orders', aggregation.summary.totalOrders, 'Total Sessions', aggregation.summary.totalSessions],
    ['Average Order Value', formatCurrency(aggregation.summary.averageOrderValue), 'Avg Session Duration', formatMins(aggregation.executiveSummary.month.avgSessionDurationMins || 0)],
    ['Revenue Per Visitor', formatCurrency(aggregation.summary.revenuePerVisitor), 'Bounce Rate', formatPercent(aggregation.executiveSummary.month.bounceRate || 0)],
    [],
    ['GUEST CHECKOUT METRICS', '', 'FUNNEL METRICS (Global Sessions)', ''],
    ['Guest Orders', aggregation.globalGuest.orders, 'Product View Rate', formatPercent(aggregation.summary.totalSessions > 0 ? aggregation.globalFunnel.productViews/aggregation.summary.totalSessions : 0)],
    ['Guest Revenue', formatCurrency(aggregation.globalGuest.revenue), 'Add To Cart Rate', formatPercent(aggregation.globalFunnel.productViews > 0 ? aggregation.globalFunnel.addToCarts/aggregation.globalFunnel.productViews : 0)],
    ['OTP Success Rate', formatPercent(aggregation.globalGuest.otpSent > 0 ? aggregation.globalGuest.otpVerified/aggregation.globalGuest.otpSent : 0), 'Cart Abandonment Rate', formatPercent(aggregation.globalFunnel.addToCarts > 0 ? 1 - (aggregation.globalFunnel.purchases/aggregation.globalFunnel.addToCarts) : 0)],
    ['Guest Conversion Rate', formatPercent(aggregation.globalGuest.guestCheckouts > 0 ? aggregation.globalGuest.orders/aggregation.globalGuest.guestCheckouts : 0), 'Checkout Conversion Rate', formatPercent(aggregation.globalFunnel.checkouts > 0 ? aggregation.globalFunnel.purchases/aggregation.globalFunnel.checkouts : 0)]
  ];

  const executiveValues = [
    ['Executive Summary'],
    [],
    ['Period', 'Visitors', 'New Visitors', 'Repeat Ratio', 'Orders', 'Revenue', 'AOV', 'Conv Rate'],
    ['Today', aggregation.executiveSummary.today.visitors, aggregation.executiveSummary.today.newVisitors, formatPercent(aggregation.executiveSummary.today.repeatRatio), aggregation.executiveSummary.today.orders, formatCurrency(aggregation.executiveSummary.today.revenue), formatCurrency(aggregation.executiveSummary.today.aov), formatPercent(aggregation.executiveSummary.today.purchaseConversionRate)],
    ['This Week', aggregation.executiveSummary.week.visitors, aggregation.executiveSummary.week.newVisitors, formatPercent(aggregation.executiveSummary.week.repeatRatio), aggregation.executiveSummary.week.orders, formatCurrency(aggregation.executiveSummary.week.revenue), formatCurrency(aggregation.executiveSummary.week.aov), formatPercent(aggregation.executiveSummary.week.purchaseConversionRate)],
    ['This Month', aggregation.executiveSummary.month.visitors, aggregation.executiveSummary.month.newVisitors, formatPercent(aggregation.executiveSummary.month.repeatRatio), aggregation.executiveSummary.month.orders, formatCurrency(aggregation.executiveSummary.month.revenue), formatCurrency(aggregation.executiveSummary.month.aov), formatPercent(aggregation.executiveSummary.month.purchaseConversionRate)],
  ];

  const mapReportRow = (row) => [
    row.date,
    row.visitors,
    row.newVisitors,
    row.repeatVisitors,
    formatPercent(row.repeatRatio),
    formatMins(row.avgSessionDurationMins),
    formatPercent(row.bounceRate),
    
    formatPercent(row.productViewRate),
    formatPercent(row.addToCartRate),
    formatPercent(row.cartAbandonmentRate),
    formatPercent(row.checkoutConversionRate),
    formatPercent(row.purchaseConversionRate),

    row.orders,
    formatCurrency(row.revenue),
    formatCurrency(row.aov),
    formatCurrency(row.revPerVisitor),
    
    row.guestVisitors,
    row.guestOrders,
    formatCurrency(row.guestRevenue),
    formatPercent(row.otpSuccessRate),
    formatPercent(row.guestConversionRate)
  ];

  const reportHeaders = [
    'Period', 'Visitors', 'New Visitors', 'Repeat Visitors', 'Repeat Ratio', 'Avg Session (m)', 'Bounce Rate',
    'Product View %', 'Add To Cart %', 'Cart Abandon %', 'Checkout Conv %', 'Overall Conv %',
    'Orders', 'Revenue', 'AOV', 'Rev / Visitor',
    'Guest Visitors', 'Guest Orders', 'Guest Revenue', 'OTP Success %', 'Guest Conv %'
  ];

  const dailyValues = [reportHeaders].concat(aggregation.dailyRows.map(mapReportRow));
  const weeklyValues = [reportHeaders].concat(aggregation.weeklyRows.map(mapReportRow));
  const monthlyValues = [reportHeaders].concat(aggregation.monthlyRows.map(mapReportRow));

  const trafficValues = [
    ['Top Exit Pages'],
    ['Page URL', 'Exits'],
    ...aggregation.topExitPages.map(r => [r.page, r.count])
  ];

  const productHeaderRow = ['Product Name', 'Product Views', 'Cart Adds', 'Purchases', 'Revenue', 'Conversion Rate'];
  const productValues = [
    ['TOP REVENUE PRODUCTS'],
    productHeaderRow,
    ...aggregation.productRows.map(row => [row.productName, row.productViews, row.cartAdds, row.purchases, formatCurrency(row.revenue), formatPercent(row.conversionRate)]),
    [],
    ['LOW CONVERSION PRODUCTS (High Views, <1% Conv)'],
    ['Product Name', 'Product Views', 'Conversion Rate'],
    ...aggregation.lowConversionProducts.map(row => [row.productName, row.productViews, formatPercent(row.conversionRate)])
  ];

  const marketingHeaderRow = ['Source', 'Visitors', 'Orders', 'Revenue', 'Conversion Rate'];
  const marketingValues = [
    ['TRAFFIC SOURCE REVENUE'],
    marketingHeaderRow,
    ...aggregation.utmRows.map(row => [row.source, row.visitors, row.orders, formatCurrency(row.revenue), formatPercent(row.conversionRate)])
  ];

  const sheetWrites = [
    { sheet: DASHBOARD_SHEET_TITLE, values: dashboardValues },
    { sheet: EXECUTIVE_SUMMARY_SHEET_TITLE, values: executiveValues },
    { sheet: DAILY_REPORT_SHEET_TITLE, values: dailyValues },
    { sheet: WEEKLY_REPORT_SHEET_TITLE, values: weeklyValues },
    { sheet: MONTHLY_REPORT_SHEET_TITLE, values: monthlyValues },
    { sheet: TRAFFIC_ANALYTICS_SHEET_TITLE, values: trafficValues },
    { sheet: PRODUCT_ANALYTICS_SHEET_TITLE, values: productValues },
    { sheet: MARKETING_ANALYTICS_SHEET_TITLE, values: marketingValues }
  ];

  for (const sheetWrite of sheetWrites) {
    await clearSheet(s, sheetWrite.sheet);
    await writeSheetValues(s, sheetWrite.sheet, 'A1', sheetWrite.values);
  }
}
`;

const contentStr = fs.readFileSync('services/googleSheetsService.js', 'utf8');
const startIdx = contentStr.indexOf('function getWeekKey(date) {');
const endIdx = contentStr.indexOf('async function populateDashboardSheet(s) {');

if (startIdx !== -1 && endIdx !== -1) {
  const newContent = contentStr.substring(0, startIdx) + replacement + contentStr.substring(endIdx);
  fs.writeFileSync('services/googleSheetsService.js', newContent);
  console.log('Successfully patched googleSheetsService.js');
} else {
  console.error('Could not find start/end indices!');
}
