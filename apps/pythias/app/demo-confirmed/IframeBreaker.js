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

        // GA4 conversion event
        window.gtag?.("event", "demo_booked", {
            event_category: "conversion",
            event_label: "demo_confirmed_page",
        });

        // Google Ads conversion event
        window.gtag?.("event", "ads_conversion_Book_appointment_1");

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
