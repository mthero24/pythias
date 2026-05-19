"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GtagTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (pathname.startsWith("/api/") || pathname.startsWith("/admin/")) return;
        if (typeof window === "undefined" || typeof window.gtag !== "function") return;
        window.gtag("event", "page_view", { page_path: pathname });
    }, [pathname]);

    return null;
}
