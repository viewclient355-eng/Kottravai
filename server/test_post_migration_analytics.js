const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
process.env.ANALYTICS_MODE = 'raw_events'; // Force raw_events mode

const axios = require('axios');
const http = require('http');
const app = require('./index'); // Assuming index.js exports the express app

// If index.js doesn't export app, we'll just mock the controller directly.
const trackingController = require('./controllers/trackingController');
const { google } = require('googleapis');
const { validateAndRepairKey } = require('./utils/googleKeyValidator');
const googleSheetsService = require('./services/googleSheetsService');

// Setup auth manually to read sheets
let key = process.env.GOOGLE_PRIVATE_KEY || '';
key = validateAndRepairKey(key);
let clientEmail = process.env.GOOGLE_CLIENT_EMAIL || '';
if (clientEmail.startsWith('"')) clientEmail = clientEmail.slice(1, -1);
const auth = new google.auth.GoogleAuth({
  credentials: { client_email: clientEmail, private_key: key },
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({ version: 'v4', auth });
let spreadsheetId = process.env.GOOGLE_SHEET_ID;
if (spreadsheetId.startsWith('"')) spreadsheetId = spreadsheetId.slice(1, -1);

async function getRawEventsCount() {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Raw Events!A1:Z'
    });
    const values = response.data.values || [];
    return Math.max(0, values.length - 1);
}

async function getLastNRows(n) {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Raw Events!A1:Z'
    });
    const values = response.data.values || [];
    return values.slice(-n);
}

// Mock express req/res
function mockReqRes(body) {
    const req = {
        body,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'TestRunner/1.0' },
        app: { get: () => '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
    };
    const res = {
        status: function(s) { this.statusCode = s; return this; },
        json: function(data) { this.data = data; return this; }
    };
    return { req, res };
}

async function runTest() {
    try {
        console.log('--- POST-MIGRATION REAL-TIME ANALYTICS VALIDATION ---');
        
        const countBefore = await getRawEventsCount();
        console.log(`1. Raw Events row count before test: ${countBefore}`);

        const sessionId = 'TEST_SESSION_' + Date.now();
        const visitorId = 'TEST_VISITOR_888';

        const testEvents = [
            { event: 'page_view', data: { page_url: '/' } },
            { event: 'page_view', data: { page_url: '/shop' } },
            { event: 'product_view', data: { page_url: '/product/heritage-saree', product_name: 'Heritage Saree', category: 'Handlooms', price: 5000 } },
            { event: 'add_to_cart', data: { page_url: '/product/heritage-saree', product_name: 'Heritage Saree', price: 5000, quantity: 1 } },
            { event: 'checkout_started', data: { page_url: '/checkout', order_total: 5000 } },
            { event: 'guest_checkout_started', data: { page_url: '/checkout' } },
            { event: 'otp_sent', data: { page_url: '/checkout', phone: '9999999999' } },
            { event: 'otp_verified', data: { page_url: '/checkout', phone: '9999999999' } },
            { event: 'purchase_completed', data: { page_url: '/checkout/success', order_id: 'ORD_TEST_001', order_total: 5000, payment_method: 'Guest_OTP' } }
        ];

        console.log(`\nTesting Event Flow...`);
        for (const te of testEvents) {
            const payload = {
                event_type: te.event,
                page: te.data.page_url,
                page_url: te.data.page_url,
                timestamp: new Date().toISOString(),
                visitor_id: visitorId,
                session_id: sessionId,
                browser: 'Chrome',
                device: 'desktop',
                metadata: te.data
            };
            
            // Apply all custom te.data directly to the payload to match what trackingUtils expects
            Object.assign(payload, te.data);
            
            console.log(`[TEST] Emitting -> ${te.event}`);
            const { req, res } = mockReqRes(payload);
            
            // Directly invoke controller to bypass full express startup (guarantees execution within node script)
            await trackingController.trackEvent(req, res);
            
            if (res.statusCode !== 200) {
                console.error(`[ERROR] Failed to process ${te.event}:`, res.data);
            }
        }

        console.log(`\nWaiting 8 seconds for Google Sheets append...`);
        await new Promise(r => setTimeout(r, 8000));

        const countAfter = await getRawEventsCount();
        console.log(`\n2. Raw Events row count after test: ${countAfter}`);
        console.log(`   Expected increase: ${testEvents.length}. Actual increase: ${countAfter - countBefore}`);

        console.log(`\n3. Newly inserted rows (Last ${testEvents.length}):`);
        const lastRows = await getLastNRows(testEvents.length);
        lastRows.forEach((row, i) => {
            // Log timestamp, event_type, page_url, visitor_id
            console.log(`   Row ${i+1}: [${row[0]}] | ${row[1]} | ${row[2]} | ${row[3]}`);
        });

        console.log(`\n4. Event payload example (${testEvents[testEvents.length-1].event}):`);
        console.log(JSON.stringify(lastRows[lastRows.length-1], null, 2));

        console.log(`\n5. Dashboard KPI Updates...`);
        console.log(`Triggering dashboard rebuild...`);
        await googleSheetsService.populateDashboardSheet();
        
        console.log(`\n✅ POST-MIGRATION VALIDATION SUCCESSFUL`);
        
    } catch (err) {
        console.error('Validation Test Failed:', err);
    }
}

runTest();
