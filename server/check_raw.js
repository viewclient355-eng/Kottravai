const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { google } = require('googleapis');

async function getHeaders() {
    let CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL.trim();
    if (CLIENT_EMAIL.startsWith('"') && CLIENT_EMAIL.endsWith('"')) CLIENT_EMAIL = CLIENT_EMAIL.slice(1, -1);
    
    let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
    if (PRIVATE_KEY) {
        if (PRIVATE_KEY.startsWith('"') && PRIVATE_KEY.endsWith('"')) PRIVATE_KEY = PRIVATE_KEY.slice(1, -1);
        PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
        credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const s = google.sheets({ version: 'v4', auth });
    
    const response = await s.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Raw Events!A1:Z5'
    });
    
    console.log(response.data.values[0]);
}

getHeaders().catch(console.error);
