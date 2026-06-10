const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { google } = require('googleapis');

const LEGACY_SHEETS = [
  "UserBehaviorLibrary",
  "TrafficAnalytics",
  "ProductAnalytics",
  "EngagementMetrics",
  "BehaviorMetrics",
  "CartAndCheckout",
  "SalesAndRevenue",
  "SearchAnalytics",
  "CustomerSegments",
  "LeadGeneration"
];

async function run() {
  try {
    let key = process.env.GOOGLE_PRIVATE_KEY || '';
    const { validateAndRepairKey } = require('./utils/googleKeyValidator');
    key = validateAndRepairKey(key);
    
    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL || '';
    if (clientEmail.startsWith('"') && clientEmail.endsWith('"')) {
        clientEmail = clientEmail.slice(1, -1);
    }
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: key
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const sheets = google.sheets({ version: 'v4', auth });
    let spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (spreadsheetId.startsWith('"') && spreadsheetId.endsWith('"')) {
        spreadsheetId = spreadsheetId.slice(1, -1);
    }

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false
    });

    const sheetTitles = response.data.sheets.map(s => s.properties.title);
    
    const auditReport = {};

    for (const sheetName of LEGACY_SHEETS) {
      if (!sheetTitles.includes(sheetName)) {
        auditReport[sheetName] = { status: 'NOT_FOUND' };
        continue;
      }

      // Fetch data
      const dataRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z` // getting up to Z columns, all rows
      });

      const values = dataRes.data.values || [];
      const rowCount = Math.max(0, values.length - 1);
      const headers = values[0] || [];
      
      const rows = values.slice(1);
      
      // Try to guess where event type and dates are based on common headers
      let eventTypeCol = -1;
      let dateCol = -1;
      let visitorCol = -1;
      let sessionCol = -1;
      
      headers.forEach((h, i) => {
        const lower = h.toLowerCase();
        if (lower.includes('event')) eventTypeCol = i;
        if (lower.includes('time') || lower.includes('date')) dateCol = i;
        if (lower.includes('visitor')) visitorCol = i;
        if (lower.includes('session')) sessionCol = i;
      });

      const eventTypes = new Set();
      const dates = [];
      const visitors = new Set();
      const sessions = new Set();

      rows.forEach(row => {
        if (eventTypeCol !== -1 && row[eventTypeCol]) eventTypes.add(row[eventTypeCol]);
        if (dateCol !== -1 && row[dateCol]) dates.push(new Date(row[dateCol]).getTime());
        if (visitorCol !== -1 && row[visitorCol]) visitors.add(row[visitorCol]);
        if (sessionCol !== -1 && row[sessionCol]) sessions.add(row[sessionCol]);
      });
      
      dates.sort();
      const minDate = dates.length > 0 ? new Date(dates[0]).toISOString() : null;
      const maxDate = dates.length > 0 ? new Date(dates[dates.length - 1]).toISOString() : null;

      auditReport[sheetName] = {
        status: 'FOUND',
        rowCount,
        columns: headers,
        eventTypesPresent: Array.from(eventTypes),
        dateRange: { min: minDate, max: maxDate },
        visitorCount: visitors.size,
        sessionCount: sessions.size
      };
    }

    console.log(JSON.stringify(auditReport, null, 2));

  } catch (err) {
    console.error('Error auditing sheets:', err);
  }
}

run();
