const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { google } = require('googleapis');
const { validateAndRepairKey } = require('./utils/googleKeyValidator');
async function run() {
    let key = validateAndRepairKey(process.env.GOOGLE_PRIVATE_KEY || '');
    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL.replace(/"/g, '');
    const auth = new google.auth.GoogleAuth({ credentials: { client_email: clientEmail, private_key: key }, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth });
    let spreadsheetId = process.env.GOOGLE_SHEET_ID.replace(/"/g, '');
    
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Raw Events'!A1:Z100" });
    res.data.values.forEach((r, i) => console.log(i, r[0], r[1], r[14]));
}
run();
