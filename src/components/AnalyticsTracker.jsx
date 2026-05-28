import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import trackingService from '../services/trackingService';
import sessionUtils from '../utils/session';

export default function AnalyticsTracker() {
  const location = useLocation();
  const lastPath = useRef(location.pathname + location.search);

  useEffect(() => {
    // ensure session started
    sessionUtils.startSession();

    // initial page view
    trackingService.trackEvent('page_view', { initial: true });

    // track route changes
    const unlisten = () => {
      const path = location.pathname + location.search;
      if (path !== lastPath.current) {
        lastPath.current = path;
        trackingService.trackEvent('page_view', { route_change: true });
      }
    };

    // react-router's useLocation updates cause rerenders; call on mount and whenever location changes
    unlisten();

    return () => {};
  }, [location]);

  // session end handling
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      try {
        const duration = sessionUtils.getSessionDuration();
        const payload = { event_type: 'session_end', session_duration: duration };
        // use sendBeacon if available
        const url = (import.meta.env.VITE_API_URL || '/api') + '/track/event';
        const body = JSON.stringify({ ...payload });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
        } else {
          // fallback synchronous XHR (best effort)
          const xhr = new XMLHttpRequest();
          xhr.open('POST', url, false);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(body);
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return null;
}
