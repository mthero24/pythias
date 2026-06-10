"use client";
import { useState, useEffect, useRef } from "react";
import {
    Box, Typography, Button, TextField, Paper, Table, TableBody, TableCell,
    TableHead, TableRow, IconButton, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, LinearProgress, Tooltip, Select, MenuItem, FormControl,
    InputLabel, Switch, Tabs, Tab, Rating,
} from "@mui/material";
import AddIcon       from "@mui/icons-material/Add";
import DeleteIcon    from "@mui/icons-material/Delete";
import EditIcon      from "@mui/icons-material/Edit";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import ImageIcon     from "@mui/icons-material/Image";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";

// ── Config ────────────────────────────────────────────────────────────────
const TUTORIAL_CATEGORIES = [
    "Getting Started", "Production", "Shipping", "Inventory",
    "Marketplace", "Design", "Analytics", "Settings",
];
const DEMO_TYPES = ["Product Overview", "Feature Walkthrough", "Onboarding", "Integration Setup"];
const PAGE_OPTIONS = [
    { label: "Homepage",          value: "/" },
    { label: "Fulfillment Cloud", value: "/fulfillment-cloud" },
    { label: "Commerce Cloud",    value: "/commerce-cloud" },
    { label: "Pricing",           value: "/pricing" },
    { label: "How It Works",      value: "/how-it-works" },
    { label: "Integrations",      value: "/integrations" },
    { label: "Features",          value: "/features" },
    { label: "FAQ",               value: "/faq" },
    { label: "About",             value: "/about" },
    { label: "Compare — vs ShipStation", value: "/compare/pythias-vs-shipstation" },
    { label: "Compare — vs Shopify",     value: "/compare/pythias-vs-shopify" },
    { label: "Compare — vs Printify",    value: "/compare/pythias-vs-printify" },
];
const PLACEMENTS  = ["Hero", "Section", "Sidebar", "Modal"];
const PRODUCTS    = [
    { label: "Fulfillment Cloud", value: "fulfillment-cloud" },
    { label: "Commerce Cloud",    value: "commerce-cloud" },
    { label: "Both",              value: "both" },
];

const TABS = [
    { label: "Tutorials",    type: "tutorial" },
    { label: "Testimonials", type: "testimonial" },
    { label: "Demo Videos",  type: "demo" },
    { label: "Page Videos",  type: "page-video" },
];

const CHIP_COLORS = { tutorial: "primary", testimonial: "success", demo: "warning", "page-video": "secondary" };

// ── Empty forms per type ──────────────────────────────────────────────────
const emptyForms = {
    tutorial:    { title: "", description: "", category: "", product: "fulfillment-cloud", order: 0 },
    testimonial: { customerName: "", company: "", role: "", rating: 5 },
    demo:        { title: "", description: "", demoType: "", order: 0 },
    "page-video":{ title: "", description: "", targetPage: "/", placement: "Section" },
};

// ── Thumbnail cell ────────────────────────────────────────────────────────
function ThumbCell({ url, label }) {
    return url ? (
        <Box component="img" src={url} alt={label} sx={{ width: 80, height: 50, objectFit: "cover", borderRadius: 1 }} />
    ) : (
        <Box sx={{ width: 80, height: 50, bgcolor: "#f1f5f9", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PlayCircleIcon sx={{ color: "#94a3b8" }} />
        </Box>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function AdminTutorialsPage() {
    const [tab, setTab]               = useState(0);
    const [items, setItems]           = useState([]);
    const [open, setOpen]             = useState(false);
    const [editing, setEditing]       = useState(null);
    const [form, setForm]             = useState(emptyForms.tutorial);
    const [videoFile, setVideoFile]   = useState(null);
    const [thumbFile, setThumbFile]   = useState(null);
    const [uploading, setUploading]   = useState(false);
    const [progress, setProgress]     = useState("");
    const [saveError, setSaveError]   = useState("");
    const [previewUrl, setPreviewUrl] = useState(null);
    const videoRef = useRef();
    const thumbRef = useRef();

    const currentType = TABS[tab].type;

    async function load(type) {
        const res  = await fetch(`/api/admin/tutorials?type=${type}`);
        const data = await res.json();
        setItems(data.tutorials || []);
    }

    useEffect(() => { load(currentType); }, [currentType]);

    function set(k) { return (e) => setForm((f) => ({ ...f, [k]: e.target.value })); }

    function openNew() {
        setEditing(null);
        setForm(emptyForms[currentType]);
        setVideoFile(null); setThumbFile(null); setPreviewUrl(null); setSaveError("");
        setOpen(true);
    }

    function openEdit(item) {
        setEditing(item);
        const base = emptyForms[currentType];
        const filled = {};
        for (const k of Object.keys(base)) filled[k] = item[k] ?? base[k];
        setForm(filled);
        setVideoFile(null); setThumbFile(null); setSaveError("");
        setPreviewUrl(item.videoUrl || null);
        setOpen(true);
    }

    async function uploadRaw(file, folder) {
        const params = new URLSearchParams({
            folder,
            filename:    file.name,
            contentType: file.type,
        });
        const res  = await fetch(`/api/admin/tutorials/upload?${params}`, {
            method:  "POST",
            headers: { "Content-Type": file.type },
            body:    file,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        return data.url;
    }

    async function save() {
        setUploading(true);
        setSaveError("");
        let saved = false;
        try {
            let videoUrl     = editing?.videoUrl     || "";
            let thumbnailUrl = editing?.thumbnailUrl || "";

            const folderMap   = { tutorial: "videos", testimonial: "testimonial-videos", demo: "demo-videos", "page-video": "page-videos" };
            const videoFolder = folderMap[currentType] || "videos";

            if (videoFile) {
                setProgress("Uploading video…");
                videoUrl = await uploadRaw(videoFile, videoFolder);
            }
            if (thumbFile) {
                setProgress("Uploading thumbnail…");
                thumbnailUrl = await uploadRaw(thumbFile, "thumbnails");
            }

            if (!videoUrl) { setSaveError("A video file is required."); return; }

            setProgress("Saving record…");
            const payload  = { ...form, videoUrl, thumbnailUrl, videoType: currentType };
            const method   = editing ? "PATCH" : "POST";
            const body     = editing ? { id: editing._id, ...payload } : payload;
            const saveRes  = await fetch("/api/admin/tutorials", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const saveData = await saveRes.json();

            if (!saveRes.ok) {
                setSaveError(saveData.error || `Save failed (${saveRes.status})`);
                return;
            }

            saved = true;
            setOpen(false);
        } catch (err) {
            setSaveError(err.message || "Something went wrong.");
        } finally {
            setUploading(false);
            setProgress("");
            load(currentType); // always refresh the list, even on error (video may have uploaded)
        }
    }

    async function togglePublished(item) {
        await fetch("/api/admin/tutorials", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item._id, published: !item.published }) });
        load(currentType);
    }

    async function remove(id) {
        if (!confirm("Delete this item?")) return;
        await fetch(`/api/admin/tutorials?id=${id}`, { method: "DELETE" });
        load(currentType);
    }

    // ── Column defs per type ────────────────────────────────────────────
    function renderTableHead() {
        if (currentType === "tutorial")    return <><TableCell sx={{ fontWeight: 700 }}>Category</TableCell><TableCell sx={{ fontWeight: 700 }}>Product</TableCell><TableCell sx={{ fontWeight: 700 }}>Order</TableCell></>;
        if (currentType === "testimonial") return <><TableCell sx={{ fontWeight: 700 }}>Customer</TableCell><TableCell sx={{ fontWeight: 700 }}>Company</TableCell><TableCell sx={{ fontWeight: 700 }}>Rating</TableCell></>;
        if (currentType === "demo")        return <><TableCell sx={{ fontWeight: 700 }}>Type</TableCell><TableCell sx={{ fontWeight: 700 }}>Order</TableCell></>;
        if (currentType === "page-video")  return <><TableCell sx={{ fontWeight: 700 }}>Page</TableCell><TableCell sx={{ fontWeight: 700 }}>Placement</TableCell></>;
    }

    function renderTableCells(item) {
        if (currentType === "tutorial")    return <><TableCell><Chip label={item.category} size="small" /></TableCell><TableCell><Chip label={item.product || "FC"} size="small" variant="outlined" /></TableCell><TableCell sx={{ fontSize: 13, color: "text.secondary" }}>{item.order}</TableCell></>;
        if (currentType === "testimonial") return <><TableCell sx={{ fontWeight: 600 }}>{item.customerName}<Typography sx={{ fontSize: 12, color: "text.secondary" }}>{item.role}</Typography></TableCell><TableCell>{item.company}</TableCell><TableCell><Rating value={item.rating || 5} readOnly size="small" /></TableCell></>;
        if (currentType === "demo")        return <><TableCell><Chip label={item.demoType || "—"} size="small" /></TableCell><TableCell sx={{ fontSize: 13, color: "text.secondary" }}>{item.order}</TableCell></>;
        if (currentType === "page-video")  return <><TableCell sx={{ fontSize: 13 }}>{item.targetPage}</TableCell><TableCell><Chip label={item.placement || "—"} size="small" /></TableCell></>;
    }

    // ── Title label shown in table ──────────────────────────────────────
    function itemLabel(item) {
        if (currentType === "testimonial") return item.customerName || "—";
        return item.title || "—";
    }

    // ── Save button validation ──────────────────────────────────────────
    function canSave() {
        if (!editing?.videoUrl && !videoFile) return false;
        if (currentType === "tutorial")    return !!form.title && !!form.category;
        if (currentType === "testimonial") return !!form.customerName;
        if (currentType === "demo")        return !!form.title;
        if (currentType === "page-video")  return !!form.title && !!form.targetPage;
        return false;
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200 }}>
            <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 2, mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>Video Library</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {items.length} {TABS[tab].label.toLowerCase()}
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}
                    sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}>
                    Add {TABS[tab].label.replace(/s$/, "")}
                </Button>
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: "1px solid #e5e7eb" }}>
                {TABS.map((t) => <Tab key={t.type} label={t.label} />)}
            </Tabs>

            <Paper variant="outlined" sx={{ borderRadius: 2, overflowX: "auto" }}>
                <Table sx={{ minWidth: 700 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8faff" }}>
                            <TableCell sx={{ fontWeight: 700 }}>Thumbnail</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Title / Name</TableCell>
                            {renderTableHead()}
                            <TableCell sx={{ fontWeight: 700 }}>Published</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ color: "text.secondary", py: 4 }}>
                                    No {TABS[tab].label.toLowerCase()} yet.
                                </TableCell>
                            </TableRow>
                        )}
                        {items.map((item) => (
                            <TableRow key={item._id} hover sx={{ opacity: item.published ? 1 : 0.55 }}>
                                <TableCell><ThumbCell url={item.thumbnailUrl} label={itemLabel(item)} /></TableCell>
                                <TableCell sx={{ fontWeight: 600, maxWidth: 240 }}>
                                    <Typography noWrap sx={{ fontSize: 14 }}>{itemLabel(item)}</Typography>
                                    {item.description && <Typography noWrap sx={{ fontSize: 12, color: "text.secondary" }}>{item.description}</Typography>}
                                </TableCell>
                                {renderTableCells(item)}
                                <TableCell>
                                    <Switch size="small" checked={!!item.published} onChange={() => togglePublished(item)} />
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => remove(item._id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* Dialog */}
            <Dialog open={open} onClose={() => !uploading && setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>
                    {editing ? "Edit" : "Add"} {TABS[tab].label.replace(/s$/, "")}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>

                        {/* ── Tutorial fields ── */}
                        {currentType === "tutorial" && <>
                            <TextField label="Title" value={form.title} onChange={set("title")} fullWidth required />
                            <TextField label="Description" value={form.description} onChange={set("description")} fullWidth multiline rows={2} />
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Category</InputLabel>
                                    <Select value={form.category} label="Category" onChange={set("category")}>
                                        {TUTORIAL_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth required>
                                    <InputLabel>Product</InputLabel>
                                    <Select value={form.product} label="Product" onChange={set("product")}>
                                        {PRODUCTS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Box>
                            <TextField label="Display order" type="number" value={form.order} onChange={set("order")} size="small" sx={{ width: 140 }} />
                        </>}

                        {/* ── Testimonial fields ── */}
                        {currentType === "testimonial" && <>
                            <TextField label="Customer name" value={form.customerName} onChange={set("customerName")} fullWidth required />
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <TextField label="Company" value={form.company} onChange={set("company")} fullWidth />
                                <TextField label="Role / Title" value={form.role} onChange={set("role")} fullWidth />
                            </Box>
                            <Box>
                                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Rating</Typography>
                                <Rating value={Number(form.rating)} onChange={(_, v) => setForm(f => ({ ...f, rating: v || 5 }))} />
                            </Box>
                        </>}

                        {/* ── Demo video fields ── */}
                        {currentType === "demo" && <>
                            <TextField label="Title" value={form.title} onChange={set("title")} fullWidth required />
                            <TextField label="Description" value={form.description} onChange={set("description")} fullWidth multiline rows={2} />
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Demo type</InputLabel>
                                    <Select value={form.demoType} label="Demo type" onChange={set("demoType")}>
                                        {DEMO_TYPES.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <TextField label="Order" type="number" value={form.order} onChange={set("order")} size="small" sx={{ width: 120 }} />
                            </Box>
                        </>}

                        {/* ── Page video fields ── */}
                        {currentType === "page-video" && <>
                            <TextField label="Title" value={form.title} onChange={set("title")} fullWidth required />
                            <TextField label="Description" value={form.description} onChange={set("description")} fullWidth multiline rows={2} />
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Target page</InputLabel>
                                    <Select value={form.targetPage} label="Target page" onChange={set("targetPage")}>
                                        {PAGE_OPTIONS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>Placement</InputLabel>
                                    <Select value={form.placement} label="Placement" onChange={set("placement")}>
                                        {PLACEMENTS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Box>
                        </>}

                        {/* ── Video upload (shared) ── */}
                        <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                Video file {editing ? "(leave blank to keep existing)" : "*"}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Button variant="outlined" size="small" startIcon={<VideoFileIcon />} onClick={() => videoRef.current.click()}>
                                    {videoFile ? videoFile.name : "Choose video"}
                                </Button>
                                {editing?.videoUrl && !videoFile && <Typography variant="caption" color="success.main">✓ Video uploaded</Typography>}
                            </Box>
                            <input ref={videoRef} type="file" accept="video/*" hidden
                                onChange={e => { setVideoFile(e.target.files[0] || null); setPreviewUrl(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null); }} />
                        </Box>

                        {/* ── Thumbnail upload (shared) ── */}
                        <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                Thumbnail image (optional{editing ? ", replaces existing" : ""})
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Button variant="outlined" size="small" startIcon={<ImageIcon />} onClick={() => thumbRef.current.click()}>
                                    {thumbFile ? thumbFile.name : "Choose thumbnail"}
                                </Button>
                                {editing?.thumbnailUrl && !thumbFile && <Typography variant="caption" color="success.main">✓ Thumbnail uploaded</Typography>}
                            </Box>
                            <input ref={thumbRef} type="file" accept="image/*" hidden onChange={e => setThumbFile(e.target.files[0] || null)} />
                        </Box>

                        {previewUrl && <Box component="video" src={previewUrl} controls sx={{ width: "100%", borderRadius: 1, maxHeight: 200 }} />}
                        {uploading && <Box><Typography variant="caption" color="text.secondary">{progress}</Typography><LinearProgress sx={{ mt: 0.5 }} /></Box>}
                        {saveError && <Typography variant="body2" sx={{ color: "error.main", fontWeight: 600, mt: 1 }}>{saveError}</Typography>}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpen(false)} disabled={uploading}>Cancel</Button>
                    <Button variant="contained" onClick={save} disabled={uploading || !canSave()}
                        sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}>
                        {uploading ? "Saving…" : editing ? "Save Changes" : "Upload & Save"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
