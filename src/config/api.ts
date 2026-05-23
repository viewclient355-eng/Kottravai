/**
 * Thozhi AI - Centralized API Configuration (Phase 8 Standard)
 * Ensures consistent endpoint construction and defensive normalization.
 */

// Defensive URL normalization to prevent double slashes and malformed paths
export const normalizeUrl = (url: string) => {
    return url.replace(/([^:]\/)\/+/g, "$1");
};

// Base Origin from Environment (Primary: VITE_API_URL, Fallback: Localhost)
let rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Defensive hotfix: Auto-correct port 5001 to 5000 in local dev environment to prevent offline DB states
if (rawApiUrl.includes("localhost:5001")) {
    rawApiUrl = rawApiUrl.replace("localhost:5001", "localhost:5000");
} else if (rawApiUrl.includes("127.0.0.1:5001")) {
    rawApiUrl = rawApiUrl.replace("127.0.0.1:5001", "127.0.0.1:5000");
}

export const API_BASE = rawApiUrl.replace(/\/api$/, "");

// Standardized Enterprise API Endpoints
export const API_ENDPOINTS = {
    chat: normalizeUrl(`${API_BASE}/api/chat`),
    products: normalizeUrl(`${API_BASE}/api/products`),
    orders: normalizeUrl(`${API_BASE}/api/orders`),
    auth: normalizeUrl(`${API_BASE}/api/auth`),
    analytics: normalizeUrl(`${API_BASE}/api/ai-analytics/metrics`), // Standardized in Phase 8
    health: normalizeUrl(`${API_BASE}/api/health`),
    affiliate: normalizeUrl(`${API_BASE}/api/affiliate`),
    location: normalizeUrl(`${API_BASE}/api/location`),
    contact: normalizeUrl(`${API_BASE}/api/contact`),
    reviews: normalizeUrl(`${API_BASE}/api/reviews`),
    razorpay: normalizeUrl(`${API_BASE}/api/razorpay`),
    customRequest: normalizeUrl(`${API_BASE}/api/custom-request`),
    wishlist: normalizeUrl(`${API_BASE}/api/wishlist`),
    recentSales: normalizeUrl(`${API_BASE}/api/public/recent-sales`),
    storage: normalizeUrl(`${API_BASE}/api/storage`),
};

// Runtime Validation
console.log("🛡️ [API_CONFIG] Origin:", API_BASE);
console.log("📡 [API_CONFIG] Chat Endpoint:", API_ENDPOINTS.chat);
