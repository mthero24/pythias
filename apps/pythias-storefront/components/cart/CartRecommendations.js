"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

// "You might also like" cross-sell — related to what's in the cart. Compact, scrollable, with quick-add.
export default function CartRecommendations({ title = "You might also like", limit = 6 }) {
    const { items } = useCart();
    const [products, setProducts] = useState([]);
    useEffect(() => {
        const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))];
        fetch("/api/cart/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productIds }) })
            .then((r) => r.json()).then((d) => { if (!d.error) setProducts((d.products || []).slice(0, limit)); }).catch(() => {});
    }, [items.length, limit]);

    if (!products.length) return null;
    const quickAdd = (p) => {
        if ((p.colors?.length > 1) || (p.sizes?.length > 1)) {
            window.dispatchEvent(new CustomEvent("sf:quick-add-open", { detail: { productId: p.id } }));
        } else {
            window.dispatchEvent(new CustomEvent("sf:add-to-cart", { detail: {
                productId: p.id, sku: p.defaultSku || p.sku || null, title: p.title,
                priceCents: p.defaultPriceCents ?? p.priceCents, color: p.defaultColor || "", size: p.defaultSize || "", image: p.image,
            } }));
        }
    };
    return (
        <div style={{ marginTop: 22 }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 10 }}>{title}</div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, alignItems: "stretch" }}>
                {products.map((p) => (
                    <div key={p.id} style={{ flex: "0 0 144px", width: 144, display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
                        <a href={`/products/${p.slug || p.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}>
                            <div style={{ width: 144, height: 144, background: "#f3f4f6", borderRadius: 10, overflow: "hidden", flex: "none" }}>
                                {p.image && <img src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                            </div>
                            <div style={{ marginTop: 6, fontSize: "0.82rem", fontWeight: 600, lineHeight: "1.2", height: "2.4em", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.title}</div>
                            <div style={{ marginTop: 2, fontSize: "0.82rem", color: p.onSale ? "#dc2626" : "var(--sf-secondary)", fontWeight: 700 }}>${((p.priceCents || 0) / 100).toFixed(2)}</div>
                        </a>
                        <button onClick={() => quickAdd(p)} style={{ marginTop: "auto", width: "100%", padding: "6px 0", borderRadius: 8, border: "1px solid var(--sf-accent,#f59e0b)", background: "#fff", color: "var(--sf-accent,#f59e0b)", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>+ Add</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
