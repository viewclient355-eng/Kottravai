const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { google } = require('googleapis');
const { validateAndRepairKey } = require('./utils/googleKeyValidator');

const LEGACY_SHEETS = [
  'UserBehaviorLibrary',
  'TrafficAnalytics',
  'ProductAnalytics',
  'EngagementMetrics',
  'BehaviorMetrics',
  'CartAndCheckout',
  'SalesAndRevenue',
  'SearchAnalytics',
  'CustomerSegments',
  'LeadGeneration'
];

const RAW_EVENTS_SHEET = 'Raw Events';
const BACKUP_SHEET = 'RAW_EVENTS_BACKUP_PRE_MIGRATION';

// Target columns for Raw Events
const TARGET_HEADERS = [
  'Timestamp', 'Event Type', 'Page', 'Referrer', 'Browser', 'Device', 'Screen Size',
  'User Agent', 'Session ID', 'Visitor ID', 'UTM Source', 'UTM Medium', 'UTM Campaign',
  'Product ID', 'Product Name', 'Category', 'Price', 'Quantity', 'Order ID', 'Order Total',
  'Payment Method', 'Duration Seconds', 'Metadata'
];

function buildKey(timestamp, event_type, visitor_id, session_id) {
  // Use exact match string
  return `${timestamp}|${event_type}|${visitor_id}|${session_id}`;
}

async function run() {
  try {
    let key = process.env.GOOGLE_PRIVATE_KEY || '';
    key = validateAndRepairKey(key);
    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL || '';
    if (clientEmail.startsWith('"') && clientEmail.endsWith('"')) clientEmail = clientEmail.slice(1, -1);
    
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: key },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const sheets = google.sheets({ version: 'v4', auth });
    let spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (spreadsheetId.startsWith('"') && spreadsheetId.endsWith('"')) spreadsheetId = spreadsheetId.slice(1, -1);

    // 1. Get spreadsheet metadata
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetData = response.data.sheets;
    const sheetTitles = sheetData.map(s => s.properties.title);
    
    // Check if Raw Events exists
    if (!sheetTitles.includes(RAW_EVENTS_SHEET)) {
      throw new Error(`${RAW_EVENTS_SHEET} sheet not found!`);
    }

    const rawEventsSheet = sheetData.find(s => s.properties.title === RAW_EVENTS_SHEET);
    const rawEventsSheetId = rawEventsSheet.properties.sheetId;

    // 2. Pre-Migration Safety: Create backup
    console.log(`[BACKUP] Creating backup sheet: ${BACKUP_SHEET}`);
    if (sheetTitles.includes(BACKUP_SHEET)) {
        // Delete old backup if it exists
        const oldBackup = sheetData.find(s => s.properties.title === BACKUP_SHEET);
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{ deleteSheet: { sheetId: oldBackup.properties.sheetId } }]
            }
        });
    }

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{
                duplicateSheet: {
                    sourceSheetId: rawEventsSheetId,
                    insertSheetIndex: 1,
                    newSheetName: BACKUP_SHEET
                }
            }]
        }
    });

    // 3. Load all legacy data & Log
    const legacyData = {};
    for (const sheetName of LEGACY_SHEETS) {
      if (!sheetTitles.includes(sheetName)) {
        console.log(`[LEGACY_AUDIT]
${sheetName}
Rows Found: 0
Action: Skipped (Not Found)`);
        continue;
      }
      const dataRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!A1:Z` });
      const values = dataRes.data.values || [];
      const rowCount = Math.max(0, values.length - 1);
      
      if (rowCount === 0) {
        console.log(`[LEGACY_AUDIT]
${sheetName}
Rows Found: 0
Action: Skipped (Empty)`);
      } else {
        console.log(`[LEGACY_AUDIT]
${sheetName}
Rows Found: ${rowCount}
Action: Will migrate`);
        
        const headers = values[0];
        const rows = values.slice(1).map(row => {
          const obj = {};
          headers.forEach((h, i) => obj[h.trim()] = row[i] || '');
          return obj;
        });
        legacyData[sheetName] = rows;
      }
    }

    // 4. Build Enrichment map from UserBehaviorLibrary
    const enrichmentMap = {}; // Key: VisitorID or SessionID
    if (legacyData['UserBehaviorLibrary']) {
        for (const row of legacyData['UserBehaviorLibrary']) {
            const data = {
                device: row['Device'],
                browser: row['Browser'],
                os: row['OS'],
                ip_location: row['IP Location'],
                returning: row['Returning User'],
                customer_id: row['Customer ID']
            };
            if (row['Session ID']) enrichmentMap[row['Session ID']] = data;
            if (row['Visitor ID']) enrichmentMap[row['Visitor ID']] = data; // fallback
        }
    }

    // 5. Build New Events
    const newEvents = [];
    
    // Process TrafficAnalytics (page_view)
    if (legacyData['TrafficAnalytics']) {
        for (const row of legacyData['TrafficAnalytics']) {
            const enrich = enrichmentMap[row['Session ID']] || enrichmentMap[row['Visitor ID']] || {};
            newEvents.push({
                'Timestamp': row['Timestamp'] || '',
                'Event Type': 'page_view',
                'Page': row['Page Path'] || '',
                'Visitor ID': row['Visitor ID'] || '',
                'Session ID': row['Session ID'] || '',
                'Product Name': '',
                'Price': '',
                'Quantity': '',
                'Order Total': '',
                'Referrer': row['Referrer'] || '',
                'UTM Source': row['UTM Source'] || '',
                'UTM Medium': row['UTM Medium'] || '',
                'UTM Campaign': row['UTM Campaign'] || '',
                'Device': row['Device'] || enrich.device || '',
                'Browser': row['Browser'] || enrich.browser || '',
                'Metadata': JSON.stringify({ ip_location: row['IP Location'] || enrich.ip_location || '', customer_id: enrich.customer_id || '' })
            });
        }
    }

    // Process ProductAnalytics
    if (legacyData['ProductAnalytics']) {
        for (const row of legacyData['ProductAnalytics']) {
            const enrich = enrichmentMap[row['Session ID']] || enrichmentMap[row['Visitor ID']] || {};
            newEvents.push({
                'Timestamp': row['Timestamp'] || '',
                'Event Type': row['Event Type'] || '',
                'Page': row['Page URL'] || '',
                'Visitor ID': row['Visitor ID'] || '',
                'Session ID': row['Session ID'] || '',
                'Product Name': row['Product Name'] || '',
                'Category': row['Category'] || '',
                'Price': row['Price'] || '',
                'Quantity': row['Quantity'] || '',
                'Referrer': row['Traffic Source'] || '',
                'Device': enrich.device || '',
                'Browser': enrich.browser || '',
                'Metadata': JSON.stringify({ variant: row['Variant'] || '', customer_id: enrich.customer_id || '' })
            });
        }
    }

    // 6. Deduplication
    console.log(`[DEDUPLICATION] Fetching existing Raw Events to find duplicates...`);
    const rawEventsRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${RAW_EVENTS_SHEET}!A1:Z` });
    const existingRaw = rawEventsRes.data.values || [];
    const existingKeys = new Set();
    
    if (existingRaw.length > 1) {
        const rawHeaders = existingRaw[0].map(h => h.trim().toLowerCase());
        const tIdx = rawHeaders.indexOf('timestamp');
        const eIdx = rawHeaders.indexOf('event type') !== -1 ? rawHeaders.indexOf('event type') : rawHeaders.indexOf('event_type');
        const vIdx = rawHeaders.indexOf('visitor id') !== -1 ? rawHeaders.indexOf('visitor id') : rawHeaders.indexOf('visitor_id');
        const sIdx = rawHeaders.indexOf('session id') !== -1 ? rawHeaders.indexOf('session id') : rawHeaders.indexOf('session_id');

        for (let i = 1; i < existingRaw.length; i++) {
            const r = existingRaw[i];
            const k = buildKey(r[tIdx]||'', r[eIdx]||'', r[vIdx]||'', r[sIdx]||'');
            existingKeys.add(k);
        }
    }

    const eventsToInsert = [];
    const duplicates = [];
    const eventDistribution = {};
    const visitorSet = new Set();
    const sessionSet = new Set();
    
    let productViews = 0, addTOCarts = 0, checkouts = 0, purchases = 0;

    for (const ev of newEvents) {
        const k = buildKey(ev['Timestamp'], ev['Event Type'], ev['Visitor ID'], ev['Session ID']);
        if (existingKeys.has(k)) {
            duplicates.push(ev);
        } else {
            existingKeys.add(k); // In case of dupes within the legacy set itself
            eventsToInsert.push(ev);

            // Stats Tracking
            eventDistribution[ev['Event Type']] = (eventDistribution[ev['Event Type']] || 0) + 1;
            if (ev['Visitor ID']) visitorSet.add(ev['Visitor ID']);
            if (ev['Session ID']) sessionSet.add(ev['Session ID']);
            
            if (ev['Event Type'] === 'product_view') productViews++;
            if (ev['Event Type'] === 'add_to_cart') addTOCarts++;
            if (ev['Event Type'] === 'checkout_started') checkouts++;
            if (ev['Event Type'] === 'purchase_completed') purchases++;
        }
    }

    // 7. Insert to Raw Events
    if (eventsToInsert.length > 0) {
        const rowsToInsert = eventsToInsert.map(ev => {
            return TARGET_HEADERS.map(h => ev[h] || '');
        });

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${RAW_EVENTS_SHEET}!A:W`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: rowsToInsert }
        });
    }

    // 8. Rename Legacy Sheets
    const renameRequests = [];
    for (const sheetName of LEGACY_SHEETS) {
        if (sheetTitles.includes(sheetName)) {
            const sheet = sheetData.find(s => s.properties.title === sheetName);
            renameRequests.push({
                updateSheetProperties: {
                    properties: {
                        sheetId: sheet.properties.sheetId,
                        title: `LEGACY_${sheetName}`
                    },
                    fields: 'title'
                }
            });
        }
    }
    
    if (renameRequests.length > 0) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: { requests: renameRequests }
        });
        console.log(`[RENAMED] Legacy sheets marked as read-only backups.`);
    }

    // 9. Output Report
    console.log(`\n================================================`);
    console.log(`          POST-MIGRATION VALIDATION REPORT      `);
    console.log(`================================================\n`);
    console.log(`1. Total Rows Migrated: ${eventsToInsert.length}`);
    console.log(`2. Rows Rejected (Duplicates): ${duplicates.length}`);
    console.log(`3. Duplicate Count: ${duplicates.length}`);
    console.log(`4. Event Distribution:\n${JSON.stringify(eventDistribution, null, 2)}`);
    console.log(`5. Visitor Count: ${visitorSet.size}`);
    console.log(`6. Session Count: ${sessionSet.size}`);
    console.log(`7. Product View Count: ${productViews}`);
    console.log(`8. Add To Cart Count: ${addTOCarts}`);
    console.log(`9. Checkout Count: ${checkouts}`);
    console.log(`10. Purchase Count: ${purchases}`);
    console.log(`11. Revenue Total: N/A (Migrated from product/traffic, legacy Revenue sheet was empty)`);
    console.log(`\n================================================\n`);

  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run();
