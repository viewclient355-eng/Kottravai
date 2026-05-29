const { google } = require('googleapis');
const { validateAndRepairKey } = require('../utils/googleKeyValidator');

let SHEET_ID = process.env.GOOGLE_SHEET_ID;
let CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// Log credential status at startup with detailed validation
console.log('[GOOGLE_INIT] Checking credentials...');

// Clean CLIENT_EMAIL - remove leading/trailing spaces and quotes
if (CLIENT_EMAIL) {
  const originalEmail = CLIENT_EMAIL;
  CLIENT_EMAIL = CLIENT_EMAIL.trim();
  if (CLIENT_EMAIL.startsWith('"') && CLIENT_EMAIL.endsWith('"')) {
    CLIENT_EMAIL = CLIENT_EMAIL.slice(1, -1);
  }
  if (CLIENT_EMAIL.startsWith("'") && CLIENT_EMAIL.endsWith("'")) {
    CLIENT_EMAIL = CLIENT_EMAIL.slice(1, -1);
  }
  CLIENT_EMAIL = CLIENT_EMAIL.trim();
  if (originalEmail !== CLIENT_EMAIL) {
    console.log('[GOOGLE_INIT] Cleaned CLIENT_EMAIL:');
    console.log('  Original: ' + JSON.stringify(originalEmail));
    console.log('  Cleaned:  ' + JSON.stringify(CLIENT_EMAIL));
  }
}

// Clean SHEET_ID - remove spaces and quotes
if (SHEET_ID) {
  const originalSheetId = SHEET_ID;
  SHEET_ID = SHEET_ID.trim();
  if (SHEET_ID.startsWith('"') && SHEET_ID.endsWith('"')) {
    SHEET_ID = SHEET_ID.slice(1, -1);
  }
  if (SHEET_ID.startsWith("'") && SHEET_ID.endsWith("'")) {
    SHEET_ID = SHEET_ID.slice(1, -1);
  }
  SHEET_ID = SHEET_ID.trim();
  if (originalSheetId !== SHEET_ID) {
    console.log('[GOOGLE_INIT] Cleaned SHEET_ID:');
    console.log('  Original: ' + JSON.stringify(originalSheetId));
    console.log('  Cleaned:  ' + JSON.stringify(SHEET_ID));
  }
}

console.log('[GOOGLE_INIT] Credential status:');
console.log({
  hasSheetId: !!SHEET_ID,
  sheetId: SHEET_ID ? SHEET_ID.substring(0, 30) + '...' : 'MISSING',
  hasClientEmail: !!CLIENT_EMAIL,
  clientEmail: CLIENT_EMAIL || 'MISSING',
  hasPrivateKey: !!PRIVATE_KEY,
  privateKeyLength: PRIVATE_KEY ? PRIVATE_KEY.length : 0,
  projectId: extractProjectId(CLIENT_EMAIL) || 'UNKNOWN'
});

// Validate and repair private key
try {
  if (PRIVATE_KEY) {
    PRIVATE_KEY = validateAndRepairKey(PRIVATE_KEY);
    console.log('[GOOGLE_INIT] ✅ Private key validated and repaired');
  } else {
    console.warn('⚠️ [GOOGLE_INIT] Google Sheets private key is missing!');
  }
} catch (keyErr) {
  console.error('[GOOGLE_INIT] ❌ Private key validation failed:', keyErr.message);
  console.error('[GOOGLE_INIT] Cannot initialize Google Sheets service');
}

if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  console.warn('⚠️ [GOOGLE_INIT] Google Sheets credentials incomplete. Tracking will fail.');
}

function extractProjectId(email) {
  if (!email) return null;
  // Format: service-account@PROJECT_ID.iam.gserviceaccount.com
  const match = email.match(/@([^.]+)\.iam\.gserviceaccount\.com/);
  return match ? match[1] : null;
}

const sheets = async () => {
  try {
    console.log('[GOOGLE_AUTH] === AUTHENTICATION DEBUG ===');
    console.log('[GOOGLE_AUTH] Service Account Email:', CLIENT_EMAIL);
    console.log('[GOOGLE_AUTH] Email format valid?', /^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/.test(CLIENT_EMAIL) ? 'YES' : 'NO');
    console.log('[GOOGLE_AUTH] Creating JWT auth...');
    
    const auth = new google.auth.JWT(CLIENT_EMAIL, null, PRIVATE_KEY, [
      'https://www.googleapis.com/auth/spreadsheets'
    ]);
    
    console.log('[GOOGLE_AUTH] Authorizing with JWT...');
    const result = await auth.authorize();
    console.log('[GOOGLE_AUTH] ✅ Authorization successful');
    console.log('[GOOGLE_AUTH] Token type:', result.token_type);
    console.log('[GOOGLE_AUTH] Token expires in:', result.expires_in, 'seconds');
    
    console.log('[GOOGLE_SHEETS] Creating sheets API instance...');
    const sheetsApi = google.sheets({ version: 'v4', auth });
    console.log('[GOOGLE_SHEETS] ✅ API instance created');
    
    return sheetsApi;
  } catch (err) {
    console.error('[GOOGLE_AUTH_ERROR] === AUTHENTICATION FAILED ===');
    console.error('[GOOGLE_AUTH_ERROR] Message:', err.message);
    console.error('[GOOGLE_AUTH_ERROR] Code:', err.code);
    console.error('[GOOGLE_AUTH_ERROR] Status:', err.status);
    if (err.response && err.response.data) {
      console.error('[GOOGLE_AUTH_ERROR] Response Data:', JSON.stringify(err.response.data, null, 2));
    }
    if (err.stack) {
      console.error('[GOOGLE_AUTH_ERROR] Stack:', err.stack);
    }
    throw err;
  }
};

const DASHBOARD_SHEET_TITLE = 'Dashboard';
const EXECUTIVE_SUMMARY_SHEET_TITLE = 'Executive Summary';
const DAILY_REPORT_SHEET_TITLE = 'Daily Report';
const WEEKLY_REPORT_SHEET_TITLE = 'Weekly Report';
const MONTHLY_REPORT_SHEET_TITLE = 'Monthly Report';
const TRAFFIC_ANALYTICS_SHEET_TITLE = 'Traffic Analytics';
const PRODUCT_ANALYTICS_SHEET_TITLE = 'Product Analytics';
const REVENUE_ANALYTICS_SHEET_TITLE = 'Revenue Analytics';
const CUSTOMER_ANALYTICS_SHEET_TITLE = 'Customer Analytics';
const MARKETING_ANALYTICS_SHEET_TITLE = 'Marketing Analytics';
const LEAD_ANALYTICS_SHEET_TITLE = 'Lead Analytics';
const CONVERSION_FUNNEL_SHEET_TITLE = 'Conversion Funnel';
const RAW_EVENTS_SHEET_TITLE = 'Raw Events';

const DATA_SHEET_ORDER = [
  DASHBOARD_SHEET_TITLE,
  EXECUTIVE_SUMMARY_SHEET_TITLE,
  DAILY_REPORT_SHEET_TITLE,
  WEEKLY_REPORT_SHEET_TITLE,
  MONTHLY_REPORT_SHEET_TITLE,
  TRAFFIC_ANALYTICS_SHEET_TITLE,
  PRODUCT_ANALYTICS_SHEET_TITLE,
  REVENUE_ANALYTICS_SHEET_TITLE,
  CUSTOMER_ANALYTICS_SHEET_TITLE,
  MARKETING_ANALYTICS_SHEET_TITLE,
  LEAD_ANALYTICS_SHEET_TITLE,
  CONVERSION_FUNNEL_SHEET_TITLE,
  RAW_EVENTS_SHEET_TITLE
];

const RAW_EVENTS_HEADER_ROW = [
  'Timestamp',
  'Event Type',
  'Page',
  'Referrer',
  'Browser',
  'Device',
  'Screen Size',
  'User Agent',
  'Session ID',
  'Visitor ID',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'Product ID',
  'Product Name',
  'Category',
  'Price',
  'Quantity',
  'Order ID',
  'Order Total',
  'Payment Method',
  'Duration Seconds',
  'Metadata'
];

const DEFAULT_RANGE = `${RAW_EVENTS_SHEET_TITLE}!A1:W`;

async function ensureAnalyticsSheetExists(s, spreadsheetData) {
  const spreadsheet = spreadsheetData || await getSpreadsheetMetadata(s);
  const rawEventsSheet = findSheetByTitle(spreadsheet, RAW_EVENTS_SHEET_TITLE);
  const legacyAnalyticsSheet = findSheetByTitle(spreadsheet, 'Analytics');

  if (rawEventsSheet) {
    return rawEventsSheet;
  }

  if (legacyAnalyticsSheet) {
    console.log('[GOOGLE_SHEET] Renaming legacy Analytics sheet to Raw Events');
    await s.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: legacyAnalyticsSheet.properties.sheetId,
                title: RAW_EVENTS_SHEET_TITLE
              },
              fields: 'title'
            }
          }
        ]
      }
    });
    return legacyAnalyticsSheet;
  }

  console.log('[GOOGLE_SHEET] Raw Events sheet not found. Creating a new Raw Events sheet with headers.');
  const createResponse = await s.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: RAW_EVENTS_SHEET_TITLE,
              gridProperties: { frozenRowCount: 1 }
            }
          }
        }
      ]
    }
  });

  const createdSheet = createResponse.data.replies[0].addSheet.properties;
  await s.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${RAW_EVENTS_SHEET_TITLE}!A1:W1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [RAW_EVENTS_HEADER_ROW] }
  });

  return createdSheet;
}

function mapPayloadToRow(payload) {
  return [
    payload.timestamp || new Date().toISOString(),
    payload.event_type || payload.event_name || 'unknown',
    payload.page || payload.page_url || '',
    payload.referrer || '',
    payload.browser || payload.browser_name || '',
    payload.device || payload.device_type || '',
    payload.screen_size || `${payload.screen_width || ''}x${payload.screen_height || ''}`,
    payload.user_agent || payload.ua || '',
    payload.session_id || '',
    payload.visitor_id || '',
    payload.utm_source || '',
    payload.utm_medium || '',
    payload.utm_campaign || '',
    payload.product_id || '',
    payload.product_name || '',
    payload.category || '',
    payload.price || '',
    payload.quantity || '',
    payload.order_id || '',
    payload.order_total || payload.total_amount || '',
    payload.payment_method || '',
    payload.duration_seconds || '',
    payload.metadata ? JSON.stringify(payload.metadata) : ''
  ];
}

function normalizeValue(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function getWeekKey(date) {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  const weekNo = Math.round(((tempDate - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7) + 1;
  return `${tempDate.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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
      requests.push({
        addSheet: {
          properties: { title }
        }
      });
    }
  }

  if (requests.length) {
    await s.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests }
    });
  }

  const updatedSpreadsheet = await getSpreadsheetMetadata(s);
  const reorderRequests = [];

  for (let index = 0; index < DATA_SHEET_ORDER.length; index++) {
    const title = DATA_SHEET_ORDER[index];
    const sheet = findSheetByTitle(updatedSpreadsheet, title);
    if (sheet && sheet.properties.index !== index) {
      reorderRequests.push({
        updateSheetProperties: {
          properties: {
            sheetId: sheet.properties.sheetId,
            index
          },
          fields: 'index'
        }
      });
    }
  }

  if (reorderRequests.length) {
    await s.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: reorderRequests }
    });
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
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: analyticsSheet.properties.sheetId,
                title: RAW_EVENTS_SHEET_TITLE
              },
              fields: 'title'
            }
          }
        ]
      }
    });
    const refreshed = await getSpreadsheetMetadata(s);
    rawSheet = findSheetByTitle(refreshed, RAW_EVENTS_SHEET_TITLE);
  }

  if (!rawSheet) {
    const response = await s.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: RAW_EVENTS_SHEET_TITLE,
                gridProperties: { frozenRowCount: 1 }
              }
            }
          }
        ]
      }
    });
    rawSheet = response.data.replies[0].addSheet.properties;
  }

  await s.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${RAW_EVENTS_SHEET_TITLE}!A1:W1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [RAW_EVENTS_HEADER_ROW] }
  });

  await s.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: rawSheet.properties.sheetId,
              gridProperties: { frozenRowCount: 1 }
            },
            fields: 'gridProperties.frozenRowCount'
          }
        }
      ]
    }
  });

  return rawSheet;
}

async function clearSheet(s, sheetName) {
  await s.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A1:Z1000`
  });
}

async function writeSheetValues(s, sheetName, startCell, values) {
  if (!values || values.length === 0) return;
  await s.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!${startCell}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });
}

function buildAggregations(rows) {
  const daily = new Map();
  const weekly = new Map();
  const monthly = new Map();
  const products = new Map();
  const utmSources = new Map();
  const utmSourceOrders = new Map();
  const utmSourceRevenue = new Map();
  const customers = new Map();
  const funnel = {
    visitors: new Set(),
    product_views: 0,
    add_to_cart: 0,
    checkout_started: 0,
    purchases: 0
  };

  let totalRevenue = 0;
  let totalOrders = 0;
  const visitorFirstSeen = new Map();
  const buyerVisitors = new Set();

  rows.forEach(row => {
    const timestamp = parseDate(row.Timestamp);
    if (!timestamp) return;

    const eventType = normalizeValue(row['Event Type']).toLowerCase();
    const visitorId = normalizeValue(row['Visitor ID']) || normalizeValue(row['Session ID']) || 'anonymous';
    const productName = normalizeValue(row['Product Name']);
    const category = normalizeValue(row['Category']);
    const utmSource = normalizeValue(row['UTM Source']) || 'Direct';
    const utmMedium = normalizeValue(row['UTM Medium']) || 'Unknown';
    const utmCampaign = normalizeValue(row['UTM Campaign']) || 'Unknown';
    const orderTotal = getSafeNumber(row['Order Total'] || row['total_amount'] || row['price'] * row['quantity']);
    const dateKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}`;
    const weekKey = getWeekKey(timestamp);
    const monthKey = getMonthKey(timestamp);
    const visitorKey = visitorId;

    const previousFirstSeen = visitorFirstSeen.get(visitorKey);
    if (!previousFirstSeen || timestamp < previousFirstSeen) {
      visitorFirstSeen.set(visitorKey, timestamp);
    }

    const ensureMapEntry = (map, key) => {
      if (!map.has(key)) {
        map.set(key, {
          date: key,
          visitors: new Set(),
          pageViews: 0,
          productViews: 0,
          addToCart: 0,
          checkouts: 0,
          purchases: 0,
          whatsappClicks: 0,
          contactLeads: 0,
          revenue: 0,
          trafficSources: new Map(),
          productCounts: new Map(),
          categoryCounts: new Map()
        });
      }
      return map.get(key);
    };

    const dailyBucket = ensureMapEntry(daily, dateKey);
    const weeklyBucket = ensureMapEntry(weekly, weekKey);
    const monthlyBucket = ensureMapEntry(monthly, monthKey);

    dailyBucket.visitors.add(visitorKey);
    weeklyBucket.visitors.add(visitorKey);
    monthlyBucket.visitors.add(visitorKey);
    funnel.visitors.add(visitorKey);

    const recordSource = (map, key, amount = 1) => {
      map.set(key, (map.get(key) || 0) + amount);
    };

    recordSource(utmSources, utmSource, 1);

    const updateProductMetrics = (map) => {
      if (!productName) return;
      const current = map.get(productName) || { productName, pageViews: 0, addToCart: 0, purchases: 0, revenue: 0 };
      if (eventType === 'product_view') current.pageViews += 1;
      if (eventType === 'add_to_cart') current.addToCart += 1;
      if (eventType === 'purchase_completed') current.purchases += 1;
      if (orderTotal > 0) current.revenue += orderTotal;
      map.set(productName, current);
    };

    if (eventType === 'page_view') {
      dailyBucket.pageViews += 1;
      weeklyBucket.pageViews += 1;
      monthlyBucket.pageViews += 1;
    }
    if (eventType === 'product_view') {
      dailyBucket.productViews += 1;
      weeklyBucket.productViews += 1;
      monthlyBucket.productViews += 1;
      funnel.product_views += 1;
      updateProductMetrics(products);
      dailyBucket.productCounts.set(productName, (dailyBucket.productCounts.get(productName) || 0) + 1);
      weeklyBucket.productCounts.set(productName, (weeklyBucket.productCounts.get(productName) || 0) + 1);
      monthlyBucket.productCounts.set(productName, (monthlyBucket.productCounts.get(productName) || 0) + 1);
    }
    if (eventType === 'add_to_cart') {
      dailyBucket.addToCart += 1;
      weeklyBucket.addToCart += 1;
      monthlyBucket.addToCart += 1;
      funnel.add_to_cart += 1;
      updateProductMetrics(products);
    }
    if (eventType === 'checkout_started') {
      dailyBucket.checkouts += 1;
      weeklyBucket.checkouts += 1;
      monthlyBucket.checkouts += 1;
      funnel.checkout_started += 1;
    }
    if (eventType === 'purchase_completed') {
      dailyBucket.purchases += 1;
      weeklyBucket.purchases += 1;
      monthlyBucket.purchases += 1;
      funnel.purchases += 1;
      totalOrders += 1;
      if (orderTotal > 0) {
        totalRevenue += orderTotal;
        dailyBucket.revenue += orderTotal;
        weeklyBucket.revenue += orderTotal;
        monthlyBucket.revenue += orderTotal;
        recordSource(utmSourceOrders, utmSource, 1);
        recordSource(utmSourceRevenue, utmSource, orderTotal);
      }
      buyerVisitors.add(visitorKey);
      updateProductMetrics(products);
    }
    if (eventType === 'whatsapp_click') {
      dailyBucket.whatsappClicks += 1;
      weeklyBucket.whatsappClicks += 1;
      monthlyBucket.whatsappClicks += 1;
    }
    if (eventType.includes('contact')) {
      dailyBucket.contactLeads += 1;
      weeklyBucket.contactLeads += 1;
      monthlyBucket.contactLeads += 1;
    }

    const sourceKey = normalizeValue(utmSource || 'Direct');
    dailyBucket.trafficSources.set(sourceKey, (dailyBucket.trafficSources.get(sourceKey) || 0) + 1);
    weeklyBucket.trafficSources.set(sourceKey, (weeklyBucket.trafficSources.get(sourceKey) || 0) + 1);
    monthlyBucket.trafficSources.set(sourceKey, (monthlyBucket.trafficSources.get(sourceKey) || 0) + 1);
  });

  const sortedMap = (map, comparator) => Array.from(map.values()).sort(comparator);
  const getTopItem = (countMap) => {
    if (!countMap || countMap.size === 0) return '';
    return Array.from(countMap.entries()).sort((a, b) => b[1] - a[1])[0][0] || '';
  };

  const dailyRows = sortedMap(daily, (a, b) => a.date.localeCompare(b.date)).map(day => ({
    date: day.date,
    visitors: day.visitors.size,
    pageViews: day.pageViews,
    productViews: day.productViews,
    addToCart: day.addToCart,
    checkouts: day.checkouts,
    purchases: day.purchases,
    whatsappClicks: day.whatsappClicks,
    contactLeads: day.contactLeads,
    revenue: day.revenue,
    conversionRate: day.checkouts === 0 ? 0 : day.purchases / day.checkouts,
    topProduct: getTopItem(day.productCounts),
    topCategory: getTopItem(day.categoryCounts),
    topTrafficSource: getTopItem(day.trafficSources)
  }));

  const weeklyRows = sortedMap(weekly, (a, b) => a.date.localeCompare(b.date)).map(week => ({
    week: week.date,
    visitors: week.visitors.size,
    orders: week.purchases,
    revenue: week.revenue,
    conversionRate: week.checkouts === 0 ? 0 : week.purchases / week.checkouts,
    topProduct: getTopItem(week.productCounts),
    topCategory: getTopItem(week.categoryCounts),
    topTrafficSource: getTopItem(week.trafficSources)
  }));

  const monthlyRows = sortedMap(monthly, (a, b) => a.date.localeCompare(b.date)).map(month => ({
    month: month.date,
    visitors: month.visitors.size,
    orders: month.purchases,
    revenue: month.revenue,
    conversionRate: month.checkouts === 0 ? 0 : month.purchases / month.checkouts
  }));

  const productRows = Array.from(products.values())
    .map(product => ({
      productName: product.productName,
      productViews: product.pageViews,
      cartAdds: product.addToCart,
      purchases: product.purchases,
      revenue: product.revenue,
      conversionRate: product.pageViews === 0 ? 0 : product.purchases / product.pageViews
    }))
    .sort((a, b) => b.revenue - a.revenue || b.productViews - a.productViews)
    .slice(0, 50);

  const utmRows = Array.from(utmSources.entries())
    .map(([source, count]) => ({ source, visitors: count, orders: utmSourceOrders.get(source) || 0, revenue: utmSourceRevenue.get(source) || 0 }))
    .sort((a, b) => b.visitors - a.visitors);

  const marketingRows = utmRows.map(row => ({
    source: row.source,
    visitors: row.visitors,
    orders: row.orders,
    revenue: row.revenue,
    conversionRate: row.visitors === 0 ? 0 : row.orders / row.visitors
  }));

  const newCustomers = Array.from(visitorFirstSeen.values()).filter(firstSeen => {
    const now = new Date();
    return firstSeen >= new Date(now.getFullYear(), now.getMonth(), 1);
  }).length;

  const leadRows = sortedMap(daily, (a, b) => a.date.localeCompare(b.date)).map(day => ({
    date: day.date,
    whatsappLeads: day.whatsappClicks,
    contactLeads: day.contactLeads,
    totalLeads: day.whatsappClicks + day.contactLeads
  }));

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const currentWeekKey = getWeekKey(today);
  const currentMonthKey = getMonthKey(today);

  const todayMetrics = daily.get(todayKey) || {};
  const weekMetrics = weekly.get(currentWeekKey) || {};
  const monthMetrics = monthly.get(currentMonthKey) || {};

  const funnelMetrics = {
    visitors: funnel.visitors.size,
    productViews: funnel.product_views,
    addToCart: funnel.add_to_cart,
    checkoutStarted: funnel.checkout_started,
    purchases: funnel.purchases
  };

  return {
    dailyRows,
    weeklyRows,
    monthlyRows,
    productRows,
    utmRows,
    marketingRows,
    leadRows,
    funnelMetrics,
    customerMetrics: {
      newCustomers,
      returningCustomers: visitorFirstSeen.size - newCustomers,
      repeatBuyers: buyerVisitors.size,
      totalCustomers: visitorFirstSeen.size
    },
    executiveSummary: {
      today: {
        visitors: todayMetrics.visitors || 0,
        orders: todayMetrics.purchases || 0,
        revenue: todayMetrics.revenue || 0,
        conversionRate: todayMetrics.checkouts ? (todayMetrics.purchases || 0) / todayMetrics.checkouts : 0
      },
      week: {
        visitors: weekMetrics.visitors || 0,
        orders: weekMetrics.purchases || 0,
        revenue: weekMetrics.revenue || 0,
        conversionRate: weekMetrics.checkouts ? (weekMetrics.purchases || 0) / weekMetrics.checkouts : 0
      },
      month: {
        visitors: monthMetrics.visitors || 0,
        orders: monthMetrics.purchases || 0,
        revenue: monthMetrics.revenue || 0,
        conversionRate: monthMetrics.checkouts ? (monthMetrics.purchases || 0) / monthMetrics.checkouts : 0
      }
    },
    summary: {
      totalVisitors: visitorFirstSeen.size,
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders === 0 ? 0 : totalRevenue / totalOrders,
      conversionRate: funnel.checkout_started === 0 ? 0 : funnel.purchases / funnel.checkout_started,
      productViews: rows.filter(r => normalizeValue(r['Event Type']).toLowerCase() === 'product_view').length,
      addToCart: rows.filter(r => normalizeValue(r['Event Type']).toLowerCase() === 'add_to_cart').length,
      checkoutStarted: rows.filter(r => normalizeValue(r['Event Type']).toLowerCase() === 'checkout_started').length,
      purchases: funnel.purchases,
      whatsappLeads: rows.filter(r => normalizeValue(r['Event Type']).toLowerCase() === 'whatsapp_click').length,
      contactLeads: rows.filter(r => normalizeValue(r['Event Type']).toLowerCase().includes('contact')).length
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

async function buildDashboardSheets(s) {
  const spreadsheet = await getSpreadsheetMetadata(s);
  await createMissingSheets(s, spreadsheet);
  await ensureRawEventsSheetExists(s, spreadsheet);
  const refreshed = await getSpreadsheetMetadata(s);
  await createMissingSheets(s, refreshed);

  const rows = await fetchRawEventRows(s);
  const aggregation = buildAggregations(rows);

  const dashboardValues = [
    ['Dashboard'],
    [],
    ['Total Visitors', aggregation.summary.totalVisitors, 'New Visitors', aggregation.executiveSummary.today.visitors, 'Repeat Visitors', aggregation.summary.totalVisitors - aggregation.executiveSummary.today.visitors],
    ['Product Views', aggregation.summary.productViews, 'Add To Cart', aggregation.summary.addToCart, 'Checkout Started', aggregation.summary.checkoutStarted],
    ['Purchases', aggregation.summary.purchases, 'WhatsApp Leads', aggregation.summary.whatsappLeads, 'Contact Leads', aggregation.summary.contactLeads],
    ['Revenue', formatCurrency(aggregation.summary.totalRevenue), 'Average Order Value', formatCurrency(aggregation.summary.averageOrderValue), 'Conversion Rate', `${(aggregation.summary.conversionRate * 100).toFixed(2)}%`],
    []
  ];

  const executiveValues = [
    ['Executive Summary'],
    [],
    ['Period', 'Visitors', 'Orders', 'Revenue', 'Conversion Rate'],
    ['Today', aggregation.executiveSummary.today.visitors, aggregation.executiveSummary.today.orders, formatCurrency(aggregation.executiveSummary.today.revenue), `${(aggregation.executiveSummary.today.conversionRate * 100).toFixed(2)}%`],
    ['This Week', aggregation.executiveSummary.week.visitors, aggregation.executiveSummary.week.orders, formatCurrency(aggregation.executiveSummary.week.revenue), `${(aggregation.executiveSummary.week.conversionRate * 100).toFixed(2)}%`],
    ['This Month', aggregation.executiveSummary.month.visitors, aggregation.executiveSummary.month.orders, formatCurrency(aggregation.executiveSummary.month.revenue), `${(aggregation.executiveSummary.month.conversionRate * 100).toFixed(2)}%`],
    [],
    ['Top Insights'],
    [`Top product this week: ${aggregation.weeklyRows.length ? aggregation.weeklyRows[aggregation.weeklyRows.length - 1].topProduct || 'N/A' : 'N/A'}`],
    [`WhatsApp generated ${aggregation.summary.whatsappLeads} leads`],
    [`Repeat visitors this month: ${aggregation.customerMetrics.returningCustomers}`]
  ];

  const dailyHeader = ['Date', 'Visitors', 'Page Views', 'Product Views', 'Add To Cart', 'Checkouts', 'Purchases', 'WhatsApp Clicks', 'Contact Leads', 'Revenue', 'Conversion Rate', 'Top Product', 'Top Traffic Source'];
  const dailyValues = [dailyHeader].concat(aggregation.dailyRows.map(row => [
    row.date,
    row.visitors,
    row.pageViews,
    row.productViews,
    row.addToCart,
    row.checkouts,
    row.purchases,
    row.whatsappClicks,
    row.contactLeads,
    formatCurrency(row.revenue),
    `${(row.conversionRate * 100).toFixed(2)}%`,
    row.topProduct,
    row.topTrafficSource
  ]));

  const weeklyHeader = ['Week', 'Visitors', 'Orders', 'Revenue', 'Conversion Rate', 'Top Product', 'Top Traffic Source'];
  const weeklyValues = [weeklyHeader].concat(aggregation.weeklyRows.map(row => [
    row.week,
    row.visitors,
    row.orders,
    formatCurrency(row.revenue),
    `${(row.conversionRate * 100).toFixed(2)}%`,
    row.topProduct,
    row.topTrafficSource
  ]));

  const monthlyHeader = ['Month', 'Visitors', 'Orders', 'Revenue', 'Conversion Rate'];
  const monthlyValues = [monthlyHeader].concat(aggregation.monthlyRows.map(row => [
    row.month,
    row.visitors,
    row.orders,
    formatCurrency(row.revenue),
    `${(row.conversionRate * 100).toFixed(2)}%`
  ]));

  const trafficValues = [
    ['Traffic Analytics'],
    [],
    ['Metric', 'Value'],
    ['Daily Visitors', aggregation.dailyRows.length ? aggregation.dailyRows[aggregation.dailyRows.length - 1].visitors : 0],
    ['Weekly Visitors', aggregation.executiveSummary.week.visitors],
    ['Monthly Visitors', aggregation.executiveSummary.month.visitors],
    ['New Visitors', aggregation.executiveSummary.today.visitors],
    ['Repeat Visitors', aggregation.customerMetrics.returningCustomers],
    ['Average Session Duration', 'N/A'],
    [],
    ['Traffic Source', 'Events'],
    ...aggregation.utmRows.slice(0, 20).map(row => [row.source, row.visitors])
  ];

  const productHeaderRow = ['Product Name', 'Product Views', 'Cart Adds', 'Purchases', 'Revenue', 'Conversion Rate'];
  const productValues = [productHeaderRow].concat(aggregation.productRows.map(row => [
    row.productName,
    row.productViews,
    row.cartAdds,
    row.purchases,
    formatCurrency(row.revenue),
    `${(row.conversionRate * 100).toFixed(2)}%`
  ]));

  const revenueValues = [
    ['Revenue Analytics'],
    [],
    ['Metric', 'Value'],
    ['GMV', formatCurrency(aggregation.summary.totalRevenue)],
    ['Total Orders', aggregation.summary.purchases],
    ['Average Order Value', formatCurrency(aggregation.summary.averageOrderValue)],
    ['Conversion Rate', `${(aggregation.summary.conversionRate * 100).toFixed(2)}%`]
  ];

  const customerValues = [
    ['Customer Analytics'],
    [],
    ['Metric', 'Value'],
    ['New Customers', aggregation.customerMetrics.newCustomers],
    ['Returning Customers', aggregation.customerMetrics.returningCustomers],
    ['Repeat Buyers', aggregation.customerMetrics.repeatBuyers],
    ['Total Customers', aggregation.customerMetrics.totalCustomers]
  ];

  const marketingHeaderRow = ['Source', 'Visitors', 'Orders', 'Revenue', 'Conversion Rate'];
  const marketingValues = [marketingHeaderRow].concat(aggregation.marketingRows.map(row => [
    row.source,
    row.visitors,
    row.orders,
    formatCurrency(row.revenue),
    `${(row.conversionRate * 100).toFixed(2)}%`
  ]));

  const leadHeaderRow = ['Date', 'WhatsApp Leads', 'Contact Leads', 'Total Leads'];
  const leadValues = [leadHeaderRow].concat(aggregation.leadRows.map(row => [
    row.date,
    row.whatsappLeads,
    row.contactLeads,
    row.totalLeads
  ]));

  const funnelValues = [
    ['Stage', 'Count'],
    ['Visitors', aggregation.funnelMetrics.visitors],
    ['Product Views', aggregation.funnelMetrics.productViews],
    ['Add To Cart', aggregation.funnelMetrics.addToCart],
    ['Checkout Started', aggregation.funnelMetrics.checkoutStarted],
    ['Purchase Completed', aggregation.funnelMetrics.purchases],
    ['View → Cart %', aggregation.funnelMetrics.productViews === 0 ? '0%' : `${((aggregation.funnelMetrics.addToCart / aggregation.funnelMetrics.productViews) * 100).toFixed(2)}%`],
    ['Cart → Checkout %', aggregation.funnelMetrics.addToCart === 0 ? '0%' : `${((aggregation.funnelMetrics.checkoutStarted / aggregation.funnelMetrics.addToCart) * 100).toFixed(2)}%`],
    ['Checkout → Purchase %', aggregation.funnelMetrics.checkoutStarted === 0 ? '0%' : `${((aggregation.funnelMetrics.purchases / aggregation.funnelMetrics.checkoutStarted) * 100).toFixed(2)}%`],
    ['Overall Conversion %', aggregation.funnelMetrics.visitors === 0 ? '0%' : `${((aggregation.funnelMetrics.purchases / aggregation.funnelMetrics.visitors) * 100).toFixed(2)}%`]
  ];

  const sheetWrites = [
    { sheet: DASHBOARD_SHEET_TITLE, values: dashboardValues },
    { sheet: EXECUTIVE_SUMMARY_SHEET_TITLE, values: executiveValues },
    { sheet: DAILY_REPORT_SHEET_TITLE, values: dailyValues },
    { sheet: WEEKLY_REPORT_SHEET_TITLE, values: weeklyValues },
    { sheet: MONTHLY_REPORT_SHEET_TITLE, values: monthlyValues },
    { sheet: TRAFFIC_ANALYTICS_SHEET_TITLE, values: trafficValues },
    { sheet: PRODUCT_ANALYTICS_SHEET_TITLE, values: productValues },
    { sheet: REVENUE_ANALYTICS_SHEET_TITLE, values: revenueValues },
    { sheet: CUSTOMER_ANALYTICS_SHEET_TITLE, values: customerValues },
    { sheet: MARKETING_ANALYTICS_SHEET_TITLE, values: marketingValues },
    { sheet: LEAD_ANALYTICS_SHEET_TITLE, values: leadValues },
    { sheet: CONVERSION_FUNNEL_SHEET_TITLE, values: funnelValues }
  ];

  for (const sheetWrite of sheetWrites) {
    await clearSheet(s, sheetWrite.sheet);
    await writeSheetValues(s, sheetWrite.sheet, 'A1', sheetWrite.values);
  }

  const latestSpreadsheet = await getSpreadsheetMetadata(s);
  const dashboardSheet = findSheetByTitle(latestSpreadsheet, DASHBOARD_SHEET_TITLE);
  const dailySheet = findSheetByTitle(latestSpreadsheet, DAILY_REPORT_SHEET_TITLE);
  const productSheet = findSheetByTitle(latestSpreadsheet, PRODUCT_ANALYTICS_SHEET_TITLE);
  const leadSheet = findSheetByTitle(latestSpreadsheet, LEAD_ANALYTICS_SHEET_TITLE);

  const chartRequests = [];
  if (dashboardSheet && dailySheet) {
    chartRequests.push({
      addChart: {
        chart: {
          spec: {
            title: 'Daily Traffic Trend',
            basicChart: {
              chartType: 'LINE',
              legendPosition: 'BOTTOM_LEGEND',
              axis: [
                { position: 'BOTTOM_AXIS', title: 'Date' },
                { position: 'LEFT_AXIS', title: 'Visitors' }
              ],
              domains: [
                {
                  sourceRange: {
                    sources: [
                      {
                        sheetId: dailySheet.properties.sheetId,
                        startRowIndex: 1,
                        endRowIndex: Math.min(aggregation.dailyRows.length + 1, 100),
                        startColumnIndex: 0,
                        endColumnIndex: 1
                      }
                    ]
                  }
                }
              ],
              series: [
                {
                  series: {
                    sourceRange: {
                      sources: [
                        {
                          sheetId: dailySheet.properties.sheetId,
                          startRowIndex: 1,
                          endRowIndex: Math.min(aggregation.dailyRows.length + 1, 100),
                          startColumnIndex: 1,
                          endColumnIndex: 2
                        }
                      ]
                    }
                  },
                  targetAxis: 'LEFT_AXIS'
                }
              ]
            }
          },
          position: {
            overlayPosition: {
              anchorCell: {
                sheetId: dashboardSheet.properties.sheetId,
                rowIndex: 10,
                columnIndex: 0
              },
              widthPixels: 700,
              heightPixels: 320
            }
          }
        }
      }
    });
  }

  if (productSheet) {
    chartRequests.push({
      addChart: {
        chart: {
          spec: {
            title: 'Revenue by Product',
            basicChart: {
              chartType: 'BAR',
              legendPosition: 'BOTTOM_LEGEND',
              axis: [
                { position: 'BOTTOM_AXIS', title: 'Revenue' },
                { position: 'LEFT_AXIS', title: 'Product' }
              ],
              domains: [
                {
                  sourceRange: {
                    sources: [
                      {
                        sheetId: productSheet.properties.sheetId,
                        startRowIndex: 1,
                        endRowIndex: Math.min(aggregation.productRows.length + 1, 20),
                        startColumnIndex: 0,
                        endColumnIndex: 1
                      }
                    ]
                  }
                }
              ],
              series: [
                {
                  series: {
                    sourceRange: {
                      sources: [
                        {
                          sheetId: productSheet.properties.sheetId,
                          startRowIndex: 1,
                          endRowIndex: Math.min(aggregation.productRows.length + 1, 20),
                          startColumnIndex: 4,
                          endColumnIndex: 5
                        }
                      ]
                    }
                  },
                  targetAxis: 'BOTTOM_AXIS'
                }
              ]
            }
          },
          position: {
            overlayPosition: {
              anchorCell: {
                sheetId: productSheet.properties.sheetId,
                rowIndex: 1,
                columnIndex: 7
              },
              widthPixels: 700,
              heightPixels: 320
            }
          }
        }
      }
    });
  }

  if (leadSheet) {
    chartRequests.push({
      addChart: {
        chart: {
          spec: {
            title: 'Lead Trend',
            basicChart: {
              chartType: 'COLUMN',
              legendPosition: 'BOTTOM_LEGEND',
              axis: [
                { position: 'BOTTOM_AXIS', title: 'Date' },
                { position: 'LEFT_AXIS', title: 'Leads' }
              ],
              domains: [
                {
                  sourceRange: {
                    sources: [
                      {
                        sheetId: leadSheet.properties.sheetId,
                        startRowIndex: 1,
                        endRowIndex: Math.min(aggregation.leadRows.length + 1, 50),
                        startColumnIndex: 0,
                        endColumnIndex: 1
                      }
                    ]
                  }
                }
              ],
              series: [
                {
                  series: {
                    sourceRange: {
                      sources: [
                        {
                          sheetId: leadSheet.properties.sheetId,
                          startRowIndex: 1,
                          endRowIndex: Math.min(aggregation.leadRows.length + 1, 50),
                          startColumnIndex: 1,
                          endColumnIndex: 2
                        }
                      ]
                    }
                  },
                  targetAxis: 'LEFT_AXIS'
                },
                {
                  series: {
                    sourceRange: {
                      sources: [
                        {
                          sheetId: leadSheet.properties.sheetId,
                          startRowIndex: 1,
                          endRowIndex: Math.min(aggregation.leadRows.length + 1, 50),
                          startColumnIndex: 3,
                          endColumnIndex: 4
                        }
                      ]
                    }
                  },
                  targetAxis: 'LEFT_AXIS'
                }
              ]
            }
          },
          position: {
            overlayPosition: {
              anchorCell: {
                sheetId: leadSheet.properties.sheetId,
                rowIndex: 1,
                columnIndex: 6
              },
              widthPixels: 700,
              heightPixels: 320
            }
          }
        }
      }
    });
  }

  if (chartRequests.length) {
    await s.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: chartRequests }
    });
  }
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

async function buildDashboardSheets(s) {
  const spreadsheet = await getSpreadsheetMetadata(s);
  await createMissingSheets(s, spreadsheet);
  await ensureRawEventsSheetExists(s, spreadsheet);
  const refreshed = await getSpreadsheetMetadata(s);
  await createMissingSheets(s, refreshed);

  const rows = await fetchRawEventRows(s);
  const aggregation = buildAggregations(rows);

  const dashboardValues = [
    ['Dashboard'],
    [],
    ['Total Visitors', aggregation.summary.totalVisitors, 'New Visitors', aggregation.executiveSummary.today.visitors, 'Repeat Visitors', Math.max(0, aggregation.summary.totalVisitors - aggregation.executiveSummary.today.visitors)],
    ['Product Views', aggregation.summary.productViews, 'Add To Cart', aggregation.summary.addToCart, 'Checkout Started', aggregation.summary.checkoutStarted],
    ['Purchases', aggregation.summary.purchases, 'WhatsApp Leads', aggregation.summary.whatsappLeads, 'Contact Leads', aggregation.summary.contactLeads],
    ['Revenue', formatCurrency(aggregation.summary.totalRevenue), 'Average Order Value', formatCurrency(aggregation.summary.averageOrderValue), 'Conversion Rate', `${(aggregation.summary.conversionRate * 100).toFixed(2)}%`],
    []
  ];

  const executiveValues = [
    ['Executive Summary'],
    [],
    ['Period', 'Visitors', 'Orders', 'Revenue', 'Conversion Rate'],
    ['Today', aggregation.executiveSummary.today.visitors, aggregation.executiveSummary.today.orders, formatCurrency(aggregation.executiveSummary.today.revenue), `${(aggregation.executiveSummary.today.conversionRate * 100).toFixed(2)}%`],
    ['This Week', aggregation.executiveSummary.week.visitors, aggregation.executiveSummary.week.orders, formatCurrency(aggregation.executiveSummary.week.revenue), `${(aggregation.executiveSummary.week.conversionRate * 100).toFixed(2)}%`],
    ['This Month', aggregation.executiveSummary.month.visitors, aggregation.executiveSummary.month.orders, formatCurrency(aggregation.executiveSummary.month.revenue), `${(aggregation.executiveSummary.month.conversionRate * 100).toFixed(2)}%`],
    [],
    ['Top Insights'],
    [`Top product this week: ${aggregation.weeklyRows.length ? aggregation.weeklyRows[aggregation.weeklyRows.length - 1].topProduct || 'N/A' : 'N/A'}`],
    [`WhatsApp generated ${aggregation.summary.whatsappLeads} leads`],
    [`Repeat visitors this month: ${aggregation.customerMetrics.returningCustomers}`]
  ];

  const dailyHeader = ['Date', 'Visitors', 'Page Views', 'Product Views', 'Add To Cart', 'Checkouts', 'Purchases', 'WhatsApp Clicks', 'Contact Leads', 'Revenue', 'Conversion Rate', 'Top Product', 'Top Traffic Source'];
  const dailyValues = [dailyHeader].concat(aggregation.dailyRows.map(row => [
    row.date,
    row.visitors,
    row.pageViews,
    row.productViews,
    row.addToCart,
    row.checkouts,
    row.purchases,
    row.whatsappClicks,
    row.contactLeads,
    formatCurrency(row.revenue),
    `${(row.conversionRate * 100).toFixed(2)}%`,
    row.topProduct,
    row.topTrafficSource
  ]));

  const weeklyHeader = ['Week', 'Visitors', 'Orders', 'Revenue', 'Conversion Rate', 'Top Product', 'Top Traffic Source'];
  const weeklyValues = [weeklyHeader].concat(aggregation.weeklyRows.map(row => [
    row.week,
    row.visitors,
    row.orders,
    formatCurrency(row.revenue),
    `${(row.conversionRate * 100).toFixed(2)}%`,
    row.topProduct,
    row.topTrafficSource
  ]));

  const monthlyHeader = ['Month', 'Visitors', 'Orders', 'Revenue', 'Conversion Rate'];
  const monthlyValues = [monthlyHeader].concat(aggregation.monthlyRows.map(row => [
    row.month,
    row.visitors,
    row.orders,
    formatCurrency(row.revenue),
    `${(row.conversionRate * 100).toFixed(2)}%`
  ]));

  const trafficValues = [
    ['Traffic Analytics'],
    [],
    ['Metric', 'Value'],
    ['Daily Visitors', aggregation.dailyRows.length ? aggregation.dailyRows[aggregation.dailyRows.length - 1].visitors : 0],
    ['Weekly Visitors', aggregation.executiveSummary.week.visitors],
    ['Monthly Visitors', aggregation.executiveSummary.month.visitors],
    ['New Visitors', aggregation.executiveSummary.today.visitors],
    ['Repeat Visitors', aggregation.customerMetrics.returningCustomers],
    ['Average Session Duration', 'N/A'],
    [],
    ['Traffic Source', 'Events'],
    ...aggregation.utmRows.slice(0, 20).map(row => [row.source, row.visitors])
  ];

  const productHeaderRow = ['Product Name', 'Product Views', 'Cart Adds', 'Purchases', 'Revenue', 'Conversion Rate'];
  const productValues = [productHeaderRow].concat(aggregation.productRows.map(row => [
    row.productName,
    row.productViews,
    row.cartAdds,
    row.purchases,
    formatCurrency(row.revenue),
    `${(row.conversionRate * 100).toFixed(2)}%`
  ]));

  const revenueValues = [
    ['Revenue Analytics'],
    [],
    ['Metric', 'Value'],
    ['GMV', formatCurrency(aggregation.summary.totalRevenue)],
    ['Total Orders', aggregation.summary.purchases],
    ['Average Order Value', formatCurrency(aggregation.summary.averageOrderValue)],
    ['Conversion Rate', `${(aggregation.summary.conversionRate * 100).toFixed(2)}%`]
  ];

  const customerValues = [
    ['Customer Analytics'],
    [],
    ['Metric', 'Value'],
    ['New Customers', aggregation.customerMetrics.newCustomers],
    ['Returning Customers', aggregation.customerMetrics.returningCustomers],
    ['Repeat Buyers', aggregation.customerMetrics.repeatBuyers],
    ['Total Customers', aggregation.customerMetrics.totalCustomers]
  ];

  const marketingHeaderRow = ['Source', 'Visitors', 'Orders', 'Revenue', 'Conversion Rate'];
  const marketingValues = [marketingHeaderRow].concat(aggregation.marketingRows.map(row => [
    row.source,
    row.visitors,
    row.orders,
    formatCurrency(row.revenue),
    `${(row.conversionRate * 100).toFixed(2)}%`
  ]));

  const leadHeaderRow = ['Date', 'WhatsApp Leads', 'Contact Leads', 'Total Leads'];
  const leadValues = [leadHeaderRow].concat(aggregation.leadRows.map(row => [
    row.date,
    row.whatsappLeads,
    row.contactLeads,
    row.totalLeads
  ]));

  const funnelValues = [
    ['Stage', 'Count'],
    ['Visitors', aggregation.funnelMetrics.visitors],
    ['Product Views', aggregation.funnelMetrics.productViews],
    ['Add To Cart', aggregation.funnelMetrics.addToCart],
    ['Checkout Started', aggregation.funnelMetrics.checkoutStarted],
    ['Purchase Completed', aggregation.funnelMetrics.purchases],
    ['View → Cart %', aggregation.funnelMetrics.productViews === 0 ? '0%' : `${((aggregation.funnelMetrics.addToCart / aggregation.funnelMetrics.productViews) * 100).toFixed(2)}%`],
    ['Cart → Checkout %', aggregation.funnelMetrics.addToCart === 0 ? '0%' : `${((aggregation.funnelMetrics.checkoutStarted / aggregation.funnelMetrics.addToCart) * 100).toFixed(2)}%`],
    ['Checkout → Purchase %', aggregation.funnelMetrics.checkoutStarted === 0 ? '0%' : `${((aggregation.funnelMetrics.purchases / aggregation.funnelMetrics.checkoutStarted) * 100).toFixed(2)}%`],
    ['Overall Conversion %', aggregation.funnelMetrics.visitors === 0 ? '0%' : `${((aggregation.funnelMetrics.purchases / aggregation.funnelMetrics.visitors) * 100).toFixed(2)}%`]
  ];

  const sheetWrites = [
    { sheet: DASHBOARD_SHEET_TITLE, values: dashboardValues },
    { sheet: EXECUTIVE_SUMMARY_SHEET_TITLE, values: executiveValues },
    { sheet: DAILY_REPORT_SHEET_TITLE, values: dailyValues },
    { sheet: WEEKLY_REPORT_SHEET_TITLE, values: weeklyValues },
    { sheet: MONTHLY_REPORT_SHEET_TITLE, values: monthlyValues },
    { sheet: TRAFFIC_ANALYTICS_SHEET_TITLE, values: trafficValues },
    { sheet: PRODUCT_ANALYTICS_SHEET_TITLE, values: productValues },
    { sheet: REVENUE_ANALYTICS_SHEET_TITLE, values: revenueValues },
    { sheet: CUSTOMER_ANALYTICS_SHEET_TITLE, values: customerValues },
    { sheet: MARKETING_ANALYTICS_SHEET_TITLE, values: marketingValues },
    { sheet: LEAD_ANALYTICS_SHEET_TITLE, values: leadValues },
    { sheet: CONVERSION_FUNNEL_SHEET_TITLE, values: funnelValues }
  ];

  for (const sheetWrite of sheetWrites) {
    await clearSheet(s, sheetWrite.sheet);
    await writeSheetValues(s, sheetWrite.sheet, 'A1', sheetWrite.values);
  }

  const latestSpreadsheet = await getSpreadsheetMetadata(s);
  const dashboardSheet = findSheetByTitle(latestSpreadsheet, DASHBOARD_SHEET_TITLE);
  const dailySheet = findSheetByTitle(latestSpreadsheet, DAILY_REPORT_SHEET_TITLE);
  const productSheet = findSheetByTitle(latestSpreadsheet, PRODUCT_ANALYTICS_SHEET_TITLE);
  const leadSheet = findSheetByTitle(latestSpreadsheet, LEAD_ANALYTICS_SHEET_TITLE);

  const chartRequests = [];
  if (dashboardSheet && dailySheet) {
    chartRequests.push({
      addChart: {
        chart: {
          spec: {
            title: 'Daily Traffic Trend',
            basicChart: {
              chartType: 'LINE',
              legendPosition: 'BOTTOM_LEGEND',
              axis: [
                { position: 'BOTTOM_AXIS', title: 'Date' },
                { position: 'LEFT_AXIS', title: 'Visitors' }
              ],
              domains: [
                {
                  sourceRange: {
                    sources: [
                      {
                        sheetId: dailySheet.properties.sheetId,
                        startRowIndex: 1,
                        endRowIndex: Math.min(aggregation.dailyRows.length + 1, 100),
                        startColumnIndex: 0,
                        endColumnIndex: 1
                      }
                    ]
                  }
                }
              ],
              series: [
                {
                  series: {
                    sourceRange: {
                      sources: [
                        {
                          sheetId: dailySheet.properties.sheetId,
                          startRowIndex: 1,
                          endRowIndex: Math.min(aggregation.dailyRows.length + 1, 100),
                          startColumnIndex: 1,
                          endColumnIndex: 2
                        }
                      ]
                    }
                  },
                  targetAxis: 'LEFT_AXIS'
                }
              ]
            }
          },
          position: {
            overlayPosition: {
              anchorCell: {
                sheetId: dashboardSheet.properties.sheetId,
                rowIndex: 10,
                columnIndex: 0
              },
              widthPixels: 700,
              heightPixels: 320
            }
          }
        }
      }
    });
  }

  if (productSheet) {
    chartRequests.push({
      addChart: {
        chart: {
          spec: {
            title: 'Revenue by Product',
            basicChart: {
              chartType: 'BAR',
              legendPosition: 'BOTTOM_LEGEND',
              axis: [
                { position: 'BOTTOM_AXIS', title: 'Revenue' },
                { position: 'LEFT_AXIS', title: 'Product' }
              ],
              domains: [
                {
                  sourceRange: {
                    sources: [
                      {
                        sheetId: productSheet.properties.sheetId,
                        startRowIndex: 1,
                        endRowIndex: Math.min(aggregation.productRows.length + 1, 20),
                        startColumnIndex: 0,
                        endColumnIndex: 1
                      }
                    ]
                  }
                }
              ],
              series: [
                {
                  series: {
                    sourceRange: {
                      sources: [
                        {
                          sheetId: productSheet.properties.sheetId,
                          startRowIndex: 1,
                          endRowIndex: Math.min(aggregation.productRows.length + 1, 20),
                          startColumnIndex: 4,
                          endColumnIndex: 5
                        }
                      ]
                    }
                  },
                  targetAxis: 'BOTTOM_AXIS'
                }
              ]
            }
          },
          position: {
            overlayPosition: {
              anchorCell: {
                sheetId: productSheet.properties.sheetId,
                rowIndex: 1,
                columnIndex: 7
              },
              widthPixels: 700,
              heightPixels: 320
            }
          }
        }
      }
    });
  }

  if (leadSheet) {
    chartRequests.push({
      addChart: {
        chart: {
          spec: {
            title: 'Lead Trend',
            basicChart: {
              chartType: 'COLUMN',
              legendPosition: 'BOTTOM_LEGEND',
              axis: [
                { position: 'BOTTOM_AXIS', title: 'Date' },
                { position: 'LEFT_AXIS', title: 'Leads' }
              ],
              domains: [
                {
                  sourceRange: {
                    sources: [
                      {
                        sheetId: leadSheet.properties.sheetId,
                        startRowIndex: 1,
                        endRowIndex: Math.min(aggregation.leadRows.length + 1, 50),
                        startColumnIndex: 0,
                        endColumnIndex: 1
                      }
                    ]
                  }
                }
              ],
              series: [
                {
                  series: {
                    sourceRange: {
                      sources: [
                        {
                          sheetId: leadSheet.properties.sheetId,
                          startRowIndex: 1,
                          endRowIndex: Math.min(aggregation.leadRows.length + 1, 50),
                          startColumnIndex: 1,
                          endColumnIndex: 2
                        }
                      ]
                    }
                  },
                  targetAxis: 'LEFT_AXIS'
                },
                {
                  series: {
                    sourceRange: {
                      sources: [
                        {
                          sheetId: leadSheet.properties.sheetId,
                          startRowIndex: 1,
                          endRowIndex: Math.min(aggregation.leadRows.length + 1, 50),
                          startColumnIndex: 3,
                          endColumnIndex: 4
                        }
                      ]
                    }
                  },
                  targetAxis: 'LEFT_AXIS'
                }
              ]
            }
          },
          position: {
            overlayPosition: {
              anchorCell: {
                sheetId: leadSheet.properties.sheetId,
                rowIndex: 1,
                columnIndex: 6
              },
              widthPixels: 700,
              heightPixels: 320
            }
          }
        }
      }
    });
  }

  if (chartRequests.length) {
    await s.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: chartRequests }
    });
  }
}


async function populateDashboardSheet(s) {
  await buildDashboardSheets(s);
}

exports.populateDashboardSheet = async () => {
  const s = await sheets();
  await ensureAnalyticsSheetExists(s);
  await buildDashboardSheets(s);
};

exports.ensureDashboardSheetExists = async () => {
  const s = await sheets();
  await ensureDashboardSheetExists(s);
};

exports.appendEventRow = async (payload) => {
  try {
    console.log('[GOOGLE_APPEND] Starting appendEventRow...');
    console.log('[GOOGLE_APPEND] Payload:', JSON.stringify(payload, null, 2));
    
    const row = mapPayloadToRow(payload);
    console.log('[GOOGLE_APPEND] Mapped row:', row);

    console.log('[GOOGLE_APPEND] Getting Sheets API instance...');
    const s = await sheets();
    console.log('[GOOGLE_APPEND] Got Sheets API instance');
    await ensureAnalyticsSheetExists(s);

    console.log('[GOOGLE_APPEND] Spreadsheet ID:', SHEET_ID);
    console.log('[GOOGLE_APPEND] Range:', DEFAULT_RANGE);
    console.log('[GOOGLE_APPEND] Sending append request...');

    const response = await s.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: DEFAULT_RANGE,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] }
    });

    console.log('[GOOGLE_APPEND_SUCCESS] Row appended:', response.data);
    return response;
  } catch (err) {
    console.error('[GOOGLE_APPEND_ERROR] Failed to append row:', err.message);
    console.error('[GOOGLE_APPEND_ERROR_CODE]:', err.code);
    console.error('[GOOGLE_APPEND_ERROR_STATUS]:', err.status);
    console.error('[GOOGLE_APPEND_ERROR_STACK]:', err.stack);
    console.error('[GOOGLE_APPEND_ERROR_FULL]:', err);
    throw err;
  }
};

exports.appendEventRows = async (payloads) => {
  try {
    console.log('[GOOGLE_BATCH] Starting appendEventRows with', payloads.length, 'rows');
    
    const rows = payloads.map(mapPayloadToRow);
    console.log('[GOOGLE_BATCH] Mapped rows:', rows);

    console.log('[GOOGLE_BATCH] Getting Sheets API instance...');
    const s = await sheets();
    console.log('[GOOGLE_BATCH] Got Sheets API instance');
    await ensureAnalyticsSheetExists(s);

    console.log('[GOOGLE_BATCH] Sending append request...');
    const response = await s.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: DEFAULT_RANGE,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: rows }
    });

    console.log('[GOOGLE_BATCH_SUCCESS] Batch appended:', response.data);
    return response;
  } catch (err) {
    console.error('[GOOGLE_BATCH_ERROR] Failed to append batch:', err.message);
    console.error('[GOOGLE_BATCH_ERROR_STACK]:', err.stack);
    throw err;
  }
};

/**
 * Diagnostic test: Validates Google authentication, spreadsheet access, and sheet existence
 * Returns detailed status and error information
 */
exports.diagnosticTest = async () => {
  const results = {
    success: false,
    steps: [],
    errors: []
  };

  try {
    // Step 1: Check credentials
    console.log('[DIAG] Step 1: Checking credentials...');
    if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
      results.errors.push('Missing credentials');
      results.steps.push({
        name: 'credentials_check',
        status: 'FAILED',
        details: { hasSheetId: !!SHEET_ID, hasClientEmail: !!CLIENT_EMAIL, hasPrivateKey: !!PRIVATE_KEY }
      });
      return results;
    }
    results.steps.push({
      name: 'credentials_check',
      status: 'PASSED',
      details: {
        sheetId: SHEET_ID,
        clientEmail: CLIENT_EMAIL,
        keyLength: PRIVATE_KEY.length
      }
    });

    // Step 2: Authenticate
    console.log('[DIAG] Step 2: Authenticating with Google...');
    const s = await sheets();
    results.steps.push({
      name: 'authentication',
      status: 'PASSED',
      details: { message: 'JWT authorized successfully' }
    });

    // Step 3: Get spreadsheet metadata
    console.log('[DIAG] Step 3: Getting spreadsheet metadata...');
    const spreadsheet = await s.spreadsheets.get({
      spreadsheetId: SHEET_ID
    });
    results.steps.push({
      name: 'spreadsheet_metadata',
      status: 'PASSED',
      details: {
        title: spreadsheet.data.properties.title,
        id: spreadsheet.data.spreadsheetId,
        sheetCount: spreadsheet.data.sheets.length,
        sheets: spreadsheet.data.sheets.map(sh => sh.properties.title),
        sheet_shared: true,
        service_account: CLIENT_EMAIL
      }
    });

    // Step 4: Check for Raw Events sheet
    console.log('[DIAG] Step 4: Looking for Raw Events sheet...');
    const eventSheet = spreadsheet.data.sheets.find(
      sh => sh.properties.title === RAW_EVENTS_SHEET_TITLE || sh.properties.title.toLowerCase() === RAW_EVENTS_SHEET_TITLE.toLowerCase() || sh.properties.title.toLowerCase() === 'analytics'
    );
    if (!eventSheet) {
      results.steps.push({
        name: 'raw_events_sheet_check',
        status: 'WARNING',
        details: { availableSheets: spreadsheet.data.sheets.map(sh => sh.properties.title), message: 'Raw Events sheet missing, attempting to create it.' }
      });
      await ensureAnalyticsSheetExists(s, spreadsheet);
      results.steps.push({
        name: 'raw_events_sheet_check',
        status: 'PASSED',
        details: { message: 'Raw Events sheet created successfully.' }
      });
    } else {
      results.steps.push({
        name: 'raw_events_sheet_check',
        status: 'PASSED',
        details: {
          title: eventSheet.properties.title,
          sheetId: eventSheet.properties.sheetId,
          gridProperties: eventSheet.properties.gridProperties
        }
      });
    }

    // Step 5: Read headers from Raw Events sheet
    console.log('[DIAG] Step 5: Reading headers...');
    const headers = await s.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${RAW_EVENTS_SHEET_TITLE}!A1:W1`
    });
    results.steps.push({
      name: 'read_headers',
      status: 'PASSED',
      details: {
        headerRow: headers.data.values ? headers.data.values[0] : 'NO HEADERS FOUND'
      }
    });

    // Step 6: Try to append a test row
    console.log('[DIAG] Step 6: Testing row append...');
    const testRow = [
      new Date().toISOString(),
      'diagnostic_test',
      '/diagnostic',
      '',
      'Test Browser',
      'Test Device',
      '',
      '',
      'DIAG_' + Date.now(),
      'DIAG_VISITOR',
      '',
      '',
      '',
      '',
      'Diagnostic Product',
      'Diagnostics',
      0,
      0,
      '',
      0,
      '',
      0,
      ''
    ];
    const appendResult = await s.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${RAW_EVENTS_SHEET_TITLE}!A:W`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [testRow] }
    });
    results.steps.push({
      name: 'append_test_row',
      status: 'PASSED',
      details: {
        updatedRows: appendResult.data.updates.updatedRows,
        appendedCell: appendResult.data.updates.updatedRange
      }
    });

    results.success = true;
    console.log('[DIAG] ✅ All diagnostic tests passed');
  } catch (err) {
    console.error('[DIAG] ❌ Diagnostic test failed:', err.message);
    results.errors.push(err.message);
    if (err.response && err.response.data) {
      results.lastError = err.response.data;
    } else {
      results.lastError = {
        message: err.message,
        code: err.code
      };
    }
  }

  return results;
};
