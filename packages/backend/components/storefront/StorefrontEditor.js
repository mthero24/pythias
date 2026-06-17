"use client";
import { useEffect, useState } from "react";
import {
    Box, Tabs, Tab, Button, Card, CardContent, Typography, TextField, MenuItem,
    IconButton, Select, CircularProgress, Snackbar, Alert, Divider, Tooltip, Chip,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { THEME_PRESETS, SECTION_MANIFEST, MANIFEST_BY_TYPE, applyPreset } from "@pythias/storefront";

const LIVE_FIELDS = ["theme", "pages", "nav", "footer", "analytics", "businessInfo", "seo"];
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
        <Box sx={{ p: 3, maxWidth: 960, mx: "auto" }}>
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
                <Tab label="SEO & Tracking" sx={{ textTransform: "none" }} />
            </Tabs>

            {tab === 0 && <DesignTab work={work} set={set} />}
            {tab === 1 && <SectionsTab work={work} set={set} viewUrl={viewUrl} />}
            {tab === 2 && <SeoTab work={work} set={set} />}

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
        </Box>
    );
}

// Logo/favicon picker: preview + Upload/Replace/Remove. Uploads server-side to /api/admin/upload
// (Wasabi) — present in BOTH platform and premier, so the shared editor works in either app.
function ImageUploadField({ label, value, hint, accept, onChange }) {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const inputId = `sf-upload-${label.toLowerCase()}`;
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
                    <input id={inputId} type="file" accept={accept} style={{ display: "none" }} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
                    <label htmlFor={inputId}>
                        <Button component="span" size="small" variant="outlined" disabled={busy} startIcon={busy ? <CircularProgress size={14} /> : null}>
                            {busy ? "Uploading…" : value ? "Replace" : "Upload"}
                        </Button>
                    </label>
                    {value && <Button size="small" color="error" onClick={() => onChange("")}>Remove</Button>}
                </Box>
            </Box>
            {hint && <Typography fontSize="0.68rem" color="text.disabled" sx={{ maxWidth: 240 }}>{hint}</Typography>}
            {err && <Typography fontSize="0.68rem" color="error">{err}</Typography>}
        </Box>
    );
}

const slugifyClient = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "page";

// ── Sections: pick a page → reorder / add / remove / edit + AI suggest + live preview ──
function SectionsTab({ work, set, viewUrl }) {
    const pages = work.pages ?? [];
    const [slug, setSlug] = useState(pages[0]?.slug || "home");
    const page = pages.find((p) => p.slug === slug) || pages[0];
    const sections = page?.sections ?? [];

    const [adding, setAdding] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);
    const [aiOpen, setAiOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiBusy, setAiBusy] = useState(false);
    const [aiErr, setAiErr] = useState("");

    const editPage = (fn) => set((w) => { const p = (w.pages ?? []).find((x) => x.slug === slug); if (p) { p.sections ??= []; fn(p); } });
    const move = (i, d) => editPage((p) => { const j = i + d; if (j < 0 || j >= p.sections.length) return; const [s] = p.sections.splice(i, 1); p.sections.splice(j, 0, s); });
    const remove = (i) => editPage((p) => p.sections.splice(i, 1));
    const add = (type) => editPage((p) => p.sections.push({ type, settings: {} }));
    const setField = (i, key, val) => editPage((p) => { p.sections[i].settings = { ...p.sections[i].settings, [key]: val }; });

    const addPage = () => {
        const title = newTitle.trim();
        if (!title) return;
        let s = slugifyClient(title);
        if (pages.some((p) => p.slug === s)) s = `${s}-${pages.length}`;
        set((w) => { (w.pages ??= []).push({ slug: s, title, sections: [] }); });
        setSlug(s); setNewTitle(""); setAdding(false);
    };
    const deletePage = () => {
        if (slug === "home") return;
        if (!confirm(`Delete the "${page?.title || slug}" page and its sections?`)) return;
        set((w) => { w.pages = (w.pages ?? []).filter((p) => p.slug !== slug); });
        setSlug("home");
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
    const previewPath = base ? (slug === "home" ? base : `${base}/${slug}`) : null;
    // preview=1 makes the storefront render the saved DRAFT (so unpublished edits show).
    const previewUrl = previewPath ? `${previewPath}?preview=1` : null;

    return (
        <Box>
            {/* Page selector + actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
                <TextField select size="small" label="Page" value={slug} onChange={(e) => setSlug(e.target.value)} sx={{ minWidth: 200 }}>
                    {pages.map((p) => <MenuItem key={p.slug} value={p.slug}>{p.title || p.slug}{p.slug === "home" ? " (home)" : ""}</MenuItem>)}
                </TextField>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setAdding((v) => !v)} sx={{ textTransform: "none" }}>New page</Button>
                {slug !== "home" && <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={deletePage} sx={{ textTransform: "none" }}>Delete page</Button>}
                <Box sx={{ flex: 1 }} />
                {previewUrl && <Button size="small" variant={showPreview ? "contained" : "outlined"} onClick={() => setShowPreview((v) => !v)} sx={{ textTransform: "none" }}>{showPreview ? "Hide preview" : "Preview"}</Button>}
            </Box>
            {adding && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <TextField size="small" label="New page title" value={newTitle} autoFocus
                        onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addPage(); }} sx={{ minWidth: 240 }} />
                    <Button size="small" variant="contained" onClick={addPage} sx={{ textTransform: "none" }}>Add</Button>
                    <Typography fontSize="0.72rem" color="text.disabled">URL: /{slugifyClient(newTitle || "page")}</Typography>
                </Box>
            )}

            {/* Live preview */}
            {showPreview && previewUrl && (
                <Card variant="outlined" sx={{ mb: 2, overflow: "hidden" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderBottom: "1px solid", borderColor: "divider", bgcolor: "#f8fafc" }}>
                        <Typography fontSize="0.78rem" fontWeight={600} color="text.secondary" sx={{ flex: 1 }}>Live preview · /{slug === "home" ? "" : slug}</Typography>
                        <Tooltip title="Refresh"><IconButton size="small" onClick={() => setPreviewKey((k) => k + 1)}><ArrowUpwardIcon fontSize="small" sx={{ transform: "rotate(45deg)" }} /></IconButton></Tooltip>
                        <Button size="small" endIcon={<OpenInNewIcon />} href={previewUrl} target="_blank" sx={{ textTransform: "none" }}>Open</Button>
                    </Box>
                    <iframe key={previewKey} src={`${previewUrl}&_pv=${previewKey}`} title="preview"
                        style={{ width: "100%", height: 540, border: "none", display: "block", background: "#fff" }} />
                    <Typography fontSize="0.7rem" color="text.disabled" sx={{ px: 1.5, py: 0.75 }}>
                        Preview reflects your latest <b>saved draft</b> — click <b>Save draft</b>, then <b>Refresh</b> to update it. (Visitors still see the published site until you Publish.)
                    </Typography>
                </Card>
            )}

            {/* AI suggestions */}
            <Box sx={{ mb: 2 }}>
                {!aiOpen ? (
                    <Button size="small" variant="outlined" onClick={() => { setAiOpen(true); setAiErr(""); }} sx={{ textTransform: "none" }}>✨ AI suggest sections</Button>
                ) : (
                    <Card variant="outlined" sx={{ p: 1.5, bgcolor: "#faf7ff" }}>
                        <Typography fontSize="0.82rem" fontWeight={700} sx={{ mb: 1 }}>✨ AI suggest sections for “{page?.title || "Home"}”</Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                            <TextField size="small" placeholder="Optional: what's this page about / your goal" value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)} sx={{ flex: 1, minWidth: 280 }} disabled={aiBusy} />
                            <Button size="small" variant="contained" onClick={runAi} disabled={aiBusy}
                                startIcon={aiBusy ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : null} sx={{ textTransform: "none" }}>
                                {aiBusy ? "Thinking…" : "Generate"}
                            </Button>
                            <Button size="small" onClick={() => setAiOpen(false)} disabled={aiBusy} sx={{ textTransform: "none" }}>Cancel</Button>
                        </Box>
                        <Typography fontSize="0.7rem" color="text.disabled" sx={{ mt: 0.75 }}>Adds suggested sections to this page — reorder or tweak them after.</Typography>
                        {aiErr && <Typography fontSize="0.72rem" color="error" sx={{ mt: 0.5 }}>{aiErr}</Typography>}
                    </Card>
                )}
            </Box>

            {sections.length === 0 && <Typography color="text.secondary" sx={{ mb: 2 }}>No sections on this page yet — add one below or use AI.</Typography>}
            {sections.map((s, i) => {
                const def = MANIFEST_BY_TYPE[s.type];
                return (
                    <Card key={i} variant="outlined" sx={{ mb: 1.5 }}>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <Typography fontWeight={700} sx={{ flex: 1 }}>{def?.label ?? s.type}</Typography>
                                <Tooltip title="Move up"><span><IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
                                <Tooltip title="Move down"><span><IconButton size="small" disabled={i === sections.length - 1} onClick={() => move(i, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
                                <Tooltip title="Remove"><IconButton size="small" onClick={() => remove(i)} sx={{ color: "error.main" }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                            </Box>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                                {(def?.fields ?? []).map((f) => (
                                    <SettingField key={f.key} field={f} value={s.settings?.[f.key] ?? ""} onChange={(v) => setField(i, f.key, v)} />
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                );
            })}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography fontWeight={700}>Add section:</Typography>
                {SECTION_MANIFEST.map((m) => (
                    <Button key={m.type} size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => add(m.type)} sx={{ textTransform: "none" }}>{m.label}</Button>
                ))}
            </Box>
        </Box>
    );
}

function SettingField({ field, value, onChange }) {
    if (field.type === "image") {
        return <ImageUploadField label={field.label} value={value} accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onChange} />;
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

// ── SEO & Tracking: meta defaults + analytics IDs + business info ────────────
function SeoTab({ work, set }) {
    const seo = work.seo ?? {}, a = work.analytics ?? {}, b = work.businessInfo ?? {};
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
        </Box>
    );
}
