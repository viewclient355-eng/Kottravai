const latencyWindow = [];
const windowSize = 50;

const monitor = {
    trackLatency(ms) {
        latencyWindow.push(ms);
        if (latencyWindow.length > windowSize) latencyWindow.shift();
    },

    getAverageLatency() {
        if (latencyWindow.length === 0) return 0;
        return (latencyWindow.reduce((a, b) => a + b, 0) / latencyWindow.length).toFixed(2);
    },

    checkAlerts(stats) {
        const alerts = [];
        if (stats.avgLatency > 5000) alerts.push("⚠️ High response latency detected");
        if (stats.fallbackRate > 0.4) alerts.push("⚠️ Fallback rate exceeding threshold (40%)");
        if (stats.failureSpike) alerts.push("🚨 Sudden spike in failed queries");
        return alerts;
    },

    getRollingStats() {
        return {
            avgLatency: this.getAverageLatency(),
            sampleSize: latencyWindow.length
        };
    }
};

module.exports = monitor;
