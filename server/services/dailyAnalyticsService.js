const { getAuth, fetchRawEventRows } = require('./googleSheetsService');

// Helper to safely parse numbers
const getSafeNumber = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const generateDailyAnalyticsSummary = async () => {
  console.log('[DAILY_ANALYTICS] Fetching Raw Events');
  const s = await getAuth();
  const rows = await fetchRawEventRows(s);

  // Determine "yesterday" in IST
  const now = new Date();
  const utcNow = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istNow = new Date(utcNow + (330 * 60000)); // IST is UTC+5:30
  
  // Subtract 1 day for yesterday
  const yesterday = new Date(istNow);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Format as YYYY-MM-DD
  const targetDateStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
  
  console.log(`[DAILY_ANALYTICS] Processing events for date: ${targetDateStr}`);

  let totalVisitors = 0;
  const uniqueVisitors = new Set();
  let totalSessions = 0;
  const uniqueSessions = new Set();
  let pageViews = 0;
  let productViews = 0;
  let addToCarts = 0;
  let orders = 0;
  let revenue = 0;
  
  const productViewCounts = new Map();
  const pageViewCounts = new Map();
  const trafficSources = new Map();
  
  const deviceCounts = { Mobile: 0, Desktop: 0, Tablet: 0, Unknown: 0 };

  rows.forEach(row => {
    // raw events timestamp is like 2026-06-02T10:00:00.000Z
    const timestampStr = row['timestamp'] || '';
    if (!timestampStr.startsWith(targetDateStr)) return;

    const eventType = String(row['event_type'] || '').trim().toLowerCase();
    const visitorId = row['visitor_id'] || 'unknown';
    const sessionId = row['session_id'] || 'unknown';
    
    uniqueVisitors.add(visitorId);
    uniqueSessions.add(sessionId);
    totalVisitors++;

    // Event specific counts
    if (eventType === 'page_view') {
      pageViews++;
      const pageUrl = row['page_url'] || 'Unknown';
      pageViewCounts.set(pageUrl, (pageViewCounts.get(pageUrl) || 0) + 1);
    } else if (eventType === 'product_view') {
      productViews++;
      const prodName = row['product_name'] || 'Unknown';
      productViewCounts.set(prodName, (productViewCounts.get(prodName) || 0) + 1);
    } else if (eventType === 'add_to_cart') {
      addToCarts++;
    } else if (eventType === 'purchase_completed') {
      orders++;
      revenue += getSafeNumber(row['order_total']);
    }

    // UTM / Traffic Sources (first touch within day approx)
    const source = String(row['utm_source'] || 'Direct').trim();
    const cleanSource = source === '' || source.toLowerCase() === 'undefined' ? 'Direct' : source;
    trafficSources.set(cleanSource, (trafficSources.get(cleanSource) || 0) + 1);

    // Device
    const device = String(row['device_type'] || 'Unknown').trim();
    if (device.toLowerCase() === 'mobile') deviceCounts.Mobile++;
    else if (device.toLowerCase() === 'desktop') deviceCounts.Desktop++;
    else if (device.toLowerCase() === 'tablet') deviceCounts.Tablet++;
    else deviceCounts.Unknown++;
  });

  // Calculate top items
  let topProduct = { name: 'None', views: 0 };
  for (const [name, views] of productViewCounts.entries()) {
    if (views > topProduct.views && name !== 'Unknown') {
      topProduct = { name, views };
    }
  }

  let topPage = { url: 'None', views: 0 };
  for (const [url, views] of pageViewCounts.entries()) {
    if (views > topPage.views && url !== 'Unknown') {
      topPage = { url, views };
    }
  }

  let topTraffic = { source: 'Direct', count: 0 };
  for (const [source, count] of trafficSources.entries()) {
    if (count > topTraffic.count) {
      topTraffic = { source, count };
    }
  }

  totalSessions = uniqueSessions.size;
  const aov = orders > 0 ? revenue / orders : 0;
  const conversionRate = totalSessions > 0 ? (orders / totalSessions) * 100 : 0;

  console.log('[DAILY_ANALYTICS] Summary Generated');
  
  return {
    date: targetDateStr,
    visitors: totalVisitors,
    uniqueVisitors: uniqueVisitors.size,
    sessions: totalSessions,
    pageViews,
    productViews,
    addToCarts,
    orders,
    revenue,
    aov,
    conversionRate,
    topProduct,
    topPage,
    topTraffic,
    trafficSources: Object.fromEntries(trafficSources),
    deviceBreakdown: deviceCounts
  };
};

module.exports = {
  generateDailyAnalyticsSummary
};
