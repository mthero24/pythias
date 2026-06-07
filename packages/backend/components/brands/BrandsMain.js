"use client";
import { useState, useEffect, useRef } from "react";
import {
    Box, Container, Typography, Stack, Button, Paper, Grid2,
    TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, Alert, Avatar, Tooltip, CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/Upload";
import ImageIcon from "@mui/icons-material/Image";
import axios from "axios";

const EMPTY_FORM = { name: "", description: "", logo: "" };

function LogoUploader({ value, onChange, uploadPath }) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    async function handleFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            form.append("folder", "brands");
            const { data } = await axios.post(uploadPath, form);
            if (!data.error) onChange(data.url);
        } catch (err) {
            console.error("Logo upload failed", err);
        } finally {
            setUploading(false);
        }
    }

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
                sx={{
                    width: 80, height: 80, borderRadius: 2,
                    border: "2px dashed", borderColor: "divider",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", bgcolor: "action.hover", flexShrink: 0,
                    cursor: "pointer",
                }}
                onClick={() => inputRef.current?.click()}
            >
                {uploading
                    ? <CircularProgress size={24} />
                    : value
                        ? <Box component="img" src={value} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        : <ImageIcon sx={{ color: "text.disabled" }} />
                }
            </Box>
            <Stack spacing={0.5}>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                >
                    {value ? "Replace logo" : "Upload logo"}
                </Button>
                {value && (
                    <Button size="small" color="error" variant="text" onClick={() => onChange("")}>
                        Remove
                    </Button>
                )}
                <Typography variant="caption" color="text.disabled">PNG, JPG, SVG — max 10 MB</Typography>
            </Stack>
            <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </Box>
    );
}

function BrandCard({ brand, onEdit, onDelete }) {
    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: "flex", alignItems: "center", gap: 2, "&:hover": { borderColor: "primary.main" } }}>
            <Avatar
                src={brand.logo || undefined}
                variant="rounded"
                sx={{ width: 56, height: 56, bgcolor: "action.hover", flexShrink: 0 }}
            >
                {!brand.logo && brand.name[0].toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={700} noWrap>{brand.name}</Typography>
                {brand.description && (
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {brand.description}
                    </Typography>
                )}
            </Box>
            <Stack direction="row" spacing={0.5} flexShrink={0}>
                <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit(brand)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => onDelete(brand)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Paper>
    );
}

export function BrandsMain({ uploadPath = "/api/admin/upload" }) {
    const [brands, setBrands]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg]         = useState(null);

    // Add / edit dialog
    const [dialog, setDialog]   = useState(null); // null | "add" | brand object
    const [form, setForm]       = useState(EMPTY_FORM);
    const [saving, setSaving]   = useState(false);

    // Delete confirm
    const [delTarget, setDelTarget] = useState(null);
    const [deleting, setDeleting]   = useState(false);

    useEffect(() => {
        axios.get("/api/admin/brands")
            .then(r => setBrands(r.data.brands ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    function openAdd() {
        setForm(EMPTY_FORM);
        setDialog("add");
    }

    function openEdit(brand) {
        setForm({ name: brand.name, description: brand.description ?? "", logo: brand.logo ?? "" });
        setDialog(brand);
    }

    function closeDialog() {
        setDialog(null);
        setForm(EMPTY_FORM);
    }

    async function save() {
        if (!form.name.trim()) return;
        setSaving(true);
        setMsg(null);
        try {
            const isEdit = dialog && dialog !== "add";
            const { data } = isEdit
                ? await axios.patch("/api/admin/brands", { id: dialog._id, ...form })
                : await axios.post("/api/admin/brands", form);
            if (data.error) { setMsg({ type: "error", text: data.msg }); return; }
            setBrands(data.brands);
            closeDialog();
        } catch {
            setMsg({ type: "error", text: "Save failed" });
        } finally {
            setSaving(false);
        }
    }

    async function deleteBrand() {
        if (!delTarget) return;
        setDeleting(true);
        try {
            const { data } = await axios.delete(`/api/admin/brands?id=${delTarget._id}`);
            if (!data.error) setBrands(data.brands);
        } catch { /* ignore */ }
        finally {
            setDeleting(false);
            setDelTarget(null);
        }
    }

    const isEditing = dialog && dialog !== "add";

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Brands</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage your brands and upload logos for use on labels and listings.
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
                        Add brand
                    </Button>
                </Stack>

                {msg && <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : brands.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 6, textAlign: "center", borderRadius: 2 }}>
                        <ImageIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                        <Typography color="text.secondary">No brands yet. Add your first brand above.</Typography>
                    </Paper>
                ) : (
                    <Grid2 container spacing={2}>
                        {brands.map(brand => (
                            <Grid2 key={brand._id} size={{ xs: 12, sm: 6 }}>
                                <BrandCard brand={brand} onEdit={openEdit} onDelete={setDelTarget} />
                            </Grid2>
                        ))}
                    </Grid2>
                )}
            </Container>

            {/* Add / Edit dialog */}
            <Dialog open={!!dialog} onClose={closeDialog} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>{isEditing ? `Edit — ${dialog.name}` : "Add brand"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 0.5 }}>
                        <LogoUploader
                            value={form.logo}
                            onChange={url => setForm(f => ({ ...f, logo: url }))}
                            uploadPath={uploadPath}
                        />
                        <TextField
                            label="Brand name"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            fullWidth size="small" required
                            autoFocus
                        />
                        <TextField
                            label="Description (optional)"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            fullWidth size="small" multiline rows={2}
                        />
                        {msg && <Alert severity={msg.type}>{msg.text}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={saving || !form.name.trim()}
                        onClick={save}
                    >
                        {saving ? "Saving…" : isEditing ? "Save changes" : "Add brand"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete confirm */}
            <Dialog open={!!delTarget} onClose={() => setDelTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Delete brand?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete <strong>{delTarget?.name}</strong>? This cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDelTarget(null)}>Cancel</Button>
                    <Button variant="contained" color="error" disabled={deleting} onClick={deleteBrand}>
                        {deleting ? "Deleting…" : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
