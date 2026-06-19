"use client";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { useI18n } from "@/components/i18n/I18nProvider";

export default function FavoritesView() {
    const { favorites, ready, remove } = useFavorites();
    const { price: money } = useI18n();

    if (!ready) return null;

    if (!favorites.length) {
        return (
            <section className="sf-container" style={{ paddingTop: 64, paddingBottom: 64, textAlign: "center" }}>
                <h1 style={{ marginBottom: 8 }}>No favorites yet</h1>
                <p style={{ opacity: 0.6, marginBottom: 12 }}>Tap the ♥ on any product to save it here.</p>
                <a href="/products" style={{ color: "var(--sf-secondary)", fontWeight: 600 }}>← Browse products</a>
            </section>
        );
    }

    // Open the quick-add modal so the buyer picks color/size (favorites are product-level).
    const addToCart = (f) => {
        if (f.productId && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("sf:quick-add-open", { detail: { productId: f.productId } }));
    };

    return (
        <section className="sf-container" style={{ paddingTop: 40, paddingBottom: 40, maxWidth: 900 }}>
            <h1 style={{ marginBottom: 24 }}>Favorites ({favorites.length})</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
                {favorites.map((f) => (
                    <div key={f.productId} style={{ position: "relative" }}>
                        <a href={`/products/${f.productId}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                            <div style={{ aspectRatio: "1/1", background: "#f3f4f6", borderRadius: 10, overflow: "hidden" }}>
                                {f.image && <img src={f.image} alt={f.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                            </div>
                            <div style={{ marginTop: 10, fontWeight: 600, fontSize: "0.95rem" }}>{f.title}</div>
                            {f.priceCents > 0 && <div style={{ color: "var(--sf-secondary)", fontWeight: 700, marginTop: 2 }}>{money(f.priceCents)}</div>}
                        </a>
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <button onClick={() => addToCart(f)} style={{
                                flex: 1, padding: "9px", borderRadius: 8, border: "none", cursor: "pointer",
                                background: "var(--sf-accent, #f59e0b)", color: "#fff", fontWeight: 700, fontSize: "0.85rem",
                            }}>
                                Add to cart
                            </button>
                            <button onClick={() => remove(f.productId)} aria-label="Remove favorite" style={{
                                padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)",
                                background: "#fff", color: "#dc2626", cursor: "pointer", fontSize: "0.85rem",
                            }}>Remove</button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
