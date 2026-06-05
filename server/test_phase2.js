require('dotenv').config();
const { sheets, fetchRawEventRows } = require('./services/googleSheetsService');
const googleSheetsService = require('./services/googleSheetsService');
const trackingUtils = require('./utils/trackingUtils');
const cartRecoveryService = require('./services/cartRecoveryService');
const { generateDailyAnalyticsSummary } = require('./services/dailyAnalyticsService');
const { buildDailyAnalyticsEmail } = require('./services/dailyEmailTemplate');

async function testPhase2() {
  const s = await sheets();
  console.log('Sending mock events...');

  const mockPayloads = [
    {
      visitor_id: 'test_phase2_vis_1', session_id: 'sess_1',
      event_type: 'product_view', product_id: 'PROD_1', product_name: 'Premium Lamp', price: 1500,
      utm_source: 'instagram', utm_medium: 'story', utm_campaign: 'summer_sale_2026', utm_content: 'ad_1', utm_term: 'lamp',
      phone: '9876543210'
    },
    {
      visitor_id: 'test_phase2_vis_1', session_id: 'sess_1',
      event_type: 'add_to_cart', product_id: 'PROD_1', product_name: 'Premium Lamp', price: 1500,
      utm_source: 'instagram', utm_medium: 'story', utm_campaign: 'summer_sale_2026', utm_content: 'ad_1', utm_term: 'lamp',
      phone: '9876543210'
    },
    // Abandoned cart, wait... we need it to be 24h old to test recovery
    {
      visitor_id: 'test_phase2_vis_2', session_id: 'sess_2',
      event_type: 'product_view', product_id: 'PROD_2', product_name: 'Vase', price: 800,
      utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'search_decor', utm_content: 'text_ad', utm_term: 'ceramic vase'
    },
    {
      visitor_id: 'test_phase2_vis_2', session_id: 'sess_2',
      event_type: 'add_to_cart', product_id: 'PROD_2', product_name: 'Vase', price: 800,
      utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'search_decor', utm_content: 'text_ad', utm_term: 'ceramic vase'
    },
    {
      visitor_id: 'test_phase2_vis_2', session_id: 'sess_2',
      event_type: 'purchase_completed', product_id: 'PROD_2', product_name: 'Vase', price: 800, order_total: 800,
      utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'search_decor', utm_content: 'text_ad', utm_term: 'ceramic vase'
    }
  ];

  const now = new Date();
  const past25h = new Date(now.getTime() - (25 * 60 * 60 * 1000));

  const finalPayloads = [];
  for (const p of mockPayloads) {
    p.timestamp = p.visitor_id === 'test_phase2_vis_1' ? past25h.toISOString() : now.toISOString();
    finalPayloads.push(trackingUtils.sanitizeTrackingPayload(p));
  }
  
  await googleSheetsService.appendEventRows(finalPayloads);

  console.log('Running Dashboard Build to create missing sheets...');
  await googleSheetsService.populateDashboardSheet();

  console.log('Running Cart Recovery Job...');
  await cartRecoveryService.runRecoveryJob();

  console.log('Generating Daily Analytics...');
  const summary = await generateDailyAnalyticsSummary();
  const emailHtml = buildDailyAnalyticsEmail(summary);
  console.log('Email Length:', emailHtml.length);
  if(summary.campaignPerformance) console.log('Campaign Performance:', summary.campaignPerformance);

  console.log('Test complete!');
}

testPhase2().catch(console.error);
