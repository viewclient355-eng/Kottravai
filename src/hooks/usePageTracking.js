import { useEffect, useRef } from 'react';
import trackingService from '../utils/trackingService';

// Hook: tracks initial pageview and route changes via history (React Router)
export default function usePageTracking({ trackOnMount = true, trackRouteChanges = true } = {}) {
  const lastPath = useRef(window.location.pathname + window.location.search);

  useEffect(() => {
    if (trackOnMount) {
      trackingService.trackEvent('page_view', { initial: true });
    }

    if (!trackRouteChanges) return;

    const onPop = () => {
      const path = window.location.pathname + window.location.search;
      if (path !== lastPath.current) {
        lastPath.current = path;
        trackingService.trackEvent('page_view', { route_change: true });
      }
    };

    window.addEventListener('popstate', onPop);
    const pushState = history.pushState;
    history.pushState = function () {
      pushState.apply(this, arguments);
      onPop();
    };

    return () => {
      window.removeEventListener('popstate', onPop);
      history.pushState = pushState;
    };
  }, [trackOnMount, trackRouteChanges]);
}
