const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { google } = require('googleapis');
const { validateAndRepairKey } = require('./utils/googleKeyValidator');
const trackingController = require('./controllers/trackingController');
const googleSheetsService = require('./services/googleSheetsService');

// Force raw events mode for testing
process.env.ANALYTICS_MODE = 'raw_events';

// Generate some mock session data
const mockEvents = [];

function addEvent(session, visitor, eventType, product, category, price, quantity, referrer, utmSource, page) {
    const timestamp = new Date().toISOString();
    mockEvents.push({
        timestamp,
        event_type: eventType,
        session_id: session,
        visitor_id: visitor,
        product_name: product || '',
        category: category || '',
        price: price || 0,
        quantity: quantity || 0,
        order_total: price && quantity ? price * quantity : 0,
        referrer: referrer || '',
        utm_source: utmSource || '',
        page: page || 'http://localhost/'
    });
}

// 1. Bounce Session (1 event)
addEvent('s_bounce', 'v_bounce', 'page_view', '', '', 0, 0, '', 'Google', 'http://localhost/');

// 2. Product View Only Session
addEvent('s_view', 'v_view', 'page_view', '', '', 0, 0, 'https://instagram.com', '', 'http://localhost/');
addEvent('s_view', 'v_view', 'product_view', 'Saree A', 'Sarees', 0, 0, '', '', 'http://localhost/saree-a');

// 3. Cart Abandonment Session
addEvent('s_abandon', 'v_abandon', 'product_view', 'Saree B', 'Sarees', 0, 0, '', 'Facebook', 'http://localhost/saree-b');
addEvent('s_abandon', 'v_abandon', 'add_to_cart', 'Saree B', 'Sarees', 5000, 1, '', 'Facebook', 'http://localhost/saree-b');

// 4. OTP Failure Session
addEvent('s_otp', 'v_otp', 'add_to_cart', 'Saree C', 'Sarees', 2000, 1, '', '', 'http://localhost/saree-c');
addEvent('s_otp', 'v_otp', 'checkout_started', '', '', 0, 0, '', '', 'http://localhost/checkout');
addEvent('s_otp', 'v_otp', 'guest_checkout_started', '', '', 0, 0, '', '', 'http://localhost/checkout');
addEvent('s_otp', 'v_otp', 'otp_sent', '', '', 0, 0, '', '', 'http://localhost/checkout');
// No OTP verified, no purchase

// 5. Successful Guest Checkout Session
addEvent('s_guest', 'v_guest', 'product_view', 'Saree D', 'Sarees', 0, 0, 'https://wa.me/message', '', 'http://localhost/saree-d');
addEvent('s_guest', 'v_guest', 'add_to_cart', 'Saree D', 'Sarees', 8000, 1, '', '', 'http://localhost/saree-d');
addEvent('s_guest', 'v_guest', 'checkout_started', '', '', 0, 0, '', '', 'http://localhost/checkout');
addEvent('s_guest', 'v_guest', 'guest_checkout_started', '', '', 0, 0, '', '', 'http://localhost/checkout');
addEvent('s_guest', 'v_guest', 'otp_sent', '', '', 0, 0, '', '', 'http://localhost/checkout');
addEvent('s_guest', 'v_guest', 'otp_verified', '', '', 0, 0, '', '', 'http://localhost/checkout');
addEvent('s_guest', 'v_guest', 'purchase_completed', 'Saree D', 'Sarees', 8000, 1, '', '', 'http://localhost/checkout/success');

// 6. Successful Returning Visitor Session (Using the same visitor as product view only to make them returning)
// But to make them repeat properly, their first timestamp needs to be earlier. 
// We will just let them be a returning customer in the context of a new session?
// Wait, returning customer logic relies on timestamp. I will just run the simulation.
addEvent('s_return', 'v_view', 'page_view', '', '', 0, 0, '', '', 'http://localhost/');
addEvent('s_return', 'v_view', 'product_view', 'Saree A', 'Sarees', 0, 0, '', '', 'http://localhost/saree-a');
addEvent('s_return', 'v_view', 'add_to_cart', 'Saree A', 'Sarees', 6000, 1, '', '', 'http://localhost/saree-a');
addEvent('s_return', 'v_view', 'checkout_started', '', '', 0, 0, '', '', 'http://localhost/checkout');
addEvent('s_return', 'v_view', 'purchase_completed', 'Saree A', 'Sarees', 6000, 1, '', '', 'http://localhost/checkout/success');


async function run() {
    try {
        let key = validateAndRepairKey(process.env.GOOGLE_PRIVATE_KEY || '');
        let clientEmail = process.env.GOOGLE_CLIENT_EMAIL.replace(/"/g, '');
        const auth = new google.auth.GoogleAuth({ credentials: { client_email: clientEmail, private_key: key }, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
        const sheets = google.sheets({ version: 'v4', auth });
        let spreadsheetId = process.env.GOOGLE_SHEET_ID.replace(/"/g, '');

        console.log('[CLEAR] Clearing Raw Events...');
        await sheets.spreadsheets.values.clear({ spreadsheetId, range: "Raw Events!A2:W1000" });

        console.log('[APPEND] Appending test events...');
        for (const ev of mockEvents) {
            await googleSheetsService.appendEventRow(ev);
        }

        console.log('[DASHBOARD] Triggering populateDashboardSheet...');
        await googleSheetsService.populateDashboardSheet({ spreadsheets: sheets.spreadsheets }); // Mock the S object since populateDashboardSheet actually fetches it internally if passed correctly.
        // Wait, populateDashboardSheet() inside googleSheetsService uses its own sheets() call. It doesn't take 's' if we use the exported one.
        // Let's check googleSheetsService.exports.populateDashboardSheet = async () => { ... }
        await googleSheetsService.populateDashboardSheet();
        
        console.log('[SUCCESS] Execution completed.');
    } catch(err) {
        console.error(err);
    }
}
run();
