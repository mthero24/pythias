"use client";
import { useEffect } from "react";

// Fires analytics events for the Founding Members funnel without restructuring the
// (server-rendered) /founding page: on mount it records a "view_founding_offer", and it
// attaches a click handler to every founder signup link (href contains "founder=1") that
// records a conversion. Works with GA4 + Google Ads (gtag) and, if present, the OpenAI pixel.
//
// To count it as a Google Ads conversion, set NEXT_PUBLIC_GADS_FOUNDER_CONVERSION to the
// conversion's "AW-XXXXXXXXX/labelXXXX" send_to value. The GA4 event fires regardless — mark
// "founder_signup_start" as a conversion in GA4. The OpenAI hook fires if window.oaiq exists.
export default function FounderConversionTracker() {
    useEffect(() => {
        const g = (...args) => { if (typeof window !== "undefined" && typeof window.gtag === "function") window.gtag(...args); };

        g("event", "view_founding_offer", { page: "/founding" });

        const planFromHref = (href = "") => {
            const m = href.match(/type=([a-z]+)/);
            return m ? m[1] : "unknown";
        };

        const onClick = (e) => {
            const a = e.currentTarget;
            const plan = planFromHref(a.getAttribute("href") || "");
            // GA4 (mark as a conversion in GA4)
            g("event", "founder_signup_start", { plan, source: "founding_page" });
            // Google Ads conversion (only if the conversion's send_to is configured)
            const gadsSendTo = process.env.NEXT_PUBLIC_GADS_FOUNDER_CONVERSION;
            if (gadsSendTo) g("event", "conversion", { send_to: gadsSendTo, plan });
            // OpenAI's registration_completed conversion fires on the platform register-success
            // (where signup actually completes) — see apps/pythias-platform/app/register/page.js.
        };

        const links = Array.from(document.querySelectorAll('a[href*="founder=1"]'));
        links.forEach((a) => a.addEventListener("click", onClick));
        return () => links.forEach((a) => a.removeEventListener("click", onClick));
    }, []);

    return null;
}
