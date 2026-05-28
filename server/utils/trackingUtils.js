const crypto = require('crypto');

exports.sanitizeTrackingPayload = (p) => {
  // Minimal sanitization: copy only expected fields and string-ify values
  const allowed = [
    'event_type','event_name','page','page_url','timestamp','user_agent','ua','browser','browser_name','device','device_type',
    'screen_size','screen_width','screen_height','referrer','session_id','visitor_id','visit_count','utm_source','utm_medium','utm_campaign','metadata'
  ];
  const out = {};
  for (const k of allowed) {
    if (p[k] !== undefined && p[k] !== null) out[k] = typeof p[k] === 'string' ? p[k].trim() : p[k];
  }
  // Ensure timestamp normalized
  out.timestamp = out.timestamp || new Date().toISOString();
  return out;
};

exports.hashEvent = (payload) => {
  try {
    const str = `${payload.event_type || ''}|${payload.page || ''}|${payload.session_id || ''}|${payload.timestamp || ''}|${JSON.stringify(payload.metadata||{})}`;
    return crypto.createHash('sha256').update(str).digest('hex');
  } catch (e) {
    return crypto.randomBytes(16).toString('hex');
  }
};
