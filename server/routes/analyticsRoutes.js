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

module.exports = router;
