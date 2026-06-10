const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const googleSheetsService = require('./services/googleSheetsService');

async function run() {
  try {
    console.log('Running diagnostic test...');
    const diag = await googleSheetsService.diagnosticTest();
    console.log(JSON.stringify(diag, null, 2));

    console.log('\n--- Fetching Raw Events ---');
    const { google } = require('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const s = google.sheets({ version: 'v4', auth });
    
    const response = await s.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Raw Events!A1:W'
    });
    
    const values = response.data.values || [];
    console.log(`Total rows (including header): ${values.length}`);
    
    if (values.length > 1) {
      const headers = values[0];
      const rows = values.slice(1);
      
      const eventTypes = {};
      rows.forEach(row => {
        const type = row[1]; // column B
        eventTypes[type] = (eventTypes[type] || 0) + 1;
      });
      console.log('Event Type Distribution:');
      console.log(JSON.stringify(eventTypes, null, 2));
      
      console.log('\nLast 20 rows:');
      const last20 = rows.slice(-20);
      last20.forEach(r => console.log(r.slice(0, 5).join(' | ')));
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
