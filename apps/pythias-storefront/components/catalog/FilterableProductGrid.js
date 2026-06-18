"use client";
import { useEffect, useMemo, useState } from "react";
import FavoriteHeart from "@/components/favorites/FavoriteHeart";
import { useI18n } from "@/components/i18n/I18nProvider";
import { ProductCard } from "@pythias/storefront";

const uniq = (arr) => [...new Set(arr)].sort();

// Faceted, sortable product grid. Filtering runs client-side on the provided result set. Filters show
// either as a live sidebar or behind a "Filters" button that opens a drawer — chosen per device, with a
// configurable drawer side. Card swatches/alt-view honor the store's catalog settings.
export default function FilterableProductGrid({ products = [], emptyText = "No products found.", urlMode = "slug", catalog = {} }) {
    const { price: money } = useI18n();
    const cfg = {
        desktop: catalog?.filterDisplay?.desktop || "sidebar",
        mobile: catalog?.filterDisplay?.mobile || "menu",
        drawerSide: catalog?.drawerSide || "left",
        filters: { department: true, category: true, color: true, size: true, brand: true, price: true, ...(catalog?.filters || {}) },
        showSwatches: catalog?.showSwatches !== false,
        showAltView: catalog?.showAltView !== false,
        quickAdd: catalog?.quickAdd !== false,
    };

    // Pick the display mode for the current viewport (default to desktop server-side to avoid hydration flash).
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        const on = () => setIsMobile(mq.matches);
        on(); mq.addEventListener?.("change", on);
        return () => mq.removeEventListener?.("change", on);
    }, []);
    const mode = isMobile ? cfg.mobile : cfg.desktop;
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [ratings, setRatings] = useState({});
    useEffect(() => {
        const ids = products.map((p) => p.id).filter(Boolean);
        if (!ids.length) return;
        fetch("/api/products/ratings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) })
            .then((r) => r.json()).then((d) => !d.error && setRatings(d.ratings || {})).catch(() => {});
    }, [products]);

    const [colors, setColors] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [brands, setBrands] = useState([]);
    const [depts, setDepts] = useState([]);
    const [cats, setCats] = useState([]);
    const [maxPrice, setMaxPrice] = useState(0);
    const [sort, setSort] = useState("featured");
    const [expanded, setExpanded] = useState({});   // which facet groups are showing all options

    const facets = useMemo(() => ({
        departments: uniq(products.flatMap((p) => p.departments || [])),
        categories: uniq(products.flatMap((p) => p.categories || [])),
        colors: uniq(products.flatMap((p) => p.colors || [])),
        sizes: uniq(products.flatMap((p) => p.sizes || [])),
        brands: uniq(products.map((p) => p.brand).filter(Boolean)),
        priceMax: Math.max(0, ...products.map((p) => p.priceCents || 0)),
    }), [products]);

    const toggle = (setter, list, v) => setter(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
    const activeCount = colors.length + sizes.length + brands.length + depts.length + cats.length + (maxPrice ? 1 : 0);
    const Stars = ({ avg }) => <span style={{ color: "#f59e0b", fontSize: "0.8rem" }}>{"★★★★★".slice(0, Math.round(avg))}{"☆☆☆☆☆".slice(0, 5 - Math.round(avg))}</span>;

    const shown = useMemo(() => {
        let r = products.filter((p) =>
            (!depts.length || (p.departments || []).some((d) => depts.includes(d))) &&
            (!cats.length || (p.categories || []).some((c) => cats.includes(c))) &&
            (!colors.length || (p.colors || []).some((c) => colors.includes(c))) &&
            (!sizes.length || (p.sizes || []).some((s) => sizes.includes(s))) &&
            (!brands.length || brands.includes(p.brand)) &&
            (!maxPrice || (p.priceCents || 0) <= maxPrice)
        );
        if (sort === "price-asc") r = [...r].sort((a, b) => a.priceCents - b.priceCents);
        else if (sort === "price-desc") r = [...r].sort((a, b) => b.priceCents - a.priceCents);
        else if (sort === "title") r = [...r].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        return r;
    }, [products, depts, cats, colors, sizes, brands, maxPrice, sort]);

    const hasFilters = cfg.filters.department || cfg.filters.category || cfg.filters.color || cfg.filters.size || cfg.filters.brand || cfg.filters.price;

    // Color name → hex, gathered from the cards' swatch data (for colored filter chips).
    const colorHex = useMemo(() => {
        const m = {};
        for (const p of products) for (const c of (p.colorImages || [])) if (c.name && c.hex && !m[c.name]) m[c.name] = c.hex;
        return m;
    }, [products]);

    // ── inline JSX (not nested components → no remount / focus loss) ──
    const FACET_LIMIT = 10;   // show this many, then a "+N more" toggle
    const group = (label, options, selected, setter, swatchOf) => {
        if (!options.length) return null;
        const open = !!expanded[label];
        const visible = open ? options : options.slice(0, FACET_LIMIT);
        return (
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: 6 }}>{label}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {visible.map((o) => {
                        const on = selected.includes(o);
                        const hex = swatchOf ? swatchOf(o) : null;
                        return (
                            <button key={o} onClick={() => toggle(setter, selected, o)} style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "4px 10px", borderRadius: 999, fontSize: "0.8rem", cursor: "pointer",
                                border: `1px solid ${on ? "var(--sf-accent,#f59e0b)" : "rgba(0,0,0,0.18)"}`,
                                background: on ? "var(--sf-accent,#f59e0b)" : "#fff", color: on ? "#fff" : "#334155",
                            }}>
                                {hex && <span style={{ width: 13, height: 13, borderRadius: "50%", background: hex, border: "1px solid rgba(0,0,0,0.3)", flexShrink: 0 }} />}
                                {o}
                            </button>
                        );
                    })}
                    {options.length > FACET_LIMIT && (
                        <button onClick={() => setExpanded((e) => ({ ...e, [label]: !open }))} style={{ padding: "4px 10px", borderRadius: 999, fontSize: "0.8rem", cursor: "pointer", border: "1px dashed rgba(0,0,0,0.28)", background: "#fff", color: "#64748b" }}>
                            {open ? "Show less" : `+${options.length - FACET_LIMIT} more`}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const filtersJsx = (
        <>
            {cfg.filters.department && group("Department", facets.departments, depts, setDepts)}
            {cfg.filters.category && group("Category", facets.categories, cats, setCats)}
            {cfg.filters.color && group("Color", facets.colors, colors, setColors, (o) => colorHex[o])}
            {cfg.filters.size && group("Size", facets.sizes, sizes, setSizes)}
            {cfg.filters.brand && group("Brand", facets.brands, brands, setBrands)}
            {cfg.filters.price && facets.priceMax > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: 6 }}>Max price: {maxPrice ? money(maxPrice) : "Any"}</div>
                    <input type="range" min={0} max={facets.priceMax} step={100} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} style={{ width: "100%" }} />
                </div>
            )}
            {activeCount > 0 && <button onClick={() => { setDepts([]); setCats([]); setColors([]); setSizes([]); setBrands([]); setMaxPrice(0); }} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.82rem", padding: 0 }}>Clear filters</button>}
        </>
    );

    const sortJsx = (
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", fontSize: "0.85rem" }}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="title">Name A–Z</option>
        </select>
    );

    const resultsJsx = shown.length === 0 ? <p style={{ opacity: 0.6 }}>{emptyText}</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 22 }}>
            {shown.map((p) => (
                <div key={p.id} style={{ position: "relative" }}>
                    <FavoriteHeart overlay product={{ productId: p.id, title: p.title, image: p.image, priceCents: p.priceCents }} />
                    <ProductCard product={p} urlMode={urlMode} rating={ratings[p.id]} showSwatches={cfg.showSwatches} showAltView={cfg.showAltView} quickAdd={cfg.quickAdd} />
                </div>
            ))}
        </div>
    );

    // ── Sidebar (live) layout ──
    if (mode === "sidebar" && hasFilters) {
        return (
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 28, alignItems: "start" }}>
                <aside>{filtersJsx}</aside>
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <span style={{ color: "#64748b", fontSize: "0.88rem" }}>{shown.length} product{shown.length === 1 ? "" : "s"}</span>
                        {sortJsx}
                    </div>
                    {resultsJsx}
                </div>
            </div>
        );
    }

    // ── Drawer (button) layout ──
    const side = cfg.drawerSide;
    const horizontal = side === "left" || side === "right";
    const panelStyle = {
        position: "fixed", background: "#fff", zIndex: 1300, boxShadow: "0 0 40px rgba(0,0,0,0.25)", overflow: "auto", padding: 20,
        ...(horizontal
            ? { top: 0, bottom: 0, width: "min(340px, 86vw)", [side]: 0 }
            : { left: 0, right: 0, height: "min(70vh, 520px)", [side]: 0 }),
    };
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {hasFilters && (
                        <button onClick={() => setDrawerOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", background: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
                            <span style={{ fontSize: "1rem", lineHeight: 1 }}>⚙</span> Filters{activeCount ? ` (${activeCount})` : ""}
                        </button>
                    )}
                    <span style={{ color: "#64748b", fontSize: "0.88rem" }}>{shown.length} product{shown.length === 1 ? "" : "s"}</span>
                </div>
                {sortJsx}
            </div>
            {resultsJsx}

            {hasFilters && drawerOpen && (
                <>
                    <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1290 }} />
                    <div style={panelStyle}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                            <span style={{ fontWeight: 800, fontSize: "1.05rem", flex: 1 }}>Filters</span>
                            <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", fontSize: "1.4rem", lineHeight: 1, cursor: "pointer", color: "#64748b" }}>×</button>
                        </div>
                        {filtersJsx}
                        <button onClick={() => setDrawerOpen(false)} style={{ marginTop: 12, width: "100%", padding: "11px 0", borderRadius: 8, border: "none", background: "var(--sf-accent,#f59e0b)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                            Show {shown.length} result{shown.length === 1 ? "" : "s"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
