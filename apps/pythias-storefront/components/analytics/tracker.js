"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const ENDPOINT = "/api/analytics/collect";
const VID = "sf_vid", SID = "sf_sid", SID_TS = "sf_sid_ts", CONSENT = "sf_consent";
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
// Opt-out: track by default (incl. the server-side GA4 mirror); stop only if the visitor declined.
function hasConsent() {
    try { return localStorage.getItem(CONSENT) !== "no"; } catch { return true; }
}

// Only count REAL buyer visits — exclude localhost/dev, the editor's draft-preview (?preview/?pv),
// and any iframe-embedded render (the builder's live preview). Otherwise dev + editor sessions skew
// the field metrics (e.g. an 78s "LCP" from previewing an unpublished store on localhost).
function isRealVisit() {
    try {
        const h = location.hostname;
        if (h === "localhost" || h.startsWith("127.") || h === "::1" || h.endsWith(".localhost")) return false;
        const sp = new URLSearchParams(location.search);
        if (sp.has("preview") || sp.has("pv")) return false;
        if (window.self !== window.top) return false;   // embedded = editor/builder preview
    } catch { return false; }
    return true;
}

// Reliable fire-and-forget send (survives page unload).
function beacon(payload) {
    if (!isRealVisit() || !hasConsent()) return;
    try {
        const body = JSON.stringify(payload);
        if (navigator.sendBeacon) navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
        else fetch(ENDPOINT, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
    } catch { /* ignore */ }
}

// Public helper for ecommerce events: add_to_cart | begin_checkout | purchase.
export function track(event, data = {}) {
    if (typeof window === "undefined") return;
    // Attribute A/B conversions: attach the visitor's experiment assignments on purchase.
    let experiments;
    if (event === "purchase") { try { experiments = JSON.parse(localStorage.getItem("sf_experiments") || "[]"); } catch { /* ignore */ } }
    beacon({ type: "event", event, sessionId: getSessionId(), visitorId: getVisitorId(), ...(experiments?.length ? { experiments } : {}), ...data });
}

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const startRef = useRef(Date.now());
    const [consent, setConsent] = useState(undefined);   // undefined = unread, null = undecided, "yes"/"no" = chosen

    useEffect(() => { try { setConsent(localStorage.getItem(CONSENT) || null); } catch { setConsent(null); } }, []);

    // Page view on every route change (carry UTM params for acquisition attribution).
    // `consent` is a dep so the landing pageview re-fires the moment the visitor opts in.
    useEffect(() => {
        startRef.current = Date.now();
        const sp = new URLSearchParams(window.location.search);
        beacon({
            type: "pageview", sessionId: getSessionId(), visitorId: getVisitorId(),
            path: pathname, referrer: document.referrer || "",
            utm: { source: sp.get("utm_source") || "", medium: sp.get("utm_medium") || "", campaign: sp.get("utm_campaign") || "" },
        });
    }, [pathname, consent]);

    // Core Web Vitals — observe, then flush once when the page is hidden/unloaded.
    useEffect(() => {
        const vitals = {};
        const observers = [];
        // LCP recorded at/after the page is first hidden is invalid — a tab loaded in the background
        // (or sent there) reports the paint as the moment it finally surfaces, which logged absurd
        // 800s+ "LCP" values that skewed the rollup. web-vitals' rule: ignore LCP once the page has
        // been hidden (firstHiddenTime = 0 if it loaded hidden).
        let firstHiddenTime = document.visibilityState === "hidden" ? 0 : Infinity;
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

        obs("largest-contentful-paint", (l) => { const e = l.getEntries().at(-1); if (e && e.startTime < firstHiddenTime) vitals.lcp = Math.round(e.startTime); });
        let cls = 0;
        obs("layout-shift", (l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; vitals.cls = Math.round(cls * 1000) / 1000; });
        let inp = 0;
        obs("event", (l) => { for (const e of l.getEntries()) inp = Math.max(inp, e.duration); vitals.inp = Math.round(inp); }, { durationThreshold: 40 });

        let flushed = false;
        const flush = () => {
            if (flushed || !Object.keys(vitals).length) return;
            flushed = true;
            // Safety net: a >60s LCP is never a real foreground paint — drop it so one stray
            // backgrounded tab can't skew the average (we saw a single session report ~846s).
            if (vitals.lcp > 60000) delete vitals.lcp;
            observers.forEach((o) => { try { o.takeRecords?.(); o.disconnect(); } catch { /* ignore */ } });
            beacon({ type: "vitals", sessionId: getSessionId(), path: window.location.pathname, vitals });
            // Time on page (does not count as another pageview).
            beacon({ type: "duration", sessionId: getSessionId(), durationMs: Date.now() - startRef.current });
        };
        const onHide = () => { if (document.visibilityState === "hidden") { firstHiddenTime = Math.min(firstHiddenTime, performance.now()); flush(); } };
        document.addEventListener("visibilitychange", onHide);
        window.addEventListener("pagehide", flush);
        return () => { document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", flush); flush(); };
    }, [pathname]);

    const choose = (v) => { try { localStorage.setItem(CONSENT, v); } catch { /* ignore */ } setConsent(v); };
    if (consent === null) return <ConsentBanner onAccept={() => choose("yes")} onDecline={() => choose("no")} />;
    return null;
}

// Cookie/tracking consent. Until the visitor accepts, beacon() sends nothing (incl. the server-side
// GA4 mirror). Shown once per device; choice persisted in localStorage.
function ConsentBanner({ onAccept, onDecline }) {
    const btn = { padding: "9px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" };
    return (
        <div role="dialog" aria-label="Cookie consent" style={{
            position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 9999,
            background: "#111827", color: "#fff", borderRadius: 12, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            boxShadow: "0 12px 34px rgba(0,0,0,0.35)", fontSize: "0.9rem",
        }}>
            <span style={{ flex: "1 1 280px" }}>
                We use cookies to analyze traffic and improve your experience.{" "}
                <a href="/policies/privacy" style={{ color: "#93c5fd" }}>Privacy policy</a>
            </span>
            <button onClick={onDecline} style={{ ...btn, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff" }}>Decline</button>
            <button onClick={onAccept} style={{ ...btn, background: "var(--sf-accent, #f59e0b)", color: "#fff" }}>Accept</button>
        </div>
    );
}
