"use client";
import { useState, useEffect, useRef } from "react";
import {
    Box, Typography, Button, TextField, Paper, Table, TableBody, TableCell,
    TableHead, TableRow, IconButton, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, LinearProgress, Tooltip, Select, MenuItem, FormControl,
    InputLabel, Switch, FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import ImageIcon from "@mui/icons-material/Image";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";

const SUGGESTED_CATEGORIES = [
    "Getting Started", "Production", "Shipping", "Inventory",
    "Marketplace", "Design", "Analytics", "Settings",
];

const emptyForm = { title: "", description: "", category: "", order: 0 };

export default function AdminTutorialsPage() {
    const [tutorials, setTutorials]   = useState([]);
    const [open, setOpen]             = useState(false);
    const [editing, setEditing]       = useState(null);
    const [form, setForm]             = useState(emptyForm);
    const [videoFile, setVideoFile]   = useState(null);
    const [thumbFile, setThumbFile]   = useState(null);
    const [uploading, setUploading]   = useState(false);
    const [progress, setProgress]     = useState("");
    const [previewUrl, setPreviewUrl] = useState(null);
    const videoRef = useRef();
    const thumbRef = useRef();

    async function load() {
        const res = await fetch("/api/admin/tutorials");
        const data = await res.json();
        setTutorials(data.tutorials || []);
    }

    useEffect(() => { load(); }, []);

    function openNew() {
        setEditing(null);
        setForm(emptyForm);
        setVideoFile(null);
        setThumbFile(null);
        setPreviewUrl(null);
        setOpen(true);
    }

    function openEdit(t) {
        setEditing(t);
        setForm({ title: t.title, description: t.description, category: t.category, order: t.order ?? 0 });
        setVideoFile(null);
        setThumbFile(null);
        setPreviewUrl(t.videoUrl || null);
        setOpen(true);
    }

    async function save() {
        if (!form.title || !form.category) return;
        setUploading(true);
        try {
            let videoUrl     = editing?.videoUrl     || "";
            let thumbnailUrl = editing?.thumbnailUrl || "";

            if (videoFile || thumbFile) {
                setProgress("Uploading files…");
                const fd = new FormData();
                if (videoFile) fd.append("video",     videoFile);
                if (thumbFile) fd.append("thumbnail", thumbFile);
                const up = await fetch("/api/admin/tutorials/upload", { method: "POST", body: fd });
                const urls = await up.json();
                if (urls.videoUrl)     videoUrl     = urls.videoUrl;
                if (urls.thumbnailUrl) thumbnailUrl = urls.thumbnailUrl;
            }

            if (!videoUrl) { setProgress("A video file is required."); setUploading(false); return; }

            setProgress("Saving…");
            const payload = { ...form, videoUrl, thumbnailUrl };
            if (editing) {
                await fetch("/api/admin/tutorials", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing._id, ...payload }) });
            } else {
                await fetch("/api/admin/tutorials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            }
            setOpen(false);
            load();
        } finally {
            setUploading(false);
            setProgress("");
        }
    }

    async function togglePublished(t) {
        await fetch("/api/admin/tutorials", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t._id, published: !t.published }) });
        load();
    }

    async function remove(id) {
        if (!confirm("Delete this tutorial?")) return;
        await fetch(`/api/admin/tutorials?id=${id}`, { method: "DELETE" });
        load();
    }

    const categories = [...new Set(tutorials.map(t => t.category))].sort();

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200 }}>
            <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 2, mb: 4 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>Tutorials</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {tutorials.length} total · {categories.length} categories
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}
                    sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}>
                    Add Tutorial
                </Button>
            </Box>

            <Paper variant="outlined" sx={{ borderRadius: 2, overflowX: "auto" }}>
                <Table sx={{ minWidth: 700 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f8faff" }}>
                            <TableCell sx={{ fontWeight: 700 }}>Thumbnail</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Published</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tutorials.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 4 }}>
                                    No tutorials yet. Add one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                        {tutorials.map((t) => (
                            <TableRow key={t._id} hover sx={{ opacity: t.published ? 1 : 0.55 }}>
                                <TableCell>
                                    {t.thumbnailUrl ? (
                                        <Box component="img" src={t.thumbnailUrl} alt={t.title}
                                            sx={{ width: 80, height: 50, objectFit: "cover", borderRadius: 1 }} />
                                    ) : (
                                        <Box sx={{ width: 80, height: 50, bgcolor: "#f1f5f9", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <PlayCircleIcon sx={{ color: "#94a3b8" }} />
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, maxWidth: 280 }}>
                                    <Typography noWrap sx={{ fontSize: 14 }}>{t.title}</Typography>
                                    {t.description && (
                                        <Typography noWrap sx={{ fontSize: 12, color: "text.secondary" }}>{t.description}</Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip label={t.category} size="small" />
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, color: "text.secondary" }}>{t.order}</TableCell>
                                <TableCell>
                                    <Switch size="small" checked={!!t.published} onChange={() => togglePublished(t)} />
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Edit">
                                        <IconButton size="small" onClick={() => openEdit(t)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton size="small" color="error" onClick={() => remove(t._id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* Add / Edit Dialog */}
            <Dialog open={open} onClose={() => !uploading && setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>{editing ? "Edit Tutorial" : "Add Tutorial"}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                        <TextField label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} fullWidth required />
                        <TextField label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline rows={2} />

                        <FormControl fullWidth required>
                            <InputLabel>Category</InputLabel>
                            <Select value={form.category} label="Category" onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                {SUGGESTED_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                {form.category && !SUGGESTED_CATEGORIES.includes(form.category) && (
                                    <MenuItem value={form.category}>{form.category}</MenuItem>
                                )}
                            </Select>
                        </FormControl>

                        <TextField label="Custom category (override)" placeholder="e.g. Advanced Shipping"
                            value={SUGGESTED_CATEGORIES.includes(form.category) ? "" : form.category}
                            onChange={e => e.target.value && setForm(f => ({ ...f, category: e.target.value }))}
                            size="small" helperText="Leave blank to use the dropdown selection above" />

                        <TextField label="Display order" type="number" value={form.order}
                            onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                            size="small" sx={{ width: 140 }} />

                        {/* Video upload */}
                        <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                Video file {editing ? "(leave blank to keep existing)" : "*"}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Button variant="outlined" size="small" startIcon={<VideoFileIcon />}
                                    onClick={() => videoRef.current.click()}>
                                    {videoFile ? videoFile.name : "Choose video"}
                                </Button>
                                {editing?.videoUrl && !videoFile && (
                                    <Typography variant="caption" color="success.main">✓ Video uploaded</Typography>
                                )}
                            </Box>
                            <input ref={videoRef} type="file" accept="video/*" hidden
                                onChange={e => { setVideoFile(e.target.files[0] || null); setPreviewUrl(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null); }} />
                        </Box>

                        {/* Thumbnail upload */}
                        <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                Thumbnail image {editing ? "(optional, replaces existing)" : "(optional)"}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Button variant="outlined" size="small" startIcon={<ImageIcon />}
                                    onClick={() => thumbRef.current.click()}>
                                    {thumbFile ? thumbFile.name : "Choose thumbnail"}
                                </Button>
                                {editing?.thumbnailUrl && !thumbFile && (
                                    <Typography variant="caption" color="success.main">✓ Thumbnail uploaded</Typography>
                                )}
                            </Box>
                            <input ref={thumbRef} type="file" accept="image/*" hidden
                                onChange={e => setThumbFile(e.target.files[0] || null)} />
                        </Box>

                        {/* Preview */}
                        {previewUrl && (
                            <Box component="video" src={previewUrl} controls
                                sx={{ width: "100%", borderRadius: 1, maxHeight: 200 }} />
                        )}

                        {uploading && (
                            <Box>
                                <Typography variant="caption" color="text.secondary">{progress}</Typography>
                                <LinearProgress sx={{ mt: 0.5 }} />
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpen(false)} disabled={uploading}>Cancel</Button>
                    <Button variant="contained" onClick={save} disabled={uploading || !form.title || !form.category}
                        sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}>
                        {uploading ? "Saving…" : editing ? "Save Changes" : "Upload & Save"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
