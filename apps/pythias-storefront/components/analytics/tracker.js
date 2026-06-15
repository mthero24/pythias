"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const ENDPOINT = "/api/analytics/collect";
const VID = "sf_vid", SID = "sf_sid", SID_TS = "sf_sid_ts";
const SESSION_GAP = 30 * 60 * 1000;   // 30 min idle = new session

function uid() {
    try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}
function getVisitorId() {
    let v = localStorage.getItem(VID);
    if (!v) { v = uid(); localStorage.setItem(VID, v); }
    return v;
}
function getSessionId() {
    const now = Date.now();
    const ts = Number(localStorage.getItem(SID_TS) || 0);
    let s = localStorage.getItem(SID);
    if (!s || now - ts > SESSION_GAP) { s = uid(); localStorage.setItem(SID, s); }
    localStorage.setItem(SID_TS, String(now));
    return s;
}

// Reliable fire-and-forget send (survives page unload).
function beacon(payload) {
    try {
        const body = JSON.stringify(payload);
        if (navigator.sendBeacon) navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
        else fetch(ENDPOINT, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
    } catch { /* ignore */ }
}

// Public helper for ecommerce events: add_to_cart | begin_checkout | purchase.
export function track(event, data = {}) {
    if (typeof window === "undefined") return;
    beacon({ type: "event", event, sessionId: getSessionId(), visitorId: getVisitorId(), ...data });
}

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const startRef = useRef(Date.now());

    // Page view on every route change (carry UTM params for acquisition attribution).
    useEffect(() => {
        startRef.current = Date.now();
        const sp = new URLSearchParams(window.location.search);
        beacon({
            type: "pageview", sessionId: getSessionId(), visitorId: getVisitorId(),
            path: pathname, referrer: document.referrer || "",
            utm: { source: sp.get("utm_source") || "", medium: sp.get("utm_medium") || "", campaign: sp.get("utm_campaign") || "" },
        });
    }, [pathname]);

    // Core Web Vitals — observe, then flush once when the page is hidden/unloaded.
    useEffect(() => {
        const vitals = {};
        const observers = [];
        const obs = (type, cb, opts) => {
            try { const o = new PerformanceObserver(cb); o.observe({ type, buffered: true, ...opts }); observers.push(o); } catch { /* unsupported */ }
        };

        // TTFB + FCP from navigation/paint timing.
        try {
            const nav = performance.getEntriesByType("navigation")[0];
            if (nav?.responseStart) vitals.ttfb = Math.round(nav.responseStart);
            const fcp = performance.getEntriesByType("paint").find((p) => p.name === "first-contentful-paint");
            if (fcp) vitals.fcp = Math.round(fcp.startTime);
        } catch { /* ignore */ }

        obs("largest-contentful-paint", (l) => { const e = l.getEntries().at(-1); if (e) vitals.lcp = Math.round(e.startTime); });
        let cls = 0;
        obs("layout-shift", (l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; vitals.cls = Math.round(cls * 1000) / 1000; });
        let inp = 0;
        obs("event", (l) => { for (const e of l.getEntries()) inp = Math.max(inp, e.duration); vitals.inp = Math.round(inp); }, { durationThreshold: 40 });

        let flushed = false;
        const flush = () => {
            if (flushed || !Object.keys(vitals).length) return;
            flushed = true;
            observers.forEach((o) => { try { o.takeRecords?.(); o.disconnect(); } catch { /* ignore */ } });
            beacon({ type: "vitals", sessionId: getSessionId(), path: window.location.pathname, vitals });
            // Time on page (does not count as another pageview).
            beacon({ type: "duration", sessionId: getSessionId(), durationMs: Date.now() - startRef.current });
        };
        const onHide = () => { if (document.visibilityState === "hidden") flush(); };
        document.addEventListener("visibilitychange", onHide);
        window.addEventListener("pagehide", flush);
        return () => { document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", flush); flush(); };
    }, [pathname]);

    return null;
}
