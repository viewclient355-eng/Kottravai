const { sheets, fetchRawEventRows } = require('./googleSheetsService');
const googleSheetsService = require('./googleSheetsService');

const getSafeNumber = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const formatCur = (val) => `₹${getSafeNumber(val).toFixed(2)}`;
const formatPct = (val) => `${getSafeNumber(val).toFixed(1)}%`;

const generateDailyAnalyticsSummary = async () => {
  console.log('[DAILY_ANALYTICS] Fetching Raw Events');
  const s = await sheets();
  const rows = await fetchRawEventRows(s);

  const now = new Date();
  const utcNow = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istNow = new Date(utcNow + (330 * 60000));
  
  const yesterday = new Date(istNow);
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDateStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
  
  console.log(`[DAILY_ANALYTICS] Processing events for date: ${targetDateStr}`);

  // Fetch global aggregations for history (MTD, 7D, AI Alerts)
  const agg = await googleSheetsService.getAggregations();
  const waRows = await googleSheetsService.fetchWhatsAppPerformance(s);

  // Core Variables
  const uniqueVisitors = new Set();
  const newVisitors = new Set();
  const repeatVisitors = new Set();
  const newCustomers = new Set();
  const returningCustomers = new Set();
  const uniqueSessions = new Set();
  
  let totalEvents = 0, pageViews = 0, productViews = 0, addToCarts = 0, orders = 0, revenue = 0;
  
  // Data Structures
  const productStats = new Map(); // { name: { views, visitors: Set, revenue, add_to_cart, purchases } }
  const pageStats = new Map(); // { url: { views, visitors: Set } }
  const trafficSources = new Map(); // { source: visitors Set }
  const campaignStats = new Map(); // { campaign: { visitors: Set, revenue } }
  const geographyStats = new Map(); // { state: visitors Set, city: visitors Set }
  const firstTouchAttr = new Map();
  const lastTouchAttr = new Map();
  const journeyAttr = new Map();

  const visitorFirstSeen = new Map();
  const visitorFirstPurchase = new Map();

  // Pass 1: Global Visitor History
  rows.forEach(row => {
    const tsStr = row['timestamp'] || '';
    if (tsStr.length >= 10) {
      const dStr = tsStr.substring(0, 10);
      const vId = row['visitor_id'] || 'unknown';
      const eventType = String(row['event_type'] || '').trim().toLowerCase();
      
      if (!visitorFirstSeen.has(vId) && vId !== 'unknown') {
        visitorFirstSeen.set(vId, dStr);
      }
      if ((eventType === 'purchase_completed' || eventType === 'purchase completed') && vId !== 'unknown') {
        if (!visitorFirstPurchase.has(vId)) {
          visitorFirstPurchase.set(vId, dStr);
        }
      }
    }
  });

  // Pass 2: Yesterday's Metrics
  rows.forEach(row => {
    const timestampStr = row['timestamp'] || '';
    if (!timestampStr.startsWith(targetDateStr)) return;

    const eventType = String(row['event_type'] || '').trim().toLowerCase();
    const visitorId = row['visitor_id'] || 'unknown';
    const sessionId = row['session_id'] || 'unknown';
    const productName = String(row['product_name'] || '').trim();

    // Ignore erroneous product events
    if ((eventType === 'purchase_completed' || eventType === 'add_to_cart' || eventType === 'product_view') && productName === '') {
        return;
    }

    uniqueVisitors.add(visitorId);
    uniqueSessions.add(sessionId);
    totalEvents++;

    if (visitorId !== 'unknown') {
      if (visitorFirstSeen.get(visitorId) === targetDateStr) newVisitors.add(visitorId);
      else repeatVisitors.add(visitorId);
    }

    // Products
    if (productName !== '') {
      if (!productStats.has(productName)) productStats.set(productName, { views: 0, visitors: new Set(), revenue: 0, add_to_cart: 0, purchases: 0 });
      const pStat = productStats.get(productName);
      if (eventType === 'product_view') {
        pStat.views++;
        pStat.visitors.add(visitorId);
        productViews++;
      } else if (eventType === 'add_to_cart') {
        pStat.add_to_cart++;
        addToCarts++;
      } else if (eventType === 'purchase_completed') {
        pStat.purchases++;
        pStat.revenue += getSafeNumber(row['order_total']);
      }
    }

    // Pages
    if (eventType === 'page_view') {
      pageViews++;
      let pageUrl = row['page'] || 'Unknown';
      if (typeof pageUrl === 'string') pageUrl = pageUrl.replace(/kottravai\.com/g, 'kottravai.in');
      if (!pageStats.has(pageUrl)) pageStats.set(pageUrl, { views: 0, visitors: new Set() });
      pageStats.get(pageUrl).views++;
      pageStats.get(pageUrl).visitors.add(visitorId);
    }

    // Purchases
    if (eventType === 'purchase_completed') {
      orders++;
      revenue += getSafeNumber(row['order_total']);
      if (visitorId !== 'unknown') {
        if (visitorFirstPurchase.get(visitorId) === targetDateStr) newCustomers.add(visitorId);
        else returningCustomers.add(visitorId);
      }
    }

    // Traffic Sources
    let source = String(row['utm_source'] || 'Direct').trim();
    if (source === '' || source === 'undefined') source = 'Direct';
    if (!trafficSources.has(source)) trafficSources.set(source, new Set());
    trafficSources.get(source).add(visitorId);

    // Campaigns
    const campaign = String(row['utm_campaign'] || '(not set)').trim();
    if (!campaignStats.has(campaign)) campaignStats.set(campaign, { visitors: new Set(), revenue: 0 });
    campaignStats.get(campaign).visitors.add(visitorId);
    if (eventType === 'purchase_completed') campaignStats.get(campaign).revenue += getSafeNumber(row['order_total']);

    // Geography
    const state = row['state'];
    const city = row['city'];
    if (visitorId !== 'unknown') {
      if (state && state !== 'Unknown') {
        if (!geographyStats.has(`State:${state}`)) geographyStats.set(`State:${state}`, new Set());
        geographyStats.get(`State:${state}`).add(visitorId);
      }
      if (city && city !== 'Unknown') {
        if (!geographyStats.has(`City:${city}`)) geographyStats.set(`City:${city}`, new Set());
        geographyStats.get(`City:${city}`).add(visitorId);
      }
    }
    
    // Attribution (simple logic for yesterday)
    const medium = String(row['utm_medium'] || '(not set)').trim();
    if (eventType === 'purchase_completed') {
       const ftKey = `${source}`;
       const ltKey = `${source}`; // Simplified for daily snapshot
       const journeyKey = `${source} → ${source}`;
       if(!firstTouchAttr.has(ftKey)) firstTouchAttr.set(ftKey, 0);
       if(!lastTouchAttr.has(ltKey)) lastTouchAttr.set(ltKey, 0);
       if(!journeyAttr.has(journeyKey)) journeyAttr.set(journeyKey, 0);
       const revAmt = getSafeNumber(row['order_total']);
       firstTouchAttr.set(ftKey, firstTouchAttr.get(ftKey) + revAmt);
       lastTouchAttr.set(ltKey, lastTouchAttr.get(ltKey) + revAmt);
       journeyAttr.set(journeyKey, journeyAttr.get(journeyKey) + revAmt);
    }
  });

  // Calculate Insights
  
  // 2. Visitor Insights
  const topTrafficSource = Array.from(trafficSources.entries()).sort((a,b)=>b[1].size - a[1].size)[0]?.[0] || 'N/A';
  const topCampaignRaw = Array.from(campaignStats.entries()).sort((a,b)=>b[1].visitors.size - a[1].visitors.size)[0]?.[0] || 'N/A';

  // 3. Product Insights
  let topViewedProd = 'N/A', maxViews = 0;
  let mostRepViewedProd = 'N/A', maxRepViews = 0;
  let highestRevProd = 'N/A', maxRev = 0;
  let topConvProd = 'N/A', maxConv = 0;
  
  for (const [name, st] of productStats.entries()) {
    if (st.views > maxViews) { maxViews = st.views; topViewedProd = name; }
    const repViews = st.views - st.visitors.size;
    if (repViews > maxRepViews) { maxRepViews = repViews; mostRepViewedProd = name; }
    if (st.revenue > maxRev) { maxRev = st.revenue; highestRevProd = name; }
    const conv = st.views > 0 ? (st.purchases / st.views) : 0;
    if (conv > maxConv && st.views > 5) { maxConv = conv; topConvProd = name; }
  }

  // 4. Cart Intelligence
  let topAddToCartProd = 'N/A', maxAddToCart = 0;
  for (const [name, st] of productStats.entries()) {
    if (st.add_to_cart > maxAddToCart) { maxAddToCart = st.add_to_cart; topAddToCartProd = name; }
  }
  const cartConversionRate = addToCarts > 0 ? (orders / addToCarts) * 100 : 0;
  
  let yesterdayCarts = agg.cartInstances.filter(c => c.addedAt && new Date(c.addedAt).toISOString().startsWith(targetDateStr));
  let avgCartDurationHours = 0;
  if (yesterdayCarts.length > 0) {
    avgCartDurationHours = yesterdayCarts.reduce((acc, c) => acc + ((Date.now() - c.addedAt)/3600000), 0) / yesterdayCarts.length;
  }

  // 5. Geography
  let topState = 'N/A', topStateVis = 0;
  let topCity = 'N/A', topCityVis = 0;
  for (const [key, set] of geographyStats.entries()) {
    if (key.startsWith('State:') && set.size > topStateVis) { topStateVis = set.size; topState = key.split(':')[1]; }
    if (key.startsWith('City:') && set.size > topCityVis) { topCityVis = set.size; topCity = key.split(':')[1]; }
  }

  // 6. Page Performance
  let topViewedPage = 'N/A', maxPgViews = 0;
  let mostRepViewedPage = 'N/A', maxRepPgViews = 0;
  let topProductPage = 'N/A', maxProdPgViews = 0;
  for (const [url, st] of pageStats.entries()) {
    if (st.views > maxPgViews) { maxPgViews = st.views; topViewedPage = url; }
    const repPgViews = st.views - st.visitors.size;
    if (repPgViews > maxRepPgViews) { maxRepPgViews = repPgViews; mostRepViewedPage = url; }
    if (url.includes('/product/') && st.views > maxProdPgViews) { maxProdPgViews = st.views; topProductPage = url; }
  }

  // 8. Revenue Insights
  const dRows = agg.dailyRows.sort((a,b) => new Date(b.date) - new Date(a.date));
  const last7DaysRev = dRows.slice(0, 7).reduce((acc, r) => acc + r.revenue, 0);
  const mtdRev = dRows.slice(0, 30).reduce((acc, r) => acc + r.revenue, 0);
  
  let waSent = 0, totalRecoveredRev = 0;
  if (waRows && waRows.length > 0) {
    waRows.forEach(row => {
       if (row['Status'] === 'Sent' || row['Status'] === 'Queued') waSent++;
       if (row['Recovered Revenue']) totalRecoveredRev += getSafeNumber(row['Recovered Revenue']);
    });
  }

  // 9. Campaign & Attribution
  const topRevCampaign = Array.from(campaignStats.entries()).sort((a,b)=>b[1].revenue - a[1].revenue)[0]?.[0] || 'N/A';
  const topFTSrc = Array.from(firstTouchAttr.entries()).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';
  const topLTSrc = Array.from(lastTouchAttr.entries()).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';
  const topRevJourney = Array.from(journeyAttr.entries()).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';

  // 10. Recommendations
  const pm = agg.productRecommendationMetrics;
  const topRecAction = topRevCampaign !== 'N/A' && topRevCampaign !== '(not set)' 
    ? `Increase budget on Campaign: ${topRevCampaign}`
    : 'Monitor baseline metrics. Ensure WhatsApp Recovery is enabled.';

  return {
    date: targetDateStr,
    summary: {
      totalVisitors: uniqueVisitors.size,
      totalSessions: uniqueSessions.size,
      totalOrders: orders,
      totalRevenue: revenue,
      overallConversionRate: uniqueSessions.size > 0 ? (orders / uniqueSessions.size) : 0,
      averageOrderValue: orders > 0 ? (revenue / orders) : 0
    },
    blocks: {
      visitorInsights: {
        totalVisitors: uniqueVisitors.size,
        newVisitors: newVisitors.size,
        repeatVisitors: repeatVisitors.size,
        topTrafficSource,
        topCampaign: topCampaignRaw
      },
      productInsights: {
        mostViewedProduct: topViewedProd,
        mostRepeatedlyViewedProduct: mostRepViewedProd,
        highestRevenueProduct: highestRevProd,
        highestConversionProduct: topConvProd,
        mostCriticalProduct: pm.mostCriticalProduct?.product || 'N/A'
      },
      cartIntelligence: {
        topAddToCartProduct: topAddToCartProd,
        averageCartDuration: avgCartDurationHours > 0 ? `${avgCartDurationHours.toFixed(1)} Hours` : 'N/A',
        cartConversionRate: formatPct(cartConversionRate),
        recoverableRevenue: formatCur(pm.totalRecoverableRev || 0),
        lostRevenue: formatCur(pm.totalLostRev || 0)
      },
      geographyInsights: {
        topState,
        topCity,
        newGeographySources: topState !== 'N/A' ? topState : 'N/A', // Simple mock
        returningGeographySources: topCity !== 'N/A' ? topCity : 'N/A'
      },
      pagePerformance: {
        topViewedPage,
        mostRevisitedPage: mostRepViewedPage,
        topProductPage
      },
      orderInsights: {
        totalOrders: orders,
        newCustomers: newCustomers.size,
        returningCustomers: returningCustomers.size,
        averageOrderValue: formatCur(orders > 0 ? (revenue / orders) : 0),
        conversionRate: formatPct(uniqueSessions.size > 0 ? (orders / uniqueSessions.size) * 100 : 0)
      },
      revenueInsights: {
        todayRevenue: formatCur(revenue),
        last7DaysRevenue: formatCur(last7DaysRev),
        monthToDateRevenue: formatCur(mtdRev),
        recoveredRevenue: formatCur(totalRecoveredRev),
        revenueOpportunity: formatCur(pm.totalRecoverableRev || 0)
      },
      campaignAttribution: {
        topCampaign: topCampaignRaw,
        topRevenueCampaign: topRevCampaign,
        topFirstTouchSource: topFTSrc,
        topLastTouchSource: topLTSrc,
        topRevenueJourney: topRevJourney
      },
      aiRecommendations: {
        topProductToPromote: pm.topProduct?.product || 'N/A',
        highestOpportunityProduct: pm.highestOpportunityProduct?.product || 'N/A',
        highestAbandonmentProduct: agg.productRows.sort((a,b)=>b.abandRate-a.abandRate)[0]?.product || 'N/A',
        bestGeography: topState,
        bestCampaign: topRevCampaign,
        topRecommendedAction: topRecAction
      }
    }
  };
};

module.exports = {
  generateDailyAnalyticsSummary
};
