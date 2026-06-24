import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_KEY, API_BASE } from "./config";

// App analytics → /api/analytics/collect. The server records to Pythias's own storefront analytics
// AND forwards to the store's GA4 (Measurement Protocol) — so this one beacon covers both.
let _sessionId = null;
let _visitorId = null;

const rid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

export async function initAnalytics() {
    try {
        _visitorId = await AsyncStorage.getItem("pythias_visitor");
        if (!_visitorId) { _visitorId = rid(); await AsyncStorage.setItem("pythias_visitor", _visitorId); }
    } catch { _visitorId = rid(); }
    _sessionId = rid();   // one session per app launch
}

async function send(body) {
    if (!_sessionId) return;
    try {
        await fetch(`${API_BASE}/api/analytics/collect`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-pythias-app-key": APP_KEY },
            body: JSON.stringify({ sessionId: _sessionId, visitorId: _visitorId, device: "app", ...body }),
        });
    } catch { /* fire-and-forget */ }
}

export const trackScreen = (path) => send({ type: "pageview", path });
export const trackEvent = (event, params = {}) => send({ type: "event", event, ...params });
