const express = require('express');
const router = express.Router();
const chatAnalytics = require('../services/chatAnalytics');

// Middleware to parse dates
const dateFilter = (req, res, next) => {
    req.startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    req.endDate = req.query.endDate || new Date().toISOString();
    next();
};

router.use(dateFilter);

router.get('/overview', async (req, res) => {
    try {
        const stats = await chatAnalytics.getOverview(req.startDate, req.endDate);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/failures', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const failures = await chatAnalytics.getFailures(req.startDate, req.endDate, limit, offset);
        res.json(failures);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/trending', async (req, res) => {
    try {
        const trending = await chatAnalytics.getTrending(req.startDate, req.endDate);
        res.json(trending);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/conversions', async (req, res) => {
    try {
        const conversions = await chatAnalytics.getConversions(req.startDate, req.endDate);
        res.json(conversions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/revenue', async (req, res) => {
    try {
        const revenue = await chatAnalytics.getRevenue(req.startDate, req.endDate);
        res.json(revenue);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/track-conversion', async (req, res) => {
    try {
        const { sessionId, eventType, productId, category, orderId, revenue } = req.body;
        await chatAnalytics.logConversion({
            sessionId,
            eventType,
            productId,
            category,
            orderId,
            revenue
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Backward compatibility
router.get('/metrics', async (req, res) => {
    try {
        const stats = await chatAnalytics.getOverview(req.startDate, req.endDate);
        res.json({
            operational_health: {
                avg_latency: stats.avg_latency ? stats.avg_latency.toFixed(0) + 'ms' : '0ms',
                fallback_rate: (stats.fallback_rate * 100).toFixed(2) + '%'
            },
            business_impact: {
                total_conversations: stats.total_conversations,
                total_conversions: stats.total_conversions
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
