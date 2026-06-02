const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
process.env.ANALYTICS_MODE = 'raw_events';

const { google } = require('googleapis');
const { validateAndRepairKey } = require('./utils/googleKeyValidator');
const googleSheetsService = require('./services/googleSheetsService');
const trackingController = require('./controllers/trackingController');

// Helper to mock express Req/Res
function mockReqRes(body) {
    const req = {
        body,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'ValidationRunner/1.0' },
        app: { get: () => '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
    };
    const res = {
        status: function(s) { this.statusCode = s; return this; },
        json: function(data) { this.data = data; return this; }
    };
    return { req, res };
}

async function run() {
    try {
        console.log('--- FINAL PRODUCT ANALYTICS VALIDATION ---');
        
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

        console.log('\nSTEP 1 & 2: Fetching Raw Events vs ProductAnalytics...');
        
        // Fetch Raw Events
        const rawRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Raw Events!A1:Z' });
        const rawRows = rawRes.data.values || [];
        const rawHeaders = rawRows[0];
        
        const rawAggregations = {};
        for (let i = 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            const eventType = row[rawHeaders.indexOf('event_type')]?.toLowerCase() || '';
            const productName = row[rawHeaders.indexOf('product_name')];
            let price = parseFloat(row[rawHeaders.indexOf('price')]) || 0;
            let quantity = parseFloat(row[rawHeaders.indexOf('quantity')]) || 0;
            let orderTotal = parseFloat(row[rawHeaders.indexOf('order_total')]) || 0;
            if (!orderTotal) orderTotal = price * quantity;

            if (productName) {
                if (!rawAggregations[productName]) {
                    rawAggregations[productName] = { views: 0, cart: 0, checkouts: 0, purchases: 0, revenue: 0 };
                }
                const p = rawAggregations[productName];
                if (eventType === 'product_view' || eventType === 'category_view') p.views++; // note: old code uses category_view for some legacy views if applicable, but googleSheetsService says if eventType==='product_view'
                if (eventType === 'add_to_cart') p.cart++;
                if (eventType === 'checkout_started') p.checkouts++;
                if (eventType === 'purchase_completed') { p.purchases++; p.revenue += orderTotal; }
            }
        }

        // Fix logic to match googleSheetsService logic for products
        // Wait, googleSheetsService.js line 550 checkout_started doesn't have productName! So product-level checkouts is always 0.
        // Actually, the user asked for: Product Views, Add To Cart, Checkout Started, Purchases, Revenue
        // Let's fetch ProductAnalytics sheet
        
        const prodRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Product Analytics'!A1:Z" });
        const prodRows = prodRes.data.values || [];
        const prodHeaders = prodRows[0];
        
        console.log(`Raw Events Count: ${rawRows.length - 1}`);
        console.log(`ProductAnalytics Row Count: ${prodRows.length - 1}`);
        
        const prodData = {};
        for (let i = 1; i < prodRows.length; i++) {
            const row = prodRows[i];
            prodData[row[0]] = {
                views: parseInt(row[1]) || 0,
                cart: parseInt(row[2]) || 0,
                purchases: parseInt(row[3]) || 0,
                revenue: parseFloat(row[4]) || 0
            };
        }

        console.log('\n--- CROSS-CHECK 3 PRODUCTS ---');
        const sampleProducts = Object.keys(rawAggregations).slice(0, 3);
        sampleProducts.forEach(prod => {
            const raw = rawAggregations[prod];
            const sht = prodData[prod] || {views:0,cart:0,purchases:0,revenue:0};
            console.log(`Product: ${prod}`);
            console.log(`  Raw Events -> Views: ${raw.views}, Cart: ${raw.cart}, Purchases: ${raw.purchases}, Revenue: ${raw.revenue}`);
            console.log(`  Prod Sheet -> Views: ${sht.views}, Cart: ${sht.cart}, Purchases: ${sht.purchases}, Revenue: ${sht.revenue}`);
            if (raw.views === sht.views && raw.cart === sht.cart && raw.purchases === sht.purchases && raw.revenue === sht.revenue) {
                console.log(`  ✅ MATCH`);
            } else {
                console.log(`  ❌ MISMATCH`);
            }
        });

        console.log('\nSTEP 4: Testing live event flow updates...');
        const testProduct = "Heritage Saree Validation";
        const testEvents = [
            { event_type: 'product_view', product_name: testProduct, page: '/product/heritage', timestamp: new Date().toISOString(), session_id: 'SESS_VALID_01', visitor_id: 'VIS_VALID_01' },
            { event_type: 'add_to_cart', product_name: testProduct, page: '/product/heritage', price: 9000, quantity: 1, timestamp: new Date().toISOString(), session_id: 'SESS_VALID_01', visitor_id: 'VIS_VALID_01' },
            { event_type: 'purchase_completed', product_name: testProduct, page: '/checkout', order_total: 9000, timestamp: new Date().toISOString(), session_id: 'SESS_VALID_01', visitor_id: 'VIS_VALID_01' }
        ];

        for (const ev of testEvents) {
            console.log(`Injecting ${ev.event_type} for ${testProduct}...`);
            const { req, res } = mockReqRes(ev);
            await trackingController.trackEvent(req, res);
        }

        console.log('Waiting 5s for sheets append...');
        await new Promise(r => setTimeout(r, 5000));
        
        console.log('Triggering dashboard rebuild...');
        await googleSheetsService.populateDashboardSheet();
        
        console.log('Verifying Product Analytics update...');
        const prodRes2 = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Product Analytics'!A1:Z" });
        const prodRows2 = prodRes2.data.values || [];
        let found = false;
        for (let i = 1; i < prodRows2.length; i++) {
            if (prodRows2[i][0] === testProduct) {
                found = true;
                console.log(`Test Product Post-Update Metrics:`);
                console.log(`  Views: ${prodRows2[i][1]}, Cart: ${prodRows2[i][2]}, Purchases: ${prodRows2[i][3]}, Revenue: ${prodRows2[i][4]}`);
            }
        }
        if (!found) console.log(`❌ Test Product NOT FOUND in Product Analytics sheet!`);
        
    } catch (e) {
        console.error('Validation Script Error:', e);
    }
}
run();
