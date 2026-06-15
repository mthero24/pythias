"use client";
import { useEffect, useMemo, useState } from "react";
import FavoriteHeart from "@/components/favorites/FavoriteHeart";
import { useI18n } from "@/components/i18n/I18nProvider";

const uniq = (arr) => [...new Set(arr)].sort();
const Stars = ({ avg }) => <span style={{ color: "#f59e0b", fontSize: "0.8rem" }}>{"★★★★★".slice(0, Math.round(avg))}{"☆☆☆☆☆".slice(0, 5 - Math.round(avg))}</span>;

// Faceted, sortable product grid. Filtering runs client-side on the provided result set, so
// facets always reflect what's actually shown. Used by /search and /collections/[slug].
export default function FilterableProductGrid({ products = [], emptyText = "No products found." }) {
    const { price: money } = useI18n();
    const [ratings, setRatings] = useState({});

    // Fetch star ratings for the shown products (social proof on cards).
    useEffect(() => {
        const ids = products.map((p) => p.id).filter(Boolean);
        if (!ids.length) return;
        fetch("/api/products/ratings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) })
            .then((r) => r.json()).then((d) => !d.error && setRatings(d.ratings || {})).catch(() => {});
    }, [products]);
    const [colors, setColors] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [brands, setBrands] = useState([]);
    const [maxPrice, setMaxPrice] = useState(0);   // 0 = no cap
    const [sort, setSort] = useState("featured");

    const facets = useMemo(() => ({
        colors: uniq(products.flatMap((p) => p.colors || [])),
        sizes: uniq(products.flatMap((p) => p.sizes || [])),
        brands: uniq(products.map((p) => p.brand).filter(Boolean)),
        priceMax: Math.max(0, ...products.map((p) => p.priceCents || 0)),
    }), [products]);

    const toggle = (setter, list, v) => setter(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

    const shown = useMemo(() => {
        let r = products.filter((p) =>
            (!colors.length || (p.colors || []).some((c) => colors.includes(c))) &&
            (!sizes.length || (p.sizes || []).some((s) => sizes.includes(s))) &&
            (!brands.length || brands.includes(p.brand)) &&
            (!maxPrice || (p.priceCents || 0) <= maxPrice)
        );
        if (sort === "price-asc") r = [...r].sort((a, b) => a.priceCents - b.priceCents);
        else if (sort === "price-desc") r = [...r].sort((a, b) => b.priceCents - a.priceCents);
        else if (sort === "title") r = [...r].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        return r;
    }, [products, colors, sizes, brands, maxPrice, sort]);

    const Group = ({ label, options, selected, setter }) => options.length > 0 && (
        <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: 6 }}>{label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {options.map((o) => {
                    const on = selected.includes(o);
                    return <button key={o} onClick={() => toggle(setter, selected, o)} style={{
                        padding: "4px 10px", borderRadius: 999, fontSize: "0.8rem", cursor: "pointer",
                        border: `1px solid ${on ? "var(--sf-accent,#f59e0b)" : "rgba(0,0,0,0.18)"}`,
                        background: on ? "var(--sf-accent,#f59e0b)" : "#fff", color: on ? "#fff" : "#334155",
                    }}>{o}</button>;
                })}
            </div>
        </div>
    );

    return (
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 28, alignItems: "start" }}>
            {/* Filters */}
            <aside>
                <Group label="Color" options={facets.colors} selected={colors} setter={setColors} />
                <Group label="Size" options={facets.sizes} selected={sizes} setter={setSizes} />
                <Group label="Brand" options={facets.brands} selected={brands} setter={setBrands} />
                {facets.priceMax > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: 6 }}>Max price: {maxPrice ? money(maxPrice) : "Any"}</div>
                        <input type="range" min={0} max={facets.priceMax} step={100} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} style={{ width: "100%" }} />
                    </div>
                )}
                {(colors.length || sizes.length || brands.length || maxPrice) ? (
                    <button onClick={() => { setColors([]); setSizes([]); setBrands([]); setMaxPrice(0); }} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.82rem", padding: 0 }}>Clear filters</button>
                ) : null}
            </aside>

            {/* Results */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ color: "#64748b", fontSize: "0.88rem" }}>{shown.length} product{shown.length === 1 ? "" : "s"}</span>
                    <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", fontSize: "0.85rem" }}>
                        <option value="featured">Featured</option>
                        <option value="price-asc">Price: low to high</option>
                        <option value="price-desc">Price: high to low</option>
                        <option value="title">Name A–Z</option>
                    </select>
                </div>
                {shown.length === 0 ? <p style={{ opacity: 0.6 }}>{emptyText}</p> : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 22 }}>
                        {shown.map((p) => (
                            <div key={p.id} style={{ position: "relative" }}>
                                <FavoriteHeart overlay product={{ productId: p.id, title: p.title, image: p.image, priceCents: p.priceCents }} />
                                <a href={`/products/${p.id}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                                    <div style={{ aspectRatio: "1/1", background: "#f3f4f6", borderRadius: 10, overflow: "hidden" }}>
                                        {p.image && <img src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                    </div>
                                    <div style={{ marginTop: 10, fontWeight: 600, fontSize: "0.95rem" }}>{p.title}</div>
                                    {ratings[p.id] && <div><Stars avg={ratings[p.id].avg} /> <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>({ratings[p.id].count})</span></div>}
                                    {p.priceCents > 0 && <div style={{ color: "var(--sf-secondary)", fontWeight: 700, marginTop: 2 }}>{money(p.priceCents)}</div>}
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
