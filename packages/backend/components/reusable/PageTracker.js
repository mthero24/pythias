"use client";
import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";

const HEARTBEAT_MS = 60_000;

export function PageTracker({ heartbeatUrl = "/api/heartbeat" }) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const intervalRef = useRef(null);
    const userName = session?.user?.userName;

    const ping = useCallback(async (page) => {
        if (!page || page.startsWith("/api/")) return;
        try { await axios.post(heartbeatUrl, { page }); } catch {}
    }, [heartbeatUrl]);

    // Fire immediately on page navigation
    useEffect(() => {
        if (!userName) return;
        ping(pathname);
    }, [pathname, userName, ping]);

    // Keep-alive interval while on a page
    useEffect(() => {
        if (!userName) return;
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => ping(pathname), HEARTBEAT_MS);
        return () => clearInterval(intervalRef.current);
    }, [pathname, userName, ping]);

    return null;
}
