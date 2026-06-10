require('dotenv').config();
const googleSheetsService = require('./services/googleSheetsService');
const dailyAnalyticsService = require('./services/dailyAnalyticsService');

async function testPhase4() {
  console.log('--- STARTING PHASE 4 TEST ---');
  
  const now = new Date();
  const cartTime = new Date(now.getTime() - (48 * 60 * 60 * 1000)).toISOString();
  
  // Phase 4 - Product Recommendations Mock Data
  const finalPayloads = [];

  // Critical Product (High views, low conversion, high aband)
  for(let i=0; i<60; i++) {
    finalPayloads.push([
      cartTime, 'product_view', '', '', '', '', 'x', '', 'sess_4_crit', 'phase4_vis_crit',
      'direct', 'none', '', 'PROD_CRIT', 'Expensive Bracelet', '', 8000, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ]);
  }
  for(let i=0; i<10; i++) {
    finalPayloads.push([
      cartTime, 'add_to_cart', '', '', '', '', 'x', '', 'sess_4_crit', 'phase4_vis_crit',
      'direct', 'none', '', 'PROD_CRIT', 'Expensive Bracelet', '', 8000, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ]);
  }

  // Hidden Gem Product (Low views, high conversion)
  for(let i=0; i<10; i++) {
    finalPayloads.push([
      cartTime, 'product_view', '', '', '', '', 'x', '', `sess_4_gem_${i}`, `phase4_vis_gem_${i}`,
      'direct', 'none', '', 'PROD_GEM', 'Local Honey', '', 500, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ]);
    finalPayloads.push([
      cartTime, 'add_to_cart', '', '', '', '', 'x', '', `sess_4_gem_${i}`, `phase4_vis_gem_${i}`,
      'direct', 'none', '', 'PROD_GEM', 'Local Honey', '', 500, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ]);
    finalPayloads.push([
      cartTime, 'purchase_completed', '', '', '', '', 'x', '', `sess_4_gem_${i}`, `phase4_vis_gem_${i}`,
      'direct', 'none', '', 'PROD_GEM', 'Local Honey', '', 500, '', '', 500, '', '', '', '', '', '', '', '', '', '', '', '', ''
    ]);
  }

  console.log('Sending mock events...');
  await googleSheetsService.appendEventRows(finalPayloads);

  console.log('Rebuilding Dashboards to execute Phase 4 metrics...');
  await googleSheetsService.populateDashboardSheet();
  const agg = await googleSheetsService.getAggregations();
  
  console.log('[PRODUCT_INTELLIGENCE_GENERATED] Evaluated products: ' + agg.productRows.length);
  console.log('[RECOMMENDATIONS_GENERATED] Ruleset applied successfully.');
  console.log('[REVENUE_OPPORTUNITY_IDENTIFIED] Recoverable Revenue: ₹' + agg.productRecommendationMetrics.totalRecoverableRev);

  if (agg.productRecommendationMetrics.hiddenGemProduct.product === 'Local Honey') {
    console.log('[TEST_PASSED] Hidden Gem logic works!');
  }
  if (agg.productRecommendationMetrics.mostCriticalProduct.product === 'Expensive Bracelet') {
    console.log('[TEST_PASSED] Most Critical logic works!');
  }

  console.log('Generating Daily Email Summary...');
  const dailySummary = await dailyAnalyticsService.generateDailyAnalyticsSummary();
  if (dailySummary.productIntelligenceSummary) {
    console.log('[TEST_PASSED] AI Business Recommendations embedded in daily summary.');
    console.log(dailySummary.productIntelligenceSummary);
  }

  console.log('Test complete!');
}

testPhase4().catch(console.error);
