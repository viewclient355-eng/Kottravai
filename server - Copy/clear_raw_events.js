const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { google } = require('googleapis');
const { validateAndRepairKey } = require('./utils/googleKeyValidator');
async function run() {
    let key = process.env.GOOGLE_PRIVATE_KEY || '';
    key = validateAndRepairKey(key);
    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL || '';
    if (clientEmail.startsWith('"')) clientEmail = clientEmail.slice(1, -1);
    const auth = new google.auth.GoogleAuth({ credentials: { client_email: clientEmail, private_key: key }, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth });
    let spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (spreadsheetId.startsWith('"')) spreadsheetId = spreadsheetId.slice(1, -1);
    
    // Clear everything below row 1
    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: "'Raw Events'!A2:Z10000"
    });
    console.log("Cleared Raw Events A2:Z10000");
}
run();
