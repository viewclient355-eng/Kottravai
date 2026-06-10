// test_phase5.js
require('dotenv').config();
const { runRecoveryJob } = require('./services/cartRecoveryService');
const { getAggregations, populateDashboardSheet } = require('./services/googleSheetsService');
const dailyAnalyticsService = require('./services/dailyAnalyticsService');

async function testPhase5() {
  console.log('--- STARTING PHASE 5 WHATSAPP AUTOMATION TEST ---');
  
  // Force dashboard rebuild to read mock events
  console.log('Rebuilding Dashboards to execute Phase 5 metrics...');
  await populateDashboardSheet();
  
  // Run Recovery Job (Should limit live sends to 10 and dump rest to preview)
  const recoveryResults = await runRecoveryJob();
  
  console.log('\n--- RECOVERY PIPELINE RESULTS ---');
  console.log(`Live Sends (Queued): ${recoveryResults.messagesSent}`);
  console.log(`Preview Queue Generated: ${recoveryResults.previewsGenerated}`);
  console.log(`Total Handled Carts: ${recoveryResults.validationRows.length}`);

  if (recoveryResults.messagesSent <= 10) {
    console.log('[TEST_PASSED] Limited Production safety cap working (<= 10).');
  } else {
    console.error('[TEST_FAILED] Safety cap breached! Sent: ' + recoveryResults.messagesSent);
  }

  // Force Daily Analytics Email generation to see new KPI section
  console.log('\n--- MOCKING DAILY EMAIL ---');
  const summary = await dailyAnalyticsService.generateDailyAnalyticsSummary(new Date());
  
  if (summary.whatsappRecoverySummary) {
    console.log('[TEST_PASSED] WhatsApp Recovery Summary populated in daily digest.');
    console.log(summary.whatsappRecoverySummary);
  } else {
    console.error('[TEST_FAILED] Missing WhatsApp Recovery Summary!');
  }
  
  console.log('\nTest complete!');
}

testPhase5().catch(console.error);
