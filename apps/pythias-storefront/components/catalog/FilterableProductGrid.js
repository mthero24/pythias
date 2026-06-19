"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import FavoriteHeart from "@/components/favorites/FavoriteHeart";
import { useI18n } from "@/components/i18n/I18nProvider";
import { ProductCard } from "@pythias/storefront";

// Faceted, sortable product grid.
//   • Server mode (searchContext + initialFacets present → Atlas faceting): filtering, sorting and facet
//     COUNTS come from the server across the whole catalog (POST /api/search). Counts reflect the term's
//     full availability so multi-select within a facet stays usable.
//   • Client mode (collections, or Atlas unavailable): filters run in-memory on the provided result set,
//     counts are computed from the loaded products.
// Cards show the product's default color, except: when a color filter is active the card switches to that
// color's image (and clicking a swatch on the card still overrides locally).
export default function FilterableProductGrid({ products = [], emptyText = "No products found.", urlMode = "slug", catalog = {}, initialFacets = null, initialTags = [], searchContext = null }) {
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

    const serverMode = !!(searchContext && initialFacets);

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

    // The displayed result set + facet counts. Seeded from SSR; in server mode they're replaced by fetches.
    const [items, setItems] = useState(products);
    const [facetData, setFacetData] = useState(initialFacets);
    const [tags, setTags] = useState(initialTags);
    const [loading, setLoading] = useState(false);
    useEffect(() => { setItems(products); }, [products]);
    useEffect(() => { setFacetData(initialFacets); }, [initialFacets]);
    useEffect(() => { setTags(initialTags); }, [initialTags]);

    // Tag bar scroll affordance — fade the edge that has more content (so a hidden scrollbar still hints
    // it's scrollable, on mobile especially where the OS hides scrollbars).
    const tagScrollRef = useRef(null);
    const [tagEdges, setTagEdges] = useState({ start: false, end: false });
    useEffect(() => {
        const el = tagScrollRef.current;
        if (!el) return;
        const update = () => setTagEdges({ start: el.scrollLeft > 2, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
        update();
        el.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
    }, [tags]);

    const [ratings, setRatings] = useState({});
    useEffect(() => {
        const ids = items.map((p) => p.id).filter(Boolean);
        if (!ids.length) return;
        fetch("/api/products/ratings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) })
            .then((r) => r.json()).then((d) => !d.error && setRatings(d.ratings || {})).catch(() => {});
    }, [items]);

    const [colors, setColors] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [brands, setBrands] = useState([]);
    const [depts, setDepts] = useState([]);
    const [cats, setCats] = useState([]);
    const [maxPrice, setMaxPrice] = useState(0);
    const [sort, setSort] = useState("featured");
    const [expanded, setExpanded] = useState({});   // which facet groups are showing all options

    // Server mode: re-query when filters/sort change (debounced). Skip the first run — SSR already has the
    // unfiltered page + facets, so we'd otherwise fire a redundant fetch on mount.
    const firstRun = useRef(true);
    useEffect(() => {
        if (!serverMode) return;
        if (firstRun.current) { firstRun.current = false; return; }
        const ctrl = new AbortController();
        setLoading(true);
        const t = setTimeout(() => {
            fetch("/api/search", {
                method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
                body: JSON.stringify({ q: searchContext.q || "", sort, filters: { departments: depts, categories: cats, colors, sizes, brands, maxPriceCents: maxPrice } }),
            }).then((r) => r.json()).then((d) => {
                if (!d.error) { setItems(d.products || []); if (d.facets) setFacetData(d.facets); if (d.tags) setTags(d.tags); }
            }).catch(() => {}).finally(() => setLoading(false));
        }, 250);
        return () => { clearTimeout(t); ctrl.abort(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverMode, depts, cats, colors, sizes, brands, maxPrice, sort, searchContext?.q]);

    // Facet options as [{value, count}]. Server mode → counts from the server; client mode → counts from
    // the loaded set. Per-facet fallback: if a server facet is empty (e.g. color/size before the facet
    // backfill runs), derive that facet from the loaded products so the filter doesn't disappear.
    const facetOptions = useMemo(() => {
        const count = (vals) => {
            const m = new Map();
            for (const v of vals) { if (v == null) continue; m.set(v, (m.get(v) || 0) + 1); }
            return [...m.entries()].map(([value, c]) => ({ value, count: c })).sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)));
        };
        const client = {
            departments: count(products.flatMap((p) => p.departments || [])),
            categories:  count(products.flatMap((p) => p.categories || [])),
            colors:      count(products.flatMap((p) => p.colors || [])),
            sizes:       count(products.flatMap((p) => p.sizes || [])),
            brands:      count(products.map((p) => p.brand).filter(Boolean)),
        };
        if (serverMode && facetData) {
            const pref = (key) => (facetData[key]?.length ? facetData[key] : client[key]);
            return { departments: pref("departments"), categories: pref("categories"), colors: pref("colors"), sizes: pref("sizes"), brands: pref("brands") };
        }
        return client;
    }, [serverMode, facetData, products]);

    // Stable price ceiling for the slider — from the initial (unfiltered) SSR set.
    const priceMax = useMemo(() => Math.max(0, ...products.map((p) => p.priceCents || 0)), [products]);

    const toggle = (setter, list, v) => setter(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
    const activeCount = colors.length + sizes.length + brands.length + depts.length + cats.length + (maxPrice ? 1 : 0);
    const clearAll = () => { setDepts([]); setCats([]); setColors([]); setSizes([]); setBrands([]); setMaxPrice(0); };

    // Server mode: items are already filtered + sorted by the server. Client mode: filter + sort in-memory.
    const shown = useMemo(() => {
        if (serverMode) return items;
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
    }, [serverMode, items, products, depts, cats, colors, sizes, brands, maxPrice, sort]);

    const hasFilters = cfg.filters.department || cfg.filters.category || cfg.filters.color || cfg.filters.size || cfg.filters.brand || cfg.filters.price;

    // Color name → hex, gathered from the cards' swatch data (for colored filter chips).
    const colorHex = useMemo(() => {
        const m = {};
        for (const p of products) for (const c of (p.colorImages || [])) if (c.name && c.hex && !m[c.name]) m[c.name] = c.hex;
        for (const p of items) for (const c of (p.colorImages || [])) if (c.name && c.hex && !m[c.name]) m[c.name] = c.hex;
        return m;
    }, [products, items]);

    // When a color filter is active, show that color on each card (first selected color the product offers).
    const preferColorFor = (p) => (colors.length ? colors.find((c) => (p.colors || []).includes(c)) || null : null);

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
                        const val = o.value;
                        const on = selected.includes(val);
                        const hex = swatchOf ? swatchOf(val) : null;
                        return (
                            <button key={val} onClick={() => toggle(setter, selected, val)} style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "4px 10px", borderRadius: 999, fontSize: "0.8rem", cursor: "pointer",
                                border: `1px solid ${on ? "var(--sf-accent,#f59e0b)" : "rgba(0,0,0,0.18)"}`,
                                background: on ? "var(--sf-accent,#f59e0b)" : "#fff", color: on ? "#fff" : "#334155",
                            }}>
                                {hex && <span style={{ width: 13, height: 13, borderRadius: "50%", background: hex, border: "1px solid rgba(0,0,0,0.3)", flexShrink: 0 }} />}
                                {val}{o.count != null && <span style={{ opacity: 0.6, fontSize: "0.72rem" }}>{o.count}</span>}
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
            {cfg.filters.department && group("Department", facetOptions.departments, depts, setDepts)}
            {cfg.filters.category && group("Category", facetOptions.categories, cats, setCats)}
            {cfg.filters.color && group("Color", facetOptions.colors, colors, setColors, (o) => colorHex[o])}
            {cfg.filters.size && group("Size", facetOptions.sizes, sizes, setSizes)}
            {cfg.filters.brand && group("Brand", facetOptions.brands, brands, setBrands)}
            {cfg.filters.price && priceMax > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: 6 }}>Max price: {maxPrice ? money(maxPrice) : "Any"}</div>
                    <input type="range" min={0} max={priceMax} step={100} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} style={{ width: "100%" }} />
                </div>
            )}
            {activeCount > 0 && <button onClick={clearAll} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.82rem", padding: 0 }}>Clear filters</button>}
        </>
    );

    // Clickable, horizontally scrollable "related searches" bar — tags from the current results. Sits
    // between the page heading and the filters; each tag links to its search/landing page.
    const tagHref = (t) => `/products/${encodeURIComponent(String(t).toLowerCase().replace(/\s+/g, "-"))}`;
    const tagBarJsx = tags.length > 0 ? (
        <div style={{ position: "relative", marginBottom: 4 }}>
            <div ref={tagScrollRef} className="sf-tagbar" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 0 14px" }}>
                <style>{".sf-tagbar{-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;scrollbar-width:none;scroll-snap-type:x proximity}.sf-tagbar::-webkit-scrollbar{display:none}.sf-tagbar>a{scroll-snap-align:start}"}</style>
                {tags.map((t) => (
                    <a key={t} href={tagHref(t)} style={{ flex: "0 0 auto", padding: "6px 14px", borderRadius: 999, fontSize: "0.82rem", whiteSpace: "nowrap",
                        border: "1px solid rgba(0,0,0,0.15)", background: "#fff", color: "var(--sf-text)", textDecoration: "none" }}>{t}</a>
                ))}
            </div>
            {tagEdges.start && <div style={{ position: "absolute", left: 0, top: 0, bottom: 14, width: 36, pointerEvents: "none", background: "linear-gradient(to right, var(--sf-bg,#fff), transparent)" }} />}
            {tagEdges.end && <div style={{ position: "absolute", right: 0, top: 0, bottom: 14, width: 36, pointerEvents: "none", background: "linear-gradient(to left, var(--sf-bg,#fff), transparent)" }} />}
        </div>
    ) : null;

    const sortJsx = (
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", fontSize: "0.85rem" }}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="title">Name A–Z</option>
        </select>
    );

    const resultsJsx = shown.length === 0 ? <p style={{ opacity: 0.6 }}>{loading ? "Loading…" : emptyText}</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 22, opacity: loading ? 0.55 : 1, transition: "opacity 150ms" }}>
            {shown.map((p) => (
                <div key={p.id} style={{ position: "relative" }}>
                    <FavoriteHeart overlay product={{ productId: p.id, title: p.title, image: p.image, priceCents: p.priceCents }} />
                    <ProductCard product={p} urlMode={urlMode} rating={ratings[p.id]} preferColor={preferColorFor(p)} showSwatches={cfg.showSwatches} showAltView={cfg.showAltView} quickAdd={cfg.quickAdd} />
                </div>
            ))}
        </div>
    );

    const countLabel = `${shown.length}${loading ? "…" : ""} product${shown.length === 1 ? "" : "s"}`;

    // ── Sidebar (live) layout ──
    if (mode === "sidebar" && hasFilters) {
        return (
            <>
                {tagBarJsx}
                <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 28, alignItems: "start" }}>
                    <aside>{filtersJsx}</aside>
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <span style={{ color: "#64748b", fontSize: "0.88rem" }}>{countLabel}</span>
                            {sortJsx}
                        </div>
                        {resultsJsx}
                    </div>
                </div>
            </>
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
            {tagBarJsx}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {hasFilters && (
                        <button onClick={() => setDrawerOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", background: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
                            <span style={{ fontSize: "1rem", lineHeight: 1 }}>⚙</span> Filters{activeCount ? ` (${activeCount})` : ""}
                        </button>
                    )}
                    <span style={{ color: "#64748b", fontSize: "0.88rem" }}>{countLabel}</span>
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
