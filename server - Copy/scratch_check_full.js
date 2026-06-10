require('dotenv').config();
const { sheets } = require('./services/googleSheetsService');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function checkSheet() {
  const s = await sheets();
  const res = await s.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Visitor Intelligence!A1:Z50' });
  console.log("SHEET CONTENT:");
  console.log(res.data.values);
  process.exit(0);
}
checkSheet();
