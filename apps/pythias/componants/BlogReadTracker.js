"use client";
import { useEffect, useRef } from "react";

function getSessionId() {
    try {
        let sid = sessionStorage.getItem("_psid");
        if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem("_psid", sid); }
        return sid;
    } catch { return "fallback-" + Math.random().toString(36).slice(2); }
}

const MIN_READ_SECONDS = 30;

export default function BlogReadTracker({ slug }) {
    const sentinelRef = useRef(null);
    const firedRef    = useRef(false);
    const enteredRef  = useRef(Date.now());

    useEffect(() => {
        firedRef.current   = false;
        enteredRef.current = Date.now();

        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const fire = () => {
            if (firedRef.current) return;
            firedRef.current = true;
            try {
                navigator.sendBeacon(
                    "/api/analytics/collect",
                    new Blob([JSON.stringify({
                        type:            "conversion",
                        sessionId:       getSessionId(),
                        page:            `/blog/${slug}`,
                        conversionEvent: "blog_read",
                    })], { type: "application/json" })
                );
            } catch {}
        };

        const obs = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting || firedRef.current) return;
            const elapsed = (Date.now() - enteredRef.current) / 1000;
            if (elapsed >= MIN_READ_SECONDS) fire();
            else setTimeout(fire, (MIN_READ_SECONDS - elapsed) * 1000);
        }, { threshold: 0.5 });

        obs.observe(sentinel);
        return () => obs.disconnect();
    }, [slug]);

    return <div ref={sentinelRef} style={{ height: 1 }} />;
}
