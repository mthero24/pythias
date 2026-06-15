"use client";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import FavoriteHeart from "@/components/favorites/FavoriteHeart";
import { track } from "@/components/analytics/tracker";
import { useI18n } from "@/components/i18n/I18nProvider";

// Variant selector + price + add-to-cart.
export default function BuyBox({ productId, title, images = [], variants = [] }) {
    const { add } = useCart();
    const { price: fmtPrice, t } = useI18n();
    const colors = useMemo(() => [...new Set(variants.map((v) => v.color).filter(Boolean))], [variants]);
    const sizes  = useMemo(() => [...new Set(variants.map((v) => v.size).filter(Boolean))], [variants]);

    const [color, setColor] = useState(colors[0] ?? "");
    const [size, setSize]   = useState(sizes[0] ?? "");
    const [added, setAdded] = useState(false);

    // Product analytics: count a product view.
    useEffect(() => { track("product_view", { productId }); }, [productId]);

    const match = useMemo(() => (
        variants.find((v) => (colors.length ? v.color === color : true) && (sizes.length ? v.size === size : true)) ?? variants[0] ?? null
    ), [variants, colors, sizes, color, size]);

    const price = match?.price ?? Math.min(...variants.map((v) => v.price ?? Infinity).filter((n) => n > 0));
    const priceLabel = Number.isFinite(price) ? fmtPrice(Math.round(price * 100)) : "—";

    const selectSx = { padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)", fontSize: "0.95rem", minWidth: 140 };

    const addToCart = () => {
        if (!match) return;
        add({
            productId, sku: match.sku, title,
            priceCents: Math.round((match.price || 0) * 100),
            color: match.color || "", size: match.size || "",
            image: match.image || images[0] || null,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2500);
    };

    return (
        <div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--sf-secondary)", marginBottom: 20 }}>{priceLabel}</div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
                {colors.length > 0 && (
                    <label style={{ display: "block", fontSize: "0.85rem" }}>
                        <span style={{ display: "block", marginBottom: 6, opacity: 0.7 }}>Color</span>
                        <select value={color} onChange={(e) => setColor(e.target.value)} style={selectSx}>
                            {colors.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>
                )}
                {sizes.length > 0 && (
                    <label style={{ display: "block", fontSize: "0.85rem" }}>
                        <span style={{ display: "block", marginBottom: 6, opacity: 0.7 }}>Size</span>
                        <select value={size} onChange={(e) => setSize(e.target.value)} style={selectSx}>
                            {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </label>
                )}
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
                <button onClick={addToCart} style={{
                    padding: "14px 32px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: "var(--sf-accent)", color: "#fff", fontWeight: 700, fontSize: "1rem",
                }}>
                    {added ? `${t("product.added", "Added")} ✓` : t("product.addToCart", "Add to cart")}
                </button>
                <FavoriteHeart size={28} product={{
                    productId, title,
                    image: match?.image || images[0] || null,
                    priceCents: Number.isFinite(price) ? Math.round(price * 100) : 0,
                    sku: match?.sku || "", color: match?.color || "", size: match?.size || "",
                }} />
            </div>
            {added && <a href="/cart" style={{ marginLeft: 16, color: "var(--sf-secondary)", fontWeight: 600 }}>View cart →</a>}
        </div>
    );
}
