"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Box, Container, Typography, Card, CardContent, Stack, TextField, Button, Alert,
    Chip, MenuItem, Select, InputLabel, FormControl, IconButton,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const TIMEZONES = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Phoenix",
    "America/Los_Angeles",
    "America/Anchorage",
    "America/Adak",
    "Pacific/Honolulu",
    "America/Puerto_Rico",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Moscow",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Bangkok",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Pacific/Auckland",
];

export default function SettingsPage() {
    const { data: session } = useSession();
    const [org, setOrg]       = useState(null);
    const [tab, setTab]       = useState("org");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg]       = useState(null);

    const [skuParts, setSkuParts]         = useState(["blank.code", "color.sku", "size.sku", "design.sku"]);
    const [skuSeparator, setSkuSeparator] = useState("_");

    useEffect(() => {
        fetch("/api/settings").then(r => r.json()).then(d => { if (d.org) setOrg(d.org); });
        fetch("/api/admin/settings/sku").then(r => r.json()).then(d => {
            if (!d.error && d.format) {
                setSkuParts(d.format.parts ?? ["blank.code", "color.sku", "size.sku", "design.sku"]);
                setSkuSeparator(d.format.separator ?? "_");
            }
        });
    }, []);

    async function saveOrg(e) {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        const res = await fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orgName: org.name, timezone: org.settings?.timezone, bulkThreshold: org.settings?.bulkThreshold }),
        });
        const d = await res.json();
        setMsg(d.error ? { type: "error", text: d.error } : { type: "success", text: "Saved" });
        setSaving(false);
    }

    if (!org) return null;

    const isOwnerOrAdmin = session?.user?.role === "owner" || session?.user?.role === "admin";

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Settings</Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                    {["org", "production", "sku"].map(t => (
                        <Button key={t} variant={tab === t ? "contained" : "outlined"} size="small" onClick={() => setTab(t)}>
                            {t === "org" ? "Organization" : t === "production" ? "Production" : "SKU Format"}
                        </Button>
                    ))}
                    <Button variant="outlined" size="small" href="admin/settings/labels">
                        Label Creator
                    </Button>
                    <Button variant="outlined" size="small" href="settings/shipping">
                        Shipping &amp; Hardware
                    </Button>
                </Stack>

                {msg && <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

                {tab === "org" && (
                    <Card variant="outlined">
                        <CardContent>
                            <form onSubmit={saveOrg}>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Company name"
                                        value={org.name || ""}
                                        onChange={e => setOrg(o => ({ ...o, name: e.target.value }))}
                                        fullWidth size="small"
                                        disabled={!isOwnerOrAdmin}
                                    />
                                    <FormControl fullWidth size="small" disabled={!isOwnerOrAdmin}>
                                        <InputLabel>Timezone</InputLabel>
                                        <Select
                                            label="Timezone"
                                            value={org.settings?.timezone || "America/New_York"}
                                            onChange={e => setOrg(o => ({ ...o, settings: { ...o.settings, timezone: e.target.value } }))}
                                        >
                                            {TIMEZONES.map(tz => (
                                                <MenuItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    {isOwnerOrAdmin && (
                                        <Button type="submit" variant="contained" size="small" disabled={saving}>
                                            {saving ? "Saving..." : "Save changes"}
                                        </Button>
                                    )}
                                </Stack>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {tab === "production" && (
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Bulk order threshold</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Orders with this many items or more are automatically flagged as bulk orders and appear in the Bulk Orders production queue.
                            </Typography>
                            <form onSubmit={saveOrg}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <TextField
                                        label="Items per order"
                                        type="number"
                                        inputProps={{ min: 1, max: 999 }}
                                        value={org.settings?.bulkThreshold ?? 5}
                                        onChange={e => setOrg(o => ({ ...o, settings: { ...o.settings, bulkThreshold: Number(e.target.value) } }))}
                                        size="small"
                                        sx={{ width: 160 }}
                                        disabled={!isOwnerOrAdmin}
                                    />
                                    {isOwnerOrAdmin && (
                                        <Button type="submit" variant="contained" size="small" disabled={saving}>
                                            {saving ? "Saving..." : "Save"}
                                        </Button>
                                    )}
                                </Stack>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {tab === "sku" && (
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>SKU Format</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Set the order and separator used when generating product variant SKUs. Use the arrows to reorder parts.
                            </Typography>

                            <Stack spacing={1} sx={{ mb: 2 }}>
                                {skuParts.map((part, i) => {
                                    const labels = {
                                        "blank.code": "Blank Style Code",
                                        "color.sku":  "Color Code",
                                        "size.sku":   "Size Code",
                                        "design.sku": "Design SKU",
                                    };
                                    return (
                                        <Stack key={part} direction="row" alignItems="center" spacing={1}
                                            sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5, bgcolor: "background.paper" }}>
                                            <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                                                <Chip label={i + 1} size="small" sx={{ mr: 1, fontSize: "0.7rem" }} />
                                                {labels[part] ?? part}
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace" }}>{part}</Typography>
                                            <IconButton size="small" disabled={i === 0} onClick={() => {
                                                const p = [...skuParts];
                                                [p[i - 1], p[i]] = [p[i], p[i - 1]];
                                                setSkuParts(p);
                                            }}><ArrowUpwardIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" disabled={i === skuParts.length - 1} onClick={() => {
                                                const p = [...skuParts];
                                                [p[i + 1], p[i]] = [p[i], p[i + 1]];
                                                setSkuParts(p);
                                            }}><ArrowDownwardIcon fontSize="small" /></IconButton>
                                        </Stack>
                                    );
                                })}
                            </Stack>

                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                <TextField
                                    label="Separator"
                                    value={skuSeparator}
                                    onChange={e => setSkuSeparator(e.target.value)}
                                    size="small"
                                    sx={{ width: 100 }}
                                    inputProps={{ maxLength: 3 }}
                                />
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Preview:</Typography>
                                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600, mt: 0.25 }}>
                                        {skuParts.map(p => ({
                                            "blank.code": "PC54",
                                            "color.sku":  "blk",
                                            "size.sku":   "L",
                                            "design.sku": "ABCD1234",
                                        }[p] ?? p)).join(skuSeparator || "_")}
                                    </Typography>
                                </Box>
                            </Stack>

                            {isOwnerOrAdmin && (
                                <Button variant="contained" size="small" disabled={saving} onClick={async () => {
                                    setSaving(true); setMsg(null);
                                    const res = await fetch("/api/admin/settings/sku", {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ parts: skuParts, separator: skuSeparator }),
                                    });
                                    const d = await res.json();
                                    setMsg(d.error ? { type: "error", text: d.msg } : { type: "success", text: "SKU format saved" });
                                    setSaving(false);
                                }}>
                                    {saving ? "Saving..." : "Save SKU Format"}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}
            </Container>
        </Box>
    );
}
