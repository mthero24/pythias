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
import PaletteIcon from "@mui/icons-material/Palette";
import ImageIcon from "@mui/icons-material/Image";
import TuneIcon from "@mui/icons-material/Tune";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import CodeIcon from "@mui/icons-material/Code";
import InsightsIcon from "@mui/icons-material/Insights";
import BusinessIcon from "@mui/icons-material/Business";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";
import CampaignIcon from "@mui/icons-material/Campaign";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { THEME_PRESETS, SECTION_MANIFEST, MANIFEST_BY_TYPE, applyPreset, COLLAGE_PRESETS, POLICY_TYPES, POLICY_SLUGS, PaymentMarks } from "@pythias/storefront";

// redirects + termContent are written live by their services (migrator / term generator), NOT via the
// draft autosave — keep them out so a stale autosave can't clobber them.
const LIVE_FIELDS = ["name", "theme", "pages", "nav", "footer", "policies", "system", "productUrlMode", "catalog", "indexableTerms", "analytics", "businessInfo", "seo", "reviews", "cartAddOns", "shipping", "announcement"];
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => k in (o ?? {})).map((k) => [k, o[k]]));
const clone = (v) => JSON.parse(JSON.stringify(v ?? null));

// Quick-add trust badges (emoji + label text badges; sellers can also upload an image badge).
const BADGE_PRESETS = [
    { icon: "🎖️", label: "Veteran Owned" },
    { icon: "♀️", label: "Woman Owned" },
    { icon: "⭐", label: "Google Reviews" },
    { icon: "🔒", label: "Secure Checkout" },
    { icon: "✅", label: "Satisfaction Guaranteed" },
    { icon: "🇺🇸", label: "Made in USA" },
];

// Common destination countries for the international-shipping picker (ISO-3166-1 alpha-2).
const COUNTRIES = [
    ["CA", "Canada"], ["GB", "United Kingdom"], ["AU", "Australia"], ["DE", "Germany"], ["FR", "France"],
    ["IT", "Italy"], ["ES", "Spain"], ["NL", "Netherlands"], ["IE", "Ireland"], ["SE", "Sweden"],
    ["NO", "Norway"], ["DK", "Denmark"], ["FI", "Finland"], ["CH", "Switzerland"], ["AT", "Austria"],
    ["BE", "Belgium"], ["PT", "Portugal"], ["PL", "Poland"], ["NZ", "New Zealand"], ["JP", "Japan"],
    ["KR", "South Korea"], ["SG", "Singapore"], ["HK", "Hong Kong"], ["AE", "United Arab Emirates"],
    ["MX", "Mexico"], ["BR", "Brazil"], ["IN", "India"], ["ZA", "South Africa"], ["IL", "Israel"], ["JM", "Jamaica"],
];

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
            base.name ??= s.name;   // store name lives at the top level; ensure it loads even from an older draft
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

// Live mini-preview of the store header so the seller sees their brand lockup (logo style, size,
// tagline, brand colors) as they edit. Mirrors SiteFrame's brand logic.
function BrandPreview({ theme = {}, name }) {
    const t = theme || {};
    const storeName = name || "Your store";
    const logoH = Math.max(16, Math.min(120, Number(t.logoHeight) || 32));
    const style = t.logoUrl ? (t.logoStyle || "logo") : "name";
    const headingFont = t.fonts?.heading || "Inter";
    const text = t.colors?.text || "#111";
    const bg = t.colors?.background || "#fff";
    const nameEl = <span style={{ fontWeight: 800, fontSize: "1.05rem", fontFamily: headingFont, color: text, lineHeight: 1.1 }}>{storeName}</span>;
    const logoEl = <img src={t.logoUrl} alt={storeName} style={{ height: logoH, width: "auto", display: "block" }} />;
    const brand = style === "name" ? nameEl
        : style === "logoName" ? <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.25 }}>{logoEl}{nameEl}</Box>
            : logoEl;
    return (
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1.25, background: bg, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <Box sx={{ minWidth: 0 }}>
                    {brand}
                    {t.tagline && <Box sx={{ fontSize: "0.72rem", color: text, opacity: 0.7, mt: 0.25 }}>{t.tagline}</Box>}
                </Box>
                <Box sx={{ ml: "auto", display: "flex", gap: 1.5, alignItems: "center" }}>
                    <Box sx={{ fontSize: "0.8rem", color: text, opacity: 0.8 }}>Shop</Box>
                    <Box sx={{ px: 1.5, py: 0.5, borderRadius: 999, background: t.colors?.accent || "#f59e0b", color: "#fff", fontSize: "0.78rem", fontWeight: 700 }}>🛒</Box>
                </Box>
            </Box>
            <Box sx={{ px: 2, py: 0.75, background: bg, fontSize: "0.68rem", color: "text.secondary", borderTop: "1px dashed rgba(0,0,0,0.06)" }}>Live header preview</Box>
        </Box>
    );
}

// A titled, collapsible card that visually groups a set of related settings in the Design tab.
// Click the header to expand/collapse so sellers can focus on one area at a time.
function Section({ icon, title, subtitle, children, sx, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <Card variant="outlined" sx={{ mb: 2.5, borderRadius: 2, ...sx }}>
            <Box onClick={() => setOpen((o) => !o)} role="button" aria-expanded={open}
                sx={{ display: "flex", alignItems: "flex-start", gap: 1, p: 2.5, cursor: "pointer", userSelect: "none", "&:hover": { bgcolor: "action.hover" } }}>
                <Box sx={{ color: "primary.main", display: "flex", mt: 0.25 }}>{icon}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={800} fontSize="1.02rem">{title}</Typography>
                    {subtitle && <Typography fontSize="0.8rem" color="text.secondary">{subtitle}</Typography>}
                </Box>
                <ExpandMoreIcon sx={{ color: "text.secondary", transition: "transform 150ms", transform: open ? "rotate(180deg)" : "none" }} />
            </Box>
            <Collapse in={open} unmountOnExit>
                <CardContent sx={{ pt: 0, px: 2.5, pb: 2.5, "&:last-child": { pb: 2.5 } }}>
                    {children}
                </CardContent>
            </Collapse>
        </Card>
    );
}

// A smaller sub-heading inside a Section.
function SubHead({ children, sx }) {
    return <Typography fontWeight={700} fontSize="0.85rem" sx={{ mb: 1, ...sx }}>{children}</Typography>;
}

// Live preview of the header menu as the seller edits it — mirrors SiteNav (links vs drawer).
function MenuPreview({ nav = {}, name }) {
    const links = nav.links || [];
    const [openIdx, setOpenIdx] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const Ico = ({ icon }) => (icon ? <span style={{ marginRight: 5 }}>{icon}</span> : null);
    return (
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.25, bgcolor: "#fff" }}>
                {nav.style === "drawer" && links.length > 0 && (
                    <Box onClick={() => setDrawerOpen((o) => !o)} sx={{ cursor: "pointer", fontSize: "1.3rem", lineHeight: 1, color: "#111", px: 0.25 }}>☰</Box>
                )}
                <Typography fontWeight={800} fontSize="0.95rem" sx={{ color: "#111" }}>{name || "Your store"}</Typography>
                {!links.length ? (
                    <Typography fontSize="0.78rem" color="text.disabled" sx={{ ml: "auto" }}>Add items to preview your menu</Typography>
                ) : nav.style === "drawer" ? null : (
                    <Box sx={{ ml: "auto", display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                        {links.map((l, i) => (
                            <Box key={i} sx={{ position: "relative" }} onMouseEnter={() => l.children?.length && setOpenIdx(i)} onMouseLeave={() => setOpenIdx(null)}>
                                <span style={{ fontSize: "0.85rem", color: "#111", whiteSpace: "nowrap", cursor: "default" }}><Ico icon={l.icon} />{l.label}{l.children?.length ? " ▾" : ""}</span>
                                {l.children?.length > 0 && openIdx === i && (
                                    <Box sx={{ position: "absolute", top: "100%", left: 0, mt: 0.5, bgcolor: "#fff", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 1.5, boxShadow: 3, minWidth: 160, py: 0.5, zIndex: 5 }}>
                                        {l.children.map((c, j) => (
                                            <Box key={j} sx={{ px: 1.5, py: 0.75, fontSize: "0.82rem", color: "#111", whiteSpace: "nowrap" }}><Ico icon={c.icon} />{c.label}</Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
            {nav.style === "drawer" && drawerOpen && links.length > 0 && (
                <Box sx={{ borderTop: "1px solid rgba(0,0,0,0.08)", bgcolor: "#fafafa", py: 0.5 }}>
                    <Box sx={{ px: 2, py: 1, fontWeight: 800, fontSize: "0.9rem", color: "#111", borderBottom: "1px solid rgba(0,0,0,0.08)", mb: 0.5 }}>{name || "Your store"}</Box>
                    {links.map((l, i) => (
                        <Box key={i}>
                            <Box sx={{ px: 2, py: 0.75, fontSize: "0.85rem", fontWeight: l.children?.length ? 700 : 500, color: "#111" }}><Ico icon={l.icon} />{l.label}</Box>
                            {l.children?.map((c, j) => <Box key={j} sx={{ pl: 4, pr: 2, py: 0.5, fontSize: "0.8rem", color: "#475569" }}><Ico icon={c.icon} />{c.label}</Box>)}
                        </Box>
                    ))}
                </Box>
            )}
            <Box sx={{ px: 2, py: 0.5, bgcolor: "#fff", borderTop: "1px dashed rgba(0,0,0,0.06)", fontSize: "0.68rem", color: "text.secondary" }}>Live menu preview{nav.style === "drawer" ? ` — tap ☰ (opens from ${nav.drawerSide || "right"})` : ""}</Box>
        </Box>
    );
}

// Shared editor for a list of menu links with optional sections (a top item with sub-links) + icons +
// reorder. `mutate(fn)` runs fn against a fresh copy of the links array. Used by header + footer.
function LinkRows({ links, mutate, childLabel = "sub-link" }) {
    const addItem = (section) => mutate((l) => l.push(section
        ? { label: "New section", href: "", icon: "", children: [{ label: "Link", href: "/products", icon: "" }] }
        : { label: "New link", href: "/products", icon: "" }));
    const setItem = (i, k, v) => mutate((l) => { l[i] = { ...l[i], [k]: v }; });
    const removeItem = (i) => mutate((l) => l.splice(i, 1));
    const moveItem = (i, d) => mutate((l) => { const j = i + d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; });
    const addChild = (i) => mutate((l) => { const it = { ...l[i] }; it.children = [...(it.children || []), { label: "Link", href: "/products", icon: "" }]; l[i] = it; });
    const setChild = (i, j, k, v) => mutate((l) => { const it = { ...l[i] }; const ch = [...(it.children || [])]; ch[j] = { ...ch[j], [k]: v }; it.children = ch; l[i] = it; });
    const removeChild = (i, j) => mutate((l) => { const it = { ...l[i] }; it.children = (it.children || []).filter((_, x) => x !== j); if (!it.children.length) delete it.children; l[i] = it; });
    return (
        <>
            <Stack spacing={1.5}>
                {(links || []).map((item, i) => (
                    <Box key={i} sx={{ border: "1px solid #eee", borderRadius: 1.5, p: 1.5 }}>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                            <TextField size="small" label="Icon" value={item.icon || ""} onChange={(e) => setItem(i, "icon", e.target.value)} sx={{ width: 68 }} inputProps={{ maxLength: 4 }} />
                            <TextField size="small" label={item.children?.length ? "Section name" : "Label"} value={item.label || ""} onChange={(e) => setItem(i, "label", e.target.value)} sx={{ flex: 1, minWidth: 120 }} />
                            <TextField size="small" label="Link (href)" value={item.href || ""} onChange={(e) => setItem(i, "href", e.target.value)} sx={{ flex: 1, minWidth: 140 }} placeholder={item.children?.length ? "(optional for sections)" : "/products"} />
                            <IconButton size="small" disabled={i === 0} onClick={() => moveItem(i, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton>
                            <IconButton size="small" disabled={i === (links.length - 1)} onClick={() => moveItem(i, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => removeItem(i)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                        </Box>
                        {item.children?.length > 0 && (
                            <Stack spacing={1} sx={{ mt: 1.25, pl: 3 }}>
                                {item.children.map((c, j) => (
                                    <Box key={j} sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                                        <TextField size="small" label="Icon" value={c.icon || ""} onChange={(e) => setChild(i, j, "icon", e.target.value)} sx={{ width: 68 }} inputProps={{ maxLength: 4 }} />
                                        <TextField size="small" label="Label" value={c.label || ""} onChange={(e) => setChild(i, j, "label", e.target.value)} sx={{ flex: 1, minWidth: 110 }} />
                                        <TextField size="small" label="Link (href)" value={c.href || ""} onChange={(e) => setChild(i, j, "href", e.target.value)} sx={{ flex: 1, minWidth: 130 }} />
                                        <IconButton size="small" onClick={() => removeChild(i, j)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                        <Button size="small" variant="text" startIcon={<AddIcon />} onClick={() => addChild(i)} sx={{ mt: 0.5, ml: item.children?.length ? 3 : 0 }}>Add {childLabel}</Button>
                    </Box>
                ))}
            </Stack>
            <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addItem(false)}>Add link</Button>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addItem(true)}>Add section</Button>
            </Box>
        </>
    );
}

// Header menu builder: choose layout (top links vs hamburger drawer), add links and dropdown sections
// (a top item with sub-links), set an emoji icon per item, reorder, or let AI design the whole menu.
function HeaderMenuEditor({ work, set }) {
    const [aiBusy, setAiBusy] = useState(false);
    const [aiMsg, setAiMsg] = useState("");
    const nav = work.nav || {};
    const links = nav.links || [];
    const setNav = (key, val) => set((w) => { w.nav = { ...(w.nav || {}), [key]: val }; });
    const setLinks = (fn) => set((w) => { w.nav = w.nav || {}; w.nav.links = [...(w.nav.links || [])]; fn(w.nav.links); });

    const aiMenu = async () => {
        setAiBusy(true); setAiMsg("");
        try {
            const r = await fetch("/api/storefront/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ style: nav.style || "links" }) });
            const d = await r.json();
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            if (Array.isArray(d.links) && d.links.length) { setNav("links", d.links); setAiMsg(`Built a ${d.links.length}-item menu — tweak it below.`); }
            else setAiMsg("No menu returned — add items manually.");
        } catch (e) { setAiMsg(e.message || "AI menu failed"); }
        finally { setAiBusy(false); }
    };

    return (
        <Box>
            <MenuPreview nav={nav} name={work.name} />
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
                <TextField select size="small" label="Menu style" value={nav.style || "links"} onChange={(e) => setNav("style", e.target.value)} sx={{ minWidth: 200 }}>
                    <MenuItem value="links">Top links</MenuItem>
                    <MenuItem value="drawer">Hamburger drawer</MenuItem>
                </TextField>
                {nav.style === "drawer" && (
                    <TextField select size="small" label="Drawer opens from" value={nav.drawerSide || "right"} onChange={(e) => setNav("drawerSide", e.target.value)} sx={{ minWidth: 170 }}>
                        {["right", "left", "top", "bottom"].map((s) => <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>{s}</MenuItem>)}
                    </TextField>
                )}
                <FormControlLabel control={<Switch size="small" checked={nav.floatingControls !== false} onChange={(e) => setNav("floatingControls", e.target.checked)} />} label={<Typography fontSize="0.82rem">Floating cart/search on scroll</Typography>} />
                <Button size="small" variant="outlined" startIcon={aiBusy ? <CircularProgress size={14} /> : <AutoAwesomeIcon />} onClick={aiMenu} disabled={aiBusy} sx={{ textTransform: "none", ml: "auto" }}>
                    {aiBusy ? "Designing…" : "AI design menu"}
                </Button>
            </Box>
            {aiMsg && <Typography fontSize="0.78rem" color="text.secondary" sx={{ mb: 1.5 }}>{aiMsg}</Typography>}

            <LinkRows links={links} mutate={setLinks} childLabel="sub-link" />
        </Box>
    );
}

// Live preview of the footer columns/links as the seller edits (matches the live footer's colors).
function FooterPreview({ footer = {}, name, primary, logoUrl }) {
    const links = footer.links || [];
    const cols = links.filter((l) => l.children?.length);
    const flat = links.filter((l) => !l.children?.length);
    const bg = footer.bg || primary || "#0f172a";
    const fg = footer.fg || "#e8eaf0";
    const showBrand = footer.showBrand !== false;
    const socialNames = (footer.socials || []).filter((s) => s.url).map((s) => s.platform || "link");
    const Ico = ({ icon }) => (icon ? <span style={{ marginRight: 5 }}>{icon}</span> : null);
    return (
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", mb: 2 }}>
            <Box sx={{ bgcolor: bg, color: fg, p: 2 }}>
                {footer.newsletter?.enabled && (
                    <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.15)", pb: 1.5, mb: 1.5, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                        <Box>
                            <Typography fontSize="0.85rem" fontWeight={700}>{footer.newsletter.heading || "Join our newsletter"}</Typography>
                            {footer.newsletter.subtext && <Typography fontSize="0.68rem" sx={{ opacity: 0.7 }}>{footer.newsletter.subtext}</Typography>}
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                            <Box sx={{ border: "1px solid rgba(255,255,255,0.3)", borderRadius: 1, px: 1, py: 0.5, fontSize: "0.62rem", opacity: 0.6 }}>Email address</Box>
                            <Box sx={{ bgcolor: "#f59e0b", color: "#fff", borderRadius: 1, px: 1, py: 0.5, fontSize: "0.62rem", fontWeight: 700 }}>{footer.newsletter.buttonText || "Subscribe"}</Box>
                        </Box>
                    </Box>
                )}
                {!links.length && !showBrand ? (
                    <Typography fontSize="0.78rem" sx={{ opacity: 0.6 }}>Add columns & links to preview your footer</Typography>
                ) : (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {showBrand && (
                            <Box sx={{ maxWidth: 200 }}>
                                {logoUrl ? <img src={logoUrl} alt="" style={{ height: 22, display: "block", marginBottom: 4 }} /> : <Typography fontSize="0.85rem" fontWeight={800}>{name || "Your store"}</Typography>}
                                {footer.tagline && <Typography fontSize="0.68rem" sx={{ opacity: 0.7, mt: 0.5, lineHeight: 1.4 }}>{footer.tagline}</Typography>}
                                {socialNames.length > 0 && <Typography fontSize="0.68rem" sx={{ opacity: 0.7, mt: 0.5 }}>{socialNames.join(" · ")}</Typography>}
                            </Box>
                        )}
                        {cols.map((c, i) => (
                            <Box key={i}>
                                <Typography fontSize="0.8rem" fontWeight={800} sx={{ mb: 0.75 }}><Ico icon={c.icon} />{c.label}</Typography>
                                {c.children.map((x, j) => <Typography key={j} fontSize="0.76rem" sx={{ opacity: 0.8, py: 0.25 }}><Ico icon={x.icon} />{x.label}</Typography>)}
                            </Box>
                        ))}
                        {flat.length > 0 && (
                            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
                                {flat.map((x, j) => <Typography key={j} fontSize="0.78rem" sx={{ opacity: 0.85 }}><Ico icon={x.icon} />{x.label}</Typography>)}
                            </Box>
                        )}
                    </Box>
                )}
                {((footer.badges || []).filter((b) => b.image || b.label).length > 0 || footer.showPayments !== false) && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1, alignItems: "center", mt: 2 }}>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                            {(footer.badges || []).filter((b) => b.image || b.label).map((b, i) => (
                                b.image
                                    ? <img key={i} src={b.image} alt={b.label || "badge"} style={{ height: 26, borderRadius: 4 }} />
                                    : <Box key={i} sx={{ border: "1px solid rgba(255,255,255,0.28)", borderRadius: 999, px: 1, py: 0.2, fontSize: "0.66rem", fontWeight: 600 }}>{b.icon ? `${b.icon} ` : ""}{b.label}</Box>
                            ))}
                        </Box>
                        {footer.showPayments !== false && <PaymentMarks gap={5} />}
                    </Box>
                )}
                <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.12)", mt: 2, pt: 1.25, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                    <Typography fontSize="0.72rem" sx={{ opacity: 0.6 }}>{footer.text || `© ${name || "Your store"}`}</Typography>
                    {!showBrand && socialNames.length > 0 && (
                        <Typography fontSize="0.72rem" sx={{ opacity: 0.6 }}>{socialNames.join(" · ")}</Typography>
                    )}
                </Box>
            </Box>
            <Box sx={{ px: 2, py: 0.5, bgcolor: "#fff", fontSize: "0.68rem", color: "text.secondary", borderTop: "1px dashed rgba(0,0,0,0.06)" }}>Live footer preview</Box>
        </Box>
    );
}

// Footer builder — mirrors the header menu: columns (sections) of links + icons + AI design + a live
// preview, plus the footer copyright line and social links.
function FooterMenuEditor({ work, set }) {
    const [aiBusy, setAiBusy] = useState(false);
    const [aiMsg, setAiMsg] = useState("");
    const footer = work.footer || {};
    const links = footer.links || [];
    const socials = footer.socials || [];
    const setFooter = (key, val) => set((w) => { w.footer = { ...(w.footer || {}), [key]: val }; });
    const mutate = (fn) => set((w) => { w.footer = w.footer || {}; w.footer.links = [...(w.footer.links || [])]; fn(w.footer.links); });
    const setSocial = (i, k, v) => set((w) => { w.footer = w.footer || {}; const s = [...(w.footer.socials || [])]; s[i] = { ...s[i], [k]: v }; w.footer.socials = s; });
    const addSocial = () => set((w) => { w.footer = w.footer || {}; w.footer.socials = [...(w.footer.socials || []), { platform: "", url: "" }]; });
    const removeSocial = (i) => set((w) => { w.footer = w.footer || {}; w.footer.socials = (w.footer.socials || []).filter((_, x) => x !== i); });
    const nl = footer.newsletter || {};
    const setNl = (key, val) => set((w) => { w.footer = w.footer || {}; w.footer.newsletter = { ...(w.footer.newsletter || {}), [key]: val }; });
    const badges = footer.badges || [];
    const setBadge = (i, k, v) => set((w) => { w.footer = w.footer || {}; const b = [...(w.footer.badges || [])]; b[i] = { ...b[i], [k]: v }; w.footer.badges = b; });
    const addBadge = (preset) => set((w) => { w.footer = w.footer || {}; w.footer.badges = [...(w.footer.badges || []), preset || { icon: "", label: "New badge", image: "", url: "" }]; });
    const removeBadge = (i) => set((w) => { w.footer = w.footer || {}; w.footer.badges = (w.footer.badges || []).filter((_, x) => x !== i); });

    const aiFooter = async () => {
        setAiBusy(true); setAiMsg("");
        try {
            const r = await fetch("/api/storefront/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: "footer" }) });
            const d = await r.json();
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            if (Array.isArray(d.links) && d.links.length) { setFooter("links", d.links); setAiMsg(`Built ${d.links.length} footer column${d.links.length === 1 ? "" : "s"} — tweak below.`); }
            else setAiMsg("No footer returned — add columns manually.");
        } catch (e) { setAiMsg(e.message || "AI footer failed"); }
        finally { setAiBusy(false); }
    };

    return (
        <Box>
            <FooterPreview footer={footer} name={work.name} primary={work.theme?.colors?.primary} logoUrl={work.theme?.logoUrl} />
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography fontSize="0.78rem" color="text.secondary">Background</Typography>
                    <input type="color" value={footer.bg || work.theme?.colors?.primary || "#0f172a"} onChange={(e) => setFooter("bg", e.target.value)} style={{ width: 36, height: 30, border: "none", background: "none", cursor: "pointer" }} />
                    <Typography fontSize="0.78rem" color="text.secondary" sx={{ ml: 1 }}>Text</Typography>
                    <input type="color" value={footer.fg || "#e8eaf0"} onChange={(e) => setFooter("fg", e.target.value)} style={{ width: 36, height: 30, border: "none", background: "none", cursor: "pointer" }} />
                    {(footer.bg || footer.fg) && <Button size="small" onClick={() => { setFooter("bg", ""); setFooter("fg", ""); }} sx={{ textTransform: "none", minWidth: 0 }}>Reset</Button>}
                </Box>
                <Button size="small" variant="outlined" startIcon={aiBusy ? <CircularProgress size={14} /> : <AutoAwesomeIcon />} onClick={aiFooter} disabled={aiBusy} sx={{ textTransform: "none", ml: "auto" }}>
                    {aiBusy ? "Designing…" : "AI design footer"}
                </Button>
            </Box>
            {aiMsg && <Typography fontSize="0.78rem" color="text.secondary" sx={{ mb: 1.5 }}>{aiMsg}</Typography>}

            <SubHead sx={{ mt: 0 }}>Newsletter signup</SubHead>
            <FormControlLabel control={<Switch size="small" checked={!!nl.enabled} onChange={(e) => setNl("enabled", e.target.checked)} />}
                label={<span>Show a newsletter signup <Typography component="span" fontSize="0.72rem" color="text.disabled">(captures emails to your marketing list)</Typography></span>} />
            {nl.enabled && (
                <Stack spacing={1} sx={{ mt: 1, mb: 1 }}>
                    <TextField size="small" label="Heading" value={nl.heading ?? ""} onChange={(e) => setNl("heading", e.target.value)} placeholder="Join our newsletter" fullWidth />
                    <TextField size="small" label="Subtext" value={nl.subtext ?? ""} onChange={(e) => setNl("subtext", e.target.value)} placeholder="New arrivals, offers, and more — straight to your inbox." fullWidth />
                    <TextField size="small" label="Button text" value={nl.buttonText ?? ""} onChange={(e) => setNl("buttonText", e.target.value)} placeholder="Subscribe" sx={{ width: 220 }} />
                </Stack>
            )}

            <SubHead sx={{ mt: 3 }}>Brand block</SubHead>
            <FormControlLabel control={<Switch size="small" checked={footer.showBrand !== false} onChange={(e) => setFooter("showBrand", e.target.checked)} />}
                label={<span>Show logo + tagline + socials <Typography component="span" fontSize="0.72rem" color="text.disabled">(leading block in the footer)</Typography></span>} />
            <TextField size="small" fullWidth label="Footer tagline" value={footer.tagline || ""} placeholder="A short line under your footer logo" onChange={(e) => setFooter("tagline", e.target.value)} sx={{ mt: 1 }} />

            <SubHead sx={{ mt: 3 }}>Columns &amp; links</SubHead>
            <Typography fontSize="0.78rem" color="text.secondary" sx={{ mb: 1.25 }}>A “section” becomes a footer column (heading + links). Plain links sit on their own. Policy pages are auto-linked too.</Typography>
            <LinkRows links={links} mutate={mutate} childLabel="link" />

            <SubHead sx={{ mt: 3 }}>Footer text</SubHead>
            <TextField size="small" fullWidth label="Copyright / tagline" value={footer.text || ""} placeholder="© 2026 Your Store" onChange={(e) => setFooter("text", e.target.value)} />

            <SubHead sx={{ mt: 3 }}>Social links</SubHead>
            <Stack spacing={1}>
                {socials.map((s, i) => (
                    <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                        <TextField size="small" label="Platform" value={s.platform || ""} onChange={(e) => setSocial(i, "platform", e.target.value)} sx={{ width: 150 }} placeholder="Instagram" />
                        <TextField size="small" label="URL" value={s.url || ""} onChange={(e) => setSocial(i, "url", e.target.value)} sx={{ flex: 1, minWidth: 180 }} placeholder="https://…" />
                        <IconButton size="small" onClick={() => removeSocial(i)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                    </Box>
                ))}
            </Stack>
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addSocial} sx={{ mt: 1 }}>Add social</Button>

            <SubHead sx={{ mt: 3 }}>Trust badges</SubHead>
            <Typography fontSize="0.78rem" color="text.secondary" sx={{ mb: 1.25 }}>Veteran-owned, Google reviews, secure checkout, etc. Use a quick preset (emoji + label) or upload a badge image.</Typography>
            <Stack spacing={1}>
                {badges.map((b, i) => (
                    <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", border: "1px solid #eee", borderRadius: 1, p: 1 }}>
                        <TextField size="small" label="Icon" value={b.icon || ""} onChange={(e) => setBadge(i, "icon", e.target.value)} sx={{ width: 68 }} inputProps={{ maxLength: 4 }} />
                        <TextField size="small" label="Label" value={b.label || ""} onChange={(e) => setBadge(i, "label", e.target.value)} sx={{ flex: 1, minWidth: 130 }} />
                        <TextField size="small" label="Link (optional)" value={b.url || ""} onChange={(e) => setBadge(i, "url", e.target.value)} sx={{ flex: 1, minWidth: 140 }} placeholder="https://…" />
                        <ImageUploadField label="Image (optional)" value={b.image} accept="image/png,image/jpeg,image/svg+xml,image/webp" hint="Overrides the emoji+label." onChange={(url) => setBadge(i, "image", url)} />
                        <IconButton size="small" onClick={() => removeBadge(i)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                    </Box>
                ))}
            </Stack>
            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                {BADGE_PRESETS.map((p) => (
                    <Button key={p.label} size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addBadge({ icon: p.icon, label: p.label, image: "", url: "" })} sx={{ textTransform: "none" }}>{p.icon} {p.label}</Button>
                ))}
                <Button size="small" variant="text" startIcon={<AddIcon />} onClick={() => addBadge()}>Custom</Button>
            </Box>

            <SubHead sx={{ mt: 3 }}>Payments</SubHead>
            <FormControlLabel control={<Switch size="small" checked={footer.showPayments !== false} onChange={(e) => setFooter("showPayments", e.target.checked)} />}
                label={<span>Show accepted payment methods <Typography component="span" fontSize="0.72rem" color="text.disabled">(Visa, Mastercard, Amex, PayPal, Apple/Google Pay…)</Typography></span>} />
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
    const ship = work.shipping ?? {};
    const setShip = (key, val) => set((w) => { w.shipping = { ...w.shipping, [key]: val }; });
    const setShipMethod = (m, key, val) => set((w) => { w.shipping = { ...w.shipping, [m]: { ...(w.shipping?.[m] || {}), [key]: val } }; });
    const setIntl = (key, val) => set((w) => { const i = w.shipping?.international || {}; w.shipping = { ...w.shipping, international: { ...i, [key]: val } }; });
    const addCountry = (code, name) => set((w) => { const i = w.shipping?.international || {}; const list = [...(i.countries || [])]; if (list.some((x) => x.code === code)) return; list.push({ code, name, baseCents: 0, perItemCents: 0 }); w.shipping = { ...w.shipping, international: { ...i, enabled: true, countries: list } }; });
    const setCountry = (idx, key, val) => set((w) => { const i = w.shipping?.international || {}; const list = [...(i.countries || [])]; list[idx] = { ...list[idx], [key]: val }; w.shipping = { ...w.shipping, international: { ...i, countries: list } }; });
    const removeCountry = (idx) => set((w) => { const i = w.shipping?.international || {}; w.shipping = { ...w.shipping, international: { ...i, countries: (i.countries || []).filter((_, j) => j !== idx) } }; });
    const dollars = (cents) => (cents || 0) / 100;
    const toCents = (v) => Math.max(0, Math.round((parseFloat(v) || 0) * 100));
    const setCat = (path, val) => set((w) => {
        w.catalog = w.catalog || {};
        const parts = path.split("."); let o = w.catalog;
        for (let i = 0; i < parts.length - 1; i++) { o[parts[i]] = o[parts[i]] || {}; o = o[parts[i]]; }
        o[parts[parts.length - 1]] = val;
    });
    // Cart add-ons (gift bag, gift message, branded packaging…).
    const cartAddOns = work.cartAddOns || [];
    const setAddOnField = (i, key, val) => set((w) => { const list = [...(w.cartAddOns || [])]; list[i] = { ...list[i], [key]: val }; w.cartAddOns = list; });
    const addAddOn = (a) => set((w) => { const list = [...(w.cartAddOns || [])]; if (a.id && list.some((x) => x.id === a.id)) return; list.push({ enabled: true, ...a }); w.cartAddOns = list; });
    const removeAddOn = (i) => set((w) => { w.cartAddOns = (w.cartAddOns || []).filter((_, idx) => idx !== i); });
    // Sale / announcement bar (top-of-site offer strip).
    const ann = work.announcement || {};
    const setAnn = (key, val) => set((w) => { w.announcement = { ...(w.announcement || {}), [key]: val }; });
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
    const setTheme = (key, val) => set((w) => { w.theme = { ...w.theme, [key]: val }; });
    return (
        <Box>
            <Section icon={<ImageIcon fontSize="small" />} title="Logo & favicon" subtitle="Upload your store logo and the little browser-tab icon.">
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
            </Section>

            <Section icon={<StorefrontIcon fontSize="small" />} title="Brand identity" subtitle="How your store presents itself in the header and across the site.">
            <BrandPreview theme={theme} name={work.name} />
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2, mb: 1.5 }}>
                <TextField size="small" label="Store name" value={work.name || ""} sx={{ minWidth: 240 }}
                    onChange={(e) => set((w) => { w.name = e.target.value; })} />
                <TextField size="small" label="Tagline" value={theme.tagline || ""} sx={{ flex: 1, minWidth: 240 }}
                    placeholder="A short line shown under your name"
                    onChange={(e) => setTheme("tagline", e.target.value)} />
            </Box>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 1 }}>
                <TextField select size="small" label="Header shows" value={theme.logoStyle || "logo"} sx={{ minWidth: 220 }}
                    onChange={(e) => setTheme("logoStyle", e.target.value)}>
                    <MenuItem value="logo">Logo only</MenuItem>
                    <MenuItem value="logoName">Logo + store name</MenuItem>
                    <MenuItem value="name">Store name only</MenuItem>
                </TextField>
                <Box sx={{ width: 220 }}>
                    <Typography fontSize="0.72rem" color="text.secondary">Logo height — {Number(theme.logoHeight) || 32}px</Typography>
                    <Slider size="small" min={16} max={120} value={Number(theme.logoHeight) || 32}
                        onChange={(_, v) => setTheme("logoHeight", v)} />
                </Box>
            </Box>
            </Section>

            <Section icon={<MenuIcon fontSize="small" />} title="Header menu" subtitle="Your top navigation — top links or a hamburger drawer, with dropdown sections and icons.">
            <HeaderMenuEditor work={work} set={set} />
            </Section>

            <Section icon={<LinkIcon fontSize="small" />} title="Footer" subtitle="Footer columns of links (sections), the copyright line, and social links." defaultOpen={false}>
            <FooterMenuEditor work={work} set={set} />
            </Section>

            <Section icon={<PaletteIcon fontSize="small" />} title="Theme & colors" subtitle="Pick a starting look, then fine-tune your palette and fonts.">
            <SubHead sx={{ mt: 0 }}>Choose a look</SubHead>
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

            <SubHead sx={{ mt: 2 }}>Colors</SubHead>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
                {["primary", "secondary", "background", "text", "accent"].map((key) => (
                    <Box key={key} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <input type="color" value={colors[key] || "#000000"} onChange={(e) => set((w) => { w.theme.colors = { ...w.theme.colors, [key]: e.target.value }; })}
                            style={{ width: 44, height: 44, border: "none", background: "none", cursor: "pointer" }} />
                        <Typography fontSize="0.7rem" color="text.secondary" sx={{ textTransform: "capitalize" }}>{key}</Typography>
                    </Box>
                ))}
            </Box>

            <SubHead sx={{ mt: 2 }}>Fonts</SubHead>
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                {["heading", "body"].map((k) => (
                    <TextField key={k} select size="small" label={k} value={fonts[k] || "Inter"} sx={{ minWidth: 180 }}
                        onChange={(e) => set((w) => { w.theme.fonts = { ...w.theme.fonts, [k]: e.target.value }; })}>
                        {FONTS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                    </TextField>
                ))}
            </Box>

            </Section>

            <Section icon={<TuneIcon fontSize="small" />} title="Product pages & catalog" subtitle="Product URLs, storefront filters, card style, and reviews.">
            <SubHead sx={{ mt: 0 }}>Product URLs</SubHead>
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

            <SubHead sx={{ mt: 2.5 }}>Catalog &amp; filters</SubHead>
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

            </Section>

            <Section icon={<LocalShippingIcon fontSize="small" />} title="Shipping" subtitle="What you charge buyers at checkout. Each rate is a base price plus a per-extra-item amount (the first item is the base).">
            {/* Standard (always offered domestically) */}
            <SubHead sx={{ mt: 0 }}>Standard shipping</SubHead>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 1 }}>
                <TextField size="small" type="number" label="Base ($)" disabled={!!ship.freeShipping} value={dollars(ship.baseCents)} onChange={(e) => setShip("baseCents", toCents(e.target.value))} sx={{ width: 120 }} />
                <TextField size="small" type="number" label="+ per extra item ($)" disabled={!!ship.freeShipping} value={dollars(ship.perItemCents)} onChange={(e) => setShip("perItemCents", toCents(e.target.value))} sx={{ width: 160 }} />
                <TextField size="small" type="number" label="ETA min (days)" value={ship.standardMinDays ?? ""} onChange={(e) => setShip("standardMinDays", parseInt(e.target.value) || undefined)} sx={{ width: 120 }} />
                <TextField size="small" type="number" label="ETA max (days)" value={ship.standardMaxDays ?? ""} onChange={(e) => setShip("standardMaxDays", parseInt(e.target.value) || undefined)} sx={{ width: 120 }} />
            </Box>
            <FormControlLabel control={<Switch size="small" checked={!!ship.freeShipping} onChange={(e) => setShip("freeShipping", e.target.checked)} />}
                label={<span>Always free standard shipping <Typography component="span" fontSize="0.72rem" color="text.disabled">(advertise free on every order)</Typography></span>} />
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mt: 1 }}>
                <TextField size="small" type="number" label="Free over ($)" disabled={!!ship.freeShipping} value={dollars(ship.freeOverCents)} onChange={(e) => setShip("freeOverCents", toCents(e.target.value))} sx={{ width: 150 }} helperText="0 = off" />
                <TextField size="small" type="number" label="Free over (# items)" disabled={!!ship.freeShipping} value={ship.freeOverItems || ""} onChange={(e) => setShip("freeOverItems", Math.max(0, parseInt(e.target.value) || 0))} sx={{ width: 170 }} helperText="0 = off" />
            </Box>

            {/* Faster domestic tiers */}
            <SubHead sx={{ mt: 2.5 }}>Faster options (optional)</SubHead>
            {[["expedited", "Expedited"], ["twoDay", "2-Day"], ["nextDay", "Next Day"]].map(([key, label]) => {
                const m = ship[key] || {};
                return (
                    <Box key={key} sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center", mb: 1, opacity: m.enabled ? 1 : 0.6 }}>
                        <FormControlLabel sx={{ width: 130, m: 0 }} control={<Switch size="small" checked={!!m.enabled} onChange={(e) => setShipMethod(key, "enabled", e.target.checked)} />} label={<Typography fontSize="0.82rem" fontWeight={600}>{label}</Typography>} />
                        <TextField size="small" type="number" label="Base ($)" disabled={!m.enabled} value={dollars(m.baseCents)} onChange={(e) => setShipMethod(key, "baseCents", toCents(e.target.value))} sx={{ width: 110 }} />
                        <TextField size="small" type="number" label="+ per item ($)" disabled={!m.enabled} value={dollars(m.perItemCents)} onChange={(e) => setShipMethod(key, "perItemCents", toCents(e.target.value))} sx={{ width: 130 }} />
                        <TextField size="small" type="number" label="ETA min" disabled={!m.enabled} value={m.minDays ?? ""} onChange={(e) => setShipMethod(key, "minDays", parseInt(e.target.value) || undefined)} sx={{ width: 90 }} />
                        <TextField size="small" type="number" label="ETA max" disabled={!m.enabled} value={m.maxDays ?? ""} onChange={(e) => setShipMethod(key, "maxDays", parseInt(e.target.value) || undefined)} sx={{ width: 90 }} />
                    </Box>
                );
            })}

            {/* International */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2.5, mb: 0.5 }}>
                <Typography fontSize="0.85rem" fontWeight={700}>International shipping</Typography>
                <Switch size="small" checked={!!ship.international?.enabled} onChange={(e) => setIntl("enabled", e.target.checked)} />
            </Box>
            <Typography fontSize="0.74rem" color="text.disabled" sx={{ mb: 1 }}>Add only the countries you ship to. Buyers in any country not listed can’t check out.</Typography>
            {ship.international?.enabled && (
                <>
                    <Stack spacing={1} sx={{ mb: 1 }}>
                        {(ship.international.countries || []).map((c, i) => (
                            <Box key={c.code || i} sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", border: "1px solid #eee", borderRadius: 1, p: 1 }}>
                                <Typography fontSize="0.85rem" fontWeight={600} sx={{ width: 150 }}>{c.name || c.code} <Typography component="span" fontSize="0.7rem" color="text.disabled">({c.code})</Typography></Typography>
                                <TextField size="small" type="number" label="Base ($)" value={dollars(c.baseCents)} onChange={(e) => setCountry(i, "baseCents", toCents(e.target.value))} sx={{ width: 110 }} />
                                <TextField size="small" type="number" label="+ per item ($)" value={dollars(c.perItemCents)} onChange={(e) => setCountry(i, "perItemCents", toCents(e.target.value))} sx={{ width: 130 }} />
                                <TextField size="small" type="number" label="ETA min" value={c.minDays ?? ""} onChange={(e) => setCountry(i, "minDays", parseInt(e.target.value) || undefined)} sx={{ width: 90 }} />
                                <TextField size="small" type="number" label="ETA max" value={c.maxDays ?? ""} onChange={(e) => setCountry(i, "maxDays", parseInt(e.target.value) || undefined)} sx={{ width: 90 }} />
                                <IconButton size="small" onClick={() => removeCountry(i)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                            </Box>
                        ))}
                    </Stack>
                    <TextField select size="small" label="Add a country" value="" sx={{ minWidth: 240 }}
                        onChange={(e) => { const code = e.target.value; const name = COUNTRIES.find((x) => x[0] === code)?.[1]; if (code) addCountry(code, name); }}>
                        {COUNTRIES.filter(([code]) => !(ship.international.countries || []).some((c) => c.code === code)).map(([code, name]) => (
                            <MenuItem key={code} value={code}>{name}</MenuItem>
                        ))}
                    </TextField>
                </>
            )}
            <Typography fontSize="0.72rem" color="text.disabled" sx={{ mt: 1.5, mb: 1 }}>
                Sales tax is calculated and collected automatically at checkout — you don’t set it here.
            </Typography>

            </Section>

            <Section icon={<CardGiftcardIcon fontSize="small" />} title="Cart add-ons" subtitle="Optional gift touches buyers can add in the cart. Toggle each on/off and set a price. “Message” shows a text box (e.g. gift message); each add-on becomes its own line item for production.">
            <Stack spacing={1}>
                {cartAddOns.map((a, i) => (
                    <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", border: "1px solid #eee", borderRadius: 1, p: 1 }}>
                        <Switch size="small" checked={a.enabled !== false} onChange={(e) => setAddOnField(i, "enabled", e.target.checked)} />
                        <TextField size="small" label="Label" value={a.label || ""} onChange={(e) => setAddOnField(i, "label", e.target.value)} sx={{ flex: 1, minWidth: 130 }} />
                        <TextField select size="small" label="Type" value={a.type || "toggle"} onChange={(e) => setAddOnField(i, "type", e.target.value)} sx={{ width: 120 }}>
                            <MenuItem value="toggle">Add-on</MenuItem>
                            <MenuItem value="message">Message</MenuItem>
                        </TextField>
                        <TextField size="small" type="number" label="Price ($)" value={(a.priceCents || 0) / 100} onChange={(e) => setAddOnField(i, "priceCents", Math.round((parseFloat(e.target.value) || 0) * 100))} sx={{ width: 100 }} />
                        <IconButton size="small" onClick={() => removeAddOn(i)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                    </Box>
                ))}
            </Stack>
            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addAddOn({ id: "gift-bag", label: "Gift bag", priceCents: 300, type: "toggle" })}>Gift bag</Button>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addAddOn({ id: "gift-message", label: "Gift message", priceCents: 0, type: "message", description: "Add a personal note" })}>Gift message</Button>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addAddOn({ id: "branded-packaging", label: "Branded packaging", priceCents: 500, type: "toggle" })}>Branded packaging</Button>
                <Button size="small" variant="text" startIcon={<AddIcon />} onClick={() => addAddOn({ id: `addon-${cartAddOns.length + 1}`, label: "New add-on", priceCents: 0, type: "toggle" })}>Custom</Button>
            </Box>
            </Section>

            <Section icon={<CampaignIcon fontSize="small" />} title="Sale bar" subtitle="A thin announcement strip above your header to promote a sale or offer. Tip: A/B test which sale converts best on the A/B testing page." defaultOpen={false}>
            <FormControlLabel control={<Switch size="small" checked={!!ann.enabled} onChange={(e) => setAnn("enabled", e.target.checked)} />} label="Show the sale bar" />
            <Stack spacing={1.5} sx={{ mt: 1, opacity: ann.enabled ? 1 : 0.55 }}>
                <TextField size="small" label="Message" placeholder="Summer Sale — 20% off everything" value={ann.message || ""} onChange={(e) => setAnn("message", e.target.value)} disabled={!ann.enabled} fullWidth />
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    <TextField size="small" label="Promo code (optional)" placeholder="SUMMER20" value={ann.code || ""} onChange={(e) => setAnn("code", e.target.value)} disabled={!ann.enabled} sx={{ flex: 1, minWidth: 160 }} />
                    <TextField size="small" label="Link (optional)" placeholder="/collections/sale" value={ann.link || ""} onChange={(e) => setAnn("link", e.target.value)} disabled={!ann.enabled} sx={{ flex: 1, minWidth: 160 }} />
                </Box>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography fontSize="0.8rem" color="text.secondary">Bar color</Typography>
                        <input type="color" value={ann.bg || colors.accent || "#f59e0b"} onChange={(e) => setAnn("bg", e.target.value)} disabled={!ann.enabled} style={{ width: 40, height: 28, border: "1px solid #ddd", borderRadius: 6, background: "#fff" }} />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography fontSize="0.8rem" color="text.secondary">Text color</Typography>
                        <input type="color" value={ann.fg || "#ffffff"} onChange={(e) => setAnn("fg", e.target.value)} disabled={!ann.enabled} style={{ width: 40, height: 28, border: "1px solid #ddd", borderRadius: 6, background: "#fff" }} />
                    </Box>
                </Box>
                <Box sx={{ borderRadius: 1, overflow: "hidden", border: "1px solid #eee" }}>
                    <Box sx={{ background: ann.bg || colors.accent || "#f59e0b", color: ann.fg || "#fff", textAlign: "center", py: 1, px: 2, fontSize: "0.84rem", fontWeight: 600 }}>
                        {ann.message || "Your sale message preview"}{ann.code ? `  ·  Code: ${ann.code}` : ""}
                    </Box>
                </Box>
            </Stack>
            </Section>
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
    const [aiImproving, setAiImproving] = useState(false);
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
    const improveAi = async () => {
        const p = aiPrompt.trim(); if (!p) return;
        setAiImproving(true); setAiErr("");
        try {
            const d = await fetch("/api/storefront/prompt-builder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: p, kind: "image" }) }).then((r) => r.json());
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            if (d.prompt) setAiPrompt(d.prompt);
        } catch (e) { setAiErr(e.message || "Couldn't improve the prompt"); }
        finally { setAiImproving(false); }
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
                        <Button size="small" variant="outlined" onClick={improveAi} disabled={aiBusy || aiImproving || !aiPrompt.trim()}
                            startIcon={aiImproving ? <CircularProgress size={12} /> : <AutoFixHighIcon sx={{ fontSize: 14 }} />}
                            sx={{ textTransform: "none", fontSize: "0.7rem", minWidth: 0 }}>{aiImproving ? "Improving…" : "Improve"}</Button>
                        <Button size="small" variant="contained" onClick={runAi} disabled={aiBusy || aiImproving}
                            startIcon={aiBusy ? <CircularProgress size={12} sx={{ color: "#fff" }} /> : <AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                            sx={{ textTransform: "none", fontSize: "0.7rem", minWidth: 0 }}>{aiBusy ? "Generating…" : "Generate"}</Button>
                        <Button size="small" onClick={() => setAiOpen(false)} disabled={aiBusy || aiImproving} sx={{ textTransform: "none", fontSize: "0.7rem", minWidth: 0 }}>Cancel</Button>
                    </Box>
                    {aiErr && <Typography fontSize="0.66rem" color="error">{aiErr}</Typography>}
                    <Typography fontSize="0.62rem" color="text.disabled">Jot a rough idea → <b>Improve</b> expands it → <b>Generate</b>. Generates the image, opens the cropper, and fills label, sub-label & link.</Typography>
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
    customHtml:       { icon: <CodeIcon fontSize="small" />,         blurb: "Your own HTML — describe it & AI builds it",  summary: (s) => (s?.html ? "Custom HTML" : "Empty — describe it") },
    collection:       { icon: <CollectionsBookmarkIcon fontSize="small" />, blurb: "Embed a curated collection's product grid", summary: (s) => s?.heading || "Collection grid" },
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
                                    <SectionAiAssist type={s.type} settings={s.settings} onApply={(patch) => { for (const [k, v] of Object.entries(patch)) setField(i, k, v); }} />
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

// 404 / error page editor — title, message, a call-to-action button, an optional background image,
// and an "AI design" button that writes on-brand copy + generates a background image.
function SpecialPageEditor({ work, set, special }) {
    const key = special?.sysKey;
    const node = work.system?.[key] ?? {};
    const edit = (field, val) => set((w) => { w.system ??= {}; w.system[key] = { ...(w.system[key] || {}), [field]: val }; });
    const isError = key === "error";
    const [aiBusy, setAiBusy] = useState(false);
    const [aiMsg, setAiMsg] = useState("");
    const aiDesign = async () => {
        setAiBusy(true); setAiMsg("");
        try {
            const r = await fetch("/api/storefront/system-page", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: key }) });
            const d = await r.json();
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            if (d.page) { set((w) => { w.system ??= {}; w.system[key] = { ...(w.system[key] || {}), ...d.page }; }); setAiMsg(d.page.backgroundImage ? "Wrote new copy + background image." : "Wrote new copy. (Add a background image manually — image generation isn’t configured.)"); }
        } catch (e) { setAiMsg(e.message || "AI design failed"); }
        finally { setAiBusy(false); }
    };
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography color="text.secondary" fontSize="0.82rem" sx={{ flex: 1, minWidth: 180 }}>
                    {isError ? "Shown if the storefront hits an unexpected error." : "Shown when a visitor lands on a page that doesn’t exist."} Leave a field blank to use the default.
                </Typography>
                <Button size="small" variant="outlined" startIcon={aiBusy ? <CircularProgress size={14} /> : <AutoAwesomeIcon />} onClick={aiDesign} disabled={aiBusy} sx={{ textTransform: "none" }}>
                    {aiBusy ? "Designing…" : "AI design"}
                </Button>
            </Box>
            {aiMsg && <Typography fontSize="0.76rem" color="text.secondary">{aiMsg}</Typography>}
            <TextField size="small" label="Heading" value={node.title ?? ""} onChange={(e) => edit("title", e.target.value)} fullWidth />
            <TextField size="small" label="Message" value={node.message ?? ""} onChange={(e) => edit("message", e.target.value)} fullWidth multiline minRows={3} />
            <TextField size="small" label="Button text" value={node.ctaText ?? ""} onChange={(e) => edit("ctaText", e.target.value)} fullWidth />
            {isError
                ? <Typography fontSize="0.68rem" color="text.disabled">The button retries the page (“Try again”).</Typography>
                : <TextField size="small" label="Button link" value={node.ctaLink ?? ""} onChange={(e) => edit("ctaLink", e.target.value)} placeholder="/products" fullWidth />}
            <ImageUploadField label="Background image" value={node.backgroundImage} accept="image/png,image/jpeg,image/webp"
                hint="Optional full-page background. The text gets a dark overlay for readability." onChange={(url) => edit("backgroundImage", url)} />
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
                                <SectionAiAssist type={s.type} settings={s.settings} onApply={(patch) => { for (const [k, v] of Object.entries(patch)) setField(i, k, v); }} />
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

                <AiLandingBuilder
                    hasContent={(sel.sections || []).length > 0 || !!sel.title?.trim()}
                    onBuilt={(p) => setSel((s) => ({
                        ...s,
                        title: p.title || s.title,
                        slug: p.slug || s.slug,
                        seo: { ...(s.seo || {}), title: p.seoTitle || s.seo?.title, description: p.seoDescription || s.seo?.description, ...(p.ogImage ? { ogImage: p.ogImage } : {}) },
                        sections: [
                            // Each AI block is its OWN customHtml section so it can be reordered/edited/removed.
                            ...(p.sections || (p.html ? [p.html] : [])).map((html) => ({ type: "customHtml", settings: { html } })),
                            // A live grid of REAL matching products at the bottom (not invented in HTML).
                            ...(p.productQuery ? [{ type: "featuredProducts", settings: { heading: p.productHeading || "Shop the collection", query: p.productQuery, sort: "featured", limit: 8 } }] : []),
                        ],
                    }))} />

                <Typography fontWeight={800} fontSize="0.9rem" sx={{ mt: 0.5 }}>Sections</Typography>
                <SectionListEditor sections={sel.sections} onChange={(secs) => patch("sections", secs)} />
                <Typography fontWeight={800} fontSize="0.9rem" sx={{ mt: 1 }}>SEO</Typography>
                <SeoAiAssist kind="page" title={sel.title} hint={(sel.sections || []).map((s) => s.settings?.html || s.settings?.body || s.settings?.heading || "").join(" ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 600)} onResult={(r) => patch("seo", { ...sel.seo, ...(r.title ? { title: r.title } : {}), ...(r.description ? { description: r.description } : {}) })} />
                <TextField size="small" label="SEO title" value={sel.seo?.title || ""} onChange={(e) => patch("seo", { ...sel.seo, title: e.target.value })} fullWidth />
                <TextField size="small" label="Meta description" multiline minRows={2} value={sel.seo?.description || ""} onChange={(e) => patch("seo", { ...sel.seo, description: e.target.value })} fullWidth />
                <ImageUploadField label="Social share image (OG)" value={sel.seo?.ogImage} accept="image/png,image/jpeg,image/webp" hint="Shown when this page is shared on social. 1200×630 px works best." onChange={(url) => patch("seo", { ...sel.seo, ogImage: url })} />
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

// "Describe → AI builds the whole landing page" (title + slug + SEO + a custom-HTML body section).
function AiLandingBuilder({ onBuilt, hasContent }) {
    const [prompt, setPrompt] = useState("");
    const [busy, setBusy] = useState(false);
    const [improving, setImproving] = useState(false);
    const [err, setErr] = useState("");
    const improve = async () => {
        if (!prompt.trim()) return;
        setImproving(true); setErr("");
        try {
            const d = await fetch("/api/storefront/prompt-builder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: prompt.trim(), kind: "landing" }) }).then((r) => r.json());
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            if (d.prompt) setPrompt(d.prompt);
        } catch (e) { setErr(e.message || "Couldn't improve the prompt"); }
        finally { setImproving(false); }
    };
    const build = async () => {
        if (!prompt.trim()) return;
        if (hasContent && !window.confirm("Replace this page's title, SEO, and sections with an AI-built page?")) return;
        setBusy(true); setErr("");
        try {
            const d = await fetch("/api/storefront/landing-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: prompt.trim() }) }).then((r) => r.json());
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            if (!d.sections?.length && !d.html) throw new Error("No page returned — try rephrasing.");
            onBuilt(d); setPrompt("");
        } catch (e) { setErr(e.message || "AI build failed"); }
        finally { setBusy(false); }
    };
    return (
        <Card variant="outlined" sx={{ p: 1.5, bgcolor: "#f8fafc", borderStyle: "dashed" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
                <AutoAwesomeIcon fontSize="small" color="primary" />
                <Typography fontWeight={700} fontSize="0.85rem">Build this page with AI</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <TextField size="small" fullWidth multiline minRows={1} maxRows={6}
                    placeholder="Describe the page (a few words is fine — then hit Improve) — e.g. “world cup watch-party tees”"
                    value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) build(); }} />
            </Box>
            <Box sx={{ display: "flex", gap: 1, mt: 1, justifyContent: "flex-end" }}>
                <Button variant="outlined" size="small" onClick={improve} disabled={improving || busy || !prompt.trim()}
                    startIcon={improving ? <CircularProgress size={14} /> : <AutoFixHighIcon />} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>
                    {improving ? "Improving…" : "Improve prompt"}
                </Button>
                <Button variant="contained" size="small" onClick={build} disabled={busy || improving || !prompt.trim()}
                    startIcon={busy ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <AutoAwesomeIcon />} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>
                    {busy ? "Building…" : "Build"}
                </Button>
            </Box>
            {err && <Typography fontSize="0.74rem" color="error" sx={{ mt: 0.5 }}>{err}</Typography>}
            <Typography fontSize="0.68rem" color="text.disabled" sx={{ mt: 0.5 }}>Jot a rough idea → <b>Improve prompt</b> expands it (grounded in your real products) → <b>Build</b>. Builds editable sections + a live product grid; tweak each after.</Typography>
        </Card>
    );
}

// Picker for the Collection section — lists the store's published collections to embed.
function CollectionPicker({ value, onChange }) {
    const [cols, setCols] = useState(null);
    useEffect(() => {
        fetch("/api/storefront/collections").then((r) => r.json())
            .then((d) => setCols(d.error ? [] : (d.collections || []))).catch(() => setCols([]));
    }, []);
    if (cols === null) return <TextField size="small" label="Collection" value="Loading…" disabled sx={{ minWidth: 260 }} />;
    if (!cols.length) return <Typography fontSize="0.8rem" color="text.secondary" sx={{ alignSelf: "center" }}>No collections yet — create one in the Collections area, then pick it here.</Typography>;
    return (
        <TextField select size="small" label="Collection" value={value || ""} onChange={(e) => onChange(e.target.value)} sx={{ minWidth: 260 }}>
            {cols.map((c) => <MenuItem key={c._id} value={c._id}>{c.title || c.slug}</MenuItem>)}
        </TextField>
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
    if (field.type === "html") {
        return <CustomHtmlField value={value} onChange={onChange} />;
    }
    if (field.type === "collection") {
        return <CollectionPicker value={value} onChange={onChange} />;
    }
    if (field.type === "color") {
        return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography fontSize="0.8rem" color="text.secondary">{field.label}</Typography>
                <input type="color" value={value || "#ffffff"} onChange={(e) => onChange(e.target.value)} style={{ width: 40, height: 30, border: "1px solid #ddd", borderRadius: 6, background: "#fff", cursor: "pointer" }} />
                {value ? <Button size="small" onClick={() => onChange("")} sx={{ textTransform: "none", minWidth: 0 }}>Clear</Button> : null}
            </Box>
        );
    }
    if (field.type === "images") {
        return <MultiImageField label={field.label} value={value} onChange={onChange} />;
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

// Custom-HTML editor: describe a section and AI builds it (follow up to iterate), or hand-write/paste HTML.
function CustomHtmlField({ value, onChange }) {
    const [prompt, setPrompt] = useState("");
    const [busy, setBusy] = useState(false);
    const [improving, setImproving] = useState(false);
    const [err, setErr] = useState("");
    const hasHtml = !!(value && value.trim());
    const improve = async () => {
        if (!prompt.trim()) return;
        setImproving(true); setErr("");
        try {
            const d = await fetch("/api/storefront/prompt-builder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: prompt.trim(), kind: "section" }) }).then((r) => r.json());
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            if (d.prompt) setPrompt(d.prompt);
        } catch (e) { setErr(e.message || "Couldn't improve the prompt"); }
        finally { setImproving(false); }
    };
    const ai = async () => {
        if (!prompt.trim()) return;
        setBusy(true); setErr("");
        try {
            const r = await fetch("/api/storefront/section-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: prompt.trim(), currentHtml: value || "" }) });
            const d = await r.json();
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            if (d.html) { onChange(d.html); setPrompt(""); }
            else setErr("No HTML returned — try rephrasing.");
        } catch (e) { setErr(e.message || "AI failed"); }
        finally { setBusy(false); }
    };
    return (
        <Box sx={{ flex: "1 1 100%", display: "grid", gap: 1 }}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <TextField size="small" fullWidth multiline minRows={1} maxRows={4}
                    placeholder={hasHtml ? "Describe a change — e.g. “make the heading bigger and add a Shop Now button”" : "Describe the section — e.g. “a teal welcome banner with a headline, a line of text, and a Shop button”"}
                    value={prompt} onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ai(); }} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 0.25 }}>
                    {!hasHtml && (
                        <Button variant="outlined" size="small" onClick={improve} disabled={improving || busy || !prompt.trim()}
                            startIcon={improving ? <CircularProgress size={14} /> : <AutoFixHighIcon />} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>
                            {improving ? "Improving…" : "Improve"}
                        </Button>
                    )}
                    <Button variant="contained" size="small" onClick={ai} disabled={busy || improving || !prompt.trim()}
                        startIcon={busy ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <AutoAwesomeIcon />}
                        sx={{ textTransform: "none", whiteSpace: "nowrap" }}>
                        {busy ? "Building…" : hasHtml ? "Update" : "Build"}
                    </Button>
                </Box>
            </Box>
            {err && <Typography fontSize="0.76rem" color="error">{err}</Typography>}
            <TextField size="small" label="HTML" value={value ?? ""} onChange={(e) => onChange(e.target.value)} multiline minRows={6} fullWidth
                InputProps={{ sx: { fontFamily: "monospace", fontSize: "0.78rem" } }} />
            <Typography fontSize="0.7rem" color="text.disabled">
                Scripts are stripped for safety. Use inline styles; <code>var(--sf-accent)</code> / <code>var(--sf-text)</code> match your theme. Wrap content in <code>&lt;div class="sf-container"&gt;</code> for aligned width.
            </Typography>
        </Box>
    );
}

// A list of images (e.g. hero overlay cut-outs): thumbnails with remove + an upload tile.
function MultiImageField({ label, value, onChange }) {
    const imgs = (Array.isArray(value) ? value : []).map((o) => (typeof o === "string" ? o : o?.image)).filter(Boolean);
    return (
        <Box sx={{ flex: "1 1 100%", display: "grid", gap: 0.75 }}>
            <Typography fontSize="0.8rem" fontWeight={600} color="text.secondary">{label}</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                {imgs.map((src, i) => (
                    <Box key={i} sx={{ position: "relative", width: 72, height: 72, borderRadius: 1.5, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fafafa" }} />
                        <IconButton size="small" onClick={() => onChange(imgs.filter((_, j) => j !== i))} sx={{ position: "absolute", top: -3, right: -3, p: 0.25, bgcolor: "rgba(255,255,255,0.92)", "&:hover": { bgcolor: "#fff", color: "error.main" } }}><DeleteOutlineIcon sx={{ fontSize: 15 }} /></IconButton>
                    </Box>
                ))}
                <AddImageTile onAdd={(url) => onChange([...imgs, url])} />
            </Box>
        </Box>
    );
}
function AddImageTile({ onAdd }) {
    const ref = useRef(null);
    const [busy, setBusy] = useState(false);
    const upload = async (file) => {
        if (!file) return;
        setBusy(true);
        try { const fd = new FormData(); fd.append("file", file); fd.append("folder", "storefront"); const d = await (await fetch("/api/admin/upload", { method: "POST", body: fd })).json(); if (d.url) onAdd(d.url); } catch { /* ignore */ } finally { setBusy(false); }
    };
    return (
        <>
            <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: "none" }} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
            <Box onClick={() => ref.current?.click()} sx={{ width: 72, height: 72, borderRadius: 1.5, border: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "text.disabled", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                {busy ? <CircularProgress size={18} /> : <AddIcon fontSize="small" />}
            </Box>
        </>
    );
}

// Per-section AI copywriter: describe a change → AI rewrites this section's text fields (grounded in the
// real catalog + theme). Has the same "Improve" prompt-builder as the page designer. Shown on every section.
function SectionAiAssist({ type, settings, onApply }) {
    const [prompt, setPrompt] = useState("");
    const [busy, setBusy] = useState(false);
    const [improving, setImproving] = useState(false);
    const [err, setErr] = useState("");
    const improve = async () => {
        if (!prompt.trim()) return;
        setImproving(true); setErr("");
        try {
            const d = await fetch("/api/storefront/prompt-builder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: prompt.trim(), kind: "section" }) }).then((r) => r.json());
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            if (d.prompt) setPrompt(d.prompt);
        } catch (e) { setErr(e.message || "Couldn't improve the prompt"); }
        finally { setImproving(false); }
    };
    const apply = async () => {
        if (!prompt.trim()) return;
        setBusy(true); setErr("");
        try {
            const d = await fetch("/api/storefront/section-fields-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, settings, prompt: prompt.trim() }) }).then((r) => r.json());
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            if (d.fields && Object.keys(d.fields).length) { onApply(d.fields); setPrompt(""); }
            else setErr("Nothing to change for this section — try rephrasing.");
        } catch (e) { setErr(e.message || "AI failed"); }
        finally { setBusy(false); }
    };
    // customHtml has its own richer HTML AI inside its field — don't double up.
    if (type === "customHtml") return null;
    return (
        <Box sx={{ flex: "1 1 100%", display: "grid", gap: 0.75, p: 1, borderRadius: 1.5, bgcolor: "#f8fafc", border: "1px dashed #cbd5e1" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><AutoAwesomeIcon sx={{ fontSize: 16 }} color="primary" /><Typography fontWeight={700} fontSize="0.78rem">Edit with AI</Typography></Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
                <TextField size="small" fullWidth multiline minRows={1} maxRows={4}
                    placeholder="Describe the copy you want — e.g. “a punchy Father's Day headline + subtext and a Shop Dad gifts button”"
                    value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) apply(); }} />
            </Box>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button variant="outlined" size="small" onClick={improve} disabled={improving || busy || !prompt.trim()} startIcon={improving ? <CircularProgress size={13} /> : <AutoFixHighIcon />} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>{improving ? "Improving…" : "Improve"}</Button>
                <Button variant="contained" size="small" onClick={apply} disabled={busy || improving || !prompt.trim()} startIcon={busy ? <CircularProgress size={13} sx={{ color: "#fff" }} /> : <AutoAwesomeIcon />} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>{busy ? "Writing…" : "Apply"}</Button>
            </Box>
            {err && <Typography fontSize="0.72rem" color="error">{err}</Typography>}
        </Box>
    );
}

// One-click AI writer for an SEO title + meta description. kind "site" (homepage) or "page" (landing).
// Shows a Google-style PREVIEW the seller accepts or discards (doesn't overwrite fields until accepted).
// onResult({ title, description }) — caller decides which fields to fill.
function SeoAiAssist({ kind = "site", title = "", hint = "", onResult }) {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [preview, setPreview] = useState(null);   // { title, description } | null
    const run = async () => {
        setBusy(true); setErr("");
        try {
            const d = await fetch("/api/storefront/seo-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, title, hint }) }).then((r) => r.json());
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            setPreview({ title: d.title || "", description: d.description || "" });
        } catch (e) { setErr(e.message || "AI failed"); }
        finally { setBusy(false); }
    };
    const accept = () => { onResult(preview); setPreview(null); };
    return (
        <Box sx={{ display: "grid", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Button variant="outlined" size="small" onClick={run} disabled={busy}
                    startIcon={busy ? <CircularProgress size={14} /> : <AutoAwesomeIcon fontSize="small" />} sx={{ textTransform: "none" }}>
                    {busy ? "Writing…" : preview ? "Regenerate" : "Write title & description with AI"}
                </Button>
                {err && <Typography fontSize="0.74rem" color="error">{err}</Typography>}
            </Box>
            {preview && (
                <Box sx={{ p: 1.5, border: "1px solid #e2e8f0", borderRadius: 1.5, bgcolor: "#fff", maxWidth: 560 }}>
                    <Typography fontSize="0.68rem" color="text.disabled" sx={{ mb: 0.75 }}>Preview — how this looks in Google / social</Typography>
                    <Typography sx={{ color: "#1a0dab", fontSize: "1.02rem", lineHeight: 1.2 }}>{preview.title || "—"}</Typography>
                    <Typography sx={{ color: "#4d5156", fontSize: "0.82rem", mt: 0.5 }}>{preview.description || "—"}</Typography>
                    <Box sx={{ display: "flex", gap: 1.5, mt: 0.75 }}>
                        <Typography fontSize="0.66rem" color={preview.title.length > 60 ? "error.main" : "text.disabled"}>Title {preview.title.length}/60</Typography>
                        <Typography fontSize="0.66rem" color={preview.description.length > 155 ? "error.main" : "text.disabled"}>Description {preview.description.length}/155</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, mt: 1.25 }}>
                        <Button variant="contained" size="small" onClick={accept} sx={{ textTransform: "none" }}>Use these</Button>
                        <Button size="small" onClick={() => setPreview(null)} sx={{ textTransform: "none", color: "text.secondary" }}>Discard</Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

// Row-based collage builder. value = [{ height, tiles:[ column ] }] where a column is
// { width, cells:[{image,label,sublabel,link}] } — cells stack vertically, so a column can be one
// tall image or several stacked smaller ones (e.g. a tall image beside two stacked tiles).
// AI collage designer: describe a mosaic → AI builds the rows/tiles layout with generated photos
// (follow up to revise). Same "Improve" prompt-builder as the page designer.
function CollageAiBuilder({ onBuilt, hasContent, current }) {
    const [prompt, setPrompt] = useState("");
    const [busy, setBusy] = useState(false);
    const [improving, setImproving] = useState(false);
    const [err, setErr] = useState("");
    const improve = async () => {
        if (!prompt.trim()) return;
        setImproving(true); setErr("");
        try {
            const d = await fetch("/api/storefront/prompt-builder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: prompt.trim(), kind: "section" }) }).then((r) => r.json());
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            if (d.prompt) setPrompt(d.prompt);
        } catch (e) { setErr(e.message || "Couldn't improve the prompt"); }
        finally { setImproving(false); }
    };
    const build = async () => {
        if (!prompt.trim()) return;
        if (hasContent && !window.confirm("Replace this collage with an AI-built one?")) return;
        setBusy(true); setErr("");
        try {
            const d = await fetch("/api/storefront/collage-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: prompt.trim(), current: hasContent ? current : undefined }) }).then((r) => r.json());
            if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Failed");
            if (!d.rows?.length) throw new Error("No collage returned — try rephrasing.");
            onBuilt(d.rows); setPrompt("");
        } catch (e) { setErr(e.message || "AI build failed"); }
        finally { setBusy(false); }
    };
    return (
        <Card variant="outlined" sx={{ p: 1.25, mb: 1.5, bgcolor: "#f8fafc", borderStyle: "dashed" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}><AutoAwesomeIcon sx={{ fontSize: 16 }} color="primary" /><Typography fontWeight={700} fontSize="0.8rem">{hasContent ? "Revise this collage with AI" : "Design this collage with AI"}</Typography></Box>
            <TextField size="small" fullWidth multiline minRows={1} maxRows={4}
                placeholder={hasContent ? "Describe a change — e.g. “make the first tile a big feature and add a stacked column”" : "Describe the mosaic — e.g. “a 3-tile lookbook of cozy fall tees, one big feature + two stacked”"}
                value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) build(); }} />
            <Box sx={{ display: "flex", gap: 1, mt: 1, justifyContent: "flex-end" }}>
                <Button variant="outlined" size="small" onClick={improve} disabled={improving || busy || !prompt.trim()} startIcon={improving ? <CircularProgress size={13} /> : <AutoFixHighIcon />} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>{improving ? "Improving…" : "Improve"}</Button>
                <Button variant="contained" size="small" onClick={build} disabled={busy || improving || !prompt.trim()} startIcon={busy ? <CircularProgress size={13} sx={{ color: "#fff" }} /> : <AutoAwesomeIcon />} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>{busy ? "Building…" : "Build"}</Button>
            </Box>
            {err && <Typography fontSize="0.72rem" color="error" sx={{ mt: 0.5 }}>{err}</Typography>}
            <Typography fontSize="0.68rem" color="text.disabled" sx={{ mt: 0.5 }}>Builds the layout + AI photos. Edit any tile below after.</Typography>
        </Card>
    );
}

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
            <CollageAiBuilder hasContent={hasContent} current={rows} onBuilt={(newRows) => onChange(newRows)} />
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
    const [showGuide, setShowGuide] = useState(false);
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
        ["ga4Id", "Google tag / GA4 (G-…)"], ["ga4ApiSecret", "GA4 API secret (optional — server-side, blocker-proof)"], ["gtmId", "Google Tag Manager (GTM-…)"],
        ["metaPixelId", "Meta pixel ID"], ["tiktokPixelId", "TikTok pixel ID"],
        ["snapPixelId", "Snap pixel ID"], ["pinterestTagId", "Pinterest tag ID"],
    ];
    // Where to find each tracking/pixel ID (shown as an in-editor guide).
    const PIXEL_GUIDE = [
        { name: "Google Analytics (GA4)", id: "G-XXXXXXX", url: "https://analytics.google.com", steps: "Admin (gear, bottom-left) → Data streams → tap your web stream → copy the Measurement ID at the top (starts with G-)." },
        { name: "GA4 API secret (optional — server-side tracking)", id: "Measurement Protocol secret", url: "https://analytics.google.com", steps: "Same web stream → Measurement Protocol API secrets → Create → copy the Secret value. Paste it beside your GA4 ID and we track server-side — bypassing ad blockers, Brave & Pi-hole so you don't lose ~10–40% of visitors. Recommended." },
        { name: "Google Tag Manager", id: "GTM-XXXXXX", url: "https://tagmanager.google.com", steps: "Open your container — the ID (GTM-…) is shown at the top of the workspace, next to the container name." },
        { name: "Meta (Facebook/Instagram) Pixel", id: "15-16 digit number", url: "https://business.facebook.com/events_manager", steps: "Events Manager → Data sources → select your pixel/dataset → the Dataset/Pixel ID (a long number) is under the name. Create one with “Connect data source → Web” if you have none." },
        { name: "TikTok Pixel", id: "Letters + numbers", url: "https://ads.tiktok.com", steps: "Ads Manager → Assets → Events → Web events → Manage → your pixel → copy the Pixel ID." },
        { name: "Snapchat Pixel", id: "UUID (xxxx-xxxx-…)", url: "https://ads.snapchat.com", steps: "Ads Manager → Events Manager → select your Pixel → copy the Pixel ID." },
        { name: "Pinterest Tag", id: "13-digit number", url: "https://ads.pinterest.com", steps: "Ads → Conversions → Tag manager → copy the Tag ID." },
    ];
    return (
        <Box>
            <Section icon={<SearchIcon fontSize="small" />} title="SEO" subtitle="How your store shows up in Google results and social shares.">
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxWidth: 560 }}>
                    <SeoAiAssist kind="site" onResult={(r) => { if (r.title) setSeo("title", r.title); if (r.description) setSeo("description", r.description); }} />
                    <TextField size="small" label="Site title" value={seo.title || ""} onChange={(e) => setSeo("title", e.target.value)} />
                    <TextField size="small" label="Meta description" multiline minRows={2} value={seo.description || ""} onChange={(e) => setSeo("description", e.target.value)} />
                    <ImageUploadField label="Social share image (OG)" value={seo.ogImage} accept="image/png,image/jpeg,image/webp" hint="Shown when your store is shared on social or messaging. 1200×630 px works best." onChange={(url) => setSeo("ogImage", url)} />
                </Box>
            </Section>

            <Section icon={<InsightsIcon fontSize="small" />} title="Tracking & pixels" subtitle="Analytics + ad pixels — GA4, Tag Manager, Meta, TikTok, Snap, Pinterest.">
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                    {analyticsFields.map(([k, label]) => (
                        <TextField key={k} size="small" label={label} value={a[k] || ""} sx={{ minWidth: 260 }} onChange={(e) => setA(k, e.target.value)} />
                    ))}
                </Box>
                <Button size="small" onClick={() => setShowGuide((v) => !v)} startIcon={<HelpOutlineIcon fontSize="small" />} sx={{ textTransform: "none", mt: 1.25 }}>
                    {showGuide ? "Hide" : "Where do I find these IDs?"}
                </Button>
                <Collapse in={showGuide} unmountOnExit>
                    <Box sx={{ mt: 1, p: 1.5, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 1.5, display: "grid", gap: 1.25, maxWidth: 640 }}>
                        <Typography fontSize="0.76rem" color="text.secondary">Paste only the ID — we add the tracking code for you. You'll need an ad/analytics account on each platform first (all free to create).</Typography>
                        {PIXEL_GUIDE.map((g) => (
                            <Box key={g.name} sx={{ display: "grid", gap: 0.25 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                    <Typography fontSize="0.82rem" fontWeight={700}>{g.name}</Typography>
                                    <Typography fontSize="0.7rem" color="text.disabled" sx={{ fontFamily: "monospace" }}>{g.id}</Typography>
                                    <Box component="a" href={g.url} target="_blank" rel="noopener noreferrer" sx={{ fontSize: "0.72rem", color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>Open ↗</Box>
                                </Box>
                                <Typography fontSize="0.76rem" color="text.secondary">{g.steps}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Collapse>
            </Section>

            <Section icon={<BusinessIcon fontSize="small" />} title="Business info" subtitle="Used for your contact details + search (Organization) schema.">
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, maxWidth: 720 }}>
                    <TextField size="small" label="Business name" value={b.legalName || ""} sx={{ minWidth: 260 }} onChange={(e) => setB("legalName", e.target.value)} />
                    <TextField size="small" label="Email" value={b.email || ""} sx={{ minWidth: 260 }} onChange={(e) => setB("email", e.target.value)} />
                    <TextField size="small" label="Phone" value={b.phone || ""} sx={{ minWidth: 260 }} onChange={(e) => setB("phone", e.target.value)} />
                </Box>
            </Section>

            <Section icon={<TravelExploreIcon fontSize="small" />} title="Indexable landing terms" subtitle="Turn search terms into Google-indexable /products/<term> pages.">
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
            </Section>

            <Section icon={<SwapHorizIcon fontSize="small" />} title="Migrate from an old site" subtitle="Map an old site's pages → 301 redirects here, keeping their Google ranking." defaultOpen={false}>
                <Typography fontSize="0.78rem" color="text.secondary" sx={{ mb: 1, maxWidth: 620 }}>
                    Paste the client's current site URL. AI finds its pages and maps them to your new structure, so old links 301-redirect here (keeping their Google ranking) and any old links pasted into this store get fixed.
                </Typography>
                <MigrateTool />
            </Section>
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
