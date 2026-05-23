const db = require('./db');

let ragMetrics = {
    total_queries: 0,
    high_confidence: 0,
    medium_confidence: 0,
    low_confidence: 0,
    fallbacks: 0,
    avg_latency: 0,
    errors: 0,
    timestamp: Date.now()
};

/**
 * Tracks a RAG interaction for real-time observability.
 */
function trackRagInteraction(data) {
    ragMetrics.total_queries++;
    
    if (data.confidence_level === 'HIGH') ragMetrics.high_confidence++;
    else if (data.confidence_level === 'MEDIUM') ragMetrics.medium_confidence++;
    else ragMetrics.low_confidence++;

    if (data.fallback_used) ragMetrics.fallbacks++;
    if (data.error) ragMetrics.errors++;

    // Rolling average for latency
    ragMetrics.avg_latency = (ragMetrics.avg_latency * (ragMetrics.total_queries - 1) + data.latency_ms) / ragMetrics.total_queries;

    // Reset metrics every 1 hour to keep them relevant to current traffic
    if (Date.now() - ragMetrics.timestamp > 3600000) {
        ragMetrics = {
            total_queries: 0,
            high_confidence: 0,
            medium_confidence: 0,
            low_confidence: 0,
            fallbacks: 0,
            avg_latency: 0,
            errors: 0,
            timestamp: Date.now()
        };
    }
}

function getRagHealth() {
    const successRate = ragMetrics.total_queries > 0 
        ? ((ragMetrics.total_queries - ragMetrics.errors) / ragMetrics.total_queries * 100).toFixed(2) 
        : 100;
        
    const qualityScore = ragMetrics.total_queries > 0
        ? ((ragMetrics.high_confidence * 1.0 + ragMetrics.medium_confidence * 0.5) / ragMetrics.total_queries * 100).toFixed(2)
        : 100;

    return {
        ...ragMetrics,
        success_rate: `${successRate}%`,
        quality_score: `${qualityScore}%`,
        status: successRate > 95 ? 'healthy' : (successRate > 80 ? 'degraded' : 'critical')
    };
}

module.exports = {
    trackRagInteraction,
    getRagHealth
};
