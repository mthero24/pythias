"use client";
import { useEffect, useState } from "react";

// Records the current product in localStorage and shows the others recently viewed (client-only, no API).
const KEY = "sf_recent_v1";

export default function RecentlyViewed({ current }) {
    const [items, setItems] = useState([]);
    useEffect(() => {
        if (!current?.id) return;
        let list = [];
        try { list = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { /* ignore */ }
        const others = list.filter((x) => x && x.id && x.id !== current.id);
        setItems(others.slice(0, 12));
        try { localStorage.setItem(KEY, JSON.stringify([current, ...others].slice(0, 16))); } catch { /* ignore */ }
    }, [current?.id]);

    if (!items.length) return null;
    return (
        <section style={{ marginTop: 52 }}>
            <h2 style={{ fontSize: "1.3rem", margin: "0 0 18px" }}>Recently viewed</h2>
            <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 6, alignItems: "flex-start" }}>
                {items.map((p) => (
                    <a key={p.id} href={p.href} style={{ flex: "0 0 168px", width: 168, textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}>
                        <div style={{ width: 168, height: 168, background: "#f3f4f6", borderRadius: 10, overflow: "hidden", flex: "none" }}>
                            {p.image && <img src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                        </div>
                        <div style={{ marginTop: 7, fontSize: "0.85rem", fontWeight: 600, lineHeight: "1.2", height: "2.4em", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.title}</div>
                        <div style={{ marginTop: 2, fontSize: "0.82rem", color: "var(--sf-secondary)", fontWeight: 700, minHeight: "1.1em" }}>{p.priceCents > 0 ? `$${(p.priceCents / 100).toFixed(2)}` : " "}</div>
                    </a>
                ))}
            </div>
        </section>
    );
}
