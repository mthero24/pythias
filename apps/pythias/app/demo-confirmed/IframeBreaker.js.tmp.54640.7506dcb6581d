"use client";
import { useEffect } from "react";

// When Google Calendar redirects the iframe to this page after booking,
// we detect we're inside an iframe and promote to full-page navigation.
export default function IframeBreaker() {
    useEffect(() => {
        if (window.self !== window.top) {
            window.top.location.href = window.self.location.href;
        }
    }, []);
    return null;
}
