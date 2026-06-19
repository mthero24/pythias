"use client";
import { useEffect, useRef, useState } from "react";
import {
    Box, Tabs, Tab, Button, Card, CardContent, Typography, TextField, MenuItem,
    IconButton, Select, CircularProgress, Snackbar, Alert, Divider, Tooltip, Chip, Collapse,
    Dialog, DialogContent, DialogActions, Slider, Stack, Switch, FormControlLabel,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ComputerIcon from "@mui/icons-material/Computer";
import TabletMacIcon from "@mui/icons-material/TabletMac";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import RefreshIcon from "@mui/icons-material/Refresh";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SearchIcon from "@mui/icons-material/Search";
import ViewCarouselIcon from "@mui/icons-material/ViewCarousel";
import StorefrontIcon from "@mui/icons-material/Storefront";
import NotesIcon from "@mui/icons-material/Notes";
import GridViewIcon from "@mui/icons-material/GridView";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LinkIcon from "@mui/icons-material/Link";
import GavelIcon from "@mui/icons-material/Gavel";
import DescriptionIcon from "@mui/icons-material/Description";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { THEME_PRESETS, SECTION_MANIFEST, MANIFEST_BY_TYPE, applyPreset, COLLAGE_PRESETS, POLICY_TYPES, POLICY_SLUGS } from "@pythias/storefront";

// redirects + termContent are written live by their services (migrator / term generator), NOT via the
// draft autosave — keep them out so a stale autosave can't clobber them.
const LIVE_FIELDS = ["theme", "pages", "nav", "footer", "policies", "system", "productUrlMode", "catalog", "indexableTerms", "analytics", "businessInfo", "seo", "reviews"];
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => k in (o ?? {})).map((k) => [k, o[k]]));
const clone = (v) => JSON.parse(JSON.stringify(v ?? null));

// Storefront builder — mounted in the platform (and later premier). Edits a working
// draft (theme/branding, sections, SEO/tracking) and saves/publishes via /api/storefront.
export default function StorefrontEditor({ viewUrl }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [tab, setTab]         = useState(0);
    const [status, setStatus]   = useState("draft");
    const [work, setWork]       = useState(null); // { theme, pages, nav, footer, analytics, businessInfo, seo }
    const [toast, setToast]     = useState(null);
    const [savedTick, setSavedTick] = useState(0); // bumped after each silent autosave → preview reloads

    useEffect(() => {
        fetch("/api/storefront").then((r) => r.json()).then((d) => {
            if (d.error) return;
            const s = d.site;
            setStatus(s.status ?? "draft");
            const base = (s.draft && Object.keys(s.draft).length) ? s.draft : pick(s, LIVE_FIELDS);
            base.theme ??= {}; base.pages ??= [{ slug: "home", title: "Home", sections: [] }];
            base.analytics ??= {}; base.businessInfo ??= {}; base.seo ??= {}; base.nav ??= { links: [] }; base.footer ??= {};
            setWork(base);
        }).finally(() => setLoading(false));
    }, []);

    const set = (updater) => setWork((w) => { const n = clone(w); updater(n); return n; });

    // Live editing: debounce-save the draft after each change, then bump savedTick so the WYSIWYG
    // preview reloads from the freshly-saved draft. (Publish still gates what visitors actually see.)
    const firstAutosave = useRef(true);
    const autosaveTimer = useRef(null);
    useEffect(() => {
        if (!work) return;
        if (firstAutosave.current) { firstAutosave.current = false; return; }
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(async () => {
            try {
                await fetch("/api/storefront", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: work }) });
                setSavedTick((t) => t + 1);
            } catch { /* keep editing; manual Save draft still available */ }
        }, 700);
        return () => clearTimeout(autosaveTimer.current);
    }, [work]);

    const save = async (publish) => {
        setSaving(true);
        try {
            const url = publish ? "/api/storefront/publish" : "/api/storefront";
            const res = await fetch(url, { method: publish ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: work }) });
            const d = await res.json();
            if (d.error) { setToast({ sev: "error", msg: typeof d.error === "string" ? d.error : "Save failed" }); return; }
            if (publish) setStatus("published");
            setToast({ sev: "success", msg: publish ? "Published — your storefront is live." : "Draft saved." });
        } catch (e) { setToast({ sev: "error", msg: e.message }); }
        finally { setSaving(false); }
    };

    if (loading || !work) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 3, maxWidth: (tab === 1 || tab === 2) ? 1320 : 960, mx: "auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={800}>Storefront</Typography>
                    <Chip size="small" label={status === "published" ? "Published" : "Draft"} color={status === "published" ? "success" : "default"} sx={{ mt: 0.5 }} />
                </Box>
                {viewUrl && <Button size="small" endIcon={<OpenInNewIcon />} href={viewUrl} target="_blank" sx={{ textTransform: "none" }}>View site</Button>}
                <Button variant="outlined" disabled={saving} onClick={() => save(false)} sx={{ textTransform: "none" }}>Save draft</Button>
                <Button variant="contained" disabled={saving} onClick={() => save(true)}
                    startIcon={saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : null} sx={{ textTransform: "none" }}>Publish</Button>
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab label="Design" sx={{ textTransform: "none" }} />
                <Tab label="Sections" sx={{ textTransform: "none" }} />
                <Tab label="Landing Pages" sx={{ textTransform: "none" }} />
                <Tab label="SEO & Tracking" sx={{ textTransform: "none" }} />
            </Tabs>

            {tab === 0 && <DesignTab work={work} set={set} />}
            {tab === 1 && <SectionsTab work={work} set={set} viewUrl={viewUrl} previewTick={savedTick} />}
            {tab === 2 && <LandingPagesTab viewUrl={viewUrl} />}
            {tab === 3 && <SeoTab work={work} set={set} />}

            <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                {toast && <Alert severity={toast.sev} onClose={() => setToast(null)}>{toast.msg}</Alert>}
            </Snackbar>
        </Box>
    );
}

// ── Design: theme presets + colors/fonts + logo ──────────────────────────────
function DesignTab({ work, set }) {
    const theme = work.theme ?? {};
    const colors = theme.colors ?? {};
    const fonts = theme.fonts ?? {};
    const applyTheme = (preset) => set((w) => { const t = applyPreset(preset.id, { name: "" }).theme; w.theme = { ...w.theme, colors: t.colors, fonts: t.fonts, baseThemeId: t.baseThemeId }; });
    const cat = work.catalog ?? {};
    const setCat = (path, val) => set((w) => {
        w.catalog = w.catalog || {};
        const parts = path.split("."); let o = w.catalog;
        for (let i = 0; i < parts.length - 1; i++) { o[parts[i]] = o[parts[i]] || {}; o = o[parts[i]]; }
        o[parts[parts.length - 1]] = val;
    });
    const [slugBusy, setSlugBusy] = useState(false);
    const [slugMsg, setSlugMsg] = useState("");
    const genSlugs = async () => {
        setSlugBusy(true); setSlugMsg("");
        try {
            const r = await fetch("/api/storefront/product-slugs", { method: "POST" });
            const d = await r.json();
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            setSlugMsg(`Done — ${d.updated} product URL${d.updated === 1 ? "" : "s"} generated.`);
        } catch (e) { setSlugMsg(e.message || "Failed"); }
        finally { setSlugBusy(false); }
    };

    const FONTS = ["Inter", "Space Grotesk", "Fraunces", "Poppins", "Georgia"];
    return (
        <Box>
            <Typography fontWeight={700} sx={{ mb: 1 }}>Choose a look</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 1.5, mb: 3 }}>
                {THEME_PRESETS.map((p) => (
                    <Card key={p.id} variant="outlined" sx={{ cursor: "pointer", borderColor: theme.baseThemeId === p.id ? "primary.main" : undefined, borderWidth: theme.baseThemeId === p.id ? 2 : 1 }} onClick={() => applyTheme(p)}>
                        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                            <Box sx={{ display: "flex", gap: 0.5, mb: 1 }}>
                                {p.swatch.map((c, i) => <Box key={i} sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: c, border: "1px solid rgba(0,0,0,0.1)" }} />)}
                            </Box>
                            <Typography fontWeight={700} fontSize="0.9rem">{p.name}</Typography>
                            <Typography fontSize="0.72rem" color="text.secondary">{p.description}</Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Typography fontWeight={700} sx={{ mb: 1 }}>Colors</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
                {["primary", "secondary", "background", "text", "accent"].map((key) => (
                    <Box key={key} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <input type="color" value={colors[key] || "#000000"} onChange={(e) => set((w) => { w.theme.colors = { ...w.theme.colors, [key]: e.target.value }; })}
                            style={{ width: 44, height: 44, border: "none", background: "none", cursor: "pointer" }} />
                        <Typography fontSize="0.7rem" color="text.secondary" sx={{ textTransform: "capitalize" }}>{key}</Typography>
                    </Box>
                ))}
            </Box>

            <Typography fontWeight={700} sx={{ mb: 1 }}>Fonts</Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                {["heading", "body"].map((k) => (
                    <TextField key={k} select size="small" label={k} value={fonts[k] || "Inter"} sx={{ minWidth: 180 }}
                        onChange={(e) => set((w) => { w.theme.fonts = { ...w.theme.fonts, [k]: e.target.value }; })}>
                        {FONTS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                    </TextField>
                ))}
            </Box>

            <Typography fontWeight={700} sx={{ mb: 1 }}>Branding</Typography>
            <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <ImageUploadField
                    label="Logo"
                    value={theme.logoUrl}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    hint="Shown in your store header. PNG/SVG with transparency works best."
                    onChange={(url) => set((w) => { w.theme.logoUrl = url; })}
                />
                <ImageUploadField
                    label="Favicon"
                    value={theme.favicon}
                    accept="image/png,image/x-icon,image/svg+xml,image/webp"
                    hint="The little icon in the browser tab. Square, 32×32 or larger."
                    onChange={(url) => set((w) => { w.theme.favicon = url; })}
                />
            </Box>

            <Typography fontWeight={700} sx={{ mt: 3, mb: 1 }}>Product URLs</Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <TextField select size="small" label="URL style" value={work.productUrlMode || "slug"} sx={{ minWidth: 260 }}
                    onChange={(e) => set((w) => { w.productUrlMode = e.target.value; })}>
                    <MenuItem value="slug">Product name — best SEO (/products/blue-tee)</MenuItem>
                    <MenuItem value="sku">SKU (/products/ABC-123)</MenuItem>
                    <MenuItem value="id">ID (/products/65f0…)</MenuItem>
                </TextField>
                <Button variant="outlined" size="small" onClick={genSlugs} disabled={slugBusy}
                    startIcon={slugBusy ? <CircularProgress size={14} /> : null} sx={{ textTransform: "none" }}>
                    {slugBusy ? "Generating…" : "Generate clean URLs"}
                </Button>
                {slugMsg && <Typography fontSize="0.78rem" color="text.secondary">{slugMsg}</Typography>}
            </Box>
            <Typography fontSize="0.7rem" color="text.disabled" sx={{ mt: 0.5 }}>
                “Generate clean URLs” builds name-based slugs for products that don't have one yet. Until then those links use the product ID (still works).
            </Typography>

            <Typography fontWeight={700} sx={{ mt: 3, mb: 1 }}>Catalog &amp; filters</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
                <TextField select size="small" label="Filters on desktop" value={cat.filterDisplay?.desktop || "sidebar"} sx={{ minWidth: 190 }} onChange={(e) => setCat("filterDisplay.desktop", e.target.value)}>
                    <MenuItem value="sidebar">Live sidebar</MenuItem>
                    <MenuItem value="menu">Button → drawer</MenuItem>
                </TextField>
                <TextField select size="small" label="Filters on mobile" value={cat.filterDisplay?.mobile || "menu"} sx={{ minWidth: 190 }} onChange={(e) => setCat("filterDisplay.mobile", e.target.value)}>
                    <MenuItem value="sidebar">Live sidebar</MenuItem>
                    <MenuItem value="menu">Button → drawer</MenuItem>
                </TextField>
                <TextField select size="small" label="Drawer slides from" value={cat.drawerSide || "left"} sx={{ minWidth: 160 }} onChange={(e) => setCat("drawerSide", e.target.value)}>
                    {["left", "right", "top", "bottom"].map((s) => <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>{s}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Product image thumbnails" value={cat.galleryThumbs || "bottom"} sx={{ minWidth: 190 }} onChange={(e) => setCat("galleryThumbs", e.target.value)}>
                    {["bottom", "top", "left", "right"].map((s) => <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>{s}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Carousel images" value={cat.galleryScope || "all"} sx={{ minWidth: 200 }} onChange={(e) => setCat("galleryScope", e.target.value)}>
                    <MenuItem value="all">All colors</MenuItem>
                    <MenuItem value="current">Selected color only</MenuItem>
                </TextField>
            </Box>
            <Box sx={{ mt: 1.5 }}>
                <Typography fontSize="0.82rem" fontWeight={700} sx={{ mb: 0.25 }}>Show filters</Typography>
                {["department", "category", "color", "size", "brand", "price"].map((f) => (
                    <FormControlLabel key={f} sx={{ textTransform: "capitalize", mr: 2 }}
                        control={<Switch size="small" checked={cat.filters?.[f] !== false} onChange={(e) => setCat(`filters.${f}`, e.target.checked)} />} label={f} />
                ))}
            </Box>
            <Box sx={{ mt: 0.5 }}>
                <Typography fontSize="0.82rem" fontWeight={700} sx={{ mb: 0.25 }}>Product cards</Typography>
                <FormControlLabel sx={{ mr: 2 }} control={<Switch size="small" checked={cat.showSwatches !== false} onChange={(e) => setCat("showSwatches", e.target.checked)} />} label="Color swatches" />
                <FormControlLabel sx={{ mr: 2 }} control={<Switch size="small" checked={cat.showAltView !== false} onChange={(e) => setCat("showAltView", e.target.checked)} />} label="“More views” badge" />
                <FormControlLabel control={<Switch size="small" checked={cat.quickAdd !== false} onChange={(e) => setCat("quickAdd", e.target.checked)} />} label="Quick-add “+” button" />
            </Box>
            <Box sx={{ mt: 0.5 }}>
                <FormControlLabel control={<Switch size="small" checked={cat.addToCartModal === true} onChange={(e) => setCat("addToCartModal", e.target.checked)} />}
                    label={<span>Add-to-cart pop-up <Typography component="span" fontSize="0.72rem" color="text.disabled">(confirmation modal when an item is added)</Typography></span>} />
            </Box>
            <Box sx={{ mt: 0.5 }}>
                <Typography fontSize="0.82rem" fontWeight={700} sx={{ mb: 0.25 }}>Reviews</Typography>
                <FormControlLabel control={<Switch size="small" checked={work.reviews?.verifiedOnly !== false} onChange={(e) => set((w) => { w.reviews = w.reviews || {}; w.reviews.verifiedOnly = e.target.checked; })} />}
                    label={<span>Verified buyers only <Typography component="span" fontSize="0.72rem" color="text.disabled">(must have purchased the product to leave a review)</Typography></span>} />
            </Box>
        </Box>
    );
}

// Logo/favicon picker: preview + Upload/Replace/Remove. Uploads server-side to /api/admin/upload
// (Wasabi) — present in BOTH platform and premier, so the shared editor works in either app.
function ImageUploadField({ label, value, hint, accept, onChange }) {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const fileRef = useRef(null);
    const upload = async (file) => {
        if (!file) return;
        setBusy(true); setErr("");
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("folder", "storefront");
            const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
            const d = await r.json();
            if (d.error || !d.url) throw new Error(d.msg || "Upload failed");
            onChange(d.url);
        } catch (e) {
            setErr(e.message || "Upload failed");
        } finally {
            setBusy(false);
        }
    };
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 240 }}>
            <Typography fontSize="0.82rem" fontWeight={600} color="text.secondary">{label}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 64, height: 64, borderRadius: 1.5, border: "1px dashed", borderColor: "divider", bgcolor: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {value
                        ? <img src={value} alt={label} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        : <Typography fontSize="0.62rem" color="text.disabled">None</Typography>}
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <input ref={fileRef} type="file" accept={accept} style={{ display: "none" }} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
                    <Button size="small" variant="outlined" disabled={busy} onClick={() => fileRef.current?.click()} startIcon={busy ? <CircularProgress size={14} /> : null}>
                        {busy ? "Uploading…" : value ? "Replace" : "Upload"}
                    </Button>
                    {value && <Button size="small" color="error" onClick={() => onChange("")}>Remove</Button>}
                </Box>
            </Box>
            {hint && <Typography fontSize="0.68rem" color="text.disabled" sx={{ maxWidth: 240 }}>{hint}</Typography>}
            {err && <Typography fontSize="0.68rem" color="error">{err}</Typography>}
        </Box>
    );
}

// Crop-to-ratio uploader. Shows a frame the exact shape a collage spot needs (`aspect` = w/h); the
// seller drags + zooms to fit, then we render the cropped region to that ratio and upload it. So the
// image always fills its tile cleanly instead of getting awkwardly cover-cropped at render time.
function CropUploadField({ label, value, aspect = 1, onChange, enableAi = false, onMeta }) {
    const [open, setOpen] = useState(false);
    const [src, setSrc] = useState("");
    const [nat, setNat] = useState({ w: 0, h: 0 });
    const [zoom, setZoom] = useState(1);
    const [off, setOff] = useState({ x: 0, y: 0 });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const drag = useRef(null);
    const fileRef = useRef(null);
    // AI "describe this image" state (only when enableAi).
    const [aiOpen, setAiOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiBusy, setAiBusy] = useState(false);
    const [aiErr, setAiErr] = useState("");

    const FRAME = 340;
    const fw = aspect >= 1 ? FRAME : Math.round(FRAME * aspect);
    const fh = aspect >= 1 ? Math.round(FRAME / aspect) : FRAME;
    const baseScale = nat.w ? Math.max(fw / nat.w, fh / nat.h) : 1;
    const eff = baseScale * zoom;
    const dispW = nat.w * eff, dispH = nat.h * eff;
    const clampOff = (o) => ({ x: Math.min(0, Math.max(fw - dispW, o.x)), y: Math.min(0, Math.max(fh - dispH, o.y)) });

    useEffect(() => { if (open) setOff((o) => clampOff(o)); /* re-clamp on zoom */ }, [zoom]); // eslint-disable-line

    // Load any image source (file data URL or AI data URL) into the crop dialog.
    const loadSrc = (dataUrl, onErr) => {
        const img = new Image();
        img.onload = () => { setNat({ w: img.naturalWidth, h: img.naturalHeight }); setSrc(dataUrl); setZoom(1); setOff({ x: 0, y: 0 }); setErr(""); setOpen(true); };
        img.onerror = () => (onErr || setErr)("Could not load that image.");
        img.src = dataUrl;
    };
    const pick = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => loadSrc(reader.result);
        reader.readAsDataURL(file);
    };
    const runAi = async () => {
        const p = aiPrompt.trim(); if (!p) return;
        setAiBusy(true); setAiErr("");
        try {
            const r = await fetch("/api/storefront/sections/tile-image", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: p, aspect }),
            });
            const d = await r.json();
            if (d.error || !d.dataUrl) throw new Error(typeof d.error === "string" ? d.error : (d.msg || "Generation failed"));
            onMeta?.(d);                          // fill label / sub-label / link
            setAiOpen(false); setAiPrompt("");
            loadSrc(d.dataUrl, setAiErr);         // open the cropper with the generated image
        } catch (e) { setAiErr(e.message || "Generation failed"); }
        finally { setAiBusy(false); }
    };

    const onDown = (e) => { drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y }; e.currentTarget.setPointerCapture?.(e.pointerId); };
    const onMove = (e) => { if (!drag.current) return; setOff(clampOff({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) })); };
    const onUp = () => { drag.current = null; };

    const confirmCrop = async () => {
        setBusy(true); setErr("");
        try {
            const img = new Image(); img.src = src; try { await img.decode(); } catch { /* fall through */ }
            const sx = -off.x / eff, sy = -off.y / eff, sw = fw / eff, sh = fh / eff;
            const outW = Math.min(Math.round(sw), 1600), outH = Math.round(outW / aspect);
            const c = document.createElement("canvas"); c.width = outW; c.height = outH;
            c.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
            const blob = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.9));
            const fd = new FormData();
            fd.append("file", new File([blob], "tile.jpg", { type: "image/jpeg" }));
            fd.append("folder", "storefront");
            const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
            const d = await r.json();
            if (d.error || !d.url) throw new Error(d.msg || "Upload failed");
            onChange(d.url); setOpen(false);
        } catch (e) {
            setErr(e.message || "Upload failed");
        } finally {
            setBusy(false);
        }
    };

    const ratioLabel = aspect >= 1 ? `${aspect.toFixed(2)} : 1 (wide)` : `1 : ${(1 / aspect).toFixed(2)} (tall)`;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <Typography fontSize="0.78rem" fontWeight={600} color="text.secondary">{label}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 64, height: 64, borderRadius: 1.5, border: "1px dashed", borderColor: "divider", bgcolor: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {value ? <img src={value} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Typography fontSize="0.6rem" color="text.disabled">None</Typography>}
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
                    <Button size="small" variant="outlined" onClick={() => fileRef.current?.click()} sx={{ textTransform: "none" }}>{value ? "Replace" : "Upload"}</Button>
                    {value && <Button size="small" color="error" onClick={() => onChange("")} sx={{ textTransform: "none" }}>Remove</Button>}
                </Box>
            </Box>
            {enableAi && (aiOpen ? (
                <Box sx={{ p: 0.75, border: "1px dashed", borderColor: "secondary.light", borderRadius: 1, bgcolor: "#faf7ff", display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <TextField size="small" multiline minRows={2} autoFocus placeholder="Describe this image…" value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)} disabled={aiBusy} sx={{ bgcolor: "#fff" }} />
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Button size="small" variant="contained" onClick={runAi} disabled={aiBusy}
                            startIcon={aiBusy ? <CircularProgress size={12} sx={{ color: "#fff" }} /> : <AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                            sx={{ textTransform: "none", fontSize: "0.7rem", minWidth: 0 }}>{aiBusy ? "Generating…" : "Generate"}</Button>
                        <Button size="small" onClick={() => setAiOpen(false)} disabled={aiBusy} sx={{ textTransform: "none", fontSize: "0.7rem", minWidth: 0 }}>Cancel</Button>
                    </Box>
                    {aiErr && <Typography fontSize="0.66rem" color="error">{aiErr}</Typography>}
                    <Typography fontSize="0.62rem" color="text.disabled">Generates the image, opens the cropper, and fills label, sub-label & link.</Typography>
                </Box>
            ) : (
                <Button size="small" startIcon={<AutoAwesomeIcon sx={{ fontSize: 15 }} />} onClick={() => { setAiOpen(true); setAiErr(""); }}
                    sx={{ textTransform: "none", fontSize: "0.72rem", color: "secondary.main", alignSelf: "flex-start", minWidth: 0 }}>AI image</Button>
            ))}
            {err && !open && <Typography fontSize="0.68rem" color="error">{err}</Typography>}

            <Dialog open={open} onClose={() => !busy && setOpen(false)} maxWidth="sm">
                <DialogContent>
                    <Typography fontWeight={700} sx={{ mb: 0.25 }}>Crop to fit this spot</Typography>
                    <Typography fontSize="0.78rem" color="text.secondary" sx={{ mb: 1.5 }}>Drag to position, slider to zoom. The frame is the exact shape this tile needs — <b>{ratioLabel}</b>.</Typography>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Box
                            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
                            sx={{ position: "relative", width: fw, height: fh, overflow: "hidden", borderRadius: 2, bgcolor: "#000", cursor: "grab", touchAction: "none", boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.7)" }}
                        >
                            {src && <img src={src} alt="crop" draggable={false} style={{ position: "absolute", left: off.x, top: off.y, width: dispW, height: dispH, maxWidth: "none", userSelect: "none" }} />}
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2 }}>
                        <Typography fontSize="0.75rem" color="text.secondary">Zoom</Typography>
                        <Slider size="small" min={1} max={3} step={0.01} value={zoom} onChange={(_, v) => setZoom(v)} />
                    </Box>
                    {err && <Typography fontSize="0.72rem" color="error" sx={{ mt: 1 }}>{err}</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} disabled={busy} sx={{ textTransform: "none" }}>Cancel</Button>
                    <Button variant="contained" onClick={confirmCrop} disabled={busy} startIcon={busy ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : null} sx={{ textTransform: "none" }}>{busy ? "Uploading…" : "Crop & use"}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

const slugifyClient = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "page";

const DEVICES = {
    desktop: { label: "Desktop", width: null, icon: <ComputerIcon fontSize="small" /> },
    tablet:  { label: "Tablet",  width: 800,  icon: <TabletMacIcon fontSize="small" /> },
    mobile:  { label: "Mobile",  width: 390,  icon: <SmartphoneIcon fontSize="small" /> },
};

// Built-in pages every store has. Sellers add merchandising sections to each (the storefront routes
// render them: home top-to-bottom, product/cart/search below the core content). Reserved slugs —
// stored in work.pages just like custom pages, but always shown and never deletable.
const SYSTEM_PAGES = [
    { slug: "home",    title: "Home",    icon: <HomeIcon fontSize="small" />,       hint: "Your landing page" },
    { slug: "products", title: "Shop / Search", icon: <SearchIcon fontSize="small" />, hint: "Shown on the shop & search page" },
    { slug: "product",  title: "Product",       icon: <Inventory2Icon fontSize="small" />, hint: "Shown on every product page" },
    { slug: "cart",     title: "Cart",          icon: <ShoppingCartIcon fontSize="small" />, hint: "Shown under the shopping cart" },
];
const SYSTEM_SLUGS = new Set(SYSTEM_PAGES.map((p) => p.slug));
// Site nav menus — edited as link lists (label + href) rather than sections.
const MENUS = [
    { key: "menu:header", title: "Header menu", navKey: "nav",    icon: <MenuIcon fontSize="small" /> },
    { key: "menu:footer", title: "Footer menu", navKey: "footer", icon: <LinkIcon fontSize="small" /> },
];
const isMenuSlug = (s) => typeof s === "string" && s.startsWith("menu:");
// Legal/policy surfaces share the page picker too, namespaced "policy:<slug>".
const isPolicySlug = (s) => typeof s === "string" && s.startsWith("policy:");
const slugifyPolicy = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "policy";
// Customizable system pages — namespaced "special:<key>"; stored under work.system[key].
const SPECIAL_PAGES = [
    { key: "special:notFound", sysKey: "notFound", title: "404 / Not found", preview: "/preview/not-found", icon: <ReportProblemIcon fontSize="small" /> },
    { key: "special:error",    sysKey: "error",    title: "Error page",      preview: "/preview/error",     icon: <ErrorOutlineIcon fontSize="small" /> },
];
const isSpecialSlug = (s) => typeof s === "string" && s.startsWith("special:");

// Per-section-type presentation for the planner: an icon, a one-line "what is this", and a summary of
// the section's current content (so a collapsed card tells you what's in it at a glance).
const SECTION_META = {
    hero:             { icon: <ViewCarouselIcon fontSize="small" />, blurb: "Big banner with a headline & button",      summary: (s) => s?.headline || "Banner" },
    featuredProducts: { icon: <StorefrontIcon fontSize="small" />,   blurb: "A grid of products (search & sort)",        summary: (s) => s?.heading || (s?.query ? `“${s.query}”` : "Product grid") },
    richText:         { icon: <NotesIcon fontSize="small" />,        blurb: "A heading and a block of text",             summary: (s) => s?.heading || "Text block" },
    imageCollage:     { icon: <GridViewIcon fontSize="small" />,     blurb: "Clickable image tiles / lookbook",          summary: (s) => { const n = Array.isArray(s?.rows) ? s.rows.length : 0; return s?.heading || (n ? `${n} row${n > 1 ? "s" : ""} of tiles` : "Image tiles"); } },
};
const sectionMeta = (type) => SECTION_META[type] || { icon: <GridViewIcon fontSize="small" />, blurb: "", summary: () => type };

// ── Sections: live WYSIWYG — preview (with device toggle) on the left, editing panel on the right.
// Edits auto-save (parent) and bump `previewTick`, so the preview refreshes as you build.
function SectionsTab({ work, set, viewUrl, previewTick }) {
    const pages = work.pages ?? [];
    const [slug, setSlug] = useState("home");
    const isMenu = isMenuSlug(slug);
    const isPolicy = isPolicySlug(slug);
    const isSpecial = isSpecialSlug(slug);
    const menuDef = MENUS.find((m) => m.key === slug);
    const sysDef = SYSTEM_PAGES.find((s) => s.slug === slug);
    const specialDef = SPECIAL_PAGES.find((s) => s.key === slug);
    const policySlug = isPolicy ? slug.slice(7) : null;
    const policyDef = POLICY_TYPES.find((p) => p.slug === policySlug);   // built-in def (undefined for custom)
    const allPolicies = work.policies ?? [];
    const customPolicies = allPolicies.filter((p) => p && !POLICY_SLUGS.has(p.slug));
    // System pages may not exist in work.pages until first edited — synthesize an empty shell so the UI works.
    const page = (isMenu || isPolicy || isSpecial)
        ? { slug, title: isMenu ? menuDef?.title : isSpecial ? specialDef?.title : (policyDef?.title || allPolicies.find((p) => p.slug === policySlug)?.title || policySlug) }
        : (pages.find((p) => p.slug === slug) || (sysDef ? { slug, title: sysDef.title, sections: [] } : pages[0]));
    const sections = page?.sections ?? [];
    const customPages = pages.filter((p) => !SYSTEM_SLUGS.has(p.slug));

    const [adding, setAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [openIdx, setOpenIdx] = useState(0);   // which section's fields are expanded
    const [addOpen, setAddOpen] = useState(false);
    const [device, setDevice] = useState("desktop");
    const [manualTick, setManualTick] = useState(0);
    const [aiOpen, setAiOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiBusy, setAiBusy] = useState(false);
    const [aiErr, setAiErr] = useState("");
    const [panelOpen, setPanelOpen] = useState(true);   // collapse the editing panel for a bigger preview
    const [dragIdx, setDragIdx] = useState(null);       // section being dragged (native drag-to-reorder)
    const [overIdx, setOverIdx] = useState(null);       // drop target highlight

    const editPage = (fn) => set((w) => {
        w.pages ??= [];
        let p = w.pages.find((x) => x.slug === slug);
        if (!p) { p = { slug, title: sysDef?.title || slug, sections: [], ...(sysDef ? { system: true } : {}) }; w.pages.push(p); }
        p.sections ??= [];
        fn(p);
    });
    const move = (i, d) => editPage((p) => { const j = i + d; if (j < 0 || j >= p.sections.length) return; const [s] = p.sections.splice(i, 1); p.sections.splice(j, 0, s); });
    const reorder = (from, to) => { if (from == null || to == null || from === to) return; editPage((p) => { const [s] = p.sections.splice(from, 1); p.sections.splice(to, 0, s); }); setOpenIdx(to); };
    const remove = (i) => { editPage((p) => p.sections.splice(i, 1)); setOpenIdx(null); };
    const add = (type) => { editPage((p) => p.sections.push({ type, settings: {} })); setAddOpen(false); setOpenIdx(sections.length); };
    const setField = (i, key, val) => editPage((p) => { p.sections[i].settings = { ...p.sections[i].settings, [key]: val }; });

    const addPage = () => {
        const title = newTitle.trim();
        if (!title) return;
        let s = slugifyClient(title);
        if (SYSTEM_SLUGS.has(s) || pages.some((p) => p.slug === s)) s = `${s}-${pages.length}`;
        set((w) => { (w.pages ??= []).push({ slug: s, title, sections: [] }); });
        setSlug(s); setNewTitle(""); setAdding(false); setOpenIdx(null);
    };
    const deletePage = () => {
        if (SYSTEM_SLUGS.has(slug) || isMenu || isPolicy) return;
        if (!confirm(`Delete the "${page?.title || slug}" page and its sections?`)) return;
        set((w) => { w.pages = (w.pages ?? []).filter((p) => p.slug !== slug); });
        setSlug("home");
    };
    const addPolicy = () => {
        const taken = new Set([...POLICY_SLUGS, ...allPolicies.map((p) => p.slug)]);
        let s = "policy", n = 1; while (taken.has(s)) s = `policy-${++n}`;
        set((w) => { (w.policies ??= []).push({ slug: s, title: "New Policy", body: "" }); });
        setSlug(`policy:${s}`); setOpenIdx(0);
    };

    const runAi = async () => {
        setAiBusy(true); setAiErr("");
        try {
            const brand = work.businessInfo?.legalName || work.seo?.title || work.businessInfo?.name || "our store";
            const r = await fetch("/api/storefront/sections/ai", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ brand, pageTitle: page?.title || "Home", prompt: aiPrompt.trim() }),
            });
            const d = await r.json();
            if (d.error || !d.sections?.length) throw new Error(typeof d.error === "string" ? d.error : "No suggestions returned");
            editPage((p) => { p.sections.push(...d.sections); });
            setAiOpen(false); setAiPrompt("");
        } catch (e) {
            setAiErr(e.message || "AI suggestion failed");
        } finally {
            setAiBusy(false);
        }
    };

    const base = (viewUrl || "").replace(/\/$/, "");
    // Map each editable surface to a real storefront route. Menus live on every page → preview on home.
    const routeFor = {
        home: base, products: `${base}/products`, cart: `${base}/cart`, product: `${base}/preview/product`,
    };
    const previewPath = base
        ? (isMenu || slug === "home" ? base
            : isPolicy ? `${base}/policies/${policySlug}`
            : isSpecial ? `${base}${specialDef?.preview || ""}`
            : (routeFor[slug] || `${base}/${slug}`))
        : null;
    const previewUrl = previewPath ? `${previewPath}?preview=1` : null;   // ?preview=1 → render the saved draft
    const tick = `${previewTick}-${manualTick}`;
    const dev = DEVICES[device];

    // Selectable "pill" for page/menu navigation.
    const navPillSx = (active) => ({
        textTransform: "none", borderRadius: 2, px: 1.1, py: 0.55, minWidth: 0, justifyContent: "flex-start",
        border: "1px solid", borderColor: active ? "primary.main" : "divider",
        bgcolor: active ? "primary.50" : "#fff", color: active ? "primary.main" : "text.secondary",
        fontWeight: active ? 700 : 500, fontSize: "0.8rem", lineHeight: 1.2,
        "& .MuiButton-startIcon": { mr: 0.6 }, "&:hover": { borderColor: "primary.main", bgcolor: active ? "primary.50" : "#f6f8fd" },
    });

    return (
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: { xs: "wrap", md: "nowrap" } }}>
            {/* ── RIGHT: live preview with device toggle (expands when the panel is collapsed) ── */}
            <Box sx={{ flex: 1, minWidth: 0, position: { md: "sticky" }, top: 12, order: { xs: 2, md: 2 } }}>
                <Card variant="outlined" sx={{ overflow: "hidden" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderBottom: "1px solid", borderColor: "divider", bgcolor: "#f8fafc" }}>
                        <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: "#34c759" }} />
                        <Typography fontSize="0.76rem" fontWeight={600} color="text.secondary">Live preview · {isMenu ? `${menuDef?.title} (shown on every page)` : isPolicy ? `/policies/${policySlug}` : isSpecial ? specialDef?.title : `/${slug === "home" ? "" : slug}`}</Typography>
                        <Box sx={{ flex: 1 }} />
                        {/* device toggle */}
                        <Box sx={{ display: "flex", border: "1px solid", borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
                            {Object.entries(DEVICES).map(([k, d]) => (
                                <Tooltip key={k} title={d.label}>
                                    <IconButton size="small" onClick={() => setDevice(k)} sx={{ borderRadius: 0, color: device === k ? "primary.main" : "text.disabled", bgcolor: device === k ? "primary.50" : "transparent" }}>
                                        {d.icon}
                                    </IconButton>
                                </Tooltip>
                            ))}
                        </Box>
                        <Tooltip title="Refresh preview"><IconButton size="small" onClick={() => setManualTick((k) => k + 1)}><RefreshIcon fontSize="small" /></IconButton></Tooltip>
                        {previewUrl && <Tooltip title="Open in new tab"><IconButton size="small" component="a" href={previewUrl} target="_blank"><OpenInNewIcon fontSize="small" /></IconButton></Tooltip>}
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "center", bgcolor: device === "desktop" ? "#fff" : "#eef1f5", p: device === "desktop" ? 0 : 2 }}>
                        {previewUrl ? (
                            <iframe
                                key={tick}
                                src={`${previewUrl}&_pv=${tick}`}
                                title="preview"
                                style={{
                                    width: dev.width ? `${dev.width}px` : "100%",
                                    maxWidth: "100%",
                                    height: "76vh",
                                    border: device === "desktop" ? "none" : "1px solid #d4d9e0",
                                    borderRadius: device === "mobile" ? 22 : device === "tablet" ? 12 : 0,
                                    background: "#fff",
                                    display: "block",
                                    boxShadow: device === "desktop" ? "none" : "0 6px 24px rgba(0,0,0,0.10)",
                                }}
                            />
                        ) : (
                            <Box sx={{ p: 6, textAlign: "center", color: "text.secondary" }}>Preview unavailable — the store's view URL isn't set.</Box>
                        )}
                    </Box>
                    <Typography fontSize="0.68rem" color="text.disabled" sx={{ px: 1.5, py: 0.6 }}>
                        Updates automatically as you edit (your draft auto-saves). Visitors keep seeing the published site until you hit <b>Publish</b>.
                    </Typography>
                </Card>
            </Box>

            {/* ── LEFT: editing panel — collapse it for a bigger preview ── */}
            {panelOpen ? (
            <Box sx={{ width: { xs: "100%", md: 420 }, flexShrink: 0, display: "flex", flexDirection: "column", gap: 1.25, order: { xs: 1, md: 1 } }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={800} sx={{ fontSize: "1.05rem", lineHeight: 1.1 }}>Site builder</Typography>
                        <Typography fontSize="0.72rem" color="text.disabled">Pick a page, then drag sections to arrange it.</Typography>
                    </Box>
                    <Tooltip title="Collapse for a bigger preview"><IconButton size="small" onClick={() => setPanelOpen(false)}><ChevronLeftIcon fontSize="small" /></IconButton></Tooltip>
                </Box>

                {/* ── page / menu navigation as labelled pills ── */}
                <Box sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "#fafbfc", display: "flex", flexDirection: "column", gap: 0.75 }}>
                    <Typography fontSize="0.66rem" fontWeight={800} letterSpacing="0.06em" color="text.disabled">PAGES</Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                        {SYSTEM_PAGES.map((p) => (
                            <Button key={p.slug} size="small" startIcon={p.icon} onClick={() => { setSlug(p.slug); setOpenIdx(0); }} sx={navPillSx(slug === p.slug)}>{p.title}</Button>
                        ))}
                    </Box>
                    {customPages.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                            {customPages.map((p) => (
                                <Button key={p.slug} size="small" onClick={() => { setSlug(p.slug); setOpenIdx(0); }} sx={navPillSx(slug === p.slug)}>{p.title || p.slug}</Button>
                            ))}
                        </Box>
                    )}
                    {adding ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <TextField size="small" label="New page title" value={newTitle} autoFocus
                                onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addPage(); if (e.key === "Escape") setAdding(false); }} sx={{ flex: 1 }} />
                            <Button size="small" variant="contained" onClick={addPage} sx={{ textTransform: "none" }}>Add</Button>
                        </Box>
                    ) : (
                        <Button size="small" startIcon={<AddIcon fontSize="small" />} onClick={() => setAdding(true)} sx={{ textTransform: "none", alignSelf: "flex-start", color: "text.secondary", fontSize: "0.76rem" }}>New page</Button>
                    )}
                    <Typography fontSize="0.66rem" fontWeight={800} letterSpacing="0.06em" color="text.disabled" sx={{ mt: 0.25 }}>MENUS</Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                        {MENUS.map((m) => (
                            <Button key={m.key} size="small" startIcon={m.icon} onClick={() => { setSlug(m.key); setOpenIdx(0); }} sx={navPillSx(slug === m.key)}>{m.title}</Button>
                        ))}
                    </Box>
                    <Typography fontSize="0.66rem" fontWeight={800} letterSpacing="0.06em" color="text.disabled" sx={{ mt: 0.25 }}>LEGAL & POLICIES</Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                        {POLICY_TYPES.map((p) => (
                            <Button key={p.slug} size="small" startIcon={<GavelIcon fontSize="small" />} onClick={() => { setSlug(`policy:${p.slug}`); setOpenIdx(0); }} sx={navPillSx(slug === `policy:${p.slug}`)}>{p.label}</Button>
                        ))}
                        {customPolicies.map((p) => (
                            <Button key={p.slug} size="small" startIcon={<DescriptionIcon fontSize="small" />} onClick={() => { setSlug(`policy:${p.slug}`); setOpenIdx(0); }} sx={navPillSx(slug === `policy:${p.slug}`)}>{p.title || p.slug}</Button>
                        ))}
                    </Box>
                    <Button size="small" startIcon={<AddIcon fontSize="small" />} onClick={addPolicy} sx={{ textTransform: "none", alignSelf: "flex-start", color: "text.secondary", fontSize: "0.76rem" }}>New policy</Button>
                    <Typography fontSize="0.66rem" fontWeight={800} letterSpacing="0.06em" color="text.disabled" sx={{ mt: 0.25 }}>SPECIAL PAGES</Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                        {SPECIAL_PAGES.map((s) => (
                            <Button key={s.key} size="small" startIcon={s.icon} onClick={() => { setSlug(s.key); setOpenIdx(0); }} sx={navPillSx(slug === s.key)}>{s.title}</Button>
                        ))}
                    </Box>
                </Box>

                {/* current surface header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={800} fontSize="0.96rem" sx={{ lineHeight: 1.1 }}>{isMenu ? menuDef?.title : isPolicy ? (page?.title || "Policy") : isSpecial ? specialDef?.title : (sysDef?.title || page?.title || "Page")}</Typography>
                        <Typography fontSize="0.72rem" color="text.disabled">{isMenu ? "Links shown across the whole site" : isPolicy ? `Legal page · /policies/${policySlug}` : isSpecial ? (specialDef?.sysKey === "notFound" ? "Shown when a page isn’t found" : "Shown when something goes wrong") : (sysDef?.hint || `/${slug}`)}{!isMenu && !isPolicy && !isSpecial && sections.length ? ` · ${sections.length} section${sections.length > 1 ? "s" : ""}` : ""}</Typography>
                    </Box>
                    {!SYSTEM_SLUGS.has(slug) && !isMenu && !isPolicy && !isSpecial && <Tooltip title="Delete page"><IconButton size="small" onClick={deletePage} sx={{ color: "error.main" }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>}
                </Box>

                {isMenu ? (
                    <LinksEditor work={work} set={set} menu={menuDef} />
                ) : isPolicy ? (
                    <PolicyEditor work={work} set={set} policySlug={policySlug} policyDef={policyDef} onDeleted={() => setSlug("home")} />
                ) : isSpecial ? (
                    <SpecialPageEditor work={work} set={set} special={specialDef} />
                ) : (<>
                {/* section list — drag to reorder, click to expand */}
                {sections.length === 0 && (
                    <Card variant="outlined" sx={{ p: 2, textAlign: "center", borderStyle: "dashed", bgcolor: "#fafbfc" }}>
                        <Typography color="text.secondary" fontSize="0.86rem" fontWeight={600}>No sections yet</Typography>
                        <Typography color="text.disabled" fontSize="0.76rem">Add one below, or let AI lay out the page for you.</Typography>
                    </Card>
                )}
                {sections.map((s, i) => {
                    const def = MANIFEST_BY_TYPE[s.type];
                    const meta = sectionMeta(s.type);
                    const open = openIdx === i;
                    const dragging = dragIdx === i;
                    const isOver = overIdx === i && dragIdx != null && dragIdx !== i;
                    return (
                        <Card
                            key={i}
                            variant="outlined"
                            onDragEnter={() => { if (dragIdx != null) setOverIdx(i); }}
                            onDragOver={(e) => { if (dragIdx != null) e.preventDefault(); }}
                            onDrop={() => { reorder(dragIdx, i); setDragIdx(null); setOverIdx(null); }}
                            sx={{
                                borderColor: open ? "primary.main" : "divider", opacity: dragging ? 0.45 : 1,
                                borderTop: isOver ? "2px solid" : undefined, borderTopColor: isOver ? "primary.main" : undefined,
                                transition: "border-color 120ms, opacity 120ms",
                            }}
                        >
                            <Box
                                draggable
                                onDragStart={(e) => { setDragIdx(i); e.dataTransfer.effectAllowed = "move"; }}
                                onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                                sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1, py: 0.9 }}
                            >
                                <Tooltip title="Drag to reorder"><Box component="span" sx={{ display: "flex", color: "text.disabled", cursor: "grab", "&:active": { cursor: "grabbing" } }}><DragIndicatorIcon fontSize="small" /></Box></Tooltip>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 1.5, bgcolor: "primary.50", color: "primary.main", flexShrink: 0 }}>{meta.icon}</Box>
                                <Box sx={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setOpenIdx(open ? null : i)}>
                                    <Typography fontWeight={700} fontSize="0.88rem" sx={{ lineHeight: 1.15 }}>{def?.label ?? s.type}</Typography>
                                    <Typography fontSize="0.74rem" color="text.disabled" noWrap>{meta.summary(s.settings)}</Typography>
                                </Box>
                                <Tooltip title="Remove"><IconButton size="small" onClick={(e) => { e.stopPropagation(); remove(i); }} sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                                <IconButton size="small" onClick={() => setOpenIdx(open ? null : i)} sx={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms", color: "text.secondary" }}><ExpandMoreIcon fontSize="small" /></IconButton>
                            </Box>
                            <Collapse in={open} unmountOnExit>
                                <Divider />
                                <Box sx={{ px: 1.5, py: 1.5, display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                                    {(def?.fields ?? []).map((f) => (
                                        <SettingField key={f.key} field={f} value={s.settings?.[f.key] ?? ""} settings={s.settings} onChange={(v) => setField(i, f.key, v)} />
                                    ))}
                                    <Box sx={{ width: "100%", display: "flex", gap: 0.5, pt: 0.5 }}>
                                        <Tooltip title="Move up"><span><IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
                                        <Tooltip title="Move down"><span><IconButton size="small" disabled={i === sections.length - 1} onClick={() => move(i, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
                                    </Box>
                                </Box>
                            </Collapse>
                        </Card>
                    );
                })}

                {/* add section — card grid picker */}
                {!addOpen ? (
                    <Button variant="contained" disableElevation fullWidth startIcon={<AddIcon />} onClick={() => setAddOpen(true)} sx={{ textTransform: "none", fontWeight: 700, py: 0.85 }}>Add a section</Button>
                ) : (
                    <Card variant="outlined" sx={{ p: 1.25 }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <Typography fontSize="0.82rem" fontWeight={800} sx={{ flex: 1 }}>Add a section</Typography>
                            <Button size="small" onClick={() => setAddOpen(false)} sx={{ textTransform: "none", minWidth: 0 }}>Cancel</Button>
                        </Box>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
                            {SECTION_MANIFEST.map((m) => {
                                const meta = sectionMeta(m.type);
                                return (
                                    <Box key={m.type} onClick={() => add(m.type)} sx={{
                                        cursor: "pointer", p: 1, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "#fff",
                                        display: "flex", flexDirection: "column", gap: 0.4, transition: "all 120ms",
                                        "&:hover": { borderColor: "primary.main", bgcolor: "primary.50", transform: "translateY(-1px)" },
                                    }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                                            <Box sx={{ display: "flex", color: "primary.main" }}>{meta.icon}</Box>
                                            <Typography fontWeight={700} fontSize="0.8rem">{m.label}</Typography>
                                        </Box>
                                        <Typography fontSize="0.7rem" color="text.disabled" sx={{ lineHeight: 1.25 }}>{meta.blurb}</Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Card>
                )}

                {/* AI */}
                {!aiOpen ? (
                    <Button startIcon={<AutoAwesomeIcon fontSize="small" />} onClick={() => { setAiOpen(true); setAiErr(""); }} sx={{ textTransform: "none", alignSelf: "stretch", justifyContent: "center", color: "secondary.main", borderRadius: 2, border: "1px dashed", borderColor: "secondary.light", py: 0.7 }}>Let AI design this page</Button>
                ) : (
                    <Card variant="outlined" sx={{ p: 1.25, bgcolor: "#faf7ff", borderColor: "#e6d9ff" }}>
                        <Typography fontSize="0.82rem" fontWeight={800} sx={{ mb: 0.75, display: "flex", alignItems: "center", gap: 0.5 }}><AutoAwesomeIcon fontSize="small" sx={{ color: "secondary.main" }} /> AI design for “{page?.title || "Home"}”</Typography>
                        <TextField size="small" fullWidth multiline minRows={2} placeholder="What's this page about? e.g. “Valentine's gifts collection, push best sellers”" value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)} disabled={aiBusy} sx={{ mb: 1, bgcolor: "#fff" }} />
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button size="small" variant="contained" onClick={runAi} disabled={aiBusy}
                                startIcon={aiBusy ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <AutoAwesomeIcon fontSize="small" />} sx={{ textTransform: "none" }}>
                                {aiBusy ? "Designing…" : "Generate sections"}
                            </Button>
                            <Button size="small" onClick={() => setAiOpen(false)} disabled={aiBusy} sx={{ textTransform: "none" }}>Cancel</Button>
                        </Box>
                        {aiErr && <Typography fontSize="0.72rem" color="error" sx={{ mt: 0.5 }}>{aiErr}</Typography>}
                    </Card>
                )}
                </>)}
            </Box>
            ) : (
            <Box sx={{ order: { xs: 1, md: 1 }, position: { md: "sticky" }, top: 12 }}>
                <Tooltip title="Show sections panel" placement="right">
                    <IconButton onClick={() => setPanelOpen(true)} sx={{ border: "1px solid", borderColor: "divider", bgcolor: "#fff" }}><MenuIcon /></IconButton>
                </Tooltip>
            </Box>
            )}
        </Box>
    );
}

// Header / footer nav editor — a reorderable list of { label, href } links (footer also has copyright text).
function LinksEditor({ work, set, menu }) {
    const navKey = menu?.navKey || "nav";
    const node = work?.[navKey] ?? {};
    const links = node.links ?? [];
    const edit = (fn) => set((w) => { w[navKey] ??= {}; w[navKey].links ??= []; fn(w[navKey].links); });
    const add = () => edit((ls) => ls.push({ label: "New link", href: "/" }));
    const remove = (i) => edit((ls) => ls.splice(i, 1));
    const move = (i, d) => edit((ls) => { const j = i + d; if (j < 0 || j >= ls.length) return; const [x] = ls.splice(i, 1); ls.splice(j, 0, x); });
    const setL = (i, key, val) => edit((ls) => { ls[i] = { ...ls[i], [key]: val }; });
    const setText = (val) => set((w) => { w[navKey] ??= {}; w[navKey].text = val; });

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography color="text.secondary" fontSize="0.82rem">
                {navKey === "footer" ? "Links shown in the site footer." : "Links shown in the header navigation."} Use paths like <b>/products</b>, <b>/collections</b>, or full URLs.
            </Typography>
            {links.length === 0 && <Typography color="text.secondary" fontSize="0.9rem">No links yet — add one below.</Typography>}
            {links.map((l, i) => (
                <Card key={i} variant="outlined" sx={{ p: 1, display: "flex", flexDirection: "column", gap: 0.75 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography fontSize="0.72rem" fontWeight={700} color="text.secondary" sx={{ flex: 1 }}>Link {i + 1}</Typography>
                        <Tooltip title="Move up"><span><IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
                        <Tooltip title="Move down"><span><IconButton size="small" disabled={i === links.length - 1} onClick={() => move(i, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
                        <Tooltip title="Remove"><IconButton size="small" onClick={() => remove(i)} sx={{ color: "error.main" }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                    </Box>
                    <TextField size="small" label="Label" value={l.label ?? ""} onChange={(e) => setL(i, "label", e.target.value)} fullWidth />
                    <TextField size="small" label="Link (href)" value={l.href ?? ""} onChange={(e) => setL(i, "href", e.target.value)} fullWidth />
                </Card>
            ))}
            <Button size="small" variant="outlined" fullWidth startIcon={<AddIcon />} onClick={add} sx={{ textTransform: "none" }}>Add link</Button>
            {navKey === "footer" && (
                <TextField size="small" label="Footer text (e.g. © 2026 Your Store)" value={node.text ?? ""} onChange={(e) => setText(e.target.value)} fullWidth sx={{ mt: 0.5 }} />
            )}
        </Box>
    );
}

// Legal/policy page editor — title + body, with an AI drafter for the built-in policy types.
function PolicyEditor({ work, set, policySlug, policyDef, onDeleted }) {
    const node = (work.policies ?? []).find((p) => p.slug === policySlug);
    const isBuiltin = !!policyDef;
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const edit = (fn) => set((w) => {
        w.policies ??= [];
        let p = w.policies.find((x) => x.slug === policySlug);
        if (!p) { p = { slug: policySlug, title: policyDef?.title || "Policy", body: "", ...(isBuiltin ? { builtin: true } : {}) }; w.policies.push(p); }
        fn(p);
    });
    const genAi = async () => {
        setBusy(true); setErr("");
        try {
            const r = await fetch("/api/storefront/policies/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: policySlug }) });
            const d = await r.json();
            if (d.error || !d.body) throw new Error(typeof d.error === "string" ? d.error : (d.msg || "Generation failed"));
            edit((p) => { p.body = d.body; if (!p.title || p.title === "New Policy") p.title = d.title || p.title; });
        } catch (e) { setErr(e.message || "Generation failed"); }
        finally { setBusy(false); }
    };
    const del = () => {
        if (!confirm(`Delete the "${node?.title || policySlug}" policy?`)) return;
        set((w) => { w.policies = (w.policies ?? []).filter((p) => p.slug !== policySlug); });
        onDeleted?.();
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography color="text.secondary" fontSize="0.82rem">
                Published at <b>/policies/{policySlug}</b> and auto-linked in your footer once it has content. Supports simple formatting — <b>## Heading</b> and <b>- bullet</b> lines.
            </Typography>
            <TextField size="small" label="Title" value={node?.title ?? (policyDef?.title || "")} onChange={(e) => edit((p) => { p.title = e.target.value; })} fullWidth />
            <TextField size="small" label="Content" value={node?.body ?? ""} onChange={(e) => edit((p) => { p.body = e.target.value; })}
                fullWidth multiline minRows={12} placeholder="Write your policy here, or generate a draft below…" />
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                {isBuiltin && (
                    <Button size="small" variant="contained" onClick={genAi} disabled={busy}
                        startIcon={busy ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <AutoAwesomeIcon fontSize="small" />}
                        sx={{ textTransform: "none" }}>{busy ? "Drafting…" : (node?.body ? "Re-draft with AI" : "Draft with AI")}</Button>
                )}
                {!isBuiltin && <Button size="small" color="error" onClick={del} startIcon={<DeleteOutlineIcon fontSize="small" />} sx={{ textTransform: "none" }}>Delete policy</Button>}
            </Box>
            {err && <Typography fontSize="0.72rem" color="error">{err}</Typography>}
            <Typography fontSize="0.68rem" color="text.disabled">
                AI drafts start from your store's business info — review and edit before publishing. These are starting templates, not legal advice.
            </Typography>
        </Box>
    );
}

// 404 / error page editor — title, message, and a call-to-action button.
function SpecialPageEditor({ work, set, special }) {
    const key = special?.sysKey;
    const node = work.system?.[key] ?? {};
    const edit = (field, val) => set((w) => { w.system ??= {}; w.system[key] = { ...(w.system[key] || {}), [field]: val }; });
    const isError = key === "error";
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography color="text.secondary" fontSize="0.82rem">
                {isError ? "Shown if the storefront hits an unexpected error." : "Shown when a visitor lands on a page that doesn’t exist."} Leave a field blank to use the default.
            </Typography>
            <TextField size="small" label="Heading" value={node.title ?? ""} onChange={(e) => edit("title", e.target.value)} fullWidth />
            <TextField size="small" label="Message" value={node.message ?? ""} onChange={(e) => edit("message", e.target.value)} fullWidth multiline minRows={3} />
            <TextField size="small" label="Button text" value={node.ctaText ?? ""} onChange={(e) => edit("ctaText", e.target.value)} fullWidth />
            {isError
                ? <Typography fontSize="0.68rem" color="text.disabled">The button retries the page (“Try again”).</Typography>
                : <TextField size="small" label="Button link" value={node.ctaLink ?? ""} onChange={(e) => edit("ctaLink", e.target.value)} placeholder="/products" fullWidth />}
        </Box>
    );
}

// Reusable section list editor (icon + summary cards, move/remove, add-grid, field editing). Operates
// on a plain `sections` array via onChange — used by the Landing Pages builder.
function SectionListEditor({ sections = [], onChange }) {
    const list = Array.isArray(sections) ? sections : [];
    const [openIdx, setOpenIdx] = useState(0);
    const [addOpen, setAddOpen] = useState(false);
    const mutate = (fn) => { const next = list.map((s) => ({ ...s, settings: { ...(s.settings || {}) } })); fn(next); onChange(next); };
    const move = (i, d) => { const j = i + d; if (j < 0 || j >= list.length) return; mutate((n) => { const [s] = n.splice(i, 1); n.splice(j, 0, s); }); setOpenIdx(i + d); };
    const remove = (i) => { mutate((n) => n.splice(i, 1)); setOpenIdx(null); };
    const add = (type) => { mutate((n) => n.push({ type, settings: {} })); setAddOpen(false); setOpenIdx(list.length); };
    const setField = (i, key, val) => mutate((n) => { n[i].settings = { ...n[i].settings, [key]: val }; });

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {list.length === 0 && <Card variant="outlined" sx={{ p: 2, textAlign: "center", borderStyle: "dashed", bgcolor: "#fafbfc" }}><Typography color="text.disabled" fontSize="0.8rem">No sections yet — add one below.</Typography></Card>}
            {list.map((s, i) => {
                const def = MANIFEST_BY_TYPE[s.type];
                const meta = sectionMeta(s.type);
                const open = openIdx === i;
                return (
                    <Card key={i} variant="outlined" sx={{ borderColor: open ? "primary.main" : "divider" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1, py: 0.9 }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 1.5, bgcolor: "primary.50", color: "primary.main", flexShrink: 0 }}>{meta.icon}</Box>
                            <Box sx={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setOpenIdx(open ? null : i)}>
                                <Typography fontWeight={700} fontSize="0.88rem" sx={{ lineHeight: 1.15 }}>{def?.label ?? s.type}</Typography>
                                <Typography fontSize="0.74rem" color="text.disabled" noWrap>{meta.summary(s.settings)}</Typography>
                            </Box>
                            <Tooltip title="Move up"><span><IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
                            <Tooltip title="Move down"><span><IconButton size="small" disabled={i === list.length - 1} onClick={() => move(i, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
                            <Tooltip title="Remove"><IconButton size="small" onClick={() => remove(i)} sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                            <IconButton size="small" onClick={() => setOpenIdx(open ? null : i)} sx={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }}><ExpandMoreIcon fontSize="small" /></IconButton>
                        </Box>
                        <Collapse in={open} unmountOnExit>
                            <Divider />
                            <Box sx={{ px: 1.5, py: 1.5, display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                                {(def?.fields ?? []).map((f) => <SettingField key={f.key} field={f} value={s.settings?.[f.key] ?? ""} settings={s.settings} onChange={(v) => setField(i, f.key, v)} />)}
                            </Box>
                        </Collapse>
                    </Card>
                );
            })}
            {!addOpen ? (
                <Button variant="outlined" fullWidth startIcon={<AddIcon />} onClick={() => setAddOpen(true)} sx={{ textTransform: "none" }}>Add a section</Button>
            ) : (
                <Card variant="outlined" sx={{ p: 1.25 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}><Typography fontSize="0.82rem" fontWeight={800} sx={{ flex: 1 }}>Add a section</Typography><Button size="small" onClick={() => setAddOpen(false)} sx={{ textTransform: "none", minWidth: 0 }}>Cancel</Button></Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
                        {SECTION_MANIFEST.map((m) => { const mm = sectionMeta(m.type); return (
                            <Box key={m.type} onClick={() => add(m.type)} sx={{ cursor: "pointer", p: 1, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "#fff", display: "flex", flexDirection: "column", gap: 0.4, "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" } }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}><Box sx={{ display: "flex", color: "primary.main" }}>{mm.icon}</Box><Typography fontWeight={700} fontSize="0.8rem">{m.label}</Typography></Box>
                                <Typography fontSize="0.7rem" color="text.disabled">{mm.blurb}</Typography>
                            </Box>); })}
                    </Box>
                </Card>
            )}
        </Box>
    );
}

// Landing Pages tab — create/edit StorefrontPage landing pages with the section builder. These render at
// /<slug> and OVERRIDE the auto /products/<slug> page. Saved via the pages API (separate from the site draft).
function LandingPagesTab({ viewUrl }) {
    const [pages, setPages] = useState(null);
    const [sel, setSel] = useState(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [tick, setTick] = useState(0);
    const [savedMsg, setSavedMsg] = useState("");

    const load = async () => { try { const d = await fetch("/api/storefront/pages").then((r) => r.json()); setPages(d.pages || []); } catch { setPages([]); } };
    useEffect(() => { load(); }, []);

    const newPage = () => { setErr(""); setSavedMsg(""); setSel({ title: "", slug: "", sections: [], seo: {}, status: "draft" }); };
    const edit = (p) => { setErr(""); setSavedMsg(""); setSel({ _id: p._id, title: p.title || "", slug: p.slug || "", sections: p.sections || [], seo: p.seo || {}, status: p.status || "draft" }); };
    const patch = (k, v) => setSel((s) => ({ ...s, [k]: v }));

    const save = async (status) => {
        if (!sel?.title?.trim()) { setErr("Give the page a title."); return; }
        setBusy(true); setErr(""); setSavedMsg("");
        try {
            const body = { title: sel.title, slug: sel.slug, sections: sel.sections, seo: sel.seo, ...(status ? { status } : {}) };
            const url = sel._id ? `/api/storefront/pages/${sel._id}` : "/api/storefront/pages";
            const d = await fetch(url, { method: sel._id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : (d.msg || "Save failed"));
            const p = d.page;
            setSel({ _id: p._id, title: p.title, slug: p.slug, sections: p.sections || [], seo: p.seo || {}, status: p.status });
            setSavedMsg(status === "published" ? "Published." : "Saved as draft."); setTick((t) => t + 1); load();
        } catch (e) { setErr(e.message); } finally { setBusy(false); }
    };
    const del = async () => {
        if (!sel?._id) { setSel(null); return; }
        if (!confirm(`Delete "${sel.title || sel.slug}"?`)) return;
        setBusy(true);
        try { await fetch(`/api/storefront/pages/${sel._id}`, { method: "DELETE" }); setSel(null); load(); }
        catch (e) { setErr(e.message); } finally { setBusy(false); }
    };

    const base = (viewUrl || "").replace(/\/$/, "");
    const previewUrl = (base && sel?._id && sel.slug) ? `${base}/products/${sel.slug}?preview=1` : null;

    if (!sel) {
        return (
            <Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={800}>Landing pages</Typography>
                        <Typography fontSize="0.78rem" color="text.disabled">SEO & campaign pages built from sections. A page at a path overrides the auto /products page there.</Typography>
                    </Box>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={newPage} sx={{ textTransform: "none" }}>New landing page</Button>
                </Box>
                {pages === null ? <Typography color="text.secondary">Loading…</Typography>
                    : pages.length === 0 ? <Card variant="outlined" sx={{ p: 3, textAlign: "center", borderStyle: "dashed" }}><Typography color="text.disabled">No landing pages yet — create one to build an SEO or campaign page.</Typography></Card>
                    : <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 1.25 }}>
                        {pages.map((p) => (
                            <Card key={p._id} variant="outlined" sx={{ p: 1.25, cursor: "pointer", "&:hover": { borderColor: "primary.main" } }} onClick={() => edit(p)}>
                                <Typography fontWeight={700} fontSize="0.92rem" noWrap>{p.title || p.slug}</Typography>
                                <Typography fontSize="0.74rem" color="text.disabled" noWrap>/{p.slug} · {(p.sections || []).length} section{(p.sections || []).length === 1 ? "" : "s"}</Typography>
                                <Chip size="small" label={p.status === "published" ? "Published" : "Draft"} color={p.status === "published" ? "success" : "default"} sx={{ mt: 0.75, height: 20, fontSize: "0.68rem" }} />
                            </Card>
                        ))}
                    </Box>}
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: { xs: "wrap", md: "nowrap" } }}>
            <Box sx={{ flex: 1, minWidth: 0, position: { md: "sticky" }, top: 12, order: { xs: 2, md: 2 } }}>
                <Card variant="outlined" sx={{ overflow: "hidden" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderBottom: "1px solid", borderColor: "divider", bgcolor: "#f8fafc" }}>
                        <Typography fontSize="0.76rem" fontWeight={600} color="text.secondary">{previewUrl ? `/${sel.slug}` : "Save to preview"}</Typography>
                        <Box sx={{ flex: 1 }} />
                        {previewUrl && <Tooltip title="Refresh"><IconButton size="small" onClick={() => setTick((t) => t + 1)}><RefreshIcon fontSize="small" /></IconButton></Tooltip>}
                        {previewUrl && <Tooltip title="Open in new tab"><IconButton size="small" component="a" href={previewUrl} target="_blank"><OpenInNewIcon fontSize="small" /></IconButton></Tooltip>}
                    </Box>
                    {previewUrl ? <iframe key={tick} src={`${previewUrl}&_pv=${tick}`} title="preview" style={{ width: "100%", height: "76vh", border: "none", display: "block", background: "#fff" }} />
                        : <Box sx={{ p: 6, textAlign: "center", color: "text.secondary" }}>Save the page to see a live preview.</Box>}
                </Card>
            </Box>
            <Box sx={{ width: { xs: "100%", md: 440 }, flexShrink: 0, display: "flex", flexDirection: "column", gap: 1.25, order: { xs: 1, md: 1 } }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Button size="small" startIcon={<ChevronLeftIcon />} onClick={() => setSel(null)} sx={{ textTransform: "none" }}>All pages</Button>
                    <Box sx={{ flex: 1 }} />
                    <Chip size="small" label={sel.status === "published" ? "Published" : "Draft"} color={sel.status === "published" ? "success" : "default"} sx={{ height: 22, fontSize: "0.68rem" }} />
                </Box>
                <TextField size="small" label="Title" value={sel.title} onChange={(e) => patch("title", e.target.value)} fullWidth />
                <TextField size="small" label="URL path (slug)" value={sel.slug} onChange={(e) => patch("slug", e.target.value)} placeholder="summer-sale or mens/hats" fullWidth
                    helperText="Serves at /slug and overrides /products/slug." />
                <Typography fontWeight={800} fontSize="0.9rem" sx={{ mt: 0.5 }}>Sections</Typography>
                <SectionListEditor sections={sel.sections} onChange={(secs) => patch("sections", secs)} />
                <Typography fontWeight={800} fontSize="0.9rem" sx={{ mt: 1 }}>SEO</Typography>
                <TextField size="small" label="SEO title" value={sel.seo?.title || ""} onChange={(e) => patch("seo", { ...sel.seo, title: e.target.value })} fullWidth />
                <TextField size="small" label="Meta description" multiline minRows={2} value={sel.seo?.description || ""} onChange={(e) => patch("seo", { ...sel.seo, description: e.target.value })} fullWidth />
                {err && <Typography fontSize="0.78rem" color="error">{err}</Typography>}
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", mt: 0.5 }}>
                    <Button variant="outlined" onClick={() => save()} disabled={busy} sx={{ textTransform: "none" }}>{busy ? "Saving…" : "Save draft"}</Button>
                    <Button variant="contained" onClick={() => save("published")} disabled={busy} sx={{ textTransform: "none" }}>Publish</Button>
                    <Box sx={{ flex: 1 }} />
                    <Button color="error" onClick={del} disabled={busy} startIcon={<DeleteOutlineIcon fontSize="small" />} sx={{ textTransform: "none" }}>Delete</Button>
                </Box>
                {savedMsg && <Typography fontSize="0.78rem" color="success.main">{savedMsg}</Typography>}
            </Box>
        </Box>
    );
}

function SettingField({ field, value, onChange, settings }) {
    if (field.type === "image") {
        return <ImageUploadField label={field.label} value={value} accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onChange} />;
    }
    if (field.type === "imageCrop") {
        // Full-width image (e.g. hero background): crop ratio = refWidth ÷ the section's height setting.
        const h = Number(settings?.[field.heightKey]) || field.defaultHeight || 480;
        const aspect = Math.max(0.4, Math.min(6, (field.refWidth || 1400) / h));
        return <CropUploadField label={field.label} value={value} aspect={aspect} onChange={onChange} />;
    }
    if (field.type === "collage") {
        return <CollageField value={value} onChange={onChange} />;
    }
    if (field.type === "select") {
        return (
            <TextField select size="small" label={field.label} value={value || field.options?.[0] || ""} sx={{ minWidth: 160 }} onChange={(e) => onChange(e.target.value)}>
                {(field.options ?? []).map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </TextField>
        );
    }
    const multiline = field.type === "textarea";
    const isNumber = field.type === "number";
    return (
        <TextField size="small" label={field.label} value={value ?? ""} multiline={multiline} minRows={multiline ? 2 : undefined}
            type={isNumber ? "number" : "text"} sx={{ minWidth: multiline ? 420 : 220, flex: multiline ? "1 1 100%" : undefined }}
            onChange={(e) => onChange(isNumber ? Number(e.target.value) : e.target.value)} />
    );
}

// Row-based collage builder. value = [{ height, tiles:[ column ] }] where a column is
// { width, cells:[{image,label,sublabel,link}] } — cells stack vertically, so a column can be one
// tall image or several stacked smaller ones (e.g. a tall image beside two stacked tiles).
function CollageField({ value, onChange }) {
    // Normalize to columns+cells (auto-upgrades any legacy flat tiles).
    const rows = (Array.isArray(value) ? value : []).map((r) => ({
        height: Number(r?.height) || 240,
        tiles: (r?.tiles || []).map((col) => col?.cells
            ? { width: Number(col.width) || 1, cells: col.cells.map((c) => ({ ...c })) }
            : { width: Number(col?.width) || 1, cells: [{ image: col?.image || "", label: col?.label || "", sublabel: col?.sublabel || "", link: col?.link || "" }] }),
    }));
    const clone = () => rows.map((r) => ({ height: r.height, tiles: r.tiles.map((col) => ({ width: col.width, cells: col.cells.map((c) => ({ ...c })) })) }));
    const hasContent = rows.some((r) => r.tiles.some((col) => col.cells.some((c) => c.image || c.label)));

    const applyPreset = (p) => {
        if (hasContent && !confirm("Replace the current layout with this preset? Tile content will be cleared.")) return;
        onChange(p.rows.map((cols) => ({
            height: p.height,
            tiles: cols.map((c) => {
                const spec = typeof c === "number" ? { w: c, cells: 1 } : c;
                return { width: spec.w || 1, cells: Array.from({ length: spec.cells || 1 }, () => ({ image: "", label: "", link: "" })) };
            }),
        })));
    };
    const addRow = () => onChange([...clone(), { height: 240, tiles: [{ width: 1, cells: [{ image: "", label: "", link: "" }] }] }]);
    const removeRow = (ri) => onChange(clone().filter((_, i) => i !== ri));
    const moveRow = (ri, d) => { const n = clone(); const j = ri + d; if (j < 0 || j >= n.length) return; [n[ri], n[j]] = [n[j], n[ri]]; onChange(n); };
    const setRowHeight = (ri, h) => { const n = clone(); n[ri].height = h; onChange(n); };
    const addCol = (ri) => { const n = clone(); n[ri].tiles.push({ width: 1, cells: [{ image: "", label: "", link: "" }] }); onChange(n); };
    const removeCol = (ri, ci) => { const n = clone(); n[ri].tiles.splice(ci, 1); if (!n[ri].tiles.length) n.splice(ri, 1); onChange(n); };
    const moveCol = (ri, ci, d) => { const n = clone(); const t = n[ri].tiles; const j = ci + d; if (j < 0 || j >= t.length) return; [t[ci], t[j]] = [t[j], t[ci]]; onChange(n); };
    const setColWidth = (ri, ci, w) => { const n = clone(); n[ri].tiles[ci].width = Math.max(1, w); onChange(n); };
    const addCell = (ri, ci) => { const n = clone(); n[ri].tiles[ci].cells.push({ image: "", label: "", link: "" }); onChange(n); };
    const removeCell = (ri, ci, ki) => { const n = clone(); const col = n[ri].tiles[ci]; col.cells.splice(ki, 1); if (!col.cells.length) { n[ri].tiles.splice(ci, 1); if (!n[ri].tiles.length) n.splice(ri, 1); } onChange(n); };
    const moveCell = (ri, ci, ki, d) => { const n = clone(); const cs = n[ri].tiles[ci].cells; const j = ki + d; if (j < 0 || j >= cs.length) return; [cs[ki], cs[j]] = [cs[j], cs[ki]]; onChange(n); };
    const setCell = (ri, ci, ki, patch) => { const n = clone(); n[ri].tiles[ci].cells[ki] = { ...n[ri].tiles[ci].cells[ki], ...patch }; onChange(n); };

    const GAP = 12, REF = 1100;
    return (
        <Box sx={{ flex: "1 1 100%" }}>
            <Typography fontSize="0.78rem" fontWeight={700} color="text.secondary" sx={{ mb: 0.5 }}>Quick layouts</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
                {COLLAGE_PRESETS.map((p) => <Button key={p.id} size="small" variant="outlined" onClick={() => applyPreset(p)} sx={{ textTransform: "none" }}>{p.label}</Button>)}
            </Box>
            <Stack spacing={1.5}>
                {rows.map((row, ri) => {
                    const rowSum = row.tiles.reduce((s, c) => s + (Number(c.width) || 1), 0) || 1;
                    const nCols = row.tiles.length;
                    return (
                    <Card key={ri} variant="outlined" sx={{ p: 1.25, bgcolor: "#fafbfc" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                            <Typography fontSize="0.8rem" fontWeight={700} sx={{ flex: 1 }}>Row {ri + 1}</Typography>
                            <TextField size="small" type="number" label="Height" value={row.height ?? 240} onChange={(e) => setRowHeight(ri, Number(e.target.value) || 240)} sx={{ width: 92 }} />
                            <Tooltip title="Move row up"><span><IconButton size="small" disabled={ri === 0} onClick={() => moveRow(ri, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
                            <Tooltip title="Move row down"><span><IconButton size="small" disabled={ri === rows.length - 1} onClick={() => moveRow(ri, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
                            <Tooltip title="Remove row"><IconButton size="small" onClick={() => removeRow(ri)} sx={{ color: "error.main" }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                        </Box>
                        <Stack spacing={1}>
                            {row.tiles.map((col, ci) => {
                                const colW = ((Number(col.width) || 1) / rowSum) * (REF - GAP * Math.max(0, nCols - 1));
                                const nCells = col.cells.length;
                                return (
                                <Card key={ci} variant="outlined" sx={{ p: 1, bgcolor: "#fff" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mb: 0.75 }}>
                                        <Typography fontSize="0.72rem" fontWeight={700} color="text.secondary" sx={{ flex: 1 }}>Column {ci + 1}{nCells > 1 ? ` · ${nCells} stacked` : ""}</Typography>
                                        <Typography fontSize="0.7rem" color="text.secondary">W</Typography>
                                        <IconButton size="small" onClick={() => setColWidth(ri, ci, (Number(col.width) || 1) - 1)}>−</IconButton>
                                        <Typography fontSize="0.82rem" fontWeight={700} sx={{ minWidth: 12, textAlign: "center" }}>{Number(col.width) || 1}</Typography>
                                        <IconButton size="small" onClick={() => setColWidth(ri, ci, (Number(col.width) || 1) + 1)}>+</IconButton>
                                        <Tooltip title="Move column left"><span><IconButton size="small" disabled={ci === 0} onClick={() => moveCol(ri, ci, -1)}><ArrowUpwardIcon fontSize="small" sx={{ transform: "rotate(-90deg)" }} /></IconButton></span></Tooltip>
                                        <Tooltip title="Move column right"><span><IconButton size="small" disabled={ci === nCols - 1} onClick={() => moveCol(ri, ci, 1)}><ArrowDownwardIcon fontSize="small" sx={{ transform: "rotate(-90deg)" }} /></IconButton></span></Tooltip>
                                        <Tooltip title="Remove column"><IconButton size="small" onClick={() => removeCol(ri, ci)} sx={{ color: "error.main" }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                                    </Box>
                                    <Stack spacing={0.75}>
                                        {col.cells.map((c, ki) => {
                                            const cellH = ((Number(row.height) || 240) - GAP * Math.max(0, nCells - 1)) / nCells;
                                            const aspect = Math.max(0.25, Math.min(4, colW / cellH));
                                            return (
                                            <Box key={ki} sx={{ display: "flex", gap: 1, alignItems: "flex-start", p: 0.75, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                                                <CropUploadField label={nCells > 1 ? `Image ${ki + 1}` : "Image"} value={c.image} aspect={aspect}
                                                    onChange={(url) => setCell(ri, ci, ki, { image: url })}
                                                    enableAi
                                                    onMeta={(d) => setCell(ri, ci, ki, { ...(d.label ? { label: d.label } : {}), ...(d.sublabel ? { sublabel: d.sublabel } : {}), ...(d.link ? { link: d.link } : {}) })} />
                                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: 1, minWidth: 0 }}>
                                                    <TextField size="small" label="Label" value={c.label ?? ""} onChange={(e) => setCell(ri, ci, ki, { label: e.target.value })} placeholder="Valentine's Day gifts" />
                                                    <TextField size="small" label="Sub-label" value={c.sublabel ?? ""} onChange={(e) => setCell(ri, ci, ki, { sublabel: e.target.value })} />
                                                    <TextField size="small" label="Links to" value={c.link ?? ""} onChange={(e) => setCell(ri, ci, ki, { link: e.target.value })} placeholder="/products?q=valentines" />
                                                    {nCells > 1 && (
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                                            <Box sx={{ flex: 1 }} />
                                                            <Tooltip title="Move up"><span><IconButton size="small" disabled={ki === 0} onClick={() => moveCell(ri, ci, ki, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
                                                            <Tooltip title="Move down"><span><IconButton size="small" disabled={ki === nCells - 1} onClick={() => moveCell(ri, ci, ki, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
                                                            <Tooltip title="Remove image"><IconButton size="small" onClick={() => removeCell(ri, ci, ki)} sx={{ color: "error.main" }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                            );
                                        })}
                                    </Stack>
                                    <Button size="small" startIcon={<AddIcon />} onClick={() => addCell(ri, ci)} sx={{ textTransform: "none", mt: 0.5 }}>Stack another image</Button>
                                </Card>
                                );
                            })}
                        </Stack>
                        <Button size="small" startIcon={<AddIcon />} onClick={() => addCol(ri)} sx={{ textTransform: "none", mt: 1 }}>Add column to row</Button>
                    </Card>
                    ); })}
            </Stack>
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addRow} sx={{ textTransform: "none", mt: 1.5 }}>Add row</Button>
        </Box>
    );
}

// ── SEO & Tracking: meta defaults + analytics IDs + business info ────────────
function SeoTab({ work, set }) {
    const seo = work.seo ?? {}, a = work.analytics ?? {}, b = work.businessInfo ?? {};
    const [tcBusy, setTcBusy] = useState(false);
    const [tcMsg, setTcMsg] = useState("");
    const genTermContent = async () => {
        setTcBusy(true); setTcMsg("");
        try {
            const d = await fetch("/api/storefront/term-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).then((r) => r.json());
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            setTcMsg(`Done — ${d.generated} description${d.generated === 1 ? "" : "s"} generated & live.`);
        } catch (e) { setTcMsg(e.message || "Failed"); }
        finally { setTcBusy(false); }
    };
    const setSeo = (k, v) => set((w) => { w.seo = { ...w.seo, [k]: v }; });
    const setA = (k, v) => set((w) => { w.analytics = { ...w.analytics, [k]: v }; });
    const setB = (k, v) => set((w) => { w.businessInfo = { ...w.businessInfo, [k]: v }; });

    const analyticsFields = [
        ["ga4Id", "Google tag / GA4 (G-…)"], ["gtmId", "Google Tag Manager (GTM-…)"],
        ["metaPixelId", "Meta pixel ID"], ["tiktokPixelId", "TikTok pixel ID"],
        ["snapPixelId", "Snap pixel ID"], ["pinterestTagId", "Pinterest tag ID"],
    ];
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
                <Typography fontWeight={700} sx={{ mb: 1 }}>SEO</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxWidth: 560 }}>
                    <TextField size="small" label="Site title" value={seo.title || ""} onChange={(e) => setSeo("title", e.target.value)} />
                    <TextField size="small" label="Meta description" multiline minRows={2} value={seo.description || ""} onChange={(e) => setSeo("description", e.target.value)} />
                    <TextField size="small" label="Social share image URL (OG)" value={seo.ogImage || ""} onChange={(e) => setSeo("ogImage", e.target.value)} />
                </Box>
            </Box>
            <Box>
                <Typography fontWeight={700} sx={{ mb: 1 }}>Tracking</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                    {analyticsFields.map(([k, label]) => (
                        <TextField key={k} size="small" label={label} value={a[k] || ""} sx={{ minWidth: 260 }} onChange={(e) => setA(k, e.target.value)} />
                    ))}
                </Box>
            </Box>
            <Box>
                <Typography fontWeight={700} sx={{ mb: 1 }}>Business info <Typography component="span" fontSize="0.75rem" color="text.secondary">(used for contact + search schema)</Typography></Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, maxWidth: 720 }}>
                    <TextField size="small" label="Business name" value={b.legalName || ""} sx={{ minWidth: 260 }} onChange={(e) => setB("legalName", e.target.value)} />
                    <TextField size="small" label="Email" value={b.email || ""} sx={{ minWidth: 260 }} onChange={(e) => setB("email", e.target.value)} />
                    <TextField size="small" label="Phone" value={b.phone || ""} sx={{ minWidth: 260 }} onChange={(e) => setB("phone", e.target.value)} />
                </Box>
            </Box>
            <Box>
                <Typography fontWeight={700} sx={{ mb: 0.5 }}>Indexable landing terms <Typography component="span" fontSize="0.75rem" color="text.secondary">(SEO)</Typography></Typography>
                <Typography fontSize="0.78rem" color="text.secondary" sx={{ mb: 1, maxWidth: 560 }}>
                    One per line. These become Google-indexable <b>/products/&lt;term&gt;</b> landing pages (e.g. “4th of july”, “mens hats”). Every other search still works for shoppers but stays out of Google so bots don't crawl an endless search space.
                </Typography>
                <TextField size="small" fullWidth multiline minRows={3} sx={{ maxWidth: 560 }}
                    value={(work.indexableTerms || []).join("\n")}
                    onChange={(e) => set((w) => { w.indexableTerms = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean); })} />
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
                    <Button variant="outlined" size="small" onClick={genTermContent} disabled={tcBusy}
                        startIcon={tcBusy ? <CircularProgress size={14} /> : <AutoAwesomeIcon fontSize="small" />} sx={{ textTransform: "none" }}>
                        {tcBusy ? "Generating…" : "Generate landing descriptions"}
                    </Button>
                    {tcMsg && <Typography fontSize="0.78rem" color="text.secondary">{tcMsg}</Typography>}
                </Box>
                <Typography fontSize="0.7rem" color="text.disabled" sx={{ mt: 0.5, maxWidth: 560 }}>
                    Writes an SEO heading + description for each term above (once), stored and <b>server-rendered in the page HTML</b> so crawlers see it — no AI on page load. Re-run after editing the list.
                </Typography>
            </Box>
            <Box>
                <Typography fontWeight={700} sx={{ mb: 0.5 }}>Migrate from an old site</Typography>
                <Typography fontSize="0.78rem" color="text.secondary" sx={{ mb: 1, maxWidth: 620 }}>
                    Paste the client's current site URL. AI finds its pages and maps them to your new structure, so old links 301-redirect here (keeping their Google ranking) and any old links pasted into this store get fixed.
                </Typography>
                <MigrateTool />
            </Box>
        </Box>
    );
}

// AI link migrator: analyze an old site → propose redirects (editable) → apply (saves redirects + fixes
// old links in your content). Redirects are served by the storefront middleware as 308s.
function MigrateTool() {
    const [oldUrl, setOldUrl] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [result, setResult] = useState(null);
    const [applied, setApplied] = useState("");

    const post = (body) => fetch("/api/storefront/migrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
    const analyze = async () => {
        setBusy(true); setErr(""); setApplied(""); setResult(null);
        try {
            const d = await post({ oldUrl: oldUrl.trim() });
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : (d.msg || "Couldn't analyze that site"));
            setResult({ redirects: d.redirects || [], internal: d.internal || [], crawled: d.crawled || 0, autoResolved: d.autoResolved || 0 });
        } catch (e) { setErr(e.message); } finally { setBusy(false); }
    };
    const setRow = (i, key, val) => setResult((r) => ({ ...r, redirects: r.redirects.map((x, j) => (j === i ? { ...x, [key]: val } : x)) }));
    const removeRow = (i) => setResult((r) => ({ ...r, redirects: r.redirects.filter((_, j) => j !== i) }));
    const apply = async () => {
        setBusy(true); setErr("");
        try {
            const d = await post({ action: "apply", redirects: result.redirects, internal: result.internal });
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Apply failed");
            setApplied(`Applied — ${d.redirects} redirect${d.redirects === 1 ? "" : "s"} active${d.aliases ? `, ${d.aliases} old handle${d.aliases === 1 ? "" : "s"} stored as aliases (no redirect)` : ""}.`);
        } catch (e) { setErr(e.message); } finally { setBusy(false); }
    };

    return (
        <Box sx={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
                <TextField size="small" fullWidth placeholder="https://oldstore.com" value={oldUrl} onChange={(e) => setOldUrl(e.target.value)} disabled={busy} />
                <Button variant="contained" onClick={analyze} disabled={busy || !oldUrl.trim()}
                    startIcon={busy && !result ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <AutoAwesomeIcon fontSize="small" />} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>
                    {busy && !result ? "Analyzing…" : "Analyze"}
                </Button>
            </Box>
            {err && <Typography fontSize="0.78rem" color="error">{err}</Typography>}
            {result && (
                <Card variant="outlined" sx={{ p: 1.25 }}>
                    <Typography fontSize="0.8rem" color="text.secondary" sx={{ mb: 1 }}>
                        Crawled {result.crawled} old URL{result.crawled === 1 ? "" : "s"} · {result.redirects.length} redirect{result.redirects.length === 1 ? "" : "s"} proposed{result.autoResolved ? ` · ${result.autoResolved} already resolve (no redirect needed)` : ""}{result.internal.length ? ` · ${result.internal.length} in-content link${result.internal.length === 1 ? "" : "s"} to fix` : ""}.
                    </Typography>
                    {result.redirects.length === 0 ? (
                        <Typography fontSize="0.82rem" color="text.disabled">No redirects proposed.</Typography>
                    ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, maxHeight: 320, overflow: "auto" }}>
                            {result.redirects.map((r, i) => (
                                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <TextField size="small" value={r.from} onChange={(e) => setRow(i, "from", e.target.value)} sx={{ flex: 1 }} />
                                    <Typography color="text.disabled">→</Typography>
                                    <TextField size="small" value={r.to} onChange={(e) => setRow(i, "to", e.target.value)} sx={{ flex: 1 }} />
                                    <Tooltip title="Remove"><IconButton size="small" onClick={() => removeRow(i)} sx={{ color: "error.main" }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                                </Box>
                            ))}
                        </Box>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.25 }}>
                        <Button variant="contained" size="small" onClick={apply} disabled={busy || !result.redirects.length} sx={{ textTransform: "none" }}>
                            {busy ? "Applying…" : "Apply redirects"}
                        </Button>
                        {applied && <Typography fontSize="0.78rem" color="success.main">{applied}</Typography>}
                    </Box>
                </Card>
            )}
        </Box>
    );
}
