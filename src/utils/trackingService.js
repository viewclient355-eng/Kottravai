// Lightweight tracking service to send events to backend /api/track
import axios from 'axios';
import { generateSessionId, getUTMParams, getBrowserInfo, getDeviceType } from './trackingHelpers';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const SESSION_KEY = 'lms_tracking_session';

function getSession() {
  let s = localStorage.getItem(SESSION_KEY);
  if (!s) {
    s = generateSessionId();
    localStorage.setItem(SESSION_KEY, s);
  }
  return s;
}

export async function trackEvent(eventType, data = {}) {
  try {
    const session_id = getSession();
    const ua = navigator.userAgent || '';
    const browser = getBrowserInfo();
    const device = getDeviceType();
    const utm = getUTMParams();
    const payload = {
      event_type: eventType,
      page: window.location.pathname,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      user_agent: ua,
      browser: browser.name,
      device: device,
      screen_width: window.screen?.width || null,
      screen_height: window.screen?.height || null,
      screen_size: `${window.screen?.width || ''}x${window.screen?.height || ''}`,
      referrer: document.referrer || '',
      session_id,
      utm_source: utm.utm_source || '',
      utm_medium: utm.utm_medium || '',
      utm_campaign: utm.utm_campaign || '',
      metadata: data
    };

    // send asynchronously, don't block UI
    axios.post(`${API_BASE}/track/event`, payload).catch(err => {
      console.warn('Tracking send failed', err?.message || err);
    });
  } catch (err) {
    console.warn('trackEvent error', err);
  }
}

export async function trackBatch(events = []) {
  if (!events.length) return;
  try {
    const session_id = getSession();
    const enriched = events.map(e => ({ ...e, session_id, timestamp: e.timestamp || new Date().toISOString() }));
    axios.post(`${API_BASE}/track/batch`, { events: enriched }).catch(() => {});
  } catch (e) { }
}

export default { trackEvent, trackBatch };
