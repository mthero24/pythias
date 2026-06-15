"use client";
import { useEffect, useMemo, useState } from "react";
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

    const home = useMemo(() => (work?.pages ?? []).find((p) => p.slug === "home") ?? work?.pages?.[0], [work]);
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
            {tab === 1 && <SectionsTab home={home} set={set} />}
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
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField size="small" label="Logo URL" value={theme.logoUrl || ""} sx={{ minWidth: 320 }} onChange={(e) => set((w) => { w.theme.logoUrl = e.target.value; })} />
                <TextField size="small" label="Favicon URL" value={theme.favicon || ""} sx={{ minWidth: 320 }} onChange={(e) => set((w) => { w.theme.favicon = e.target.value; })} />
            </Box>
        </Box>
    );
}

// ── Sections: reorder / add / remove / edit settings (home page) ─────────────
function SectionsTab({ home, set }) {
    const sections = home?.sections ?? [];
    const editHome = (fn) => set((w) => { const h = (w.pages ?? []).find((p) => p.slug === "home") ?? w.pages?.[0]; if (h) fn(h); });
    const move = (i, d) => editHome((h) => { const j = i + d; if (j < 0 || j >= h.sections.length) return; const [s] = h.sections.splice(i, 1); h.sections.splice(j, 0, s); });
    const remove = (i) => editHome((h) => h.sections.splice(i, 1));
    const add = (type) => editHome((h) => h.sections.push({ type, settings: {} }));
    const setField = (i, key, val) => editHome((h) => { h.sections[i].settings = { ...h.sections[i].settings, [key]: val }; });

    return (
        <Box>
            {sections.length === 0 && <Typography color="text.secondary" sx={{ mb: 2 }}>No sections yet — add one below.</Typography>}
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography fontWeight={700}>Add section:</Typography>
                {SECTION_MANIFEST.map((m) => (
                    <Button key={m.type} size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => add(m.type)} sx={{ textTransform: "none" }}>{m.label}</Button>
                ))}
            </Box>
        </Box>
    );
}

function SettingField({ field, value, onChange }) {
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
