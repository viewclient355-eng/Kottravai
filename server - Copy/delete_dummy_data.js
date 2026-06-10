require('dotenv').config();
const { google } = require('googleapis');

async function deleteDummyData() {
  try {
    let rawKey = process.env.GOOGLE_PRIVATE_KEY;
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) rawKey = rawKey.slice(1, -1);
    const privateKey = rawKey.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
    
    console.log('Fetching sheet metadata...');
    const sheetMeta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });
    const rawEventsSheet = sheetMeta.data.sheets.find(s => s.properties.title === 'Raw Events');
    const sheetId = rawEventsSheet.properties.sheetId;

    console.log('Fetching rows...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Raw Events!A:Z',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found.');
      return;
    }

    const header = rows[0];
    console.log('Header:', header);
    const productIdx = header.indexOf('Product Name');
    console.log('Product Idx:', productIdx);

    console.log('First data row:', rows[1]);
    
    // We iterate backwards to delete rows without messing up the indices
    const requests = [];
    for (let i = rows.length - 1; i >= 1; i--) {
      const row = rows[i];
      const prodName = row[productIdx] ? row[productIdx].toLowerCase() : '';
      if (prodName === 'vase' || prodName === 'shaktimaan' || prodName === 'testing' || prodName === '(not set)') {
        requests.push({
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: i,
              endIndex: i + 1
            }
          }
        });
      }
    }

    if (requests.length === 0) {
      console.log('No dummy data found.');
      return;
    }

    console.log(`Deleting ${requests.length} dummy rows...`);
    // Execute batch update
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: requests
      }
    });

    console.log(`Deleted ${requests.length} dummy rows (Vase, etc.) from Raw Events sheet.`);
  } catch (err) {
    console.error('Error deleting dummy data:', err);
  }
}

deleteDummyData();
