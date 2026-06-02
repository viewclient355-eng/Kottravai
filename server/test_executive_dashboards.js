const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const googleSheetsService = require('./services/googleSheetsService');
const { google } = require('googleapis');
const { validateAndRepairKey } = require('./utils/googleKeyValidator');

function generateRandomString(len = 8) {
    return Math.random().toString(36).substring(2, 2 + len);
}

function generateEvents(count, scenarios = {}) {
    const events = [];
    const now = Date.now();
    
    // Some pre-defined users to simulate returning visitors
    const returningUsers = Array(5).fill(0).map(() => ({ vId: 'v_ret_' + generateRandomString(4), sId: 's_ret_' + generateRandomString(4) }));
    
    for (let i = 0; i < count; i++) {
        // Spread dates over the last 30 days
        const offset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
        const timestamp = new Date(now - offset).toISOString();
        
        let isReturning = Math.random() < 0.3;
        let user = isReturning ? returningUsers[Math.floor(Math.random() * returningUsers.length)] : { vId: 'v_' + generateRandomString(6), sId: 's_' + generateRandomString(6) };
        
        let eventTypes = ['page_view', 'product_view', 'add_to_cart', 'checkout_started', 'purchase_completed', 'guest_checkout_started', 'otp_sent', 'otp_verified', 'whatsapp_click'];
        // Bias towards top of funnel
        let eventType = eventTypes[Math.floor(Math.random() * 2)]; // 0 or 1
        if (Math.random() < 0.3) eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        if (scenarios.missingProduct && eventType === 'product_view') eventType = 'page_view';
        
        let source = ['google', 'instagram', 'facebook', 'direct', 'referral', 'whatsapp'][Math.floor(Math.random() * 6)];
        if (scenarios.missingUTM) source = '';

        let productName = ['Kottravai Heal Soap', 'Heritage Saree', 'Organic Honey', 'Instant Dosa Mix'][Math.floor(Math.random() * 4)];
        let productId = 'prod_' + Math.floor(Math.random() * 100);
        let price = Math.floor(Math.random() * 2000) + 100;

        let payload = {
            Timestamp: timestamp,
            'Event Type': eventType,
            Page: '/product/' + productId,
            Referrer: source ? "https://" + source + ".com" : '',
            Browser: 'Chrome',
            Device: 'desktop',
            'Session ID': user.sId,
            'Visitor ID': user.vId,
            'UTM Source': source,
            'Product ID': scenarios.missingProduct ? '' : productId,
            'Product Name': scenarios.missingProduct ? '' : productName,
            Price: price,
            'Order Total': eventType === 'purchase_completed' ? price : '',
            Quantity: eventType === 'purchase_completed' || eventType === 'add_to_cart' ? 1 : ''
        };
        events.push(payload);
    }
    return events;
}

async function runValidation() {
    try {
        let key = validateAndRepairKey(process.env.GOOGLE_PRIVATE_KEY || '');
        let clientEmail = process.env.GOOGLE_CLIENT_EMAIL.replace(/"/g, '');
        const auth = new google.auth.GoogleAuth({ credentials: { client_email: clientEmail, private_key: key }, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
        const sheets = google.sheets({ version: 'v4', auth });
        let spreadsheetId = process.env.GOOGLE_SHEET_ID.replace(/"/g, '');

        console.log('--- VALIDATION 1: EMPTY DATASET ---');
        await sheets.spreadsheets.values.clear({ spreadsheetId, range: "Raw Events!A2:W50000" });
        await googleSheetsService.populateDashboardSheet();
        console.log('Empty dataset passed without crashing.');

        console.log('--- VALIDATION 2: SMALL DATASET (<100 events) ---');
        const smallData = generateEvents(50);
        await googleSheetsService.appendEventRows(smallData);
        await googleSheetsService.populateDashboardSheet();
        console.log('Small dataset passed without crashing.');

        console.log('--- VALIDATION 3: MEDIUM DATASET + MISSING UTM/PRODUCT + GUEST FLOW ---');
        const medData = [
            ...generateEvents(500), 
            ...generateEvents(200, { missingUTM: true }), 
            ...generateEvents(200, { missingProduct: true })
        ];
        // Inject explicit guest checkout flow
        const guestSess = 's_guest_test';
        const guestVis = 'v_guest_test';
        medData.push(
            { Timestamp: new Date().toISOString(), 'Event Type': 'guest_checkout_started', 'Session ID': guestSess, 'Visitor ID': guestVis },
            { Timestamp: new Date().toISOString(), 'Event Type': 'otp_sent', 'Session ID': guestSess, 'Visitor ID': guestVis },
            { Timestamp: new Date().toISOString(), 'Event Type': 'otp_verified', 'Session ID': guestSess, 'Visitor ID': guestVis },
            { Timestamp: new Date().toISOString(), 'Event Type': 'purchase_completed', 'Session ID': guestSess, 'Visitor ID': guestVis, 'Order Total': 1500, 'Product Name': 'Test Product' }
        );

        await googleSheetsService.appendEventRows(medData);
        await googleSheetsService.populateDashboardSheet();
        console.log('Medium mixed dataset passed without crashing.');

        console.log('--- VALIDATION COMPLETE ---');
        console.log('Please open the Google Sheet to view the beautiful new Executive Dashboards!');
        
    } catch(err) {
        console.error('Validation failed:', err);
    }
}

runValidation();
