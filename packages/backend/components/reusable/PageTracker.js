"use client";
import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const HEARTBEAT_MS = 60_000;

function getSessionId() {
    try {
        let sid = sessionStorage.getItem("_psid");
        if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem("_psid", sid); }
        return sid;
    } catch { return "fallback-" + Math.random().toString(36).slice(2); }
}

export function PageTracker({ heartbeatUrl = "/api/heartbeat" }) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const intervalRef = useRef(null);
    const userName = session?.user?.userName;

    const ping = useCallback(async (page) => {
        if (!page || page.startsWith("/api/")) return;
        const sid = getSessionId();
        const params = new URLSearchParams(window.location.search);
        try {
            await fetch(heartbeatUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    page,
                    sessionId: sid,
                    userName: userName || null,
                    source: params.get("utm_source") || document.referrer || "direct",
                    medium: params.get("utm_medium") || "",
                    campaign: params.get("utm_campaign") || "",
                }),
            });
        } catch {}
    }, [heartbeatUrl, userName]);

    useEffect(() => {
        ping(pathname);
    }, [pathname, ping]);

    useEffect(() => {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => ping(pathname), HEARTBEAT_MS);
        return () => clearInterval(intervalRef.current);
    }, [pathname, ping]);

    return null;
}
