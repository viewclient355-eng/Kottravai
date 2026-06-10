const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const sheetsService = require('./services/googleSheetsService');

async function checkRawEvents() {
    try {
        await sheetsService.initializeGoogleSheets();
        console.log("Initialized Google Sheets.");
        
        // Let's get the auth client directly and fetch raw rows to bypass any internal logic
        const s = sheetsService.getSheetsClient();
        const response = await s.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID || '12-MmkBGEOaWjDDJP1r_2cEyWNYr3e-79v_pL5G4j1oQ',
            range: 'Raw Events!A1:Z5'
        });
        const values = response.data.values || [];
        if (values.length === 0) {
            console.log("No data found.");
            return;
        }
        console.log("ACTUAL HEADERS IN SHEET:");
        console.log(values[0]);

        console.log("\nSample Row 1:");
        console.log(values[1]);

    } catch (e) {
        console.error(e);
    }
}

checkRawEvents();
