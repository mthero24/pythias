"use client";
import { useFavorites } from "./FavoritesProvider";

// Heart toggle. `product` = { productId, title, image, priceCents, sku?, color?, size? }.
// `overlay` floats it in the top-right of a product card; otherwise it renders inline.
export default function FavoriteHeart({ product, overlay = false, size = 22 }) {
    const { isFavorite, toggle, ready } = useFavorites();
    if (!ready) return null;
    const active = isFavorite(product.productId);

    const onClick = (e) => { e.preventDefault(); e.stopPropagation(); toggle(product); };

    const overlaySx = overlay ? {
        position: "absolute", top: 8, right: 8, zIndex: 2,
        background: "rgba(255,255,255,0.92)", borderRadius: 999, width: 34, height: 34,
        boxShadow: "0 1px 6px rgba(0,0,0,.15)",
    } : {};

    return (
        <button
            onClick={onClick}
            aria-label={active ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={active}
            title={active ? "In your favorites" : "Add to favorites"}
            style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                border: "none", cursor: "pointer", background: overlay ? undefined : "transparent",
                padding: 0, lineHeight: 1, fontSize: size, color: active ? "#e11d48" : "#94a3b8",
                ...overlaySx,
            }}
        >
            {active ? "♥" : "♡"}
        </button>
    );
}
