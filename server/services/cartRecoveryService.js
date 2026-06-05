const { google } = require('googleapis');
const trackingUtils = require('../utils/trackingUtils');
const whatsappProvider = require('./whatsapp/provider');
const googleSheetsService = require('./googleSheetsService');

const IS_DRY_RUN = true; 

const VALIDATION_SHEET = 'Recovery Validation';
const PREVIEW_SHEET = 'Recovery Preview Queue';
const PERFORMANCE_SHEET = 'WhatsApp Recovery Performance';

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;
const MAX_LIVE_SENDS_PER_DAY = 10;

// Phase 5: A/B Templates
const TEMPLATES = [
  { name: 'Template A', weight: 40, strategy: 'Friendly Reminder', generate: (p) => `Hi there! We noticed you left ${p} in your cart. Still interested? Reply YES to continue.` },
  { name: 'Template B', weight: 40, strategy: 'Personalized Follow-Up', generate: (p) => `Hey! Your ${p} is flying off the shelves. We've saved it for you, but hurry back!` },
  { name: 'Template C', weight: 20, strategy: 'Discount Offer', generate: (p, c) => `Special offer just for you! Complete your purchase of ${p} using code ${c} for an exclusive discount.` }
];

function selectTemplateByWeight() {
  const rand = Math.random() * 100;
  if (rand < 40) return TEMPLATES[0];
  if (rand < 80) return TEMPLATES[1];
  return TEMPLATES[2];
}

function getConfidence(value, views) {
  if (value >= 1000 && views > 5) return 'High';
  if ((value >= 300 && value < 1000) || views > 3) return 'Medium';
  return 'Low';
}

function generateCoupon(cartValue, confidence) {
  if (cartValue >= 500 || confidence === 'High') {
    // Generate a simple mock coupon
    return 'SAVE' + Math.floor(Math.random() * 10 + 10);
  }
  return '';
}

async function runRecoveryJob() {
  console.log('[CART_RECOVERY] Starting Phase 5 Staged Recovery Job...');
  
  const s = await googleSheetsService.sheets();
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;

  // 1. Fetch current aggregation
  const agg = await googleSheetsService.getAggregations();
  
  // 2. Fetch existing Recovery History
  let existingLogs = [];
  try {
    const res = await s.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${VALIDATION_SHEET}!A2:Z` });
    existingLogs = res.data.values || [];
  } catch (e) {
    // ignore
  }

  const recoveryHistory = new Map();
  existingLogs.forEach(row => {
    const vId = row[0];
    const pName = row[1];
    const strat = row[5];
    const status = row[7];
    
    if (vId && pName) {
      const key = `${vId}_${pName}`;
      if (!recoveryHistory.has(key)) recoveryHistory.set(key, { attempts: 0, lastStrategy: null, recovered: false });
      const hist = recoveryHistory.get(key);
      hist.attempts += 1;
      hist.lastStrategy = strat;
      if (status === 'Recovered') hist.recovered = true;
    }
  });

  const now = Date.now();
  const validationRows = [];
  const previewRows = [];
  const performanceRows = [];
  let messagesSent = 0;

  // 3. Scan Active Carts
  for (const inst of agg.cartInstances) {
    const ageMs = now - inst.addedAt;
    const ageHours = ageMs / ONE_HOUR;
    
    const visitor = agg.visitorProfiles.find(v => v.visitorId === inst.visitorId);
    if (!visitor) continue;

    const phoneFound = visitor.phone ? visitor.phone : 'No';
    const confidence = getConfidence(inst.price, visitor.productViews);

    const key = `${inst.visitorId}_${inst.productId}`;
    const hist = recoveryHistory.get(key) || { attempts: 0, lastStrategy: null, recovered: false };

    // Validation Checks
    let status = 'Valid';
    let notes = '';
    
    const isInvalidPhone = phoneFound === 'No' || phoneFound.length < 10;

    if (inst.purchasedAt) {
      status = 'Purchased - Excluded';
      notes = 'User already purchased this item.';
    } else if (ageHours > (7 * 24)) {
      status = 'Old Cart - Excluded';
      notes = `Cart age is > 7 days (${Math.round(ageHours)}h).`;
    } else if (ageHours < 24) {
      status = 'Too Fresh - Excluded';
      notes = `Cart age is < 24 hours (${Math.round(ageHours)}h).`;
    } else if (hist.recovered) {
      status = 'Already Recovered - Excluded';
      notes = 'User recovered cart previously.';
    } else if (hist.attempts >= 2) {
      status = 'Max Attempts - Excluded';
      notes = 'Max 2 messages reached.';
    } else if (isInvalidPhone) {
      status = 'Missing Phone - Excluded';
      notes = 'No phone number captured.';
    } else {
      status = 'Sent';
      notes = 'Passed all validation checks.';
    }

    let strategy = 'None';
    let templateName = 'None';
    let couponCode = '';
    let msgBody = '';
    let sendStatus = 'Not Sent';

    // Phase 5 Logic - Only valid items get preview/sent
    if (status === 'Sent') {
      const template = selectTemplateByWeight();
      strategy = template.strategy;
      templateName = template.name;
      couponCode = generateCoupon(inst.price, confidence);
      msgBody = template.generate(inst.productId, couponCode); // Simplified using ID as name for mock

      let eligibleForSend = 'No';
      if (confidence === 'High' && inst.price >= 500 && ageHours >= 24 && ageHours <= 72) {
        eligibleForSend = 'Yes';
      }

      // Live Send Limiter Logic
      if (eligibleForSend === 'Yes' && messagesSent < MAX_LIVE_SENDS_PER_DAY && !IS_DRY_RUN) {
        // Attempt live send (Mocked to Queued per requirement when no provider)
        messagesSent++;
        sendStatus = 'Queued'; 
        console.log(`[WHATSAPP_MESSAGE_SENT] Template: ${templateName} | Cart: ${inst.price}`);
      } else {
        sendStatus = 'Preview Generated';
        console.log(`[RECOVERY_PREVIEW_GENERATED] Visitor: ${inst.visitorId} | Template: ${templateName}`);
      }

      // Add to Preview Queue
      previewRows.push([
        inst.visitorId,
        phoneFound,
        inst.productId,
        inst.price,
        Math.round(ageHours * 10) / 10,
        strategy,
        templateName,
        couponCode,
        msgBody,
        confidence,
        eligibleForSend,
        new Date().toISOString()
      ]);

      // Add to Performance Tracker if it triggered a phase action
      performanceRows.push([
        new Date().toISOString().substring(0, 10), // Date
        strategy,
        templateName,
        sendStatus,
        new Date().toISOString(), // Sent At
        '', // Recovered Order ID
        0,  // Recovered Revenue
        ''  // Recovery Time Hours
      ]);
    }

    // Always log to Validation Sheet for auditing
    validationRows.push([
      inst.visitorId,
      inst.productId,
      inst.price,
      Math.round(ageHours * 10) / 10,
      phoneFound,
      strategy,
      confidence,
      status,
      notes
    ]);
  }

  // 4. Update the Google Sheets
  if (validationRows.length > 0) {
    const ensureHeaders = async (sheetName, headersArray) => {
      try {
         await s.spreadsheets.values.update({
           spreadsheetId: SHEET_ID,
           range: `${sheetName}!A1:Z1`,
           valueInputOption: 'USER_ENTERED',
           requestBody: { values: [headersArray] }
         });
      } catch (e) {
         // ignore
      }
    };

    // Update Validation
    await ensureHeaders(VALIDATION_SHEET, ['Visitor ID', 'Product Name', 'Cart Value', 'Cart Age', 'Phone Number Found', 'Recovery Strategy', 'Recovery Confidence', 'Validation Status', 'Validation Notes']);
    await s.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${VALIDATION_SHEET}!A2:I`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: validationRows }
    });

    // Update Preview Queue
    if (previewRows.length > 0) {
      await ensureHeaders(PREVIEW_SHEET, ['Visitor ID', 'Phone Number', 'Product Name', 'Cart Value', 'Cart Age', 'Recovery Strategy', 'Template', 'Coupon Code', 'Generated Message', 'Confidence Score', 'Eligible For Send', 'Created At']);
      await s.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${PREVIEW_SHEET}!A2:L`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: previewRows }
      });
    }

    // Update Performance
    if (performanceRows.length > 0) {
      await ensureHeaders(PERFORMANCE_SHEET, ['Date', 'Recovery Strategy', 'Template', 'Status', 'Sent At', 'Recovered Order ID', 'Recovered Revenue', 'Recovery Time Hours']);
      await s.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${PERFORMANCE_SHEET}!A2:H`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: performanceRows }
      });
    }
  }

  console.log(`[RECOVERY_VALIDATION_COMPLETE] Phase 5 Execution completed. Preview Generated: ${previewRows.length} | Sent (Live): ${messagesSent}`);

  return {
    messagesSent,
    previewsGenerated: previewRows.length,
    validationRows,
    performanceRows
  };
}

module.exports = {
  runRecoveryJob
};
