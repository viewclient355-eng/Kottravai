/**
 * Kottravai Analytics Service — Ultra Robust v2.0
 * 
 * Sends events to Google Apps Script doPost() which writes to Google Sheets.
 */

// Use Environment Variable from .env, fallback to the current hardcoded one if not available
const GOOGLE_SCRIPT_URL = import.meta.env.VITE_ANALYTICS_URL || 'https://script.google.com/macros/s/AKfycbyP2DTMncQ6C9KcbyCUTRUR09eWD_uuQi28fz3Njrlq5NFN6PADpHXu5ZCB6MMiagHhFQ/exec';

export interface AnalyticsPayload {
    visitor_id: string;
    session_id: string;
    event_name: string;
    page_url: string;
    page_title?: string;
    ip_address?: string;
    sheet_name?: string;
    [key: string]: any;
}

export async function sendAnalyticsEvent(payload: AnalyticsPayload): Promise<void> {
    const url = GOOGLE_SCRIPT_URL;

    // Log the attempt so we can verify the URL in the browser (F12 -> Console)
    console.log(`[Analytics] 🛰️ Sending ${payload.event_name} to:`, url);

    try {
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors', // Required for Google Apps Script Web Apps
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload),
            keepalive: true
        });
        console.log('[Analytics] ✅ Signal sent (Web App will process it in background)');
    } catch (error) {
        console.error('[Analytics] ❌ Transport error:', error);
    }
}

class AnalyticsService {
    private sessionId: string;
    private visitorId: string;
    private ipAddress: string = 'Pending';
    private trafficSourceData = {
        source: 'direct',
        utm_source: '',
        utm_medium: '',
        utm_campaign: ''
    };

    constructor() {
        this.sessionId = this.getOrGenerateSessionId();
        this.visitorId = this.getOrGenerateVisitorId();

        // fetch IP 
        this.fetchIpAddress();

        // Resolve traffic source
        this.trafficSourceData = this.resolveTrafficSource();

        console.log('[Analytics] Service Ready. Visitor:', this.visitorId);
    }

    private getOrGenerateVisitorId(): string {
        let vid = localStorage.getItem('analytics_visitor_id');
        if (!vid) {
            vid = 'v_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
            localStorage.setItem('analytics_visitor_id', vid);
        }
        return vid;
    }

    private getOrGenerateSessionId(): string {
        let sid = sessionStorage.getItem('analytics_session_id');
        if (!sid) {
            sid = 'sid_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
            sessionStorage.setItem('analytics_session_id', sid);
        }
        return sid;
    }

    private async fetchIpAddress() {
        try {
            const resp = await fetch('https://api.ipify.org?format=json');
            if (!resp.ok) throw new Error('IP Fetch failed');
            const data = await resp.json();
            this.ipAddress = data.ip;
            console.log('[Analytics] IP Resolved:', this.ipAddress);
        } catch (e) {
            console.warn('[Analytics] IP Fetch failed, defaulting to Unknown');
            this.ipAddress = 'Unknown';
        }
    }

    private getDeviceType(): string {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
        return 'desktop';
    }

    private getBrowser(): string {
        const ua = navigator.userAgent;
        if (ua.indexOf('Firefox') > -1) return 'Firefox';
        if (ua.indexOf('Chrome') > -1) return 'Chrome';
        if (ua.indexOf('Safari') > -1) return 'Safari';
        if (ua.indexOf('Edge') > -1) return 'Edge';
        return 'Other';
    }

    private resolveTrafficSource() {
        const params = new URLSearchParams(window.location.search);
        const referrer = document.referrer;
        let source = 'direct';
        
        if (params.get('utm_source')) {
            source = 'campaign';
        } else if (referrer) {
            try {
                const refUrl = new URL(referrer);
                if (refUrl.hostname !== window.location.hostname) {
                    source = 'referral';
                }
            } catch (e) {
                source = 'referral';
            }
        }

        return {
            source: source,
            utm_source: params.get('utm_source') || '',
            utm_medium: params.get('utm_medium') || '',
            utm_campaign: params.get('utm_campaign') || ''
        };
    }

    public setUserId(uid: string | null) {
        if (uid) localStorage.setItem('user_id', uid);
        else localStorage.removeItem('user_id');
    }

    public trackEvent(eventName: string, metadata: Record<string, any> = {}, sheetName?: string) {
        const payload: AnalyticsPayload = {
            visitor_id: this.visitorId,
            session_id: this.sessionId,
            event_name: eventName,
            page_url: window.location.href,
            page_title: document.title,
            device_variant: this.getDeviceType(),
            browser: this.getBrowser(),
            os: navigator.platform,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            traffic_source: this.trafficSourceData.source,
            utm_source: this.trafficSourceData.utm_source,
            utm_medium: this.trafficSourceData.utm_medium,
            utm_campaign: this.trafficSourceData.utm_campaign,
            ip_address: this.ipAddress,
            timestamp: new Date().toISOString(),
            sheet_name: sheetName || "TrafficAnalytics"
        };

        // Merge metadata directly into payload
        Object.keys(metadata).forEach(key => {
            if (payload[key] === undefined) {
                payload[key] = metadata[key];
            }
        });

        sendAnalyticsEvent(payload);
    }
}

export const analytics = new AnalyticsService();

if (typeof window !== 'undefined') {
    (window as any).sendAnalyticsEvent = sendAnalyticsEvent;
    (window as any).analytics = analytics;
}

export default analytics;
