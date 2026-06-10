const db = require('./db');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../config.json');
const BACKUP_PATH = path.join(__dirname, '../backup_configs.json');

let metrics = { total: 0, ml: 0, heuristic: 0, uncertain: 0, rejection: 0, timestamp: Date.now() };
let runtimeFlags = { disableHeuristic: false, strictMode: false, lastAdjustment: 0 };

const monitorLog = (msg) => console.log(`[MONITOR] ${new Date().toISOString()} | ${msg}`);

const logThresholdChange = async (oldConf, newConf, rates, action) => {
    try {
        await db.query(
            'INSERT INTO voter_threshold_logs (old_low, old_high, new_low, new_high, fallback_rate, uncertainty_rate, action) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [oldConf.low_threshold, oldConf.high_threshold, newConf.low_threshold, newConf.high_threshold, rates.fallback, rates.uncertain, action]
        );
    } catch (e) { console.error('Failed to log threshold change:', e); }
};

const saveConfig = (config) => {
    // Keep last 5 in backup
    let history = [];
    if (fs.existsSync(BACKUP_PATH)) history = JSON.parse(fs.readFileSync(BACKUP_PATH));
    history.unshift(JSON.parse(fs.readFileSync(CONFIG_PATH)));
    fs.writeFileSync(BACKUP_PATH, JSON.stringify(history.slice(0, 5)));
    
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4));
};

const evaluateSystemHealth = async () => {
    if (metrics.total < 15) return;
    if (Date.now() - runtimeFlags.lastAdjustment < 420000) return; // 7-min cooldown

    const fRate = metrics.heuristic / metrics.total;
    const uRate = metrics.uncertain / metrics.total;
    const rRate = metrics.rejection / metrics.total;
    const rates = { fallback: fRate, uncertain: uRate, rejection: rRate };

    let config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const oldConfig = { ...config };
    let action = null;

    // --- MULTI-METRIC DECISION ENGINE ---
    
    // Pattern A: System Degradation (Falling ML precision)
    if (fRate > 0.30 && rRate > 0.20) {
        action = "tighten";
        config.low_threshold = Math.max(0.25, config.low_threshold - 0.03);
        config.high_threshold = Math.min(0.75, config.high_threshold + 0.03);
    } 
    // Pattern B: Environmental Noise (Blurry/Dark photos spike)
    else if (uRate > 0.35) {
        monitorLog("⚠️ Pattern Detected: Environmental Noise Spike. Enabling StrictMode.");
        runtimeFlags.strictMode = true;
    }
    // Pattern C: Healthy/Stable (Safe to Relax)
    else if (fRate < 0.12 && uRate < 0.12 && rRate < 0.10) {
        action = "relax";
        config.low_threshold = Math.min(0.4, config.low_threshold + 0.01);
        config.high_threshold = Math.max(0.6, config.high_threshold - 0.01);
    }

    // Pattern D: Suspicious (Declining hits but no uncertainty)
    if (fRate < 0.05 && metrics.total > 50 && rRate < 0.02) {
        monitorLog("🚩 SUSPICIOUS: Abnormally high success rate. Thresholds might be too loose.");
    }

    if (action && (config.low_threshold !== oldConfig.low_threshold || config.high_threshold !== oldConfig.high_threshold)) {
        if (config.low_threshold >= config.high_threshold) return;
        saveConfig(config);
        runtimeFlags.lastAdjustment = Date.now();
        await logThresholdChange(oldConfig, config, rates, action);
        monitorLog(`⚡ REACTION [${action.toUpperCase()}]: Low=${config.low_threshold}, High=${config.high_threshold} | metrics: F=${(fRate*100).toFixed(1)}% R=${(rRate*100).toFixed(1)}%`);
    }

    // Reset loop
    if (Date.now() - metrics.timestamp > 1200000) {
        metrics = { total: 0, ml: 0, heuristic: 0, uncertain: 0, rejection: 0, timestamp: Date.now() };
    }
};

setInterval(evaluateSystemHealth, 60000);

module.exports = {
    trackMetric: (type) => { metrics.total++; if (metrics[type] !== undefined) metrics[type]++; },
    runtimeFlags,
    getHealth: () => ({
        metrics,
        config: JSON.parse(fs.readFileSync(CONFIG_PATH)),
        flags: runtimeFlags
    })
};
