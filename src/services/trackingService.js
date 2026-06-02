import { getVisitorId } from '../utils/visitor';
import sessionUtils from '../utils/session';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function sendWithRetry(url, body, retries = 2, backoff = 300) {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: false });
    return res;
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise(r => setTimeout(r, backoff));
    return sendWithRetry(url, body, retries - 1, backoff * 2);
  }
}

function enrich(payload) {
  return {
    visitor_id: getVisitorId(),
    session_id: sessionUtils.getSessionId(),
    timestamp: new Date().toISOString(),
    page: window.location.pathname,
    page_url: window.location.href,
    referrer: document.referrer || '',
    user_agent: navigator.userAgent || '',
    screen_width: window.screen?.width || null,
    screen_height: window.screen?.height || null,
    screen_size: `${window.screen?.width || ''}x${window.screen?.height || ''}`,
    ...payload
  };
}

export async function trackEvent(eventType, payload = {}) {
  try {
    const data = enrich({ event_type: eventType, ...payload });
    // fire-and-forget; still attempt network
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;
    sendWithRetry(`${baseUrl}/api/track/event`, data).catch(() => {});
  } catch (err) {
    console.warn('trackEvent error', err);
  }
}

export async function trackBatch(events = []) {
  if (!events.length) return;
  try {
    const session_id = sessionUtils.getSessionId();
    const enriched = events.map(e => ({ ...e, session_id, timestamp: e.timestamp || new Date().toISOString() }));
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;
    sendWithRetry(`${baseUrl}/api/track/batch`, { events: enriched }).catch(() => {});
  } catch (e) { }
}

export default { trackEvent, trackBatch };
