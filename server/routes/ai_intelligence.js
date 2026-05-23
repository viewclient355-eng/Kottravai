const express = require('express');
const router = express.Router();
const optimizationAdvisor = require('../utils/optimizationAdvisor');
const retrievalIntelligence = require('../utils/retrievalIntelligence');

/**
 * Thozhi AI Intelligence Evolution Dashboard
 * Provides automated calibration and optimization guidance.
 */
router.get('/advisor', async (req, res) => {
    try {
        const report = await optimizationAdvisor.generateReport();
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: "Failed to generate optimization report" });
    }
});

router.get('/analysis', async (req, res) => {
    try {
        const analysis = await retrievalIntelligence.analyzePerformance();
        res.json(analysis);
    } catch (err) {
        res.status(500).json({ error: "Failed to analyze retrieval performance" });
    }
});

module.exports = router;
