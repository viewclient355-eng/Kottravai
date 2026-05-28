const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const rateLimiter = require('../middleware/trackingRateLimiter');

// POST /api/track/event  -> track single event
router.post('/event', rateLimiter, trackingController.trackEvent);

// POST /api/track/batch  -> accept batch events for scalability
router.post('/batch', rateLimiter, trackingController.trackBatch);

// Health
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'tracking' }));

module.exports = router;
