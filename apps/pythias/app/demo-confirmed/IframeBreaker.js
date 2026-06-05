"use client";
import { useEffect } from "react";

// When Google Calendar redirects the iframe to this page after booking,
// we detect we're inside an iframe and promote to full-page navigation.
// Also fires a demo_booked conversion event to GA4 and internal analytics.
export default function IframeBreaker() {
    useEffect(() => {
        // Inside Google Calendar iframe — promote to full page, which re-runs this effect at top level
        if (window.self !== window.top) {
            window.top.location.href = window.self.location.href;
            return;
        }

        // Only fire conversion events when the user came from the booking page.
        // Bots and direct URL visits will not have this flag set.
        let fromBooking = false;
        try {
            fromBooking = sessionStorage.getItem("_demo_booked") === "1";
            if (fromBooking) sessionStorage.removeItem("_demo_booked");
        } catch {}

        if (!fromBooking) return;

        window.gtag?.("event", "conversion_event_book_appointment");
        window.gtag?.("event", "conversion", { send_to: "AW-18171939038" });

        try {
            const sid = sessionStorage.getItem("_psid");
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
