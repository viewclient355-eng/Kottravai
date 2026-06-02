const googleSheetsService = require('../services/googleSheetsService');
const { sanitizeTrackingPayload, hashEvent } = require('../utils/trackingUtils');
const NodeCache = require('node-cache');

// In-memory duplicate prevention cache (short TTL)
const recentEvents = new NodeCache({ stdTTL: 60, checkperiod: 30 });

const REQUIRED_FIELDS = ['event_type', 'page', 'timestamp', 'session_id'];

exports.trackEvent = async (req, res) => {
  try {
    console.log('[TRACKING_EVENT_RECEIVED] Event received:', req.body?.event_type);
    const payload = sanitizeTrackingPayload(req.body || {});
    
    // Enrich payload with server-side network data
    payload.ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    payload.ip_location = req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || 'Unknown';

    for (const f of REQUIRED_FIELDS) {
      if (!payload[f]) {
          console.warn(`[TRACKING_ERROR] Missing required field ${f}`);
          return res.status(200).json({ status: 'ok' }); // Always return success to business flow
      }
    }

    // Duplicate prevention
    const h = hashEvent(payload);
    if (recentEvents.get(h)) {
      return res.status(200).json({ status: 'duplicate_ignored' });
    }
    recentEvents.set(h, true);

    console.log('[TRACK_EVENT_RECEIVED]', payload);

    await googleSheetsService.appendEventRow(payload);

    console.log('[RAW_EVENT_WRITTEN]', {
      eventType: payload.event_type,
      page: payload.page,
      visitorId: payload.visitor_id
    });

    setImmediate(() => {
      googleSheetsService
        .populateDashboardSheet()
        .catch(err =>
          console.error('[DASHBOARD_REFRESH_ERROR]', err)
        );
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error("[TRACKING_ERROR]", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.trackBatch = async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : (req.body.events || []);
    if (!events.length) return res.status(400).json({ error: 'No events provided' });

    console.log(`[TRACKING_EVENT_RECEIVED] Batch received with ${events.length} events`);

    const rows = [];
    for (const raw of events) {
      const payload = sanitizeTrackingPayload(raw || {});
      
      // Enrich payload with server-side network data
      payload.ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      payload.ip_location = req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || 'Unknown';
      
      const h = hashEvent(payload);
      if (recentEvents.get(h)) continue;
      recentEvents.set(h, true);
      rows.push(payload);
    }

    if (!rows.length) return res.json({ status: 'no_new_events' });
    
    console.log('[TRACK_BATCH_RECEIVED]', { count: rows.length });

    await googleSheetsService.appendEventRows(rows);

    console.log('[RAW_BATCH_WRITTEN]', { count: rows.length });

    setImmediate(() => {
      googleSheetsService
        .populateDashboardSheet()
        .catch(err =>
          console.error('[DASHBOARD_REFRESH_ERROR]', err)
        );
    });
    
    res.json({ success: true, appended: rows.length });
  } catch (err) {
    console.error('❌ [TRACKING_BATCH_ERROR]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.health = async (req, res) => {
    try {
        const diag = await googleSheetsService.diagnosticTest();
        const rawEventsStep = diag.steps.find(s => s.name === 'raw_events_sheet_check');
        const authStep = diag.steps.find(s => s.name === 'authentication');
        const config = googleSheetsService.getConfig();
        
        res.json({
            success: true,
            spreadsheetConnected: authStep?.status === 'PASSED',
            rawEventsSheetFound: rawEventsStep?.status === 'PASSED' || rawEventsStep?.status === 'WARNING',
            spreadsheetId: config.spreadsheetId,
            spreadsheetUrl: config.spreadsheetUrl,
            serviceAccountAuthenticated: authStep?.status === 'PASSED'
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.config = (req, res) => {
    res.json(googleSheetsService.getConfig());
};

exports.lastWrite = (req, res) => {
    res.json(googleSheetsService.getLastWrite() || { message: "No successful writes since server start." });
};

exports.testWrite = async (req, res) => {
    try {
        const testPayload = {
            event_type: 'test_write',
            page: '/api/track/test-write',
            timestamp: new Date().toISOString(),
            session_id: 'test_session_' + Date.now(),
            visitor_id: 'test_visitor',
            metadata: JSON.stringify({ source: 'diagnostic_test' })
        };
        await googleSheetsService.appendEventRow(testPayload);
        const config = googleSheetsService.getConfig();
        res.json({
            success: true,
            rowWritten: true,
            sheet: "Raw Events",
            spreadsheetId: config.spreadsheetId
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
