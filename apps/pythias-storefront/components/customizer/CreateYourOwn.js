"use client";
import { useRef, useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

// "Create your own" design studio: pick a BLANK garment, see it as the canvas background, drop your
// own uploaded or AI-generated artwork into the print zone, move/resize it, and add to cart. The
// placed artwork is exported (transparent, print zone only) → production prints it on the blank.
const FABRIC_SRC = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
function loadFabric() {
    return new Promise((resolve, reject) => {
        if (window.fabric) return resolve(window.fabric);
        const ex = document.getElementById("fabric-cdn");
        if (ex) { ex.addEventListener("load", () => resolve(window.fabric)); return; }
        const s = document.createElement("script"); s.id = "fabric-cdn"; s.src = FABRIC_SRC;
        s.onload = () => resolve(window.fabric); s.onerror = () => reject(new Error("Couldn't load the designer"));
        document.body.appendChild(s);
    });
}
// The blank's print boxes are authored in a 400×400 reference (same as the [...renderImages]
// compositor: multiplier = width/400). So the design canvas IS 400×400 and boxes map 1:1.
const W = 400, H = 400;
const DEFAULT_ZONE = { x: 120, y: 110, w: 160, h: 200 };   // fallback print zone (400-space)
const btn = { padding: "10px 16px", borderRadius: 9, border: "none", background: "var(--sf-accent, #635bff)", color: "#fff", fontWeight: 700, cursor: "pointer" };
const ghost = { ...btn, background: "#f1f5f9", color: "#334155" };
const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;

export default function CreateYourOwn({ blanks = [] }) {
    const canvasElRef = useRef(null), fcRef = useRef(null), bgRef = useRef(null), zoneRef = useRef(null), zoneBoxRef = useRef(DEFAULT_ZONE);
    const { add } = useCart();
    const [blank, setBlank] = useState(blanks[0] || null);
    const [color, setColor] = useState(blanks[0]?.colors?.[0] || null);
    const [size, setSize] = useState(blanks[0]?.sizes?.[0] || null);
    const [prompt, setPrompt] = useState("");
    const [busy, setBusy] = useState("");
    const [msg, setMsg] = useState("");
    const [added, setAdded] = useState(false);

    // Resolve the print zone from the blank's box (keyed by side, in a containerHeight≈400 frame).
    const resolveZone = (clr) => {
        const boxes = clr?.boxes;
        if (boxes && typeof boxes === "object") {
            const side = boxes.front ? "front" : Object.keys(boxes)[0];
            const b = boxes[side];
            const bw = b?.boxWidth ?? b?.width, bh = b?.boxHeight ?? b?.height;
            if (b && typeof bw === "number" && typeof bh === "number") {
                const f = 400 / (b.containerHeight || 400);   // normalize to the 400 frame
                return { x: (b.x || 0) * f, y: (b.y || 0) * f, w: bw * f, h: bh * f };
            }
        }
        return DEFAULT_ZONE;
    };

    const setBg = (clr) => {
        const F = window.fabric, c = fcRef.current; if (!F || !c) return;
        if (!clr?.image) return;
        const Z = resolveZone(clr); zoneBoxRef.current = Z;
        if (zoneRef.current) zoneRef.current.set({ left: Z.x, top: Z.y, width: Z.w, height: Z.h });
        // Load the garment at the 400×400 CDN size so it matches the box reference exactly.
        const url = `${clr.image}${clr.image.includes("?") ? "&" : "?"}width=400&height=400`;
        F.Image.fromURL(url, (img) => {
            if (!fcRef.current || !img.width) return;
            img.set({ selectable: false, evented: false, scaleX: W / img.width, scaleY: H / img.height, left: 0, top: 0 });
            if (bgRef.current) c.remove(bgRef.current);
            bgRef.current = img; c.add(img); c.sendToBack(img); c.renderAll();
        });   // no crossOrigin: the garment CDN may not send CORS headers; bg is hidden on export anyway
    };

    useEffect(() => {
        let disposed = false;
        (async () => {
            const F = await loadFabric().catch(() => null);
            if (disposed || !F || !canvasElRef.current) return;
            const c = new F.Canvas(canvasElRef.current, { width: W, height: H, backgroundColor: "#f3f4f6", preserveObjectStacking: true });
            fcRef.current = c;
            const Z = zoneBoxRef.current;
            const zone = new F.Rect({ left: Z.x, top: Z.y, width: Z.w, height: Z.h, fill: "rgba(99,102,241,0.04)", stroke: "#94a3b8", strokeDashArray: [6, 6], selectable: false, evented: false });
            zoneRef.current = zone; c.add(zone);
            setBg(color);
        })();
        return () => { disposed = true; try { fcRef.current?.dispose(); } catch { /* ignore */ } };
    }, []); // eslint-disable-line

    useEffect(() => { if (fcRef.current) setBg(color); }, [color]); // eslint-disable-line

    const addArt = (url) => {
        const F = window.fabric, c = fcRef.current; if (!F || !c) return;
        const Z = zoneBoxRef.current;
        F.Image.fromURL(url, (img) => {
            const s = Math.min(Z.w / img.width, Z.h / img.height) * 0.9;
            img.set({ scaleX: s, scaleY: s, left: Z.x + Z.w / 2 - (img.width * s) / 2, top: Z.y + Z.h / 2 - (img.height * s) / 2, cornerColor: "#635bff", borderColor: "#635bff", transparentCorners: false });
            c.add(img); c.setActiveObject(img); c.renderAll();
        }, { crossOrigin: "anonymous" });
    };

    const onUpload = (e) => {
        const f = e.target.files?.[0]; if (!f) return; setBusy("upload"); setMsg("");
        const reader = new FileReader();
        reader.onload = async () => {
            try { const d = await (await fetch("/api/customizer/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl: reader.result }) })).json();
                if (d.error) throw new Error(d.error); addArt(d.url); }
            catch (err) { setMsg(err.message); } finally { setBusy(""); e.target.value = ""; }
        };
        reader.readAsDataURL(f);
    };
    const onGenerate = async () => {
        if (!prompt.trim()) return; setBusy("ai"); setMsg("");
        try { const d = await (await fetch("/api/ai/generate-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) })).json();
            if (d.error) throw new Error(d.error); addArt(d.url); }
        catch (err) { setMsg(err.message); } finally { setBusy(""); }
    };
    const delSel = () => { const c = fcRef.current, o = c?.getActiveObject(); if (o && o !== zoneRef.current && o !== bgRef.current) { c.remove(o); c.renderAll(); } };

    const exportArtwork = () => {
        const c = fcRef.current, Z = zoneBoxRef.current; if (!c) return null;
        if (bgRef.current) bgRef.current.visible = false;
        if (zoneRef.current) zoneRef.current.visible = false;
        c.discardActiveObject(); c.renderAll();
        let url = null;
        try { url = c.toDataURL({ format: "png", left: Z.x, top: Z.y, width: Z.w, height: Z.h, multiplier: 3 }); }
        catch { /* cross-origin taint — production re-composites from the stored art */ }
        if (bgRef.current) bgRef.current.visible = true;
        if (zoneRef.current) zoneRef.current.visible = true;
        c.renderAll();
        return url;
    };

    const addToCart = async () => {
        const c = fcRef.current; if (!c || !blank || !size) { setMsg("Pick a product and size."); return; }
        const hasArt = c.getObjects().some((o) => o !== zoneRef.current && o !== bgRef.current);
        if (!hasArt) { setMsg("Add a design first — upload one or generate with AI."); return; }
        setBusy("cart"); setMsg("");
        try {
            const dataUrl = exportArtwork();
            let artworkUrl = null;
            if (dataUrl) { const d = await (await fetch("/api/customizer/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) })).json(); if (!d.error) artworkUrl = d.url; }
            add({
                blankId: blank.id, styleCode: blank.code, title: blank.name,
                color: color?.color || "", size: size.name, sku: size.sku || `${blank.code}-${color?.color || ""}-${size.name}`,
                priceCents: size.priceCents, wholesaleCents: size.wholesaleCents, image: color?.image || null,
                personalization: { mode: "studio", artworkUrl, side: "front" },
                customKey: `cy${Date.now()}${Math.floor(Math.random() * 1000)}`,
            });
            setAdded(true); setTimeout(() => setAdded(false), 3000);
        } catch (e) { setMsg(e.message); } finally { setBusy(""); }
    };

    if (!blanks.length) {
        return <section style={{ padding: "60px 0", textAlign: "center" }}><div className="sf-container"><h1>Create your own</h1><p style={{ opacity: 0.6 }}>No products are available to customize yet.</p></div></section>;
    }

    return (
        <section style={{ padding: "32px 0 56px" }}>
            <div className="sf-container">
                <h1 style={{ fontSize: "1.9rem", margin: "0 0 6px" }}>Create your own ✨</h1>
                <p style={{ opacity: 0.65, margin: "0 0 24px" }}>Pick a product, then upload your artwork or generate a design with AI. Drag and resize it in the print area.</p>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,520px) minmax(0,1fr)", gap: 40, alignItems: "start" }}>
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, background: "#fff" }}>
                        <canvas ref={canvasElRef} style={{ width: "100%", maxWidth: W, height: "auto", touchAction: "none" }} />
                        <div style={{ textAlign: "center", fontSize: "0.74rem", color: "#94a3b8", marginTop: 6 }}>Dashed box = printable area. Drag corners to resize.</div>
                    </div>

                    <div style={{ display: "grid", gap: 18 }}>
                        <div>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>1 · Choose a product</div>
                            <select value={blank?.id} onChange={(e) => { const b = blanks.find((x) => x.id === e.target.value); setBlank(b); setColor(b?.colors?.[0] || null); setSize(b?.sizes?.[0] || null); }} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", width: "100%", maxWidth: 360 }}>
                                {blanks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                                {blank?.colors?.length > 0 && <select value={color?.color || ""} onChange={(e) => setColor(blank.colors.find((c) => c.color === e.target.value) || null)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1" }}>{blank.colors.map((c) => <option key={c.color} value={c.color}>{c.color}</option>)}</select>}
                                {blank?.sizes?.length > 0 && <select value={size?.name || ""} onChange={(e) => setSize(blank.sizes.find((s) => s.name === e.target.value) || null)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1" }}>{blank.sizes.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}</select>}
                                {size && <span style={{ alignSelf: "center", fontWeight: 800, color: "var(--sf-secondary)" }}>{money(size.priceCents)}</span>}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>2 · Add your design</div>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                <label style={{ ...ghost, display: "inline-block" }}>
                                    {busy === "upload" ? "Uploading…" : "⬆ Upload image"}
                                    <input type="file" accept="image/*" onChange={onUpload} style={{ display: "none" }} />
                                </label>
                                <button onClick={delSel} style={ghost}>🗑 Delete selected</button>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                                <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe a design (AI)…" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", flex: 1, minWidth: 200 }} />
                                <button onClick={onGenerate} disabled={!!busy} style={btn}>{busy === "ai" ? "Generating…" : "✨ Generate"}</button>
                            </div>
                        </div>

                        <div>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>3 · Add to cart</div>
                            <button onClick={addToCart} disabled={!!busy} style={{ ...btn, padding: "14px 28px", fontSize: "1rem" }}>{busy === "cart" ? "Adding…" : added ? "Added ✓" : "Add to cart"}</button>
                            {added && <a href="/cart" style={{ marginLeft: 16, color: "var(--sf-secondary)", fontWeight: 600 }}>View cart →</a>}
                        </div>
                        {msg && <div style={{ color: "#dc2626", fontSize: "0.88rem" }}>{msg}</div>}
                    </div>
                </div>
            </div>
        </section>
    );
}
