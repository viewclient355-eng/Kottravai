// Helper functions: getBrowserInfo, getDeviceType, getUTMParams, generateSessionId
export function getBrowserInfo() {
  const ua = navigator.userAgent || '';
  let name = 'Unknown';
  if (ua.includes('Firefox/')) name = 'Firefox';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) name = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) name = 'Safari';
  else if (ua.includes('Edg/')) name = 'Edge';
  return { name, ua };
}

export function getDeviceType() {
  const ua = navigator.userAgent || '';
  if (/Mobi|Android/i.test(ua)) return 'mobile';
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  return 'desktop';
}

export function getUTMParams() {
  try {
    const url = new URL(window.location.href);
    return {
      utm_source: url.searchParams.get('utm_source') || '',
      utm_medium: url.searchParams.get('utm_medium') || '',
      utm_campaign: url.searchParams.get('utm_campaign') || ''
    };
  } catch (e) { return { utm_source: '', utm_medium: '', utm_campaign: '' }; }
}

export function generateSessionId() {
  return 's_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
