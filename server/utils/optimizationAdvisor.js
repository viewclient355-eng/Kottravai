const retrievalIntelligence = require('./retrievalIntelligence');

/**
 * Thozhi AI Optimization Advisor (Phase 10)
 * Generates human-readable calibration recommendations.
 */
class OptimizationAdvisor {
    async generateReport() {
        const analysis = await retrievalIntelligence.analyzePerformance();
        if (!analysis) return { error: "Insufficient data" };

        const recommendations = [];

        // 1. Threshold Recommendations
        if (parseFloat(analysis.similarity_distribution.avg_quality_score) < 0.6) {
            recommendations.push({
                type: 'THRESHOLD',
                action: 'DECREASE',
                reason: 'Average quality score is below target (0.6). Users are seeing too many fallbacks.',
                suggested_value: 0.28
            });
        }

        // 2. Metadata Enrichment
        analysis.semantic_gaps.filter(g => g.intensity === 'HIGH').forEach(gap => {
            recommendations.push({
                type: 'METADATA',
                action: 'ENRICH',
                topic: gap.topic,
                reason: `High volume of failed queries detected for topic: "${gap.topic}"`,
                example: `Add synonyms like "${gap.topic} gift set" or "${gap.topic} for children"`
            });
        });

        // 3. Synonym Additions
        if (analysis.intent_analysis.discovery > analysis.intent_analysis.transactional * 2) {
            recommendations.push({
                type: 'RANKING',
                action: 'OPTIMIZE_DISCOVERY',
                reason: 'Users are primarily in discovery phase. Recommend increasing variety in top-K results.'
            });
        }

        return {
            status: 'success',
            timestamp: new Date().toISOString(),
            recommendations
        };
    }
}

module.exports = new OptimizationAdvisor();
