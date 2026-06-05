require('dotenv').config();
const { populateDashboardSheet, getAggregations } = require('./services/googleSheetsService');
const dailyAnalyticsService = require('./services/dailyAnalyticsService');

async function testPhase6() {
  console.log('--- STARTING PHASE 6 COMMAND CENTER TEST ---');
  
  console.log('1. Rebuilding Dashboards to execute Phase 6 metrics...');
  await populateDashboardSheet();
  console.log('[TEST_PASSED] Dashboard Rebuild successful.');

  const agg = await getAggregations();
  if (agg.productRecommendationMetrics) {
    console.log('[TEST_PASSED] Aggregation payload maps correctly.');
  } else {
    console.error('[TEST_FAILED] Aggregation missing productRecommendationMetrics.');
  }

  console.log('\n2. Generating Daily Executive Brief...');
  const summary = await dailyAnalyticsService.generateDailyAnalyticsSummary(new Date());
  
  if (summary.executiveBrief) {
    console.log('[TEST_PASSED] Executive Morning Brief populated in daily digest.');
    console.log(summary.executiveBrief);
  } else {
    console.error('[TEST_FAILED] Missing Executive Morning Brief!');
  }
  
  console.log('\nTest complete!');
}

testPhase6().catch(console.error);
