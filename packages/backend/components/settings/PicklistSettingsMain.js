"use client";
import {
    Box, Container, Typography, Stack, Paper, Button, Alert,
    Switch, Chip,
} from "@mui/material";
import LockIcon          from "@mui/icons-material/Lock";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useState, useEffect } from "react";

// ── Column definitions ────────────────────────────────────────────────────────
const FIXED_COLS = [
    { key: "barcode",  label: "Bulk ID (barcode)" },
    { key: "quantity", label: "Quantity"           },
    { key: "poNumber", label: "PO Number"          },
];

const OPTIONAL_COLS = [
    { key: "colorName",    label: "Color"              },
    { key: "sizeName",     label: "Size"               },
    { key: "styleCode",    label: "Style Code"         },
    { key: "designSku",    label: "Design SKU"         },
    { key: "shippingType", label: "Shipping Type"      },
    { key: "type",         label: "Print Type"         },
    { key: "inventoryLoc", label: "Inventory Location" },
];

const SAMPLE = {
    barcode:     "BLK-2024-A1B2C3",
    quantity:    "12",
    poNumber:    "PO-10042",
    colorName:   "Black",
    sizeName:    "L",
    styleCode:   "GI64000",
    designSku:   "SKU-ABC123",
    shippingType:"Standard",
    type:        "DTF",
    inventoryLoc:"R1 U2 S3 B4",
};

// ── Preview table ─────────────────────────────────────────────────────────────
function PicklistPreview({ cols }) {
    if (cols.length === 0) {
        return (
            <Box sx={{ py: 8, textAlign: "center" }}>
                <Typography variant="body2" color="text.disabled">Enable columns to see a preview</Typography>
            </Box>
        );
    }

    const colFr = cols.map(c => c.key === "barcode" ? "minmax(140px,2fr)" : "1fr").join(" ");

    return (
        <Box sx={{ overflow: "auto" }}>
            {/* Mock PDF header */}
            <Box sx={{ px: 3, py: 1.5, borderBottom: "1px solid #e2e8f0", textAlign: "center", bgcolor: "#fff" }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>Pick List — PO: PO-10042</Typography>
                <Typography variant="caption" color="text.secondary">
                    {new Date().toLocaleString("en-US")}
                </Typography>
            </Box>

            {/* Header row */}
            <Box sx={{ display: "grid", gridTemplateColumns: colFr, bgcolor: "#e2e8f0", px: 1.5 }}>
                {cols.map(col => (
                    <Typography key={col.key} variant="caption" fontWeight={700}
                        sx={{ py: 0.75, px: 0.75, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.4, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {col.label}
                    </Typography>
                ))}
            </Box>

            {/* Sample row */}
            {[SAMPLE, { ...SAMPLE, quantity: "8", colorName: "White", sizeName: "XL", inventoryLoc: "R2 U1 S1 B2" }].map((row, ri) => (
                <Box key={ri} sx={{
                    display: "grid", gridTemplateColumns: colFr,
                    bgcolor: ri % 2 === 0 ? "#fff" : "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    px: 1.5, alignItems: "center",
                }}>
                    {cols.map(col => (
                        <Box key={col.key} sx={{ py: 1.25, px: 0.75 }}>
                            {col.key === "barcode" ? (
                                <Box>
                                    <Typography sx={{ fontFamily: "monospace", fontSize: "0.58rem", color: "#6b7280", letterSpacing: 0, lineHeight: 1 }}>
                                        ▐█▌▐▌▐█▌▐▌▐▌▐█▌▐▌▐█▌▐▌
                                    </Typography>
                                    <Typography sx={{ fontFamily: "monospace", fontSize: "0.62rem", color: "#374151" }}>
                                        {row.barcode}
                                    </Typography>
                                </Box>
                            ) : (
                                <Typography sx={{ fontSize: "0.75rem", color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {row[col.key] ?? "—"}
                                </Typography>
                            )}
                        </Box>
                    ))}
                </Box>
            ))}
        </Box>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export function PicklistSettingsMain() {
    const [fields, setFields]     = useState([]);
    const [dragOver, setDragOver] = useState(null);
    const [saving, setSaving]     = useState(false);
    const [msg, setMsg]           = useState(null);

    useEffect(() => {
        fetch("/api/admin/settings/integrations")
            .then(r => r.json())
            .then(d => {
                const saved = d.creds?.picklistTemplate ?? {};
                setFields(saved.fields ?? []);
            })
            .catch(() => {});
    }, []);

    const toggle = (key) => {
        setFields(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleDragStart = (e, key) => {
        e.dataTransfer.setData("text/plain", key);
    };

    const handleDrop = (e, targetKey) => {
        e.preventDefault();
        const dragged = e.dataTransfer.getData("text/plain");
        if (dragged === targetKey) return;
        setFields(prev => {
            const arr = [...prev];
            const from = arr.indexOf(dragged);
            const to   = arr.indexOf(targetKey);
            if (from < 0 || to < 0) return prev;
            arr.splice(from, 1);
            arr.splice(to, 0, dragged);
            return arr;
        });
        setDragOver(null);
    };

    const save = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch("/api/admin/settings/integrations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ picklistTemplate: { fields } }),
            });
            if (!res.ok) throw new Error();
            setMsg({ type: "success", text: "Picklist template saved." });
        } catch {
            setMsg({ type: "error", text: "Failed to save. Please try again." });
        }
        setSaving(false);
    };

    const enabledCols  = fields.map(k => OPTIONAL_COLS.find(f => f.key === k)).filter(Boolean);
    const disabledCols = OPTIONAL_COLS.filter(f => !fields.includes(f.key));
    const allCols      = [...FIXED_COLS, ...enabledCols];


    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Stack spacing={0.5} sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={700}>Picklist Creator</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Choose which columns appear on the PDF pick list. Drag enabled columns to reorder them.
                    </Typography>
                </Stack>

                {msg && (
                    <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2.5, borderRadius: 2 }}>
                        {msg.text}
                    </Alert>
                )}

                <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">

                    {/* ── Left panel: column controls ─────────────────── */}
                    <Stack spacing={2} sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0 }}>

                        {/* Fixed columns */}
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                <LockIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                <Typography variant="subtitle2" fontWeight={700}>Fixed Columns</Typography>
                                <Typography variant="caption" color="text.secondary">always included</Typography>
                            </Stack>
                            <Stack spacing={0.5}>
                                {FIXED_COLS.map(f => (
                                    <Stack key={f.key} direction="row" alignItems="center" spacing={1.25}
                                        sx={{ p: 1, borderRadius: 1.5, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                                        <DragIndicatorIcon sx={{ fontSize: 16, color: "transparent" }} />
                                        <Typography variant="body2" sx={{ flex: 1 }}>{f.label}</Typography>
                                        <Chip label="locked" size="small"
                                            sx={{ fontSize: "0.6rem", height: 18, color: "text.disabled", bgcolor: "#f1f5f9" }} />
                                    </Stack>
                                ))}
                            </Stack>
                        </Paper>

                        {/* Optional columns */}
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Optional Columns</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                                Toggle to add · Drag enabled columns to reorder
                            </Typography>

                            <Stack spacing={0.5}>
                                {/* Enabled — draggable */}
                                {enabledCols.map(f => (
                                    <Stack
                                        key={f.key}
                                        direction="row"
                                        alignItems="center"
                                        spacing={1}
                                        draggable
                                        onDragStart={e => handleDragStart(e, f.key)}
                                        onDragOver={e => { e.preventDefault(); setDragOver(f.key); }}
                                        onDrop={e => handleDrop(e, f.key)}
                                        onDragLeave={() => setDragOver(null)}
                                        sx={{
                                            p: 0.75, borderRadius: 1.5, cursor: "grab",
                                            bgcolor: dragOver === f.key ? "#ede9fe" : "#f0fdf4",
                                            border: "1px solid",
                                            borderColor: dragOver === f.key ? "#7c3aed" : "#bbf7d0",
                                            transition: "background 120ms, border-color 120ms",
                                        }}
                                    >
                                        <DragIndicatorIcon sx={{ fontSize: 16, color: "#9ca3af", flexShrink: 0 }} />
                                        <Typography variant="body2" sx={{ flex: 1 }}>{f.label}</Typography>
                                        <Switch size="small" checked onChange={() => toggle(f.key)}
                                            onClick={e => e.stopPropagation()} />
                                    </Stack>
                                ))}

                                {/* Disabled — not draggable */}
                                {disabledCols.map(f => (
                                    <Stack key={f.key} direction="row" alignItems="center" spacing={1}
                                        sx={{ p: 0.75, borderRadius: 1.5, bgcolor: "#f9fafb", border: "1px solid #f1f5f9" }}>
                                        <DragIndicatorIcon sx={{ fontSize: 16, color: "transparent" }} />
                                        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{f.label}</Typography>
                                        <Switch size="small" checked={false} onChange={() => toggle(f.key)} />
                                    </Stack>
                                ))}
                            </Stack>
                        </Paper>

                        <Button variant="contained" size="large" fullWidth disabled={saving} onClick={save}>
                            {saving ? "Saving…" : "Save"}
                        </Button>
                    </Stack>

                    {/* ── Right panel: live preview ─────────────────────── */}
                    <Paper variant="outlined" sx={{ flex: 1, borderRadius: 2, overflow: "hidden" }}>
                        <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider", bgcolor: "#f8fafc" }}>
                            <Typography variant="subtitle2" fontWeight={700}>Preview</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Sample rows — actual output is a Letter-size PDF
                            </Typography>
                        </Box>
                        <PicklistPreview cols={allCols} />
                    </Paper>

                </Stack>
            </Container>
        </Box>
    );
}
