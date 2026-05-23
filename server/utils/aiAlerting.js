const supabase = require('../supabase');

/**
 * AI Anomaly Detection Engine
 * Monitors recent logs for performance degradation.
 */
async function runAnomalyCheck() {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

        // 1. Fetch last hour logs
        const { data: logs, error } = await supabase
            .from('chat_audit_logs')
            .select('fallback_used, confidence_level, latency_ms')
            .gte('created_at', oneHourAgo);

        if (error) throw error;
        if (logs.length < 5) return; // Not enough data for anomaly detection

        const fallbackRate = logs.filter(l => l.fallback_used).length / logs.length;
        const lowConfidenceRate = logs.filter(l => l.confidence_level === 'LOW').length / logs.length;
        const avgLatency = logs.reduce((acc, l) => acc + l.latency_ms, 0) / logs.length;

        // 2. Intelligence Thresholds
        if (fallbackRate > 0.4) {
            console.error(`🚨 ANOMALY: High Fallback Rate Detected (${(fallbackRate * 100).toFixed(1)}%)`);
            // Here we would trigger a Slack/Email alert
        }

        if (avgLatency > 5000) {
            console.warn(`⚠️ ANOMALY: High Latency Detected (${avgLatency.toFixed(0)}ms)`);
        }

        if (lowConfidenceRate > 0.6) {
            console.info(`💡 CALIBRATION: High Low-Confidence Rate. Consider expanding product metadata or adjusting thresholds.`);
        }

    } catch (err) {
        console.error("Anomaly Check Failed:", err.message);
    }
}

// Run every 15 minutes
setInterval(runAnomalyCheck, 15 * 60 * 1000);

module.exports = { runAnomalyCheck };
