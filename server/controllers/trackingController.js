const googleSheetsService = require('../services/googleSheetsService');
const { sanitizeTrackingPayload, hashEvent } = require('../utils/trackingUtils');
const NodeCache = require('node-cache');

// In-memory duplicate prevention cache (short TTL)
const recentEvents = new NodeCache({ stdTTL: 60, checkperiod: 30 });

const REQUIRED_FIELDS = ['event_type', 'page', 'timestamp', 'session_id'];

exports.trackEvent = async (req, res) => {
  try {
    console.log('[TRACKING] Event received:', JSON.stringify(req.body, null, 2));
    const payload = sanitizeTrackingPayload(req.body || {});
    
    // Enrich payload with server-side network data to prevent empty columns
    payload.ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    payload.ip_location = req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || 'Unknown';

    console.log('[TRACKING] Payload sanitized:', JSON.stringify(payload, null, 2));

    for (const f of REQUIRED_FIELDS) {
      if (!payload[f]) return res.status(400).json({ error: `Missing required field ${f}` });
    }
    console.log('[TRACKING] Validation passed');

    // Duplicate prevention
    const h = hashEvent(payload);
    if (recentEvents.get(h)) {
      console.log('[TRACKING] Duplicate detected, ignoring');
      return res.status(200).json({ status: 'duplicate_ignored' });
    }
    recentEvents.set(h, true);

    const analyticsUrl = process.env.VITE_ANALYTICS_URL;
    if (analyticsUrl) {
      console.log('[TRACKING] Forwarding payload to Google Apps Script Webhook...');
      
      // Determine the target sheet based on event type for high-standard routing
      const eType = payload.event_type || '';
      let targetSheet = "UserBehaviorLibrary"; // Default master list
      
      if (['page_view', 'search'].includes(eType)) targetSheet = "TrafficAnalytics";
      if (['add_to_cart', 'checkout_started', 'purchase_completed', 'product_view', 'category_view'].includes(eType)) targetSheet = "ProductAnalytics";
      if (['whatsapp_click', 'contact_form_submit'].includes(eType)) targetSheet = "LeadGeneration";
      
      payload.sheetName = targetSheet;

      // Node.js native fetch (Node 18+)
      await fetch(analyticsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('[TRACKING] Webhook notified successfully');
    } else {
      console.log('[TRACKING] Calling googleSheetsService.appendEventRow() (Fallback)');
      await googleSheetsService.appendEventRow(payload);
    }
    
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('❌ [TRACKING_ERROR]:', err.message);
    console.error('[TRACKING_ERROR_STACK]:', err.stack);
    console.error('[TRACKING_ERROR_FULL]:', err);
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
      
      // Enrich payload with server-side network data
      payload.ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      payload.ip_location = req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || 'Unknown';
      
      const h = hashEvent(payload);
      if (recentEvents.get(h)) continue;
      recentEvents.set(h, true);
      rows.push(payload);
    }

    if (!rows.length) return res.json({ status: 'no_new_events' });
    
    const analyticsUrl = process.env.VITE_ANALYTICS_URL;
    if (analyticsUrl) {
      console.log(`[TRACKING] Forwarding ${rows.length} payloads to Apps Script Webhook...`);
      for (const payload of rows) {
        const eType = payload.event_type || '';
        let targetSheet = "UserBehaviorLibrary";
        if (['page_view', 'search'].includes(eType)) targetSheet = "TrafficAnalytics";
        if (['add_to_cart', 'checkout_started', 'purchase_completed', 'product_view', 'category_view'].includes(eType)) targetSheet = "ProductAnalytics";
        if (['whatsapp_click', 'contact_form_submit'].includes(eType)) targetSheet = "LeadGeneration";
        
        payload.sheetName = targetSheet;

        await fetch(analyticsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      console.log('[TRACKING] Batch Webhook notified successfully');
    } else {
      await googleSheetsService.appendEventRows(rows);
    }
    
    res.json({ status: 'ok', appended: rows.length });
  } catch (err) {
    console.error('❌ [TRACKING_BATCH_ERROR]:', err.message);
    res.status(500).json({ error: 'batch_tracking_failed' });
  }
};
