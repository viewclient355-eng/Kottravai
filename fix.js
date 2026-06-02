const fs = require('fs');
const file = 'server/services/googleSheetsService.js';
const content = fs.readFileSync(file, 'utf8');
const prefix = `const { google } = require('googleapis');
const { validateAndRepairKey } = require('../utils/googleKeyValidator');
const chartBuilder = require('./chartBuilder');

let SHEET_ID = process.env.GOOGLE_SHEET_ID;
let CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// Log credential status at startup with detailed validation
console.log('[GOOGLE_INIT] Checking credentials...');

// Clean CLIENT_EMAIL - remove leading/trailing spaces and quotes
if (CLIENT_EMAIL) {
  const originalEmail = CLIENT_EMAIL;
  CLIENT_EMAIL = CLIENT_EMAIL.trim();
`;
fs.writeFileSync(file, prefix + content);
