// Session utility: session-scoped ID and duration tracking
const SESSION_KEY = 'analytics_session_id';
const SESSION_START_KEY = 'analytics_session_start';

export function generateSessionId() {
  return 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function startSession() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateSessionId();
      sessionStorage.setItem(SESSION_KEY, id);
      const now = Date.now();
      sessionStorage.setItem(SESSION_START_KEY, String(now));
    } else {
      // ensure start time exists
      if (!sessionStorage.getItem(SESSION_START_KEY)) sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
    }
    return id;
  } catch (e) {
    return generateSessionId();
  }
}

export function getSessionId() {
  try { return sessionStorage.getItem(SESSION_KEY) || startSession(); } catch (e) { return generateSessionId(); }
}

export function getSessionStart() {
  try { return Number(sessionStorage.getItem(SESSION_START_KEY)) || Date.now(); } catch (e) { return Date.now(); }
}

export function getSessionDuration() {
  const start = getSessionStart();
  return Math.max(0, Math.floor((Date.now() - start) / 1000)); // seconds
}

export function endSession() {
  try {
    const duration = getSessionDuration();
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_START_KEY);
    return duration;
  } catch (e) {
    return 0;
  }
}

export default { startSession, getSessionId, getSessionStart, getSessionDuration, endSession };
