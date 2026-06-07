"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Box, Container, Typography, Stack, Button, Alert,
    FormControl, InputLabel, Select, MenuItem,
    Divider, Switch, FormControlLabel, Paper,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { PREMIER_DEFAULT_FIELDS, LABEL_TEMPLATE_DEFAULT } from "../../lib/labelConstants.js";

const LABEL_SIZES = [
    { label: '2×2" (Recommended)', width: 2, height: 2 },
    { label: '2×3"', width: 2, height: 3 },
    { label: '3×2"', width: 3, height: 2 },
    { label: '4×2"', width: 4, height: 2 },
    { label: '4×6"', width: 4, height: 6 },
];

const OPTIONAL_FIELDS = [
    { key: "itemNumber",     label: "Item Number",        hint: "#1, #2…" },
    { key: "styleCode",      label: "Style Code",         hint: "Blank style code" },
    { key: "shipByDate",     label: "Ship By Date",       hint: "" },
    { key: "inventoryLoc",   label: "Inventory Location", hint: "Aisle / Unit / Shelf / Bin" },
    { key: "color",          label: "Color",              hint: "" },
    { key: "size",           label: "Size",               hint: "" },
    { key: "shippingType",   label: "Shipping Type",      hint: "Standard / Expedited" },
    { key: "designSku",      label: "Design SKU",         hint: "" },
    { key: "orderCount",     label: "Order Count",        hint: "Total items in order" },
    { key: "designName",     label: "Design Name",        hint: "" },
    { key: "printType",      label: "Print Type",         hint: "DTF, Embroidery…" },
    { key: "printLocations", label: "Print Locations",    hint: "Front / Back" },
    { key: "blankCode",      label: "Blank Code",         hint: "" },
    { key: "orderDate",      label: "Order Date",         hint: "" },
];

function LabelPreview({ width, height, enabledFields }) {
    const previewW = 220;
    const previewH = Math.round((height / width) * previewW);
    const rows = OPTIONAL_FIELDS.filter(f => enabledFields.includes(f.key));

    return (
        <Paper variant="outlined" sx={{
            width: previewW, height: Math.max(previewH, 120),
            p: 1.5, boxSizing: "border-box", overflow: "hidden",
            display: "flex", flexDirection: "column", gap: 0.5,
        }}>
            {/* Fixed top */}
            <Box sx={{ pb: 0.5, borderBottom: "1px dashed", borderColor: "divider" }}>
                {["PO#", "Piece"].map(label => (
                    <Stack key={label} direction="row" alignItems="center" spacing={0.5}>
                        <LockIcon sx={{ fontSize: 9, color: "text.disabled" }} />
                        <Typography sx={{ fontSize: 8, fontFamily: "monospace", color: "text.secondary" }}>
                            {label} ———
                        </Typography>
                    </Stack>
                ))}
            </Box>

            {/* Barcode */}
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1px", py: 0.5 }}>
                <LockIcon sx={{ fontSize: 9, color: "text.disabled", mr: 0.5 }} />
                {Array.from({ length: 24 }).map((_, i) => (
                    <Box key={i} sx={{ width: i % 3 === 0 ? 2 : 1, height: 24, bgcolor: "text.primary", opacity: 0.65 }} />
                ))}
            </Box>

            {/* Optional fields */}
            {rows.length > 0 && (
                <Box sx={{ pt: 0.5, borderTop: "1px dashed", borderColor: "divider", flex: 1, overflow: "hidden" }}>
                    {rows.map(f => (
                        <Typography key={f.key} sx={{ fontSize: 7, fontFamily: "monospace", color: "text.secondary", lineHeight: 1.6 }}>
                            {f.label}: ———
                        </Typography>
                    ))}
                </Box>
            )}
        </Paper>
    );
}

export function LabelSettingsMain() {
    const { data: session } = useSession();
    const [template, setTemplate] = useState(LABEL_TEMPLATE_DEFAULT);
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [msg, setMsg]           = useState(null);

    useEffect(() => {
        fetch("/api/admin/settings/integrations")
            .then(r => r.json())
            .then(d => {
                if (d.creds?.labelTemplate) setTemplate({ ...LABEL_TEMPLATE_DEFAULT, ...d.creds.labelTemplate });
                setLoading(false);
            });
    }, []);

    function set(key, val) {
        setTemplate(t => ({ ...t, [key]: val }));
    }

    function toggleField(key) {
        setTemplate(t => {
            const fields = t.fields ?? [];
            return { ...t, fields: fields.includes(key) ? fields.filter(k => k !== key) : [...fields, key] };
        });
    }

    async function save() {
        setSaving(true);
        setMsg(null);
        const res = await fetch("/api/admin/settings/integrations", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ labelTemplate: template }),
        });
        const d = await res.json();
        setMsg(d.error ? { type: "error", text: d.error } : { type: "success", text: "Label settings saved" });
        setSaving(false);
    }

    const isAdmin = session?.user?.role === "admin" || session?.user?.role === "manager";
    if (loading) return null;

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }} flexWrap="wrap" gap={2}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Label Creator</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Configure the layout of production pick labels. PO number, piece ID, and barcode are always printed.
                        </Typography>
                    </Box>
                </Stack>

                {msg && <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

                <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignItems="flex-start">

                    {/* ── Controls ── */}
                    <Stack spacing={3} sx={{ flex: 1 }}>

                        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Label Settings</Typography>
                            <Stack spacing={2}>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Label Size</InputLabel>
                                    <Select
                                        label="Label Size"
                                        value={`${template.width}x${template.height}`}
                                        onChange={e => {
                                            const sz = LABEL_SIZES.find(s => `${s.width}x${s.height}` === e.target.value) ?? LABEL_SIZES[0];
                                            setTemplate(t => ({ ...t, width: sz.width, height: sz.height }));
                                        }}
                                    >
                                        {LABEL_SIZES.map(s => (
                                            <MenuItem key={`${s.width}x${s.height}`} value={`${s.width}x${s.height}`}>
                                                {s.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" fullWidth>
                                    <InputLabel>Output Format</InputLabel>
                                    <Select label="Output Format" value={template.format} onChange={e => set("format", e.target.value)}>
                                        <MenuItem value="ZPL">ZPL (Zebra direct)</MenuItem>
                                        <MenuItem value="PDF">PDF</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Fixed Fields</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                                These fields are always printed and cannot be removed.
                            </Typography>
                            <Stack spacing={0.75}>
                                {[
                                    { label: "PO Number",  hint: "always at top" },
                                    { label: "Piece ID",   hint: "always at top" },
                                    { label: "Barcode",    hint: "always in center" },
                                ].map(f => (
                                    <Stack key={f.label} direction="row" alignItems="center" spacing={1}>
                                        <LockIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                        <Typography variant="body2">{f.label}</Typography>
                                        <Typography variant="caption" color="text.disabled">({f.hint})</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Paper>

                        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Optional Fields</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                                Toggle the fields you want printed below the barcode.
                            </Typography>
                            <Stack spacing={0.25}>
                                {OPTIONAL_FIELDS.map(f => (
                                    <FormControlLabel
                                        key={f.key}
                                        control={
                                            <Switch
                                                size="small"
                                                checked={(template.fields ?? []).includes(f.key)}
                                                onChange={() => toggleField(f.key)}
                                            />
                                        }
                                        label={
                                            <Stack direction="row" spacing={0.75} alignItems="center">
                                                <Typography variant="body2">{f.label}</Typography>
                                                {f.hint && (
                                                    <Typography variant="caption" color="text.disabled">{f.hint}</Typography>
                                                )}
                                            </Stack>
                                        }
                                        sx={{ m: 0 }}
                                    />
                                ))}
                            </Stack>
                        </Paper>

                        {isAdmin && (
                            <Button variant="contained" size="large" disabled={saving} onClick={save} fullWidth>
                                {saving ? "Saving…" : "Save label settings"}
                            </Button>
                        )}
                    </Stack>

                    {/* ── Preview ── */}
                    <Box sx={{ flexShrink: 0, position: { md: "sticky" }, top: { md: 80 } }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Preview</Typography>
                        <LabelPreview
                            width={template.width}
                            height={template.height}
                            enabledFields={template.fields ?? PREMIER_DEFAULT_FIELDS}
                        />
                        <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 1 }}>
                            {template.width}×{template.height}&quot; · {template.format}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.25 }}>
                            Default label layout
                        </Typography>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
}
