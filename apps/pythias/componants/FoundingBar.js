"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Top promo bar that drives to /founding. Shows only when the runtime flag is on (FOUNDING_BAR_ON=1,
// returned by /api/founder-count) and fewer than 100 founding/early seats are filled. The text follows
// the live tier so it's always accurate: founders → early-bird → early-adopter.
function offerText(count) {
    if (count < 10)  return "Become a founding member — 25% off for life + free onboarding";
    if (count < 60)  return "Become an early-bird member — 20% off for a year + 50% off onboarding";
    if (count < 100) return "Become an early adopter — 10% off for a year";
    return null; // all 100 seats filled → no bar
}

export default function FoundingBar() {
    const pathname = usePathname();
    const [text, setText] = useState(null);

    useEffect(() => {
        // Don't show on the offer page itself or inside the admin app.
        if (pathname?.startsWith("/founding") || pathname?.startsWith("/admin")) { setText(null); return; }
        let active = true;
        fetch("/api/founder-count")
            .then((r) => r.json())
            .then((d) => { if (active) setText(d?.enabled ? offerText(d?.count ?? 0) : null); })
            .catch(() => {});
        return () => { active = false; };
    }, [pathname]);

    if (!text) return null;
    return (
        <Link href="/founding" style={{
            display: "block", textDecoration: "none", textAlign: "center",
            background: "linear-gradient(90deg,#D3A73D,#b8860b)", color: "#0f172a",
            fontWeight: 700, fontSize: "0.85rem", padding: "9px 16px", letterSpacing: "0.01em",
        }}>
            🚀 {text} · Limited seats →
        </Link>
    );
}
