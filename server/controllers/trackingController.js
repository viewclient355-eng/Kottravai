const googleSheetsService = require('../services/googleSheetsService');
const { sanitizeTrackingPayload, hashEvent } = require('../utils/trackingUtils');
const NodeCache = require('node-cache');

// In-memory duplicate prevention cache (short TTL)
const recentEvents = new NodeCache({ stdTTL: 60, checkperiod: 30 });

const REQUIRED_FIELDS = ['event_type', 'page', 'timestamp', 'session_id'];

exports.trackEvent = async (req, res) => {
  try {
    const payload = sanitizeTrackingPayload(req.body || {});

    for (const f of REQUIRED_FIELDS) {
      if (!payload[f]) return res.status(400).json({ error: `Missing required field ${f}` });
    }

    // Duplicate prevention
    const h = hashEvent(payload);
    if (recentEvents.get(h)) {
      return res.status(200).json({ status: 'duplicate_ignored' });
    }
    recentEvents.set(h, true);

    await googleSheetsService.appendEventRow(payload);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('❌ [TRACKING_ERROR]:', err.message);
    res.status(500).json({ error: 'tracking_failed' });
  }
};

exports.trackBatch = async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : (req.body.events || []);
    if (!events.length) return res.status(400).json({ error: 'No events provided' });

    const rows = [];
    for (const raw of events) {
      const payload = sanitizeTrackingPayload(raw || {});
      const h = hashEvent(payload);
      if (recentEvents.get(h)) continue;
      recentEvents.set(h, true);
      rows.push(payload);
    }

    if (!rows.length) return res.json({ status: 'no_new_events' });
    await googleSheetsService.appendEventRows(rows);
    res.json({ status: 'ok', appended: rows.length });
  } catch (err) {
    console.error('❌ [TRACKING_BATCH_ERROR]:', err.message);
    res.status(500).json({ error: 'batch_tracking_failed' });
  }
};
