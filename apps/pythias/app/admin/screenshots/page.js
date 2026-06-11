"use client";
import { useState, useEffect, useRef } from "react";
import {
    Box, Typography, Button, CircularProgress, Alert,
    Chip, Divider, Tooltip, IconButton,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const SECTIONS = [
    {
        label: "Fulfillment Cloud",
        color: "#D3A73D",
        page: "/fulfillment-cloud",
        slots: [
            { slot: "fc-production-queue", title: "Production Queue",   desc: "The main order queue sorted by deadline and print type." },
            { slot: "fc-order-detail",     title: "Order Detail View",  desc: "Single job view with design file, blank spec, and size." },
            { slot: "fc-analytics",        title: "Analytics Dashboard", desc: "Daily output, revenue by channel, inventory levels." },
        ],
    },
    {
        label: "Commerce Cloud",
        color: "#6366f1",
        page: "/commerce-cloud",
        slots: [
            { slot: "cc-order-routing",  title: "Order Routing Dashboard", desc: "Live view of orders being routed to fulfillment partners." },
            { slot: "cc-product-studio", title: "Product Studio",           desc: "Design upload, product creation, and listing sync." },
            { slot: "cc-analytics",      title: "Channel Analytics",        desc: "Revenue, margin, and fulfillment rate by channel." },
        ],
    },
];

function ScreenshotSlot({ slot, title, desc, objects, onUploaded, onDeleted }) {
    const inputRef = useRef(null);
    const [loading, setLoading]   = useState(false);
    const [feedback, setFeedback] = useState(null);

    const existing = objects.find(o => o.slot === slot);

    async function handleFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        setFeedback(null);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("slot", slot);
            const res  = await fetch("/api/admin/screenshots", { method: "POST", body: fd });
            const data = await res.json();
            if (data.ok) {
                setFeedback({ type: "success", msg: "Uploaded to S3" });
                onUploaded({ key: data.key, url: data.url, slot: data.slot });
            } else {
                setFeedback({ type: "error", msg: data.error || "Upload failed" });
            }
        } catch {
            setFeedback({ type: "error", msg: "Upload failed" });
        } finally {
            setLoading(false);
            e.target.value = "";
        }
    }

    async function handleDelete() {
        if (!existing || !confirm(`Delete screenshot for "${title}"?`)) return;
        setLoading(true);
        try {
            const res  = await fetch("/api/admin/screenshots", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: existing.key }),
            });
            const data = await res.json();
            if (data.ok) {
                setFeedback({ type: "success", msg: "Deleted from S3" });
                onDeleted(existing.key);
            } else {
                setFeedback({ type: "error", msg: data.error || "Delete failed" });
            }
        } catch {
            setFeedback({ type: "error", msg: "Delete failed" });
        } finally {
            setLoading(false);
        }
    }

    const previewUrl = existing?.url ? `${existing.url}?t=${Date.now()}` : null;

    return (
        <Box sx={{
            border: "1.5px solid", borderColor: existing ? "#e5e7eb" : "#f0f0f0",
            borderRadius: 2.5, overflow: "hidden", bgcolor: "#fff",
            transition: "box-shadow 0.2s",
            "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.07)" },
        }}>
            {/* Preview */}
            <Box sx={{
                width: "100%", aspectRatio: "16/10", bgcolor: "#f8fafc",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden",
                borderBottom: "1px solid #f0f0f0",
            }}>
                {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                    <Box sx={{ textAlign: "center", color: "#9ca3af" }}>
                        <UploadIcon sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                        <Typography sx={{ fontSize: 12 }}>No screenshot yet</Typography>
                    </Box>
                )}
                {existing && (
                    <Box sx={{ position: "absolute", top: 8, right: 8 }}>
                        <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />}
                            label="Live on S3"
                            size="small"
                            sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.65rem", "& .MuiChip-icon": { color: "#065f46" } }}
                        />
                    </Box>
                )}
            </Box>

            {/* Info + actions */}
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{title}</Typography>
                    <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                        {existing && (
                            <Tooltip title="Open in new tab">
                                <IconButton size="small" href={existing.url} target="_blank">
                                    <OpenInNewIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        {existing && (
                            <Tooltip title="Delete from S3">
                                <IconButton size="small" color="error" onClick={handleDelete} disabled={loading}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                <Typography sx={{ fontSize: 12, color: "#6b7280", mb: 1.5, lineHeight: 1.5 }}>{desc}</Typography>

                {existing && (
                    <Typography sx={{ fontFamily: "monospace", fontSize: 10.5, color: "#9ca3af", bgcolor: "#f9fafb", px: 1, py: 0.5, borderRadius: 1, border: "1px solid #e5e7eb", mb: 1.5, wordBreak: "break-all", display: "block" }}>
                        {existing.key}
                    </Typography>
                )}

                {feedback && (
                    <Alert severity={feedback.type} sx={{ mb: 1.5, py: 0.25, fontSize: 12 }} onClose={() => setFeedback(null)}>
                        {feedback.msg}
                    </Alert>
                )}

                <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={handleFile} />
                <Button
                    variant="outlined" size="small" fullWidth
                    startIcon={loading ? <CircularProgress size={14} /> : <UploadIcon />}
                    onClick={() => inputRef.current?.click()}
                    disabled={loading}
                    sx={{ fontWeight: 600, fontSize: 13, borderRadius: 1.5, textTransform: "none" }}
                >
                    {existing ? "Replace Screenshot" : "Upload Screenshot"}
                </Button>
            </Box>
        </Box>
    );
}

export default function AdminScreenshotsPage() {
    const [objects, setObjects] = useState([]);
    const [loading, setLoading] = useState(true);

    async function loadObjects() {
        try {
            const res  = await fetch("/api/admin/screenshots");
            const data = await res.json();
            setObjects(data.objects || []);
        } catch {
            setObjects([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadObjects(); }, []);

    function handleUploaded(obj) {
        setObjects(prev => {
            const filtered = prev.filter(o => o.slot !== obj.slot);
            return [...filtered, obj];
        });
    }

    function handleDeleted(key) {
        setObjects(prev => prev.filter(o => o.key !== key));
    }

    const uploaded = objects.length;
    const total    = SECTIONS.reduce((sum, s) => sum + s.slots.length, 0);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100 }}>
            <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 2, mb: 4 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>Screenshots</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {uploaded}/{total} slots filled · Saved to Wasabi S3 · PNG, JPG, or WebP · 16:10 ratio recommended
                    </Typography>
                </Box>
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                SECTIONS.map((section, si) => (
                    <Box key={section.label} sx={{ mb: si < SECTIONS.length - 1 ? 6 : 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                            <Box sx={{ width: 4, height: 28, bgcolor: section.color, borderRadius: 1 }} />
                            <Box>
                                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                                    {section.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                                    Shown on{" "}
                                    <a href={section.page} target="_blank" rel="noreferrer" style={{ color: section.color, fontWeight: 600 }}>
                                        {section.page}
                                    </a>
                                </Typography>
                            </Box>
                            <Box sx={{ ml: "auto" }}>
                                <Button
                                    size="small" variant="text" endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                                    href={section.page} target="_blank"
                                    sx={{ fontSize: 12, textTransform: "none", color: section.color }}
                                >
                                    Preview page
                                </Button>
                            </Box>
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2.5 }}>
                            {section.slots.map(slot => (
                                <ScreenshotSlot
                                    key={slot.slot}
                                    {...slot}
                                    objects={objects}
                                    onUploaded={handleUploaded}
                                    onDeleted={handleDeleted}
                                />
                            ))}
                        </Box>

                        {si < SECTIONS.length - 1 && <Divider sx={{ mt: 6 }} />}
                    </Box>
                ))
            )}
        </Box>
    );
}
