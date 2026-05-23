const express = require('express');
const router = express.Router();
const userPreferenceService = require('../services/userPreferenceService');

// Internal Admin-Only APIs
router.get('/top-categories', async (req, res) => {
    try {
        const stats = await userPreferenceService.getTopCategories();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/trending-interests', async (req, res) => {
    try {
        const trending = await userPreferenceService.getTrendingInterests();
        res.json(trending);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/conversion-patterns', async (req, res) => {
    try {
        const patterns = await userPreferenceService.getConversionPatterns();
        res.json(patterns);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
