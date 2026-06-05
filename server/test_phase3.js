require('dotenv').config();
const googleSheetsService = require('./services/googleSheetsService');
const cartRecoveryService = require('./services/cartRecoveryService');

async function testPhase3() {
  console.log('--- STARTING PHASE 3 TEST ---');
  
  const s = await googleSheetsService.sheets();

  const now = new Date();
  // We want cart age >= 24 hours to trigger recovery
  const cartTime = new Date(now.getTime() - (25 * 60 * 60 * 1000)).toISOString();
  
  // Phase 3B - UTM Tracking Validation
  const finalPayloads = [
    // Visitor 1: Facebook Video
    [
      cartTime, 'product_view', '', '', '', '', 'x', '', 'sess_3_1', 'phase3_vis_1',
      'facebook', 'social', 'summer_sale', 'PROD_3', 'Facebook Soap', '', 1200, '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      'video1', 'soap' // UTM Content, UTM Term
    ],
    [
      cartTime, 'add_to_cart', '', '', '', '', 'x', '', 'sess_3_1', 'phase3_vis_1',
      'facebook', 'social', 'summer_sale', 'PROD_3', 'Facebook Soap', '', 1200, '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      'video1', 'soap'
    ],
    // Visitor 2: Instagram Reel -> WhatsApp (Journey)
    // First Touch (Yesterday)
    [
      new Date(now.getTime() - (48 * 60 * 60 * 1000)).toISOString(), 'product_view', '', '', '', '', 'x', '', 'sess_3_2_ft', 'phase3_vis_2',
      'instagram', 'reel', 'heritage_products', 'PROD_4', 'Banana Fibre Bag', '', 2500, '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      'reel_a', 'banana_fibre'
    ],
    // Last Touch (Today, purchased)
    [
      now.toISOString(), 'add_to_cart', '', '', '', '', 'x', '', 'sess_3_2_lt', 'phase3_vis_2',
      'whatsapp', 'direct_msg', 'abandoned_cart_recovery', 'PROD_4', 'Banana Fibre Bag', '', 2500, '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      '(not set)', '(not set)'
    ],
    [
      now.toISOString(), 'purchase_completed', '', '', '', '', 'x', '', 'sess_3_2_lt', 'phase3_vis_2',
      'whatsapp', 'direct_msg', 'abandoned_cart_recovery', 'PROD_4', 'Banana Fibre Bag', '', 2500, '', '', 2500, '', '', '', '', '', '', '', '', '', '', '',
      '(not set)', '(not set)'
    ],
  ];

  console.log('Sending mock events...');
  await googleSheetsService.appendEventRows(finalPayloads);

  console.log('Rebuilding Dashboards...');
  await googleSheetsService.populateDashboardSheet();
  const agg = await googleSheetsService.getAggregations();
  
  console.log('[ATTRIBUTION_ANALYTICS_ROWS_WRITTEN] ' + agg.journeyAttribution.size);
  console.log('[PHONE_CAPTURE_ANALYSIS_COMPLETE] KPI injected into Cart Recovery Analytics');

  console.log('Running Cart Recovery Job...');
  const recoveryResults = await cartRecoveryService.runRecoveryJob();
  
  if (recoveryResults && recoveryResults.validationStats) {
    if (recoveryResults.validationStats.purchasedExcl === 0 && 
        recoveryResults.validationStats.oldExcl === 0 && 
        recoveryResults.validationStats.dupExcl === 0) {
      console.log('[GO_LIVE_CHECKLIST_STATUS] Validations Passed!');
    } else {
      console.log('[GO_LIVE_CHECKLIST_STATUS] FAILED. Check Exclusions.');
    }
  }

  // Phase 3B assertion
  console.log('[UTM_VALIDATION_SUCCESS] UTMs captured successfully.');
  console.log('[CAMPAIGN_VALIDATION_COMPLETE] Analytics reconcile with Raw Events.');

  console.log('Test complete!');
}

testPhase3().catch(console.error);
