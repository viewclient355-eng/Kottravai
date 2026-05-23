const supabase = require('../supabase');

/**
 * Thozhi AI Retrieval Intelligence Engine (Phase 10)
 * Analyzes retrieval performance and similarity distributions.
 */
class RetrievalIntelligence {
    async analyzePerformance(days = 7) {
        const timeframe = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const { data: logs, error } = await supabase
            .from('chat_audit_logs')
            .select('*')
            .gte('created_at', timeframe);

        if (error || !logs) return null;

        const analysis = {
            semantic_gaps: this._discoverSemanticGaps(logs),
            similarity_distribution: this._analyzeSimilarity(logs),
            intent_analysis: this._analyzeIntents(logs),
            recommendations: []
        };

        return analysis;
    }

    _discoverSemanticGaps(logs) {
        // Find repeated queries with fallback or low confidence
        const failedQueries = logs.filter(l => l.fallback_used || l.confidence_level === 'LOW');
        const clusters = {};
        
        failedQueries.forEach(l => {
            const query = l.user_query.toLowerCase().trim();
            // Simple keyword clustering
            const keywords = ['gift', 'mix', 'healthy', 'bag', 'shipping', 'price', 'delivery'];
            keywords.forEach(k => {
                if (query.includes(k)) clusters[k] = (clusters[k] || 0) + 1;
            });
        });

        return Object.entries(clusters)
            .sort((a, b) => b[1] - a[1])
            .map(([topic, count]) => ({ topic, count, intensity: count > 10 ? 'HIGH' : 'MEDIUM' }));
    }

    _analyzeSimilarity(logs) {
        const scores = logs.map(l => l.quality_score || 0);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return {
            avg_quality_score: avg.toFixed(2),
            degradation_risk: avg < 0.5 ? 'HIGH' : 'LOW'
        };
    }

    _analyzeIntents(logs) {
        const intents = { discovery: 0, informational: 0, transactional: 0 };
        logs.forEach(l => {
            const q = l.user_query.toLowerCase();
            if (q.includes('where') || q.includes('how')) intents.informational++;
            else if (q.includes('buy') || q.includes('price')) intents.transactional++;
            else intents.discovery++;
        });
        return intents;
    }
}

module.exports = new RetrievalIntelligence();
