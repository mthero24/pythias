"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getSessionId() {
    try {
        let sid = sessionStorage.getItem("_psid");
        if (!sid) {
            sid = crypto.randomUUID();
            sessionStorage.setItem("_psid", sid);
        }
        return sid;
    } catch { return "fallback-" + Math.random().toString(36).slice(2); }
}

function beacon(payload) {
    try {
        navigator.sendBeacon(
            "/api/analytics/collect",
            new Blob([JSON.stringify(payload)], { type: "application/json" })
        );
    } catch {}
}

function useWebVitals(vitalsRef) {
    useEffect(() => {
        const observers = [];

        try {
            const obs = new PerformanceObserver(list => {
                const entries = list.getEntries();
                vitalsRef.current.lcp = entries[entries.length - 1]?.startTime ?? 0;
            });
            obs.observe({ type: "largest-contentful-paint", buffered: true });
            observers.push(obs);
        } catch {}

        let clsScore = 0;
        try {
            const obs = new PerformanceObserver(list => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) clsScore += entry.value;
                }
                vitalsRef.current.cls = clsScore;
            });
            obs.observe({ type: "layout-shift", buffered: true });
            observers.push(obs);
        } catch {}

        try {
            const obs = new PerformanceObserver(list => {
                for (const entry of list.getEntries()) {
                    const dur = entry.duration ?? 0;
                    if (dur > (vitalsRef.current.inp ?? 0)) vitalsRef.current.inp = dur;
                }
            });
            obs.observe({ type: "event", buffered: true, durationThreshold: 16 });
            observers.push(obs);
        } catch {}

        const captureNavTiming = () => {
            const nav = performance.getEntriesByType("navigation")[0];
            if (nav) {
                vitalsRef.current.ttfb = Math.round(nav.responseStart);
                vitalsRef.current.loadTime = Math.round(nav.loadEventEnd);
            }
            const fcp = performance.getEntriesByName("first-contentful-paint")[0];
            if (fcp) vitalsRef.current.fcp = Math.round(fcp.startTime);
        };
        if (document.readyState === "complete") captureNavTiming();
        else window.addEventListener("load", captureNavTiming, { once: true });

        return () => observers.forEach(o => o.disconnect());
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

export function AnalyticsTracker() {
    const pathname = usePathname();
    const vitalsRef = useRef({});
    const leaveSent = useRef(false);
    const interacted = useRef(false);
    const enterTime = useRef(null);

    useWebVitals(vitalsRef);

    useEffect(() => {
        if (pathname.startsWith("/api/") || pathname.startsWith("/admin/")) return;

        const sid = getSessionId();
        const page = pathname;
        const entered = Date.now();
        enterTime.current = entered;
        leaveSent.current = false;
        interacted.current = false;

        const markInteracted = () => { interacted.current = true; };
        const opts = { once: true, passive: true };
        window.addEventListener("mousemove", markInteracted, opts);
        window.addEventListener("scroll", markInteracted, opts);
        window.addEventListener("keydown", markInteracted, opts);
        window.addEventListener("touchstart", markInteracted, opts);
        window.addEventListener("click", markInteracted, opts);

        const params = new URLSearchParams(window.location.search);
        const referrer = document.referrer;

        beacon({
            type: "pageview",
            sessionId: sid,
            page,
            referrer,
            source: params.get("utm_source") || "",
            medium: params.get("utm_medium") || "",
            campaign: params.get("utm_campaign") || "",
        });

        const sendLeave = () => {
            if (leaveSent.current) return;
            leaveSent.current = true;
            beacon({
                type: "leave",
                sessionId: sid,
                page,
                timeOnPage: Math.round((Date.now() - entered) / 1000),
                interacted: interacted.current,
                vitals: { ...vitalsRef.current },
            });
        };

        const onVisibility = () => { if (document.visibilityState === "hidden") sendLeave(); };
        window.addEventListener("beforeunload", sendLeave);
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            sendLeave();
            window.removeEventListener("mousemove", markInteracted);
            window.removeEventListener("scroll", markInteracted);
            window.removeEventListener("keydown", markInteracted);
            window.removeEventListener("touchstart", markInteracted);
            window.removeEventListener("click", markInteracted);
            window.removeEventListener("beforeunload", sendLeave);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [pathname]);

    return null;
}
