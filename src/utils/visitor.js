// Visitor ID utility: persistent visitor identifier in localStorage
const VISITOR_KEY = 'analytics_visitor_id';

export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // fallback
  return 'v-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
}

export function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch (e) {
    return generateUUID();
  }
}

export function clearVisitorId() {
  try { localStorage.removeItem(VISITOR_KEY); } catch (e) {}
}

export default { getVisitorId, generateUUID, clearVisitorId };
