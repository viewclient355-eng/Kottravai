const { google } = require('googleapis');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

if (PRIVATE_KEY && PRIVATE_KEY.includes('\\n')) {
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n');
}

if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  console.warn('⚠️ Google Sheets credentials missing. Tracking will fail until env is configured.');
}

const sheets = async () => {
  const auth = new google.auth.JWT(CLIENT_EMAIL, null, PRIVATE_KEY, ['https://www.googleapis.com/auth/spreadsheets']);
  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
};

const DEFAULT_RANGE = 'Analytics!A1:L';

function mapPayloadToRow(payload) {
  // Columns: Timestamp, Event Type, Page, Referrer, Browser, Device, Screen Size, User Agent, Session ID, UTM Source, UTM Medium, UTM Campaign
  return [
    payload.timestamp || new Date().toISOString(),
    payload.event_type || payload.event_name || 'unknown',
    payload.page || payload.page_url || '',
    payload.referrer || '',
    payload.browser || payload.browser_name || '',
    payload.device || payload.device_type || '',
    payload.screen_size || `${payload.screen_width || ''}x${payload.screen_height || ''}` ,
    payload.user_agent || payload.ua || '',
    payload.session_id || '',
    payload.utm_source || '',
    payload.utm_medium || '',
    payload.utm_campaign || ''
  ];
}

exports.appendEventRow = async (payload) => {
  const row = mapPayloadToRow(payload);
  const s = await sheets();
  return s.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: DEFAULT_RANGE,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] }
  });
};

exports.appendEventRows = async (payloads) => {
  const rows = payloads.map(mapPayloadToRow);
  const s = await sheets();
  return s.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: DEFAULT_RANGE,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows }
  });
};
