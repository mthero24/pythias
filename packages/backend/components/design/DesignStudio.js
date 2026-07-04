"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// ── Customer-facing "Design & Send In" studio ──────────────────────────────────────────────────
// A shop sends a customer a link to this page. The customer picks MULTIPLE blanks, chooses colors +
// sizes + quantities per blank, uploads ONE piece of art and positions it in a placement box, sees a
// LIVE preview of that art on every selected blank/color, fills in their contact info, and submits.
// There is NO PRICING anywhere — it creates a `requested` quote the shop prices later.
//
// Prop: { orgSlug } — optional. Premier omits it (single-tenant); the platform passes the shop slug so
// the catalog / preview / submit endpoints are scoped to that org.
const enc = encodeURIComponent;

// Append &orgSlug=… to a URL when we're on the multi-tenant (platform) side.
const withSlug = (url, orgSlug) => (orgSlug ? `${url}${url.includes("?") ? "&" : "?"}orgSlug=${enc(orgSlug)}` : url);

// Route images1-hosted catalog images through the images app (images2) for on-the-fly
// thumbnail resizing — the studio only needs small previews, not full-res source files, so
// this cuts page weight. Uses the /origin endpoint (transparent bg, format preserved). No-op
// for any non-images1 URL (renderImages previews, data: URLs, external images).
const IMG_ORIGIN = "https://images1.pythiastechnologies.com";
const IMG_RESIZER = "https://images2.pythiastechnologies.com";
const img2 = (url, width = 400) => {
    if (!url || typeof url !== "string" || !url.startsWith(IMG_ORIGIN)) return url;
    const path = url.slice(IMG_ORIGIN.length);              // "/<key>" (may include a query)
    return `${IMG_RESIZER}/origin${path}${path.includes("?") ? "&" : "?"}width=${width}`;
};

// The live preview is just an <img>: the server composites the art onto the blank-color at `place`.
// Keyed on the placement so it refetches whenever the art is moved/resized.
const previewUrl = ({ code, colorName, artUrl, place, orgSlug }) => {
    const p = place || { xPct: 0.25, yPct: 0.25, wPct: 0.5, hPct: 0.5 };
    let u = `/api/renderImages/${enc(code)}-${enc(colorName)}-front.jpg?blank=${enc(code)}&colorName=${enc(colorName)}` +
        `&design=${enc(artUrl)}&side=front&width=320&xPct=${p.xPct}&yPct=${p.yPct}&wPct=${p.wPct}&hPct=${p.hPct}`;
    if (orgSlug) u += `&orgSlug=${enc(orgSlug)}`;
    return u;
};

const clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0));

// ── shared light-theme styles (customer-facing) ──
const C = {
    accent: "#635bff",
    page: { minHeight: "100vh", background: "#f6f8fb", color: "#0f172a", fontFamily: "system-ui, -apple-system, Segoe UI, Arial, sans-serif" },
    container: { maxWidth: 980, margin: "0 auto", padding: "0 16px" },
    card: { border: "1px solid #e8edf3", borderRadius: 18, background: "#fff", boxShadow: "0 1px 3px rgba(16,24,40,0.05)" },
    field: { padding: "12px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", width: "100%", fontFamily: "inherit" },
    lbl: { fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.06em", color: "#94a3b8", textTransform: "uppercase", margin: "0 0 11px" },
};
const btn = { padding: "12px 18px", borderRadius: 999, border: "none", background: C.accent, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" };
const ghost = { ...btn, background: "#f1f5f9", color: "#334155" };

// ── placement box: lightweight pointer drag/resize over a reference image ──────────────────────
// Outputs `place = { xPct, yPct, wPct, hPct }` (0–1, relative to the rendered reference image), which
// the server uses to composite the art at the same spot on every blank/color. Mouse + touch via
// pointer events. Keeps the box at the art's natural aspect ratio when known (else a free box).
function PlacementBox({ refImage, artUrl, artAspect, place, onChange }) {
    const wrapRef = useRef(null);
    const stateRef = useRef(null); // active drag/resize gesture

    const setPlace = useCallback((next) => {
        // clamp the box fully inside the reference (0–1 space)
        let { xPct, yPct, wPct, hPct } = next;
        wPct = Math.min(Math.max(wPct, 0.05), 1);
        hPct = Math.min(Math.max(hPct, 0.05), 1);
        xPct = Math.min(Math.max(xPct, 0), 1 - wPct);
        yPct = Math.min(Math.max(yPct, 0), 1 - hPct);
        onChange({ xPct: clamp01(xPct), yPct: clamp01(yPct), wPct: clamp01(wPct), hPct: clamp01(hPct) });
    }, [onChange]);

    const rect = () => wrapRef.current?.getBoundingClientRect();

    const onPointerDown = (mode) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        const r = rect(); if (!r) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        stateRef.current = { mode, startX: e.clientX, startY: e.clientY, base: { ...place }, W: r.width, H: r.height };
    };
    const onPointerMove = (e) => {
        const s = stateRef.current; if (!s) return;
        const dx = (e.clientX - s.startX) / s.W;
        const dy = (e.clientY - s.startY) / s.H;
        if (s.mode === "move") {
            setPlace({ ...s.base, xPct: s.base.xPct + dx, yPct: s.base.yPct + dy });
        } else {
            // resize from the bottom-right handle, holding the art's aspect ratio when known
            let wPct = s.base.wPct + dx;
            let hPct;
            if (artAspect > 0) {
                // grow proportionally — drive by whichever axis moved more
                const byW = s.base.wPct + dx;
                hPct = (byW * (s.W / s.H)) / artAspect; // box w/h in px ratio == art aspect
                wPct = byW;
            } else {
                hPct = s.base.hPct + dy;
            }
            setPlace({ ...s.base, wPct, hPct });
        }
    };
    const onPointerUp = (e) => {
        if (stateRef.current) { try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch { /* ignore */ } }
        stateRef.current = null;
    };

    const boxStyle = {
        position: "absolute",
        left: `${place.xPct * 100}%`, top: `${place.yPct * 100}%`,
        width: `${place.wPct * 100}%`, height: `${place.hPct * 100}%`,
        border: `2px solid ${C.accent}`, background: "rgba(99,91,255,0.05)",
        boxSizing: "border-box", cursor: "move", touchAction: "none",
    };
    return (
        <div ref={wrapRef} style={{ position: "relative", width: "100%", maxWidth: 360, margin: "0 auto", userSelect: "none" }}>
            <img src={refImage} alt="" draggable={false} style={{ width: "100%", display: "block", borderRadius: 12, background: "#f8fafc", pointerEvents: "none" }} />
            <div
                style={boxStyle}
                onPointerDown={onPointerDown("move")}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
            >
                <img src={artUrl} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
                {/* bottom-right resize handle */}
                <div
                    onPointerDown={onPointerDown("resize")}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    style={{ position: "absolute", right: -9, bottom: -9, width: 18, height: 18, borderRadius: "50%", background: C.accent, border: "2px solid #fff", cursor: "nwse-resize", touchAction: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}
                />
            </div>
        </div>
    );
}

const SECTION = { padding: "26px 0", borderTop: "1px solid #eef2f7" };

export default function DesignStudio({ orgSlug } = {}) {
    // catalog
    const [q, setQ] = useState("");
    const [blanks, setBlanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [catalogErr, setCatalogErr] = useState("");

    // selection: blank._id -> { blank, colors:Set(colorName), qty: { "colorName::sizeName": n } }
    const [selected, setSelected] = useState({}); // keyed by blank._id

    // artwork + placement (one art, one placement, front only for v1)
    const [artUrl, setArtUrl] = useState("");
    const [artAspect, setArtAspect] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [place, setPlace] = useState({ xPct: 0.3, yPct: 0.28, wPct: 0.4, hPct: 0.4 });
    const [previewBlankId, setPreviewBlankId] = useState(null); // which selected blank to position art on

    // contact + submit
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [submitErr, setSubmitErr] = useState("");
    const [done, setDone] = useState(null); // { quoteId }

    // ── catalog load (debounced search) ──
    useEffect(() => {
        let cancelled = false;
        setLoading(true); setCatalogErr("");
        const t = setTimeout(async () => {
            try {
                let url = withSlug("/api/design/catalog", orgSlug);
                if (q.trim()) url += `${url.includes("?") ? "&" : "?"}q=${enc(q.trim())}`;
                const r = await fetch(url);
                const d = await r.json();
                if (cancelled) return;
                if (d.error) setCatalogErr(d.error);
                else setBlanks(Array.isArray(d.blanks) ? d.blanks : []);
            } catch {
                if (!cancelled) setCatalogErr("Couldn't load the product catalog. Please try again.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, q ? 300 : 0);
        return () => { cancelled = true; clearTimeout(t); };
    }, [q, orgSlug]);

    const selectedList = Object.values(selected);

    const toggleBlank = (blank) => {
        setSelected((prev) => {
            const next = { ...prev };
            if (next[blank._id]) {
                delete next[blank._id];
                if (previewBlankId === blank._id) setPreviewBlankId(null);
            } else {
                next[blank._id] = { blank, colors: [], qty: {} };
            }
            return next;
        });
    };
    const isSelected = (id) => !!selected[id];

    const toggleColor = (blankId, colorName) => {
        setSelected((prev) => {
            const e = prev[blankId]; if (!e) return prev;
            const colors = e.colors.includes(colorName) ? e.colors.filter((c) => c !== colorName) : [...e.colors, colorName];
            // drop qty entries for a color that was just turned off
            const qty = { ...e.qty };
            if (!colors.includes(colorName)) Object.keys(qty).forEach((k) => { if (k.startsWith(`${colorName}::`)) delete qty[k]; });
            return { ...prev, [blankId]: { ...e, colors, qty } };
        });
    };
    const setQty = (blankId, colorName, sizeName, val) => {
        const n = Math.max(0, parseInt(val, 10) || 0);
        setSelected((prev) => {
            const e = prev[blankId]; if (!e) return prev;
            const qty = { ...e.qty, [`${colorName}::${sizeName}`]: n };
            return { ...prev, [blankId]: { ...e, qty } };
        });
    };

    // ── art upload ──
    const handleFiles = (fileList) => {
        const file = fileList?.[0]; if (!file) return;
        setUploading(true); setSubmitErr("");
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const r = await fetch(withSlug("/api/customizer/upload", orgSlug), {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl: reader.result }),
                });
                const d = await r.json();
                if (d.error) throw new Error(d.error);
                setArtUrl(d.url);
                // capture the art's natural aspect ratio so the placement box keeps proportions
                const img = new window.Image();
                img.onload = () => setArtAspect(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0);
                img.src = d.url;
            } catch (err) {
                setSubmitErr(err.message || "Upload failed.");
            } finally {
                setUploading(false);
            }
        };
        reader.onerror = () => { setUploading(false); setSubmitErr("Couldn't read that file."); };
        reader.readAsDataURL(file);
    };
    const onDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };

    // which blank's front to render the placement box over
    const previewBlank = (previewBlankId && selected[previewBlankId]?.blank) || selectedList[0]?.blank || null;

    // ── build the (blank × color × size, qty>0) preview tiles ──
    const previewTiles = [];
    if (artUrl) {
        for (const { blank, colors, qty } of selectedList) {
            for (const colorName of colors) {
                const hasQty = Object.keys(qty).some((k) => k.startsWith(`${colorName}::`) && qty[k] > 0);
                if (!hasQty) continue;
                previewTiles.push({
                    key: `${blank._id}-${colorName}`,
                    label: `${blank.name} · ${colorName}`,
                    url: previewUrl({ code: blank.code, colorName, artUrl, place, orgSlug }),
                });
            }
        }
    }

    // ── build the order lines (one per blank × color × size with qty>0) ──
    const buildLines = () => {
        const lines = [];
        for (const { blank, colors, qty } of selectedList) {
            for (const colorName of colors) {
                const image = previewUrl({ code: blank.code, colorName, artUrl, place, orgSlug });
                for (const size of (blank.sizes || [])) {
                    const n = qty[`${colorName}::${size.name}`] || 0;
                    if (n <= 0) continue;
                    lines.push({
                        blank: blank._id, styleCode: blank.code, colorName, sizeName: size.name,
                        quantity: n, printType: "",
                        image,
                        design: { front: artUrl },
                        personalization: {
                            mode: "design-send-in", side: "front", artworkUrl: artUrl,
                            sides: [{ view: "front", location: "front", artworkUrl: artUrl, place: { ...place } }],
                        },
                    });
                }
            }
        }
        return lines;
    };

    const lines = artUrl ? buildLines() : [];
    const totalPieces = lines.reduce((s, l) => s + l.quantity, 0);
    const canSubmit = !!email.trim() && lines.length > 0 && !busy;

    const submit = async () => {
        setSubmitErr("");
        if (!email.trim()) { setSubmitErr("Please enter your email so we can send your quote."); return; }
        if (!artUrl) { setSubmitErr("Please upload your artwork first."); return; }
        if (lines.length === 0) { setSubmitErr("Add at least one color/size with a quantity."); return; }
        setBusy(true);
        try {
            const body = {
                customer: { name: name.trim(), email: email.trim(), phone: phone.trim() },
                message: message.trim(),
                lines,
            };
            if (orgSlug) body.orgSlug = orgSlug;
            const r = await fetch(withSlug("/api/quotes/request", orgSlug), {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
            });
            const d = await r.json();
            if (d.error) throw new Error(d.error);
            setDone({ quoteId: d.quoteId });
        } catch (err) {
            setSubmitErr(err.message || "Something went wrong sending your request.");
        } finally {
            setBusy(false);
        }
    };

    // ── confirmation screen ──
    if (done) {
        return (
            <div style={C.page}>
                <div style={{ ...C.container, paddingTop: 80, paddingBottom: 80, textAlign: "center" }}>
                    <div style={{ fontSize: 56 }}>✅</div>
                    <h1 style={{ fontSize: "1.7rem", margin: "14px 0 8px" }}>Request sent!</h1>
                    <p style={{ color: "#475569", fontSize: "1.05rem", margin: 0 }}>
                        We&apos;ll review your design and email your quote to <b>{email}</b>.
                    </p>
                    {done.quoteId && <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 16 }}>Reference: {done.quoteId}</p>}
                </div>
            </div>
        );
    }

    const stepHead = (n, title, sub) => (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", background: C.accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem", flexShrink: 0 }}>{n}</span>
                <h2 style={{ fontSize: "1.2rem", margin: 0, fontWeight: 800 }}>{title}</h2>
            </div>
            {sub && <p style={{ color: "#64748b", margin: "6px 0 0", fontSize: "0.9rem" }}>{sub}</p>}
        </div>
    );

    return (
        <div style={C.page}>
            <div style={C.container}>
                <header style={{ padding: "34px 0 4px" }}>
                    <h1 style={{ fontSize: "2rem", margin: "0 0 6px", fontWeight: 800, letterSpacing: "-0.02em" }}>Design &amp; Send In</h1>
                    <p style={{ color: "#64748b", margin: 0, fontSize: "1rem" }}>
                        Pick your products, drop in your artwork, and send us a request. We&apos;ll email you a quote — no payment needed now.
                    </p>
                </header>

                {/* ── Step 1: pick products ── */}
                <section style={SECTION}>
                    {stepHead(1, "Pick your products", "Tap a product to add it. You can select as many as you like.")}
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" style={{ ...C.field, marginBottom: 16 }} />
                    {loading ? (
                        <p style={{ color: "#94a3b8" }}>Loading products…</p>
                    ) : catalogErr ? (
                        <p style={{ color: "#dc2626" }}>{catalogErr}</p>
                    ) : blanks.length === 0 ? (
                        <p style={{ color: "#94a3b8" }}>No products found{q ? ` for “${q}”` : ""}.</p>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                            {blanks.map((b) => {
                                const on = isSelected(b._id);
                                return (
                                    <button key={b._id} onClick={() => toggleBlank(b)} style={{ position: "relative", textAlign: "left", border: `2px solid ${on ? C.accent : "#eef2f7"}`, borderRadius: 14, background: "#fff", padding: 8, cursor: "pointer" }}>
                                        <div style={{ width: "100%", aspectRatio: "1", background: "#f8fafc", borderRadius: 10, overflow: "hidden" }}>
                                            {b.image && <img src={img2(b.image, 280)} alt={b.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
                                        </div>
                                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginTop: 7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                                        {(b.brand || b.code) && <div style={{ fontSize: "0.72rem", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.brand || b.code}</div>}
                                        {on && <span style={{ position: "absolute", top: -8, right: -8, width: 24, height: 24, borderRadius: "50%", background: C.accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800 }}>✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {selectedList.length > 0 && (
                        <div style={{ marginTop: 16, fontSize: "0.9rem", color: "#475569" }}>
                            <b>{selectedList.length}</b> product{selectedList.length === 1 ? "" : "s"} selected.
                        </div>
                    )}
                </section>

                {/* ── Step 2: colors, sizes & quantities ── */}
                {selectedList.length > 0 && (
                    <section style={SECTION}>
                        {stepHead(2, "Choose colors, sizes & quantities", "Toggle the colors you want, then set how many of each size.")}
                        <div style={{ display: "grid", gap: 18 }}>
                            {selectedList.map(({ blank, colors, qty }) => (
                                <div key={blank._id} style={{ ...C.card, padding: 16 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                                        {blank.image && <img src={img2(blank.image, 96)} alt="" loading="lazy" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8, background: "#f8fafc" }} />}
                                        <div>
                                            <div style={{ fontWeight: 800 }}>{blank.name}</div>
                                            {(blank.brand || blank.code) && <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{blank.brand}{blank.brand && blank.code ? " · " : ""}{blank.code}</div>}
                                        </div>
                                    </div>

                                    <div style={C.lbl}>Colors</div>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                                        {(blank.colors || []).map((c) => {
                                            const on = colors.includes(c.name);
                                            return (
                                                <button key={c._id || c.name} title={c.name} onClick={() => toggleColor(blank._id, c.name)}
                                                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px 5px 6px", borderRadius: 999, cursor: "pointer", background: on ? "rgba(99,91,255,0.08)" : "#fff", border: `1.5px solid ${on ? C.accent : "#e2e8f0"}`, color: on ? C.accent : "#334155", fontWeight: 700, fontSize: "0.82rem" }}>
                                                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: c.hexcode || "#e2e8f0", border: "1px solid rgba(0,0,0,0.18)", overflow: "hidden", flexShrink: 0 }}>
                                                        {c.image && <img src={img2(c.image, 48)} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                                    </span>
                                                    {c.name}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {colors.length > 0 && (blank.sizes || []).length > 0 && (
                                        <div style={{ overflowX: "auto" }}>
                                            <table style={{ borderCollapse: "collapse", fontSize: "0.85rem", minWidth: "100%" }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ textAlign: "left", padding: "6px 10px", color: "#94a3b8", fontWeight: 700 }}>Color \ Size</th>
                                                        {blank.sizes.map((s) => <th key={s.name} style={{ padding: "6px 8px", color: "#94a3b8", fontWeight: 700 }}>{s.name}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {colors.map((colorName) => (
                                                        <tr key={colorName}>
                                                            <td style={{ padding: "6px 10px", fontWeight: 700, whiteSpace: "nowrap" }}>{colorName}</td>
                                                            {blank.sizes.map((s) => (
                                                                <td key={s.name} style={{ padding: "4px 6px" }}>
                                                                    <input type="number" min="0" inputMode="numeric"
                                                                        value={qty[`${colorName}::${s.name}`] || ""}
                                                                        onChange={(e) => setQty(blank._id, colorName, s.name, e.target.value)}
                                                                        placeholder="0"
                                                                        style={{ width: 56, padding: "8px 6px", textAlign: "center", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} />
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Step 3: artwork + placement ── */}
                {selectedList.length > 0 && (
                    <section style={SECTION}>
                        {stepHead(3, "Add your artwork", "Upload one design — we'll place it on the front of every product you picked.")}
                        {!artUrl ? (
                            <label onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
                                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, border: "2px dashed #c7d2fe", borderRadius: 16, padding: "44px 20px", cursor: "pointer", textAlign: "center", color: "#94a3b8", background: "#fff" }}>
                                <span style={{ fontSize: "2rem" }}>⬆️</span>
                                <span style={{ fontWeight: 800, color: C.accent }}>{uploading ? "Uploading…" : "Upload your artwork"}</span>
                                <span style={{ fontSize: "0.85rem" }}>Drag &amp; drop or click to choose a file. PNG with a transparent background works best.</span>
                                <input type="file" accept="image/*" onChange={(e) => handleFiles(e.target.files)} style={{ display: "none" }} />
                            </label>
                        ) : (
                            <div style={{ display: "grid", gap: 16 }}>
                                {selectedList.length > 1 && (
                                    <div>
                                        <div style={C.lbl}>Position it on</div>
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                            {selectedList.map(({ blank }) => {
                                                const on = (previewBlank && previewBlank._id) === blank._id;
                                                return (
                                                    <button key={blank._id} onClick={() => setPreviewBlankId(blank._id)}
                                                        style={{ padding: "7px 14px", borderRadius: 999, cursor: "pointer", background: on ? "rgba(99,91,255,0.08)" : "#fff", border: `1.5px solid ${on ? C.accent : "#e2e8f0"}`, color: on ? C.accent : "#334155", fontWeight: 700, fontSize: "0.82rem" }}>
                                                        {blank.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {previewBlank?.image ? (
                                    <PlacementBox refImage={img2(previewBlank.image, 700)} artUrl={artUrl} artAspect={artAspect} place={place} onChange={setPlace} />
                                ) : (
                                    <p style={{ color: "#94a3b8" }}>Select a product above to position your art.</p>
                                )}
                                <p style={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center", margin: 0 }}>Drag to move · use the corner handle to resize.</p>
                                <div style={{ textAlign: "center" }}>
                                    <button onClick={() => { setArtUrl(""); setArtAspect(0); }} style={{ ...ghost, padding: "9px 16px" }}>Replace artwork</button>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* ── Step 4: preview gallery ── */}
                {artUrl && previewTiles.length > 0 && (
                    <section style={SECTION}>
                        {stepHead(4, "Preview", "Here's your design on each product and color you chose.")}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                            {previewTiles.map((t) => (
                                <div key={t.key} style={{ ...C.card, padding: 8 }}>
                                    <div style={{ width: "100%", aspectRatio: "1", background: "#f8fafc", borderRadius: 10, overflow: "hidden" }}>
                                        {/* keyed on the url so it refetches when the placement changes */}
                                        <img key={t.url} src={t.url} alt={t.label} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    </div>
                                    <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: 6, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.label}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Step 5: contact + submit ── */}
                {selectedList.length > 0 && (
                    <section style={{ ...SECTION, paddingBottom: 80 }}>
                        {stepHead(5, "Your info & request", "Tell us who you are and we'll email your quote.")}
                        <div style={{ ...C.card, padding: 20, display: "grid", gap: 14, maxWidth: 560 }}>
                            <div>
                                <div style={C.lbl}>Name</div>
                                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={C.field} />
                            </div>
                            <div>
                                <div style={C.lbl}>Email <span style={{ color: "#dc2626" }}>*</span></div>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={C.field} />
                            </div>
                            <div>
                                <div style={C.lbl}>Phone</div>
                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(optional)" style={C.field} />
                            </div>
                            <div>
                                <div style={C.lbl}>Notes</div>
                                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Anything we should know? (deadline, ink colors, etc.)" style={{ ...C.field, resize: "vertical" }} />
                            </div>
                            {totalPieces > 0 && (
                                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                    Requesting a quote for <b>{totalPieces}</b> piece{totalPieces === 1 ? "" : "s"} across <b>{lines.length}</b> variant{lines.length === 1 ? "" : "s"}.
                                </div>
                            )}
                            {submitErr && <div style={{ color: "#dc2626", fontSize: "0.88rem" }}>{submitErr}</div>}
                            <button onClick={submit} disabled={!canSubmit} style={{ ...btn, width: "100%", padding: 15, fontSize: "1rem", opacity: canSubmit ? 1 : 0.55, cursor: canSubmit ? "pointer" : "not-allowed" }}>
                                {busy ? "Sending…" : "Send my request"}
                            </button>
                            <p style={{ color: "#94a3b8", fontSize: "0.78rem", textAlign: "center", margin: 0 }}>
                                No payment now — this is just a quote request.
                            </p>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
