const { google } = require('googleapis');
const { validateAndRepairKey } = require('../utils/googleKeyValidator');
const chartBuilder = require('./chartBuilder');

let SHEET_ID = process.env.GOOGLE_SHEET_ID;
let CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// Log credential status at startup with detailed validation
console.log('[GOOGLE_INIT] Checking credentials...');

let lastSuccessfulWrite = null;

exports.getLastWrite = () => lastSuccessfulWrite;
exports.getConfig = () => ({
    analyticsMode: process.env.ANALYTICS_MODE || 'legacy',
    spreadsheetId: SHEET_ID,
    spreadsheetUrl: SHEET_ID ? `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit` : null,
    rawEventsSheet: 'Raw Events',
    dashboardSheets: [
        'Executive Dashboard',
        'Visitor Intelligence',
        'Traffic Analytics',
        'Product Analytics',
        'Revenue Analytics',
        'Customer Analytics',
        'WhatsApp Analytics',
        'Conversion Funnel',
        'Daily Report',
        'Weekly Report',
        'Monthly Report',
        'Lead Analytics'
    ]
});

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

const EXECUTIVE_DASHBOARD_SHEET = 'Executive Dashboard';
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
  const getISTDateString = (date) => {
    return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
  };
  const getWeekKeyIST = (date) => {
    const d = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    d.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
    return d.getFullYear() + '-W' + Math.ceil((d.getDate() + 6 - d.getDay()) / 7); // Using ISO format roughly
  };
  const getMonthKeyIST = (date) => {
    const d = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

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
    const timestampStr = row['timestamp'];
    if (!timestampStr) return;
    const time = new Date(timestampStr).getTime();
    if (isNaN(time)) return;

    const visitorId = row['visitor_id'];
    const sessionId = row['session_id'];
    const eventType = row['event_type'];
    const revenue = getSafeNumber(row['order_total']);
    const productId = row['product_id'];
    const productName = row['product_name'];
    let pageUrl = row['page'] || '';
    if (typeof pageUrl === 'string') pageUrl = pageUrl.replace(/kottravai\.com/g, 'kottravai.in');
    
    let referrer = row['referrer'] || '';
    if (typeof referrer === 'string') referrer = referrer.replace(/kottravai\.com/g, 'kottravai.in');

    // Default categorizations
    let source = normalizeValue(row['utm_source']);
    if (!source || source === 'direct' || source === '') {
        if (referrer && referrer.includes('google')) source = 'google';
        else if (referrer && referrer.includes('instagram')) source = 'instagram';
        else if (referrer && referrer.includes('facebook')) source = 'facebook';
        else if (referrer && referrer.includes('whatsapp')) source = 'whatsapp';
        else if (referrer && !referrer.includes('kottravai') && !referrer.includes('localhost')) source = 'referral';
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
async function fetchRawEventRows(s) {
  const response = await s.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: DEFAULT_RANGE
  });
  const values = response.data.values || [];
  if (values.length === 0) return [];

  const normalizeKey = (key) => {
    if (key === undefined || key === null) return '';
    return String(key).trim().toLowerCase().replace(/\s+/g, '_');
  };
  const headers = values[0].map(h => normalizeKey(h));
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

  const ndy = (val, formatter) => val === 0 ? 'No Data Yet' : (formatter ? formatter(val) : val);

  const appendMeta = (vals) => {
    vals.push(createEmpty(), ['---', '---'], ['Last Refresh (IST)', ts], ['Data Source', 'Raw Events (Single Source of Truth)']);
    return vals;
  };

  // 1. EXECUTIVE DASHBOARD
  const execVals = appendMeta([
    ['EXECUTIVE DASHBOARD - PERFORMANCE SUMMARY'], createEmpty(),
    ['KEY PERFORMANCE INDICATORS', 'Current Period', '', 'GUEST METRICS', 'Current Period'],
    ['Total Visitors', aggregation.summary.totalVisitors, '', 'Guest Orders', ndy(aggregation.globalGuest.orders)],
    ['Total Sessions', aggregation.dailyRows.reduce((a,b)=>a+b.visitors, 0), '', 'Guest Revenue', ndy(aggregation.globalGuest.revenue, formatCurrency)],
    ['Total Orders', ndy(aggregation.summary.totalOrders), '', 'Guest Conv %', ndy(aggregation.globalGuest.guestCheckouts > 0 ? aggregation.globalGuest.orders/aggregation.globalGuest.guestCheckouts : 0, formatPercent)],
    ['Total Revenue', ndy(aggregation.summary.totalRevenue, formatCurrency), '', '', ''],
    ['GMV', ndy(aggregation.summary.totalRevenue, formatCurrency), '', 'VISITOR METRICS', ''],
    ['AOV', ndy(aggregation.summary.averageOrderValue, formatCurrency), '', 'Repeat Ratio', ndy(aggregation.executiveSummary.month.repeatRatio, formatPercent)],
    ['Conversion Rate', ndy(aggregation.summary.overallConversionRate, formatPercent), '', '', '']
  ]);

  // 2. VISITOR INTELLIGENCE
  const visitorVals = appendMeta([
    ['VISITOR INTELLIGENCE'], createEmpty(),
    ['METRIC', 'Value'],
    ['New Visitors (All Time)', aggregation.dailyRows.reduce((sum, r) => sum + r.newVisitors, 0)],
    ['Repeat Visitors', aggregation.dailyRows.reduce((sum, r) => sum + r.repeatVisitors, 0)],
    ['Average Session Duration', formatMins(aggregation.executiveSummary.month.avgSessionDurationMins)],
    ['Global Bounce Rate', ndy(aggregation.executiveSummary.month.bounceRate, formatPercent)],
    createEmpty(), ['TOP EXIT PAGES', 'Exits'],
    ...aggregation.topExitPages.map(r => [r.page, r.count])
  ]);

  // 3. WHATSAPP ANALYTICS
  const waVals = appendMeta([
    ['WHATSAPP CHECKOUT ANALYTICS'], createEmpty(),
    ['METRIC', 'Value'],
    ['WhatsApp Button Clicks', ndy(aggregation.leadData.whatsappClicks)],
    ['OTP Sent', ndy(aggregation.globalGuest.otpSent)],
    ['OTP Verified', ndy(aggregation.globalGuest.otpVerified)],
    ['OTP Success %', ndy(aggregation.globalGuest.otpSent > 0 ? aggregation.globalGuest.otpVerified / aggregation.globalGuest.otpSent : 0, formatPercent)],
    ['Guest Orders', ndy(aggregation.globalGuest.orders)],
    ['Guest Revenue', ndy(aggregation.globalGuest.revenue, formatCurrency)]
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
    ['Checkout Started', ndy(aggregation.globalFunnel.checkoutStarted), ndy(aggregation.globalFunnel.addToCarts > 0 ? aggregation.globalFunnel.checkoutStarted/aggregation.globalFunnel.addToCarts : 0, formatPercent)],
    ['Guest Checkout Started', ndy(aggregation.globalFunnel.guestCheckoutStarted), ndy(aggregation.globalFunnel.checkoutStarted > 0 ? aggregation.globalFunnel.guestCheckoutStarted/aggregation.globalFunnel.checkoutStarted : 0, formatPercent)],
    ['OTP Sent', ndy(aggregation.globalFunnel.otpSent), ndy(aggregation.globalFunnel.guestCheckoutStarted > 0 ? aggregation.globalFunnel.otpSent/aggregation.globalFunnel.guestCheckoutStarted : 0, formatPercent)],
    ['OTP Verified', ndy(aggregation.globalFunnel.otpVerified), ndy(aggregation.globalFunnel.otpSent > 0 ? aggregation.globalFunnel.otpVerified/aggregation.globalFunnel.otpSent : 0, formatPercent)],
    ['Purchase Completed', ndy(aggregation.globalFunnel.purchases), ndy(aggregation.globalFunnel.checkouts > 0 || aggregation.globalFunnel.otpVerified > 0 ? aggregation.globalFunnel.purchases/Math.max(aggregation.globalFunnel.checkoutStarted, aggregation.globalFunnel.otpVerified) : 0, formatPercent)]
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
          chartRequests.push({ deleteEmbeddedObject: { objectId: chart.chartId } });
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

    console.log(`\n==================================================\nGOOGLE SHEETS WRITE ATTEMPT\n===========================\nSpreadsheet ID: ${SHEET_ID}\nSpreadsheet URL: https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit\nTarget Sheet: ${RAW_EVENTS_SHEET_TITLE}\nEvent Type: ${payload.event_type}\nVisitor ID: ${payload.visitor_id || 'N/A'}\nSession ID: ${payload.session_id || 'N/A'}\n========================\n`);

    const response = await s.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: DEFAULT_RANGE,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] }
    });

    console.log('[GOOGLE_APPEND_SUCCESS] Row appended:', response.data);

    console.log(`\n==================================================\nRAW EVENT WRITTEN\n=================\nSpreadsheet ID: ${SHEET_ID}\nTarget Sheet: ${RAW_EVENTS_SHEET_TITLE}\nRow Number: ${response?.data?.updates?.updatedRange || 'Unknown'}\n=====================================\n`);
    
    lastSuccessfulWrite = {
        timestamp: new Date().toISOString(),
        eventType: payload.event_type,
        visitorId: payload.visitor_id || 'N/A',
        sessionId: payload.session_id || 'N/A',
        spreadsheetId: SHEET_ID,
        sheetName: RAW_EVENTS_SHEET_TITLE
    };

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
    
    console.log(`\n==================================================\nGOOGLE SHEETS WRITE ATTEMPT\n===========================\nSpreadsheet ID: ${SHEET_ID}\nSpreadsheet URL: https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit\nTarget Sheet: ${RAW_EVENTS_SHEET_TITLE}\nEvent Type: BATCH (${payloads.length} events)\nVisitor ID: N/A\nSession ID: N/A\n========================\n`);
    const response = await s.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: DEFAULT_RANGE,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: rows }
    });

    console.log('[GOOGLE_BATCH_SUCCESS] Batch appended:', response.data);

    console.log(`\n==================================================\nRAW EVENT WRITTEN\n=================\nSpreadsheet ID: ${SHEET_ID}\nTarget Sheet: ${RAW_EVENTS_SHEET_TITLE}\nRow Number: ${response?.data?.updates?.updatedRange || 'Unknown'} (Batch of ${payloads.length})\n=====================================\n`);
    
    lastSuccessfulWrite = {
        timestamp: new Date().toISOString(),
        eventType: `BATCH_OF_${payloads.length}`,
        visitorId: 'N/A',
        sessionId: 'N/A',
        spreadsheetId: SHEET_ID,
        sheetName: RAW_EVENTS_SHEET_TITLE
    };

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
      sh => sh.properties.title === RAW_EVENTS_SHEET_TITLE || DATA_SHEET_ORDER.includes(sh.properties.title)
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
      sh => sh.properties.title === RAW_EVENTS_SHEET_TITLE || DATA_SHEET_ORDER.includes(sh.properties.title)
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

// Exports for testing
exports.fetchRawEventRows = fetchRawEventRows;
exports.buildAggregations = buildAggregations;
exports.sheets = sheets;
