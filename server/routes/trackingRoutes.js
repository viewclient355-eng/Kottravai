const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const googleSheetsService = require('../services/googleSheetsService');
const rateLimiter = require('../middleware/trackingRateLimiter');

// POST /api/track/event  -> track single event
router.post('/event', rateLimiter, trackingController.trackEvent);

// POST /api/track/batch  -> accept batch events for scalability
router.post('/batch', rateLimiter, trackingController.trackBatch);

// GET /api/track/test  -> diagnostic test for Google Sheets integration
router.get('/test', async (req, res) => {
  try {
    const result = await googleSheetsService.diagnosticTest();
    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
});

// GET /api/track/google-test  -> explicit Google Sheets connection test endpoint
router.get('/google-test', async (req, res) => {
  try {
    const result = await googleSheetsService.diagnosticTest();
    const metadataStep = result.steps.find(s => s.name === 'spreadsheet_metadata');
    const analyticsStep = result.steps.find(s => s.name === 'analytics_sheet_check');

    res.json({
      success: result.success,
      spreadsheet: metadataStep?.details?.title || null,
      spreadsheetId: metadataStep?.details?.id || null,
      sheet: analyticsStep?.details?.title || 'Analytics',
      sheet_shared: metadataStep?.details?.sheet_shared || false,
      details: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
});

// GET /api/track/dashboard/update -> create or refresh dashboard formulas
router.get('/dashboard/update', async (req, res) => {
  try {
    await googleSheetsService.populateDashboardSheet();
    res.json({ success: true, dashboardUpdated: true });
  } catch (err) {
    console.error('[DASHBOARD_UPDATE_ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Diagnostics
router.get('/health', trackingController.health);
router.get('/config', trackingController.config);
router.get('/last-write', trackingController.lastWrite);
router.post('/test-write', trackingController.testWrite);

module.exports = router;
