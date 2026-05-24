"use client";
import { useEffect } from "react";

// When Google Calendar redirects the iframe to this page after booking,
// we detect we're inside an iframe and promote to full-page navigation.
// Also fires a demo_booked conversion event to GA4 and internal analytics.
export default function IframeBreaker() {
    useEffect(() => {
        if (window.self !== window.top) {
            window.top.location.href = window.self.location.href;
            return;
        }

        window.gtag?.("event", "conversion_event_book_appointment");
        window.gtag?.("event", "conversion", { send_to: "AW-18171939038" });

        // Internal analytics conversion event
        try {
            let sid = sessionStorage.getItem("_psid");
            if (sid) {
                navigator.sendBeacon(
                    "/api/analytics/collect",
                    new Blob([JSON.stringify({
                        type: "conversion",
                        sessionId: sid,
                        page: "/demo-confirmed",
                        conversionEvent: "demo_booked",
                    })], { type: "application/json" })
                );
            }
        } catch {}
    }, []);
    return null;
}
