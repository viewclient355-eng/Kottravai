const supabase = require('../supabase');

/**
 * AI Production Metrics Utility
 * Aggregates logs from chat_audit_logs for operational monitoring.
 */
const getAIMetrics = async (timeframeHours = 24) => {
    try {
        const { data, error } = await supabase
            .from('chat_audit_logs')
            .select('*')
            .gte('created_at', new Date(Date.now() - timeframeHours * 60 * 60 * 1000).toISOString());

        if (error) throw error;

        const total = data.length;
        const latencyAvg = data.reduce((sum, log) => sum + log.latency_ms, 0) / total;
        const fallbacks = data.filter(log => log.fallback_used).length;
        const fallbackRate = (fallbacks / total) * 100;

        const confidenceStats = data.reduce((acc, log) => {
            acc[log.confidence_level] = (acc[log.confidence_level] || 0) + 1;
            return acc;
        }, {});

        return {
            period: `${timeframeHours}h`,
            total_queries: total,
            avg_latency_ms: Math.round(latencyAvg),
            fallback_rate: `${fallbackRate.toFixed(1)}%`,
            confidence_dist: confidenceStats
        };
    } catch (err) {
        console.error('Metrics Aggregation Failed:', err.message);
        return null;
    }
};

module.exports = { getAIMetrics };
