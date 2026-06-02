const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { google } = require('googleapis');
const { validateAndRepairKey } = require('./utils/googleKeyValidator');
const googleSheetsService = require('./services/googleSheetsService');

async function run() {
    try {
        let key = validateAndRepairKey(process.env.GOOGLE_PRIVATE_KEY || '');
        let clientEmail = process.env.GOOGLE_CLIENT_EMAIL.replace(/"/g, '');
        const auth = new google.auth.GoogleAuth({ credentials: { client_email: clientEmail, private_key: key }, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
        const sheets = google.sheets({ version: 'v4', auth });
        let spreadsheetId = process.env.GOOGLE_SHEET_ID.replace(/"/g, '');

        console.log('[CLEAR] Clearing Dummy Events from Raw Events sheet...');
        await sheets.spreadsheets.values.clear({ spreadsheetId, range: "Raw Events!A2:W1000" });

        console.log('[DASHBOARD] Updating Dashboard Sheet to reset values...');
        await googleSheetsService.populateDashboardSheet();
        
        console.log('[SUCCESS] Dummy data cleared. The site will now log real data to the sheet as users visit it.');
    } catch(err) {
        console.error(err);
    }
}
run();
