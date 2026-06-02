const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fs = require('fs');

// Mock getting data from sheets
const { google } = require('googleapis');
const { validateAndRepairKey } = require('./utils/googleKeyValidator');

function getSafeNumber(val) {
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? 0 : num;
}

function normalizeValue(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

async function fetchRawEventRows() {
    let CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL.trim();
    if (CLIENT_EMAIL.startsWith('"')) CLIENT_EMAIL = CLIENT_EMAIL.slice(1, -1);
    let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
    if (PRIVATE_KEY) PRIVATE_KEY = validateAndRepairKey(PRIVATE_KEY);

    const auth = new google.auth.GoogleAuth({
        credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const s = google.sheets({ version: 'v4', auth });
    
    const response = await s.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Raw Events!A1:Z500' // Just fetch first 500 to test
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

async function testAggregations() {
    const rows = await fetchRawEventRows();
    console.log(`Fetched ${rows.length} rows.`);
    
    if (rows.length > 0) {
        console.log("Sample row[0]:", rows[0]);
    }
    
    // Check if buildAggregations inside googleSheetsService would read it correctly
    const eventTypes = {};
    let missingVisitorId = 0;
    
    rows.forEach(row => {
        const timestampStr = row['Timestamp'];
        const visitorId = row['Visitor ID'];
        const eventType = row['Event Type'];
        
        eventTypes[eventType] = (eventTypes[eventType] || 0) + 1;
        if (!visitorId) missingVisitorId++;
    });
    
    console.log("Event Types found:", eventTypes);
    console.log(`Missing visitor ID: ${missingVisitorId}`);
}

testAggregations().catch(console.error);
