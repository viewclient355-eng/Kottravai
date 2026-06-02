const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { google } = require('googleapis');
const { validateAndRepairKey } = require('./utils/googleKeyValidator');

async function runAudit() {
    try {
        let key = validateAndRepairKey(process.env.GOOGLE_PRIVATE_KEY || '');
        let clientEmail = process.env.GOOGLE_CLIENT_EMAIL.replace(/"/g, '');
        const auth = new google.auth.GoogleAuth({ credentials: { client_email: clientEmail, private_key: key }, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
        const sheets = google.sheets({ version: 'v4', auth });
        let spreadsheetId = process.env.GOOGLE_SHEET_ID.replace(/"/g, '');

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Raw Events!A1:W1000"
        });

        const values = response.data.values || [];
        if (values.length === 0) {
            console.log("No data found in Raw Events.");
            return;
        }

        const actualHeaders = values[0];
        console.log("=== A. ACTUAL RAW EVENTS HEADER ROW ===");
        console.log(actualHeaders);

        function normalizeValue(value) {
            if (value === null || value === undefined) return '';
            return String(value).trim().toLowerCase();
        }

        const normalizedHeaders = actualHeaders.map(h => normalizeValue(h));
        
        console.log("\n=== B. COLUMN MAPPING USED ===");
        console.log("When googleSheetsService.js reads the sheet, it normalizes headers:");
        console.log(normalizedHeaders);
        console.log("\nHowever, buildAggregations() expects:");
        console.log("row['Timestamp'], row['Visitor ID'], row['Event Type'], etc.");
        
        const rows = values.slice(1).map(row => {
            const result = {};
            normalizedHeaders.forEach((header, index) => {
                result[header] = row[index] !== undefined ? row[index] : '';
            });
            return result;
        });

        console.log("\n=== E. SAMPLE PARSED EVENT OBJECT (What buildAggregations sees) ===");
        console.log(rows[0]);

        // Manually counting events from RAW data
        let eventDist = {
            page_view: 0,
            product_view: 0,
            category_view: 0,
            add_to_cart: 0,
            checkout_started: 0,
            guest_checkout_started: 0,
            otp_sent: 0,
            otp_verified: 0,
            purchase_completed: 0
        };

        let uniqueVisitors = new Set();
        let uniqueSessions = new Set();
        let totalRevenue = 0;

        values.slice(1).forEach(row => {
            // Find columns by their actual index to avoid the mapping bug in this manual count
            const eventTypeIdx = actualHeaders.findIndex(h => h.toLowerCase() === 'event type' || h === 'Event Type');
            const visitorIdx = actualHeaders.findIndex(h => h.toLowerCase() === 'visitor id' || h === 'Visitor ID');
            const sessionIdx = actualHeaders.findIndex(h => h.toLowerCase() === 'session id' || h === 'Session ID');
            const revenueIdx = actualHeaders.findIndex(h => h.toLowerCase() === 'order total' || h === 'Order Total');

            const eventType = row[eventTypeIdx];
            const visitorId = row[visitorIdx];
            const sessionId = row[sessionIdx];
            const revStr = row[revenueIdx];

            if (eventDist[eventType] !== undefined) {
                eventDist[eventType]++;
            } else if (eventType) {
                eventDist[eventType] = 1;
            }

            if (visitorId) uniqueVisitors.add(visitorId);
            if (sessionId) uniqueSessions.add(sessionId);
            
            if (eventType === 'purchase_completed' && revStr) {
                const revNum = parseFloat(revStr.replace(/[^0-9.-]+/g, ''));
                if (!isNaN(revNum)) totalRevenue += revNum;
            }
        });

        console.log("\n=== C. ACTUAL EVENT DISTRIBUTION (From raw sheet array) ===");
        console.log(eventDist);

        console.log("\n=== D. DIRECT RAW COUNTS ===");
        console.log("Unique Visitors: " + uniqueVisitors.size);
        console.log("Unique Sessions: " + uniqueSessions.size);
        console.log("Revenue Total: " + totalRevenue);
        
        console.log("\n=== CONCLUSION ===");
        console.log("The discrepancy is caused by the header normalization. fetchRawEventRows() converts headers to lowercase (e.g. 'timestamp'), but buildAggregations() is looking for Title Case keys (e.g. 'Timestamp'). This causes row['Timestamp'] to be undefined, and the row is skipped.");

    } catch (err) {
        console.error(err);
    }
}

runAudit();
