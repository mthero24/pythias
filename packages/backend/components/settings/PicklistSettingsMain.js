"use client";
import {
    Box, Container, Typography, Stack, Paper, Button, Alert,
    Switch, FormControlLabel, Chip,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { useState, useEffect } from "react";

const OPTIONAL_FIELDS = [
    { key: "colorName",    label: "Color"            },
    { key: "sizeName",     label: "Size"             },
    { key: "styleCode",    label: "Style Code"       },
    { key: "designSku",    label: "Design SKU"       },
    { key: "shippingType", label: "Shipping Type"    },
    { key: "type",         label: "Print Type"       },
    { key: "inventoryLoc", label: "Inventory Location" },
];

const FIXED_FIELDS = [
    { key: "barcode",  label: "Bulk ID (barcode)" },
    { key: "quantity", label: "Quantity"           },
    { key: "poNumber", label: "PO Number"          },
];

export function PicklistSettingsMain() {
    const [fields, setFields]   = useState([]);
    const [saving, setSaving]   = useState(false);
    const [msg, setMsg]         = useState(null);
    const [loaded, setLoaded]   = useState(false);

    useEffect(() => {
        fetch("/api/admin/settings/integrations")
            .then(r => r.json())
            .then(d => {
                const saved = d.creds?.picklistTemplate ?? {};
                setFields(saved.fields ?? []);
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, []);

    const toggle = (key) => {
        setFields(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
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
            if (!res.ok) throw new Error("Save failed");
            setMsg({ type: "success", text: "Picklist template saved." });
        } catch {
            setMsg({ type: "error", text: "Failed to save. Please try again." });
        }
        setSaving(false);
    };

    if (!loaded) return null;

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Stack spacing={1} sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={700}>Picklist Settings</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Configure which columns appear on the PDF pick list printed with bulk orders.
                        The pick list is always a PDF sent to your designated picklist printer.
                    </Typography>
                </Stack>

                {msg && (
                    <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 2.5 }}>
                        {msg.text}
                    </Alert>
                )}

                {/* Fixed fields */}
                <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <LockIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                        <Typography variant="subtitle2" fontWeight={700}>Fixed Fields</Typography>
                        <Typography variant="caption" color="text.secondary">always included</Typography>
                    </Stack>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                        {FIXED_FIELDS.map(f => (
                            <Chip
                                key={f.key}
                                label={f.label}
                                size="small"
                                sx={{ bgcolor: "#f1f5f9", color: "text.secondary", fontWeight: 600 }}
                            />
                        ))}
                    </Stack>
                </Paper>

                {/* Optional fields */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Optional Fields</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                        Toggle the columns you want to appear on the picklist. Order matches the toggle order.
                    </Typography>
                    <Stack spacing={0.25}>
                        {OPTIONAL_FIELDS.map(f => (
                            <FormControlLabel
                                key={f.key}
                                control={
                                    <Switch
                                        size="small"
                                        checked={fields.includes(f.key)}
                                        onChange={() => toggle(f.key)}
                                    />
                                }
                                label={<Typography variant="body2">{f.label}</Typography>}
                                sx={{ m: 0 }}
                            />
                        ))}
                    </Stack>
                </Paper>

                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={saving}
                    onClick={save}
                    sx={{ mt: 3 }}
                >
                    {saving ? "Saving…" : "Save Picklist Template"}
                </Button>
            </Container>
        </Box>
    );
}
