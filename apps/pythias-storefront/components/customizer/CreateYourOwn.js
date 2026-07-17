"use client";
import { useRef, useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useCustomer, authHeaders } from "@/components/account/CustomerProvider";
import DesignThumb from "@/components/customizer/DesignThumb";
import { prefetchImages } from "@/lib/prefetchImages";

// "Create your own" design studio: pick a BLANK garment, then design its Front / Back / Sleeve (each
// side that the blank has a print box for). Drop uploaded or AI-generated artwork into the print zone,
// move/resize it — it stays clamped inside the (slightly padded) print area and keeps its aspect ratio.
// The print box can be rotated (e.g. to follow an angled sleeve); the zone + art rotate to match and
// that rotation is baked into the exported PNG, so production places it as-is (rotation handled here).
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
// Blank print boxes are authored in a 400×400 reference (compositor: multiplier = width/400). The
// canvas is larger for a roomier preview; boxes scale up by SCALE. PAD400 grows the printable area
// slightly past the strict box so artwork has a little breathing room at the edges.
const REF = 400;
const W = 560, H = 560;
const SCALE = W / REF;
const PAD400 = 12;   // breathing room so the print box sits inset from the garment edges/collar
const DEFAULT_BOX = { x: 120, y: 110, w: 160, h: 200, rotation: 0 };   // fallback if a side has no envelope
const DEFAULT_ASPECT = DEFAULT_BOX.w / DEFAULT_BOX.h;
const CY_FRAC = 0.46;   // vertical center of the print area on the garment (chest)
const SECOND_SIDE_CENTS = 200;   // surcharge when both front AND back are designed

// Build a centered 400-space print box from the envelope's aspect ratio (width/height), so what the
// buyer designs maps to inches without distortion. Fit it into a comfortable area of the garment.
function boxFromAspect(aspect) {
    const a = aspect > 0 ? aspect : DEFAULT_ASPECT;
    const maxW = 0.62 * REF, maxH = 0.66 * REF;
    let w = maxW, h = w / a;
    if (h > maxH) { h = maxH; w = h * a; }
    return { x: (REF - w) / 2, y: Math.max(0, CY_FRAC * REF - h / 2), w, h, rotation: 0 };
}
const btn = { padding: "10px 16px", borderRadius: 9, border: "none", background: "var(--sf-accent, #635bff)", color: "#fff", fontWeight: 700, cursor: "pointer" };
const ghost = { ...btn, background: "#f1f5f9", color: "#334155" };
const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;
const sideKey = (colorName, idx) => `${colorName}::${idx}`;
// Load CDN images through our same-origin proxy so the canvas stays clean (untainted) and toDataURL
// works — for both the production artwork export and the cart mockup.
const proxied = (u) => (u && /^https?:\/\//i.test(u) ? `/api/img?u=${encodeURIComponent(u)}` : u);
// Resize DISPLAY thumbnails through the images app (images2). images1 (Wasabi) ignores ?width=, so
// the tiles were downloading full-res source files; /origin actually resizes. Canvas images are
// deliberately NOT routed here — they load via the same-origin proxy so toDataURL stays untainted.
const IMG1 = "https://images1.pythiastechnologies.com";
const img2 = (u, width = 300) =>
    (typeof u === "string" && u.startsWith(IMG1))
        ? `https://images2.pythiastechnologies.com/origin${u.slice(IMG1.length)}${u.includes("?") ? "&" : "?"}width=${width}`
        : u;
// Web-safe fonts + a few popular Google fonts (loaded on mount) the buyer can set their text in.
const GOOGLE_FONTS = ["Anton", "Bebas Neue", "Oswald", "Montserrat", "Pacifico", "Lobster", "Permanent Marker", "Caveat"];
const FONTS = ["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana", "Trebuchet MS", "Impact", "Comic Sans MS", ...GOOGLE_FONTS];

// box (400-space) → the canvas-space rotated zone (center cx/cy, size w/h, angle) plus the axis-aligned
// bounding box (aabb) of that rotated rect, used for clamping and for the exported print region.
function zoneFromBox(box) {
    const b = box || DEFAULT_BOX;
    const y = Math.max(0, b.y - PAD400);
    const w = Math.min(REF, b.w + PAD400 * 2), h = Math.min(REF - y, b.h + PAD400 * 2);
    const x = (REF - w) / 2;   // center the print box horizontally on the (centered) garment
    const angle = b.rotation || 0;
    const cx = (x + w / 2) * SCALE, cy = (y + h / 2) * SCALE, Zw = w * SCALE, Zh = h * SCALE;
    const rad = Math.abs(angle) * Math.PI / 180;
    const ax = Math.abs((Zw / 2) * Math.cos(rad)) + Math.abs((Zh / 2) * Math.sin(rad));
    const ay = Math.abs((Zw / 2) * Math.sin(rad)) + Math.abs((Zh / 2) * Math.cos(rad));
    const aabb = { x: cx - ax, y: cy - ay, w: 2 * ax, h: 2 * ay };
    return { cx, cy, w: Zw, h: Zh, angle, aabb };
}

// Build an (invisible) SVG path the text rides along, sized to the text's natural width, to bend it
// into the chosen shape. Returns a fabric.Path or null (Normal = straight, no path).
function makeTextPath(shape, w, fontSize) {
    const F = window.fabric; if (!F || !w) return null;
    const amp = Math.max(fontSize * 0.6, w * 0.22);
    let d = null;
    if (shape === "archUp") d = `M 0 0 Q ${w / 2} ${-amp} ${w} 0`;
    else if (shape === "archDown") d = `M 0 0 Q ${w / 2} ${amp} ${w} 0`;
    else if (shape === "wave") d = `M 0 0 Q ${w / 4} ${-amp} ${w / 2} 0 T ${w} 0`;
    else if (shape === "flag") d = `M 0 0 C ${w * 0.33} ${-amp} ${w * 0.66} ${amp} ${w} 0`;
    else if (shape === "circle") { const r = Math.max(fontSize, w / (2 * Math.PI)); d = `M ${r} 0 A ${r} ${r} 0 1 1 ${r} ${2 * r} A ${r} ${r} 0 1 1 ${r} 0`; }
    if (!d) return null;
    return new F.Path(d, { fill: "", stroke: "" });
}
const TEXT_SHAPES = [
    { id: "normal", label: "Normal", icon: "—" }, { id: "archUp", label: "Arch Up", icon: "⌒" }, { id: "archDown", label: "Arch Down", icon: "⌣" },
    { id: "wave", label: "Wave", icon: "∿" }, { id: "circle", label: "Circle", icon: "◯" }, { id: "flag", label: "Flag", icon: "⚑" },
];

export default function CreateYourOwn({ blanks = [], embed = false }) {
    const canvasElRef = useRef(null), fcRef = useRef(null), bgRef = useRef(null), zoneRef = useRef(null), wrapRef = useRef(null);
    const curZoneRef = useRef(zoneFromBox(DEFAULT_BOX));
    const artRef = useRef({});   // sideKey -> [fabric objects]
    const loadedRef = useRef(false);
    const { add } = useCart();
    const { customer, ready: customerReady } = useCustomer();
    const [blank, setBlank] = useState(blanks[0] || null);
    const [color, setColor] = useState(blanks[0]?.colors?.[0] || null);
    const [sideIdx, setSideIdx] = useState(0);
    const [size, setSize] = useState(blanks[0]?.sizes?.[0] || null);
    const [prompt, setPrompt] = useState("");
    const [textValue, setTextValue] = useState("");
    const [font, setFont] = useState("Anton");
    const [textColor, setTextColor] = useState("#111111");
    const [textShape, setTextShape] = useState("normal");
    const [busy, setBusy] = useState("");
    const [msg, setMsg] = useState("");
    const [added, setAdded] = useState(false);
    const [ready, setReady] = useState(false);
    const [pendingArt, setPendingArt] = useState(null);   // design art to drop once the canvas/side is mounted
    const [tool, setTool] = useState(null);   // active tool panel: null (product specs) | text | products | upload | ai
    const [qty, setQty] = useState(1);
    const [aiStyle, setAiStyle] = useState("");
    const [search, setSearch] = useState("");
    const [agree, setAgree] = useState(false);
    const [uploads, setUploads] = useState([]);   // reusable library of uploaded/AI images (place on any side)
    const addToLibrary = (url) => {
        setUploads((u) => (u.includes(url) ? u : [url, ...u]));
        if (customer) fetch("/api/account/uploads", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ url }) }).catch(() => {});
    };
    const removeUpload = (url) => {
        setUploads((u) => u.filter((x) => x !== url));
        if (customer) fetch("/api/account/uploads", { method: "DELETE", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ url }) }).catch(() => {});
    };
    const [designId, setDesignId] = useState(null);     // saved-design id once saved (enables update)
    const [designName, setDesignName] = useState("");
    const [savedList, setSavedList] = useState([]);     // the buyer's saved designs
    const [, setDesignV] = useState(0);                 // bump to re-render when art (a ref) changes
    const touch = () => setDesignV((v) => v + 1);

    // Warm up Fabric.js as soon as the studio mounts (a ~300KB CDN script) so it's ready by the time
    // the buyer picks a product to design — takes the load wait off the first interaction.
    useEffect(() => { loadFabric().catch(() => {}); }, []);

    // Precache the selected blank's color images (garment backgrounds) on idle so switching color on
    // the canvas is instant. Runs on each blank change; never blocks — it's idle + low-priority.
    useEffect(() => {
        if (!blank) return;
        prefetchImages((blank.colors || []).flatMap((cc) => (cc.sides || []).slice(0, 1)
            .map((sd) => (sd?.image ? proxied(`${sd.image}?width=${W}&height=${H}`) : null))).filter(Boolean));
    }, [blank]);

    const [isMobile, setIsMobile] = useState(false);
    // Scale the Fabric canvas (which wraps itself in a fixed-px container) down to fit narrow screens,
    // keeping the internal 560-px coordinate space so all the box math stays correct.
    const fitCanvas = () => {
        const el = wrapRef.current, c = fcRef.current; if (!el || !c) return;
        const mobile = typeof window !== "undefined" && window.innerWidth <= 860;
        const pad = mobile ? 8 : 16;
        const avail = (el.clientWidth || W) - pad * 2;   // fill the card width (minus its padding)
        const css = Math.max(220, Math.min(W, avail));
        c.setDimensions({ width: css, height: css }, { cssOnly: true });
    };
    useEffect(() => {
        const onResize = () => { setIsMobile(window.innerWidth <= 860); requestAnimationFrame(fitCanvas); };
        onResize(); window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []); // eslint-disable-line

    const sides = color?.sides || [];
    const activeSide = sides[sideIdx] || null;
    // Front + back both designed → second-side surcharge (kept in sync with lib/cart.js).
    const isDesigned = (i) => (artRef.current[sideKey(color?.color, i)] || []).length > 0;
    const frontIdx = sides.findIndex((s) => s.side === "front");
    const backIdx = sides.findIndex((s) => s.side === "back");
    const bothSides = frontIdx >= 0 && backIdx >= 0 && isDesigned(frontIdx) && isDesigned(backIdx);
    const surchargeCents = bothSides ? SECOND_SIDE_CENTS : 0;
    const unitCents = (size?.priceCents || 0) + surchargeCents;

    // Keep an object's bounding box inside the (padded) print zone: first cap its size to the zone
    // (uniform — never stretches), then nudge it back in. Runs on move / scale / rotate.
    const clampObj = (obj) => {
        const Z = curZoneRef.current?.aabb; if (!obj || !Z) return;
        let br = obj.getBoundingRect(true, true);
        if (br.width > Z.w || br.height > Z.h) {
            const f = Math.min(Z.w / br.width, Z.h / br.height);
            obj.scaleX *= f; obj.scaleY *= f; obj.setCoords();
            br = obj.getBoundingRect(true, true);
        }
        let dx = 0, dy = 0;
        if (br.left < Z.x) dx = Z.x - br.left; else if (br.left + br.width > Z.x + Z.w) dx = (Z.x + Z.w) - (br.left + br.width);
        if (br.top < Z.y) dy = Z.y - br.top; else if (br.top + br.height > Z.y + Z.h) dy = (Z.y + Z.h) - (br.top + br.height);
        if (dx || dy) { obj.left += dx; obj.top += dy; obj.setCoords(); }
    };

    // The print box uses the envelope's aspect ratio (so the design maps to inches without distortion).
    const aspectForSide = (sideName) => {
        const e = (blank?.envelopes || []).find((x) => x.side === sideName);
        return e ? e.width / e.height : DEFAULT_ASPECT;
    };

    // Show a side: swap the dashed zone + garment background and re-attach that side's art.
    const mountSide = (colorObj, idx) => {
        const F = window.fabric, c = fcRef.current; if (!F || !c || !colorObj) return;
        const sd = colorObj.sides?.[idx]; if (!sd) return;
        c.getObjects().slice().forEach((o) => { if (o !== bgRef.current && o !== zoneRef.current) c.remove(o); });
        const z = zoneFromBox(sd.box); curZoneRef.current = z;
        if (zoneRef.current) { zoneRef.current.set({ left: z.cx, top: z.cy, width: z.w, height: z.h, angle: z.angle, visible: true }); zoneRef.current.setCoords(); }
        const url = proxied(`${sd.image}${sd.image.includes("?") ? "&" : "?"}width=${W}&height=${H}`);
        F.Image.fromURL(url, (img) => {
            if (!fcRef.current || !img.width) return;
            img.set({ selectable: false, evented: false, scaleX: W / img.width, scaleY: H / img.height, left: 0, top: 0 });
            if (bgRef.current) c.remove(bgRef.current);
            bgRef.current = img; c.add(img); c.sendToBack(img); c.renderAll();
        });   // via same-origin proxy → canvas stays clean so toDataURL works
        (artRef.current[sideKey(colorObj.color, idx)] || []).forEach((o) => c.add(o));
        c.renderAll();
    };

    // Build (or rebuild) the Fabric canvas. Re-runs when the layout switches between mobile/desktop
    // (the <canvas> element is remounted then); art persists in artRef, so we re-mount the side after.
    useEffect(() => {
        let disposed = false;
        (async () => {
            const F = await loadFabric().catch(() => null);
            if (disposed || !F || !canvasElRef.current) return;
            try { fcRef.current?.dispose(); } catch { /* ignore */ }
            bgRef.current = null;
            const c = new F.Canvas(canvasElRef.current, { width: W, height: H, backgroundColor: "#f3f4f6", preserveObjectStacking: true });
            fcRef.current = c;
            const z = curZoneRef.current;
            const zone = new F.Rect({ left: z.cx, top: z.cy, width: z.w, height: z.h, angle: z.angle, originX: "center", originY: "center", fill: "rgba(99,102,241,0.04)", stroke: "#94a3b8", strokeDashArray: [6, 6], selectable: false, evented: false });
            zoneRef.current = zone; c.add(zone);
            c.on("object:moving", (e) => clampObj(e.target));
            c.on("object:scaling", (e) => clampObj(e.target));
            c.on("object:rotating", (e) => clampObj(e.target));
            requestAnimationFrame(fitCanvas);   // measure after layout so it fits the real screen width
            setReady(true);
            mountSide(color, sideIdx);   // restore the current side onto the (re)built canvas
        })();
        return () => { disposed = true; try { fcRef.current?.dispose(); } catch { /* ignore */ } };
    }, [isMobile]); // eslint-disable-line

    // (Re)mount the active side whenever the canvas, color, or side changes.
    useEffect(() => { if (ready && fcRef.current) mountSide(color, sideIdx); }, [ready, color, sideIdx]); // eslint-disable-line

    // On sign-in: load the buyer's saved designs, and auto-open one if ?design=<id> is in the URL.
    useEffect(() => {
        if (!ready || !customerReady || !customer) return;
        refreshSaved();
        (async () => { try { const d = await (await fetch("/api/account/uploads", { headers: authHeaders() })).json(); if (!d.error && Array.isArray(d.uploads)) setUploads((u) => [...new Set([...u, ...d.uploads])]); } catch { /* ignore */ } })();
        if (loadedRef.current) return;
        const id = new URLSearchParams(window.location.search).get("design");
        if (id) { loadedRef.current = true; loadDesignById(id); }
    }, [ready, customerReady, customer]); // eslint-disable-line

    // Preload from a product's "Customize this design" deep-link: ?blank=&color=&art= → preselect the
    // blank + color, then queue the design art to drop onto the canvas (dropped by the effect below once
    // the side has mounted). Distinct params from the saved-design `?design=` loader above.
    const presetRef = useRef(false);
    useEffect(() => {
        if (!ready || presetRef.current) return;
        const sp = new URLSearchParams(window.location.search);
        const blankId = sp.get("blank"), colorName = sp.get("color"), art = sp.get("art");
        if (!blankId && !art) return;
        presetRef.current = true;
        let b = blank;
        if (blankId) { const found = blanks.find((x) => x.id === blankId); if (found) { b = found; setBlank(found); setSize(found.sizes?.[0] || null); } }
        if (b) setColor((colorName && (b.colors || []).find((cc) => cc.color === colorName)) || b.colors?.[0] || null);
        setSideIdx(0);
        if (art) setPendingArt(art);
    }, [ready]); // eslint-disable-line

    // Drop the queued design art once the canvas + the active side are mounted (re-runs on color/side so
    // it uses the live addArt closure + the mounted print zone). Clears itself after dropping.
    useEffect(() => {
        if (!ready || !pendingArt) return;
        const t = setTimeout(() => { addArt(pendingArt); addToLibrary(pendingArt); setPendingArt(null); }, 350);
        return () => clearTimeout(t);
    }, [ready, pendingArt, color, sideIdx]); // eslint-disable-line

    // Pull in the Google fonts once so the canvas can render text in them.
    useEffect(() => {
        if (document.getElementById("cy-fonts")) return;
        const l = document.createElement("link"); l.id = "cy-fonts"; l.rel = "stylesheet";
        l.href = "https://fonts.googleapis.com/css2?" + GOOGLE_FONTS.map((f) => "family=" + encodeURIComponent(f).replace(/%20/g, "+")).join("&") + "&display=swap";
        document.head.appendChild(l);
    }, []);

    const changeColor = (c) => { artRef.current = {}; setColor(c); setSideIdx(0); };
    const changeBlank = (b) => { artRef.current = {}; setBlank(b); setColor(b?.colors?.[0] || null); setSize(b?.sizes?.[0] || null); setSideIdx(0); };

    const addArt = (url) => {
        const F = window.fabric, c = fcRef.current, z = curZoneRef.current; if (!F || !c || !z) return;
        F.Image.fromURL(proxied(url), (img) => {
            const s = Math.min(z.w / img.width, z.h / img.height) * 0.9;
            img.set({
                originX: "center", originY: "center", left: z.cx, top: z.cy, angle: z.angle, scaleX: s, scaleY: s,
                cornerColor: "#635bff", borderColor: "#635bff", transparentCorners: false,
                lockUniScaling: true,   // corner handles scale uniformly — never stretch the artwork
            });
            img.setControlsVisibility({ ml: false, mr: false, mt: false, mb: false });   // hide stretch handles
            c.add(img); c.setActiveObject(img);
            (artRef.current[sideKey(color.color, sideIdx)] ||= []).push(img);
            clampObj(img); c.renderAll(); touch();
        }, { crossOrigin: "anonymous" });
    };

    // Buyer-entered text → a movable, uniformly-scaled text object rotated to the side's angle.
    const ensureFont = async (f) => { try { await document.fonts.load(`24px "${f}"`); await document.fonts.ready; } catch { /* ignore */ } };
    // Re-fit a text object's curve path (after the text, font, or shape changes its natural width).
    const reshape = (o) => {
        if (!o || o.type !== "i-text") return;
        o.set("path", null); if (o.initDimensions) o.initDimensions();   // measure straight (natural) width
        if (o.shape && o.shape !== "normal") {
            const p = makeTextPath(o.shape, o.width, o.fontSize);
            if (p) o.set({ path: p, pathAlign: "center", pathStartOffset: 0 });
        }
        o.set("dirty", true);
    };
    const addText = async () => {
        const F = window.fabric, c = fcRef.current, z = curZoneRef.current; if (!F || !c || !z) return;
        const val = (textValue || "").trim(); if (!val) { setMsg("Type some text first."); return; }
        await ensureFont(font);
        const t = new F.IText(val, {
            originX: "center", originY: "center", left: z.cx, top: z.cy, angle: z.angle,
            fontFamily: font, fill: textColor, fontSize: 48, textAlign: "center",
            cornerColor: "#635bff", borderColor: "#635bff", transparentCorners: false, lockUniScaling: true,
        });
        t.shape = textShape; reshape(t);
        t.setControlsVisibility({ ml: false, mr: false, mt: false, mb: false });
        const s = Math.min(z.w / t.width, z.h / t.height) * 0.9;
        t.scaleX = s; t.scaleY = s; t.set({ left: z.cx, top: z.cy });
        c.add(t); c.setActiveObject(t);
        (artRef.current[sideKey(color.color, sideIdx)] ||= []).push(t);
        clampObj(t); c.renderAll(); touch();
    };
    // Font / color / shape pickers also restyle the selected text object live.
    const applyFont = (f) => { setFont(f); const o = fcRef.current?.getActiveObject(); if (o?.type === "i-text") ensureFont(f).then(() => { o.set("fontFamily", f); reshape(o); clampObj(o); fcRef.current.renderAll(); }); };
    const applyColor = (col) => { setTextColor(col); const o = fcRef.current?.getActiveObject(); if (o?.type === "i-text") { o.set("fill", col); fcRef.current.renderAll(); } };
    const applyShape = (shape) => {
        setTextShape(shape);
        const c = fcRef.current, o = c?.getActiveObject(); if (!o || o.type !== "i-text") return;
        o.shape = shape; reshape(o);
        const z = curZoneRef.current; if (z) o.set({ left: z.cx, top: z.cy });
        o.setCoords(); clampObj(o); c.renderAll();
    };

    const onUpload = (e) => {
        const f = e.target.files?.[0]; if (!f) return; setBusy("upload"); setMsg("");
        const reader = new FileReader();
        reader.onload = async () => {
            try { const d = await (await fetch("/api/customizer/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl: reader.result }) })).json();
                if (d.error) throw new Error(d.error); addToLibrary(d.url); addArt(d.url); }
            catch (err) { setMsg(err.message); } finally { setBusy(""); e.target.value = ""; }
        };
        reader.readAsDataURL(f);
    };
    const onGenerate = async () => {
        if (!prompt.trim()) return; setBusy("ai"); setMsg("");
        const fullPrompt = aiStyle ? `${aiStyle} style — ${prompt}` : prompt;
        try { const d = await (await fetch("/api/ai/generate-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: fullPrompt }) })).json();
            if (d.error) throw new Error(d.error); addToLibrary(d.url); addArt(d.url); }
        catch (err) { setMsg(err.message); } finally { setBusy(""); }
    };
    const delSel = () => {
        const c = fcRef.current, o = c?.getActiveObject(); if (!o || o === zoneRef.current || o === bgRef.current) return;
        const k = sideKey(color.color, sideIdx);
        if (artRef.current[k]) artRef.current[k] = artRef.current[k].filter((x) => x !== o);
        c.remove(o); c.renderAll(); touch();
    };

    // Tight union bounding box (canvas px) of a set of fabric objects.
    const unionBounds = (objs) => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        objs.forEach((o) => { o.setCoords(); const b = o.getBoundingRect(true, true); minX = Math.min(minX, b.left); minY = Math.min(minY, b.top); maxX = Math.max(maxX, b.left + b.width); maxY = Math.max(maxY, b.top + b.height); });
        return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
    };

    // Export every designed side: a CROPPED, high-res transparent PNG (tight to the art — no blank
    // space, no wasted print media) PLUS the art's placement normalized (0–1) within the print box.
    // Production maps that placement to the per-size envelope (inches); rotation is baked into the PNG.
    const exportAllSides = () => {
        const c = fcRef.current; if (!c) return [];
        const out = [];
        for (let i = 0; i < sides.length; i++) {
            const arr = artRef.current[sideKey(color.color, i)] || [];
            if (!arr.length) continue;
            const sd = sides[i];
            const z = zoneFromBox(sd.box);
            const boxLeft = z.cx - z.w / 2, boxTop = z.cy - z.h / 2;
            c.getObjects().slice().forEach((o) => { if (o !== bgRef.current && o !== zoneRef.current) c.remove(o); });
            arr.forEach((o) => c.add(o));
            if (bgRef.current) bgRef.current.visible = false;
            if (zoneRef.current) zoneRef.current.visible = false;
            c.discardActiveObject(); c.renderAll();
            const ab = unionBounds(arr);
            // normalized placement of the art within the print box (clamped to 0–1)
            const clamp01 = (n) => Math.max(0, Math.min(1, n));
            const place = {
                xPct: clamp01((ab.left - boxLeft) / z.w), yPct: clamp01((ab.top - boxTop) / z.h),
                wPct: clamp01(ab.width / z.w), hPct: clamp01(ab.height / z.h),
            };
            const mult = Math.max(4, Math.min(12, (isMobile ? 2200 : 3000) / Math.max(ab.width, ab.height, 1)));
            let dataUrl = null;
            try { dataUrl = c.toDataURL({ format: "png", left: ab.left, top: ab.top, width: ab.width, height: ab.height, multiplier: mult }); }
            catch { /* cross-origin taint — production re-composites from the stored art */ }
            out.push({ view: sd.side, location: sd.side, dataUrl, place, styleImage: sd.image });
        }
        if (bgRef.current) bgRef.current.visible = true;
        if (zoneRef.current) zoneRef.current.visible = true;
        mountSide(color, sideIdx);   // restore the active side
        return out;
    };

    // Capture one side's full-canvas mockup (garment + that side's art); loads the side's bg fresh.
    const captureSideMockup = (idx) => new Promise((resolve) => {
        const c = fcRef.current, F = window.fabric, sd = color?.sides?.[idx];
        if (!c || !F || !sd) return resolve(null);
        c.getObjects().slice().forEach((o) => { if (o !== bgRef.current && o !== zoneRef.current) c.remove(o); });
        (artRef.current[sideKey(color.color, idx)] || []).forEach((o) => c.add(o));
        if (zoneRef.current) zoneRef.current.visible = false;
        c.discardActiveObject();
        F.Image.fromURL(proxied(`${sd.image}?width=${W}&height=${H}`), (img) => {
            if (img && img.width) {
                img.set({ selectable: false, evented: false, scaleX: W / img.width, scaleY: H / img.height, left: 0, top: 0 });
                if (bgRef.current) c.remove(bgRef.current); bgRef.current = img; c.add(img); c.sendToBack(img);
            }
            c.renderAll();
            let url = null;
            try { url = c.toDataURL({ format: "png", multiplier: 1 }); } catch { /* taint */ }
            resolve(url);
        });
    });

    // Front mockup (big) + back mockup (small, bottom-right corner) → one combined cart thumbnail.
    const composeFrontBack = (frontUrl, backUrl) => new Promise((resolve) => {
        const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
        const ctx = cv.getContext("2d");
        const f = new window.Image();
        f.onload = () => {
            ctx.drawImage(f, 0, 0, W, H);
            const b = new window.Image();
            const finish = () => { try { resolve(cv.toDataURL("image/jpeg", 0.85)); } catch { resolve(frontUrl); } };
            b.onload = () => {
                const bw = W * 0.4, bh = H * 0.4, bx = W - bw - 12, by = H - bh - 12;
                ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 10; ctx.fillStyle = "#fff";
                ctx.fillRect(bx - 5, by - 5, bw + 10, bh + 10); ctx.restore();
                ctx.drawImage(b, bx, by, bw, bh);
                ctx.lineWidth = 2; ctx.strokeStyle = "rgba(15,23,42,0.2)"; ctx.strokeRect(bx - 5, by - 5, bw + 10, bh + 10);
                finish();
            };
            b.onerror = finish; b.src = backUrl;
        };
        f.onerror = () => resolve(null); f.src = frontUrl;
    });

    // Cart thumbnail: both sides (front big + back corner) when both are designed, else the single side.
    const buildCartImage = async () => {
        const fi = sides.findIndex((s) => s.side === "front");
        const bi = sides.findIndex((s) => s.side === "back");
        const hasFront = fi >= 0 && (artRef.current[sideKey(color.color, fi)] || []).length;
        const hasBack = bi >= 0 && (artRef.current[sideKey(color.color, bi)] || []).length;
        const frontUrl = hasFront ? await captureSideMockup(fi) : null;
        const backUrl = hasBack ? await captureSideMockup(bi) : null;
        mountSide(color, sideIdx);   // restore the side the user was on
        if (frontUrl && backUrl) return composeFrontBack(frontUrl, backUrl);
        return frontUrl || backUrl || null;
    };

    const addToCart = async () => {
        const c = fcRef.current; if (!c || !blank || !size) { setMsg("Pick a product and size."); return; }
        const hasArt = sides.some((_, i) => (artRef.current[sideKey(color.color, i)] || []).length);
        if (!hasArt) { setMsg("Add a design first — upload one or generate with AI."); return; }
        setBusy("cart"); setMsg("");
        try {
            // Capture the mockup + per-side art on the (shared) canvas, then upload them all
            // concurrently — serial uploads were the add-to-cart bottleneck, especially on mobile.
            const mockup = await buildCartImage();
            const exported = exportAllSides();
            const uploadDataUrl = async (dataUrl) => {
                if (!dataUrl) return null;
                try {
                    const d = await (await fetch("/api/customizer/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) })).json();
                    return d.error ? null : d.url;
                } catch { return null; }
            };
            const [mockupUrl, ...sideUrls] = await Promise.all([
                uploadDataUrl(mockup),
                ...exported.map((s) => uploadDataUrl(s.dataUrl)),
            ]);
            const cartImage = mockupUrl || color?.image || null;
            const sidesOut = exported.map((s, i) => ({ view: s.view, location: s.location, artworkUrl: sideUrls[i], place: s.place, styleImage: s.styleImage }));
            const line = {
                blankId: blank.id, styleCode: blank.code, title: blank.name,
                color: color?.color || "", size: size.name, sku: size.sku || `${blank.code}-${color?.color || ""}-${size.name}`,
                priceCents: unitCents, wholesaleCents: size.wholesaleCents, image: cartImage,
                personalization: { mode: "studio", side: sidesOut[0]?.view || "front", artworkUrl: sidesOut[0]?.artworkUrl || null, sides: sidesOut },
                customKey: `cy${Date.now()}${Math.floor(Math.random() * 1000)}`,
            };
            const n = Math.max(1, qty);
            // In the native app's WebView, hand the line back to the app's cart instead of the web cart.
            if (embed && typeof window !== "undefined" && window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: "addToCart", line, qty: n }));
            } else {
                add(line, n);
            }
            setAdded(true); setTimeout(() => setAdded(false), 3000);
        } catch (e) { setMsg(e.message); } finally { setBusy(""); }
    };

    // ── save / resume a design (signed-in buyers) ──
    // Serialize each side's objects (text + placed art with transforms) keyed by view, so we can
    // re-hydrate the exact editable canvas later.
    const serializeDesign = () => {
        const out = {};
        sides.forEach((s, i) => {
            const arr = artRef.current[sideKey(color.color, i)] || [];
            if (arr.length) out[s.side] = arr.map((o) => o.toObject(["fontFamily", "lockUniScaling", "shape"]));
        });
        return out;
    };
    // Rebuild saved Fabric objects. Images are reloaded via a native Image element (WITHOUT crossOrigin,
    // and with a guaranteed onerror) so they display even when the CDN sends no CORS headers AND a bad
    // URL can't hang the whole restore. Text (and anything else) goes through enlivenObjects.
    const enliven = (objs) => Promise.all((objs || []).map((o) => new Promise((res) => {
        const F = window.fabric;
        if (o.type === "image" && o.src) {
            const el = new window.Image();
            const done = (img) => res(img);
            el.onload = () => { const img = new F.Image(el); const rest = { ...o }; delete rest.type; delete rest.src; delete rest.crossOrigin; img.set(rest); img.setCoords(); done(img); };
            el.onerror = () => done(null);
            el.src = proxied(o.src);   // same-origin → canvas stays clean for export
        } else {
            try { F.util.enlivenObjects([{ ...o, crossOrigin: undefined }], (list) => res(list && list[0]), "fabric"); }
            catch { res(null); }
        }
    }))).then((arr) => arr.filter(Boolean));
    const hydrate = async (saved) => {
        const F = window.fabric; if (!F || !saved) return;
        const b = blanks.find((x) => x.id === String(saved.blankId)); if (!b) { setMsg("That design's product is no longer available."); return; }
        const colorObj = b.colors.find((c) => c.color === saved.colorName) || b.colors[0];
        const sizeObj = b.sizes.find((s) => s.name === saved.sizeName) || b.sizes[0];
        artRef.current = {};
        for (const [view, objs] of Object.entries(saved.design || {})) {
            const idx = (colorObj.sides || []).findIndex((s) => s.side === view);
            if (idx < 0) continue;
            const list = await enliven(objs);
            list.forEach((o) => { o.set({ cornerColor: "#635bff", borderColor: "#635bff", transparentCorners: false, lockUniScaling: true }); o.setControlsVisibility({ ml: false, mr: false, mt: false, mb: false }); if (o.type === "i-text" && o.shape && o.shape !== "normal") reshape(o); });
            artRef.current[sideKey(colorObj.color, idx)] = list;
        }
        setDesignId(String(saved._id)); setDesignName(saved.name || "");
        setBlank(b); setSize(sizeObj); setSideIdx(0); setColor(colorObj);   // setColor triggers the mount effect
        requestAnimationFrame(() => { if (fcRef.current) mountSide(colorObj, 0); touch(); });   // belt-and-suspenders mount
    };
    const refreshSaved = async () => {
        if (!customer) return;
        try { const d = await (await fetch("/api/account/designs", { headers: authHeaders() })).json(); if (!d.error) setSavedList(d.designs || []); } catch { /* ignore */ }
    };
    const loadDesignById = async (id) => {
        try { const d = await (await fetch(`/api/account/designs/${id}`, { headers: authHeaders() })).json(); if (d.error) throw new Error(d.error); await hydrate(d.design); setTool(null); }
        catch (e) { setMsg(e.message); }
    };
    const deleteDesign = async (id) => {
        try { await fetch(`/api/account/designs/${id}`, { method: "DELETE", headers: authHeaders() }); setSavedList((l) => l.filter((x) => String(x._id) !== String(id))); if (String(designId) === String(id)) setDesignId(null); } catch { /* ignore */ }
    };
    const saveDesign = async () => {
        if (!customer) { setMsg("Sign in to save your design."); return; }
        if (!blank) return;
        const design = serializeDesign();
        if (!Object.keys(design).length) { setMsg("Add something to your design first."); return; }
        setBusy("save"); setMsg("");
        try {
            const body = { id: designId, blankId: blank.id, name: designName || `${blank.name} design`, styleCode: blank.code, productTitle: blank.name, colorName: color?.color, sizeName: size?.name, thumbnail: color?.image || null, design };
            const d = await (await fetch("/api/account/designs", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(body) })).json();
            if (d.error) throw new Error(d.error);
            setDesignId(d.id); setMsg("Design saved ✓"); refreshSaved();
        } catch (e) { setMsg(e.message); } finally { setBusy(""); }
    };

    if (!blanks.length) {
        return <section style={{ padding: "60px 0", textAlign: "center" }}><div className="sf-container"><h1>Create your own</h1><p style={{ opacity: 0.6 }}>No products are available to customize yet.</p></div></section>;
    }

    // ── panel styles ──
    const card = { border: "1px solid #e8edf3", borderRadius: 18, background: "#fff", boxShadow: "0 1px 3px rgba(16,24,40,0.05)" };
    const field = { padding: "12px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: "0.92rem", outline: "none", boxSizing: "border-box" };
    const pill = (on) => ({ padding: "8px 16px", borderRadius: 999, border: "1.5px solid " + (on ? "var(--sf-accent, #635bff)" : "#e2e8f0"), background: on ? "rgba(99,91,255,0.08)" : "#fff", color: on ? "var(--sf-accent, #635bff)" : "#334155", fontWeight: 700, fontSize: "0.84rem", cursor: "pointer" });
    const primary = { ...btn, width: "100%", padding: "15px", fontSize: "1rem", borderRadius: 999, opacity: busy ? 0.75 : 1 };
    const lbl = { fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.06em", color: "#94a3b8", textTransform: "uppercase", margin: "0 0 11px" };
    const stepBtn = { width: 40, height: 46, border: "none", background: "#f1f5f9", fontSize: "1.25rem", cursor: "pointer", color: "#334155" };
    const TOOLS = [{ id: "text", label: "Add Text", icon: "🅣" }, { id: "products", label: "Products", icon: "▦" }, { id: "upload", label: "Upload", icon: "⬆" }, { id: "ai", label: "AI Art", icon: "✦" }];
    const TEXT_COLORS = ["#ffffff", "#111111", "#9ca3af", "#1e3a8a", "#2563eb", "#7dd3fc", "#ea580c", "#f59e0b", "#16a34a", "#dc2626", "#a16207", "#14532d", "#6b7280", "#facc15"];
    const AI_PRESETS = ["Vintage", "Distressed", "Minimal", "Watercolor", "3D", "Retro", "Pixel Art"];
    const tabBtn = (t) => {
        const on = tool === t.id;
        return (
            <button key={t.id} onClick={() => setTool(on ? null : t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "13px 4px", background: on ? "#f8fafc" : "#fff", border: "none", borderBottom: "2px solid " + (on ? "var(--sf-accent, #635bff)" : "transparent"), color: on ? "var(--sf-accent, #635bff)" : "#475569", cursor: "pointer", fontWeight: 700, fontSize: "0.78rem" }}>
                <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{t.icon}</span>{t.label}
            </button>
        );
    };
    const back = <button onClick={() => setTool(null)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: "#0f172a", fontWeight: 700, fontSize: "0.92rem", padding: 0, marginBottom: 16 }}>‹ Back</button>;
    const colorDot = (c) => {
        const on = c.color === color?.color;
        return <button key={c.color} title={c.color} onClick={() => changeColor(c)} style={{ width: 30, height: 30, borderRadius: "50%", background: c.hex || "#e2e8f0", cursor: "pointer", border: "1px solid rgba(0,0,0,0.18)", outline: on ? "2px solid var(--sf-accent, #635bff)" : "none", outlineOffset: 2 }} />;
    };
    const swatchDot = (hex) => <button key={hex} title={hex} onClick={() => applyColor(hex)} style={{ width: 28, height: 28, borderRadius: "50%", background: hex, cursor: "pointer", border: "1px solid rgba(0,0,0,0.18)", outline: textColor.toLowerCase() === hex ? "2px solid var(--sf-accent, #635bff)" : "none", outlineOffset: 2 }} />;
    const sizeDotBtn = (s) => { const on = s.name === size?.name; return <button key={s.name} onClick={() => setSize(s)} style={{ minWidth: 46, height: 46, padding: "0 10px", borderRadius: 999, border: "1.5px solid " + (on ? "var(--sf-accent, #635bff)" : "#e2e8f0"), background: on ? "rgba(99,91,255,0.08)" : "#fff", color: on ? "var(--sf-accent, #635bff)" : "#334155", fontWeight: 700, cursor: "pointer", textTransform: "uppercase", fontSize: "0.82rem" }}>{s.name}</button>; };

    // ── reusable panel pieces (shared by desktop panel + mobile bottom sheet) ──
    const colorPicker = <div><div style={lbl}>Color · <span style={{ color: "#334155" }}>{color?.color}</span></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{(blank?.colors || []).map(colorDot)}</div></div>;
    const sizePicker = <div><div style={lbl}>Size · <span style={{ color: "#334155" }}>{size?.name}</span></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{(blank?.sizes || []).map(sizeDotBtn)}</div></div>;
    const saveControls = customer
        ? <button onClick={saveDesign} disabled={!!busy} style={{ ...ghost, width: "100%", borderRadius: 999, padding: "13px" }}>{busy === "save" ? "Saving…" : designId ? "💾 Update saved design" : "💾 Save design for later"}</button>
        : <a href="/account" style={{ display: "block", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>Sign in to save your design and finish later</a>;
    const savedListBlock = customer && savedList.length > 0 ? (
        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
            <div style={lbl}>My saved designs</div>
            <div style={{ display: "grid", gap: 8 }}>
                {savedList.map((d) => (
                    <div key={d._id} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #eef2f7", borderRadius: 12, padding: 8 }}>
                        <DesignThumb thumbnail={d.thumbnail} preview={d.preview} size={40} radius={8} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{d.productTitle}{d.colorName ? ` · ${d.colorName}` : ""}</div>
                        </div>
                        <button onClick={() => loadDesignById(d._id)} style={{ ...ghost, padding: "6px 12px", fontSize: "0.78rem", borderRadius: 8 }}>Edit</button>
                        <button onClick={() => deleteDesign(d._id)} title="Delete" style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                    </div>
                ))}
            </div>
        </div>
    ) : null;
    const qtyStepper = (
        <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={stepBtn}>−</button>
            <span style={{ minWidth: 30, textAlign: "center", fontWeight: 700 }}>{qty}</span>
            <button onClick={() => setQty((q) => Math.min(99, q + 1))} style={stepBtn}>+</button>
        </div>
    );
    const msgEl = msg ? <div style={{ color: msg.includes("✓") ? "#16a34a" : "#dc2626", fontSize: "0.85rem", marginTop: 12, textAlign: "center" }}>{msg}</div> : null;

    const textBody = (<>
        <div style={lbl}>Add custom text</div>
        <input value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="Write your text here" style={{ ...field, width: "100%" }} />
        <div style={{ ...lbl, marginTop: 18 }}>Font style</div>
        <select value={font} onChange={(e) => applyFont(e.target.value)} style={{ ...field, width: "100%", fontFamily: font }}>
            {FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
        </select>
        <div style={{ ...lbl, marginTop: 18 }}>Text shape</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {TEXT_SHAPES.map((sh) => { const on = textShape === sh.id; return (
                <button key={sh.id} onClick={() => applyShape(sh.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 4px", borderRadius: 12, border: "1.5px solid " + (on ? "var(--sf-accent, #635bff)" : "#e2e8f0"), background: on ? "rgba(99,91,255,0.08)" : "#fff", color: on ? "var(--sf-accent, #635bff)" : "#475569", cursor: "pointer", fontWeight: 700, fontSize: "0.74rem" }}>
                    <span style={{ fontSize: "1.35rem", lineHeight: 1 }}>{sh.icon}</span>{sh.label}
                </button>
            ); })}
        </div>
        <div style={{ ...lbl, marginTop: 18 }}>Color</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {TEXT_COLORS.map(swatchDot)}
            <input type="color" value={textColor} onChange={(e) => applyColor(e.target.value)} title="Custom color" style={{ width: 30, height: 30, border: "1px solid #cbd5e1", borderRadius: "50%", padding: 1, cursor: "pointer" }} />
        </div>
        <div style={{ ...lbl, marginTop: 18 }}>Sample <span style={{ color: "#cbd5e1" }}>· on {color?.color}</span></div>
        <div style={{ background: color?.hex || "#1e293b", border: "1px solid #e2e8f0", borderRadius: 14, padding: "26px 16px", textAlign: "center", overflow: "hidden" }}>
            <span style={{ fontFamily: font, color: textColor, fontSize: "1.7rem", fontWeight: 700, wordBreak: "break-word" }}>{textValue || "Hello World"}</span>
        </div>
        <button onClick={addText} disabled={!!busy} style={{ ...primary, marginTop: 18 }}>Add Text To Product</button>
        <div style={{ fontSize: "0.74rem", color: "#94a3b8", marginTop: 8, textAlign: "center" }}>Double-click text on the design to edit it.</div>
    </>);

    const productsBody = (<>
        <div style={lbl}>Choose a product</div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search styles…" style={{ ...field, width: "100%" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 14 }}>
            {blanks.filter((b) => b.name.toLowerCase().includes(search.toLowerCase())).map((b) => {
                const on = b.id === blank?.id;
                return (
                    <button key={b.id} onClick={() => { changeBlank(b); setTool(null); }} style={{ minWidth: 0, border: "2px solid " + (on ? "var(--sf-accent, #635bff)" : "#eef2f7"), borderRadius: 14, background: "#fff", padding: 8, cursor: "pointer", textAlign: "center" }}>
                        <div style={{ width: "100%", aspectRatio: "1", background: "#f8fafc", borderRadius: 10, overflow: "hidden" }}>
                            {b.image && <img src={img2(b.image, 200)} alt={b.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
                        </div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                    </button>
                );
            })}
        </div>
    </>);

    const uploadBody = (<>
        <div style={lbl}>Upload your image</div>
        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, border: "2px dashed #c7d2fe", borderRadius: 16, padding: "44px 20px", cursor: agree ? "pointer" : "not-allowed", textAlign: "center", color: "#94a3b8", opacity: agree ? 1 : 0.55 }}>
            <span style={{ fontSize: "2rem" }}>⬆️</span>
            <span style={{ fontWeight: 800, color: "var(--sf-accent, #635bff)" }}>{busy === "upload" ? "Uploading…" : "Upload"}</span>
            <span style={{ fontSize: "0.85rem" }}>Drag or drop your image here</span>
            <input type="file" accept="image/*" disabled={!agree} onChange={onUpload} style={{ display: "none" }} />
        </label>
        <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: "0.8rem", color: "#475569", marginTop: 16 }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2 }} />
            <span>I confirm that any uploaded design complies with all applicable laws and respects third-party rights.</span>
        </label>
        <div style={{ fontSize: "0.74rem", color: "#94a3b8", marginTop: 10 }}>PNG with a transparent background works best. Max 12MB.</div>
        {uploads.length > 0 && <div style={{ marginTop: 20 }}>
            <div style={lbl}>Your uploads</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {uploads.map((u) => (
                    <div key={u} style={{ position: "relative" }}>
                        <button onClick={() => addArt(u)} title="Add to this side" style={{ width: "100%", aspectRatio: "1", border: "1px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", padding: 0, cursor: "pointer", overflow: "hidden" }}>
                            <img src={img2(u, 120)} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </button>
                        <button onClick={() => removeUpload(u)} title="Remove" style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#1e293b", color: "#fff", fontSize: "0.68rem", cursor: "pointer", lineHeight: 1 }}>✕</button>
                    </div>
                ))}
            </div>
            <div style={{ fontSize: "0.74rem", color: "#94a3b8", marginTop: 8 }}>Switch to <b>Front</b> or <b>Back</b>, then tap an image to place it there — no need to upload twice.</div>
        </div>}
    </>);

    const aiBody = (<>
        <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: 14 }}>Welcome to our A.I. Design Generator</div>
        <div style={lbl}>Style preset</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {AI_PRESETS.map((p) => <button key={p} onClick={() => setAiStyle(aiStyle === p ? "" : p)} style={pill(aiStyle === p)}>{p}</button>)}
        </div>
        <div style={{ ...lbl, marginTop: 18 }}>Prompt</div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="Write your design idea here" style={{ ...field, width: "100%", resize: "vertical", fontFamily: "inherit" }} />
        <button onClick={onGenerate} disabled={!!busy} style={{ ...primary, marginTop: 16 }}>{busy === "ai" ? "Generating…" : "Generate Design"}</button>
        <div style={{ fontSize: "0.74rem", color: "#94a3b8", marginTop: 8, textAlign: "center" }}>The generated art drops straight onto your product — drag to place it.</div>
    </>);

    // canvas + front/back switcher (shared element; re-init effect keys on isMobile)
    const canvasCard = (
        <div ref={wrapRef} style={{ ...card, padding: isMobile ? 8 : 16, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "100%", boxSizing: "border-box", overflow: "hidden" }}>
            <div style={{ position: "relative", display: "block", maxWidth: "100%" }}>
                <canvas ref={canvasElRef} style={{ touchAction: "none", display: "block", maxWidth: "100%" }} />
                {activeSide?.aiGenerated && (
                    <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 11, fontWeight: 600, letterSpacing: 0.2, padding: "3px 9px", borderRadius: 5, pointerEvents: "none", fontFamily: "Arial, Helvetica, sans-serif" }}>
                        AI Generated
                    </div>
                )}
            </div>
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 10 }}>
                {sides.length > 1 ? (
                    <div style={{ display: "flex", gap: 10 }}>
                        {sides.map((s, i) => {
                            const on = i === sideIdx, designed = (artRef.current[sideKey(color.color, i)] || []).length > 0;
                            return (
                                <button key={s.side + i} onClick={() => setSideIdx(i)} title={s.label}
                                    style={{ position: "relative", padding: 0, width: 54, height: 54, borderRadius: 12, overflow: "hidden", cursor: "pointer", background: "#f8fafc", border: "2px solid " + (on ? "var(--sf-accent, #635bff)" : "#e2e8f0") }}>
                                    <img src={img2(s.image, 120)} alt={s.label} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, fontSize: "0.6rem", fontWeight: 800, textAlign: "center", color: "#fff", background: "rgba(15,23,42,0.55)", padding: "1px 0" }}>{s.label}{designed ? " ✓" : ""}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Drag · resize · rotate.</span>}
                <button onClick={delSel} style={{ ...ghost, padding: "9px 14px", fontSize: "0.84rem", borderRadius: 999 }}>🗑 Delete</button>
            </div>
        </div>
    );

    const MOBILE_TABS = [{ id: "product", label: "Product", icon: "🧢" }, { id: "text", label: "Text", icon: "🅣" }, { id: "upload", label: "Upload", icon: "⬆" }, { id: "ai", label: "AI", icon: "✦" }];
    const SHEET_TITLES = { product: "Product", products: "Choose a product", text: "Add text", upload: "Upload image", ai: "AI design" };
    const sheetBody = tool === "product"
        ? <div style={{ display: "grid", gap: 16 }}>{colorPicker}{sizePicker}<button onClick={() => setTool("products")} style={{ ...ghost, borderRadius: 999, padding: "12px" }}>Change product →</button>{saveControls}{savedListBlock}</div>
        : tool === "products" ? productsBody : tool === "text" ? textBody : tool === "upload" ? uploadBody : tool === "ai" ? aiBody : null;

    // ───────────────────────── MOBILE: fixed canvas + bottom bar + tool sheet ─────────────────────────
    if (isMobile) {
        return (
            <section style={{ padding: "12px 0 0" }}>
                <div className="sf-container" style={{ maxWidth: "100%", overflowX: "hidden", paddingBottom: 150 }}>
                    {canvasCard}
                </div>

                {/* persistent bottom bar: price + add to cart, then the tool tabs */}
                <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40, background: "#fff", borderTop: "1px solid #e8edf3", boxShadow: "0 -2px 14px rgba(16,24,40,0.08)" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px" }}>
                        {qtyStepper}
                        <button onClick={addToCart} disabled={!!busy} style={{ ...primary, flex: 1, padding: "13px" }}>{busy === "cart" ? "Adding…" : added ? "Added ✓" : `🛒 Add To Cart · ${money(unitCents * qty)}`}</button>
                    </div>
                    {added && <a href="/cart" style={{ display: "block", textAlign: "center", padding: "0 0 8px", color: "var(--sf-secondary)", fontWeight: 600, fontSize: "0.85rem" }}>View cart →</a>}
                    <div style={{ display: "flex", borderTop: "1px solid #f1f5f9" }}>
                        {MOBILE_TABS.map((t) => { const on = tool === t.id; return (
                            <button key={t.id} onClick={() => setTool(on ? null : t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "9px 2px", background: "none", border: "none", color: on ? "var(--sf-accent, #635bff)" : "#64748b", fontWeight: 700, fontSize: "0.7rem", cursor: "pointer" }}>
                                <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{t.icon}</span>{t.label}
                            </button>
                        ); })}
                    </div>
                </div>

                {/* tool bottom sheet */}
                {tool !== null && <>
                    <div onClick={() => setTool(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 50 }} />
                    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 51, background: "#fff", borderRadius: "20px 20px 0 0", maxHeight: "82vh", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ fontWeight: 800, fontSize: "1rem" }}>{SHEET_TITLES[tool]}</span>
                            <button onClick={() => setTool(null)} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>✕</button>
                        </div>
                        <div style={{ padding: 18, overflowY: "auto" }}>{sheetBody}{msgEl}</div>
                    </div>
                </>}
            </section>
        );
    }

    // ───────────────────────────────────── DESKTOP: two-column ─────────────────────────────────────
    return (
        <section style={{ padding: "28px 0 64px" }}>
            <div className="sf-container" style={{ maxWidth: "100%", overflowX: "hidden" }}>
                <h1 style={{ fontSize: "2rem", margin: "0 0 4px", fontWeight: 800, letterSpacing: "-0.02em" }}>Design studio</h1>
                <p style={{ opacity: 0.6, margin: "0 0 26px", fontSize: "0.95rem" }}>Make it yours — add text, upload art, or generate a design with AI. Drag it right where you want it.</p>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,600px) minmax(380px,460px)", gap: 28, alignItems: "start", justifyContent: "center" }}>
                    <div style={{ width: "100%", position: "sticky", top: 16 }}>{canvasCard}</div>

                    <div style={{ ...card, overflow: "hidden", width: "100%" }}>
                        <div style={{ display: "flex", borderBottom: "1px solid #eef2f7" }}>{TOOLS.map(tabBtn)}</div>
                        <div style={{ padding: 20 }}>
                            {tool === null && <div style={{ display: "grid", gap: 16 }}>
                                {colorPicker}
                                {sizePicker}
                                <div>
                                    {surchargeCents > 0 && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", color: "#64748b", marginBottom: 6 }}><span>Front + back print</span><span>+{money(surchargeCents)}</span></div>}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                                        <span style={{ fontWeight: 700, color: "#475569" }}>Total Price</span>
                                        <span style={{ fontWeight: 800, fontSize: "1.7rem" }}>{money(unitCents * qty)}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 12 }}>{qtyStepper}<button onClick={addToCart} disabled={!!busy} style={{ ...primary, flex: 1 }}>{busy === "cart" ? "Adding…" : added ? "Added ✓" : "🛒 Add To Cart"}</button></div>
                                    {added && <a href="/cart" style={{ display: "block", textAlign: "center", marginTop: 12, color: "var(--sf-secondary)", fontWeight: 600, fontSize: "0.9rem" }}>View cart →</a>}
                                </div>
                                {saveControls}
                                {savedListBlock}
                                {msgEl}
                            </div>}
                            {tool === "text" && <div>{back}{textBody}{msgEl}</div>}
                            {tool === "products" && <div>{back}{productsBody}</div>}
                            {tool === "upload" && <div>{back}{uploadBody}{msgEl}</div>}
                            {tool === "ai" && <div>{back}{aiBody}{msgEl}</div>}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
