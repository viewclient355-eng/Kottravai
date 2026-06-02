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

    const analyticsMode = process.env.ANALYTICS_MODE || 'legacy';
    
    if (analyticsMode === 'raw_events') {
      console.log('[TRACKING_TARGET_RAW_EVENTS] Forwarding event to googleSheetsService.appendEventRow');
      try {
        await googleSheetsService.appendEventRow(payload);
        console.log('[GOOGLE_SHEETS_APPEND_SUCCESS] Successfully appended event to Raw Events');
        // Update dashboard in the background
        googleSheetsService.populateDashboardSheet().catch(err => console.error("Dashboard update failed:", err.message));
      } catch (error) {
        console.error("[GOOGLE_SHEETS_APPEND_FAILED] Failed to append event to Raw Events:", error.message);
      }
    } else {
      console.log('[TRACKING_TARGET_LEGACY] Forwarding event to legacy Apps Script webhook');
      const analyticsUrl = process.env.VITE_ANALYTICS_URL;
      if (analyticsUrl) {
        const eType = payload.event_type || '';
        let targetSheet = "UserBehaviorLibrary"; // Default master list
        
        if (['page_view', 'search'].includes(eType)) targetSheet = "TrafficAnalytics";
        if (['add_to_cart', 'checkout_started', 'purchase_completed', 'product_view', 'category_view'].includes(eType)) targetSheet = "ProductAnalytics";
        if (['whatsapp_click', 'contact_form_submit'].includes(eType)) targetSheet = "LeadGeneration";
        
        payload.sheetName = targetSheet;

        // Fire and forget, catch errors
        fetch(analyticsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        .then(() => console.log('[TRACKING_SUCCESS] Legacy Webhook notified successfully'))
        .catch((error) => console.error("[TRACKING_ERROR]", error.message));
      } else {
        console.warn("[TRACKING_ERROR] ANALYTICS_MODE=legacy but VITE_ANALYTICS_URL is not set.");
      }
    }
    
    res.json({ status: 'ok' });
  } catch (err) {
    console.error("[TRACKING_ERROR]", err.message);
    res.status(200).json({ status: 'ok' }); // Always return success to business flow
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
    
    const analyticsMode = process.env.ANALYTICS_MODE || 'legacy';
    
    if (analyticsMode === 'raw_events') {
      console.log('[TRACKING_TARGET_RAW_EVENTS] Forwarding batch to googleSheetsService.appendEventRows');
      try {
        await googleSheetsService.appendEventRows(rows);
        console.log('[GOOGLE_SHEETS_APPEND_SUCCESS] Successfully appended batch to Raw Events');
        // Update dashboard in the background
        googleSheetsService.populateDashboardSheet().catch(err => console.error("Dashboard update failed:", err.message));
      } catch (error) {
        console.error("[GOOGLE_SHEETS_APPEND_FAILED] Failed to append batch to Raw Events:", error.message);
      }
    } else {
      console.log('[TRACKING_TARGET_LEGACY] Forwarding batch to legacy Apps Script webhook');
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
        console.warn("[TRACKING_ERROR] ANALYTICS_MODE=legacy but VITE_ANALYTICS_URL is not set.");
      }
    }
    
    res.json({ status: 'ok', appended: rows.length });
  } catch (err) {
    console.error('❌ [TRACKING_BATCH_ERROR]:', err.message);
    res.status(500).json({ error: 'batch_tracking_failed' });
  }
};
