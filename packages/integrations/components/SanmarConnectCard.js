"use client";
import { useState, useEffect } from "react";
import {
    Box, Card, Typography, TextField, Button, Chip, Stack,
    CircularProgress, Alert, Divider, Collapse, IconButton, Tooltip,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import axios from "axios";

export function SanmarConnectCard({ apiBase = "/api/admin/integrations/sanmar" }) {
    const [status, setStatus]     = useState(null);   // { connected, customerNumber, userName, hasPassword }
    const [expanded, setExpanded] = useState(false);
    const [form, setForm]         = useState({ customerNumber: "", userName: "", password: "" });
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState("");
    const [success, setSuccess]   = useState("");

    useEffect(() => {
        axios.get(apiBase).then(r => {
            setStatus(r.data);
            if (r.data.customerNumber) setForm(f => ({ ...f, customerNumber: r.data.customerNumber, userName: r.data.userName }));
            if (!r.data.connected) setExpanded(true);
        }).catch(() => setStatus({ connected: false }));
    }, [apiBase]);

    const save = async () => {
        setError(""); setSuccess("");
        if (!form.customerNumber || !form.userName || !form.password) {
            setError("All three fields are required.");
            return;
        }
        setSaving(true);
        try {
            await axios.post(apiBase, form);
            setStatus({ connected: true, customerNumber: form.customerNumber, userName: form.userName, hasPassword: true });
            setForm(f => ({ ...f, password: "" }));
            setSuccess("Connected successfully.");
            setExpanded(false);
        } catch (e) {
            setError(e.response?.data?.error || "Connection failed — check your credentials.");
        } finally { setSaving(false); }
    };

    const disconnect = async () => {
        if (!confirm("Disconnect SanMar? Blanks will keep their style codes but ordering will stop.")) return;
        setSaving(true);
        try {
            await axios.delete(apiBase);
            setStatus({ connected: false });
            setExpanded(true);
            setSuccess("");
        } catch (e) {
            setError(e.response?.data?.error || "Disconnect failed.");
        } finally { setSaving(false); }
    };

    if (!status) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    return (
        <Card variant="outlined" sx={{
            borderRadius: 2,
            border: status.connected ? "1px solid #6ee7b7" : "1px solid #e5e7eb",
            bgcolor: status.connected ? "#f0fdf4" : "#fff",
            overflow: "hidden",
        }}>
            {/* Header row */}
            <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 2 }}>
                {/* Logo placeholder */}
                <Box sx={{
                    width: 48, height: 48, borderRadius: 1.5, flexShrink: 0,
                    bgcolor: "#1a4c8b", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "0.75rem", letterSpacing: 0.5 }}>
                        SM
                    </Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                        <Typography variant="subtitle1" fontWeight={700}>SanMar</Typography>
                        <Chip label="Supplier" size="small" variant="outlined"
                            sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#6b7280", borderColor: "#e5e7eb" }} />
                        {status.connected && (
                            <Chip
                                label="Connected"
                                size="small"
                                icon={<CheckCircleOutlineIcon sx={{ fontSize: "14px !important" }} />}
                                sx={{ bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.7rem", "& .MuiChip-icon": { color: "#065f46" } }}
                            />
                        )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem", mt: 0.25 }}>
                        {status.connected
                            ? `Account: ${status.customerNumber} · ${status.userName}`
                            : "Enter your SanMar credentials to enable direct ordering from inventory."}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                    {status.connected && (
                        <Tooltip title="Disconnect SanMar">
                            <IconButton size="small" color="error" onClick={disconnect} disabled={saving}>
                                <LinkOffIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <IconButton size="small" onClick={() => setExpanded(v => !v)}>
                        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                </Stack>
            </Box>

            {/* Expandable credentials form */}
            <Collapse in={expanded}>
                <Divider />
                <Box sx={{ px: 2.5, py: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                        Your SanMar credentials are stored securely and used only for catalog lookup and purchase order submission.
                        Contact <strong>sanmarintegrations@sanmar.com</strong> or call (800) 426-6399 ext 6458 if you need API access.
                    </Typography>
                    <Stack spacing={1.5}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                            <TextField
                                size="small" fullWidth
                                label="Customer Number"
                                placeholder="e.g. 123456"
                                value={form.customerNumber}
                                onChange={e => setForm(f => ({ ...f, customerNumber: e.target.value }))}
                            />
                            <TextField
                                size="small" fullWidth
                                label="Username"
                                placeholder="Your SanMar.com web username"
                                value={form.userName}
                                onChange={e => setForm(f => ({ ...f, userName: e.target.value }))}
                            />
                            <TextField
                                size="small" fullWidth
                                label="Password"
                                type="password"
                                placeholder={status.hasPassword ? "Leave blank to keep existing" : "Your SanMar.com web password"}
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            />
                        </Stack>

                        {error   && <Alert severity="error"   onClose={() => setError("")}   sx={{ py: 0.5 }}>{error}</Alert>}
                        {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ py: 0.5 }}>{success}</Alert>}

                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button
                                variant="contained" size="small"
                                onClick={save}
                                disabled={saving || !form.customerNumber || !form.userName || (!form.password && !status.hasPassword)}
                                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                                sx={{ bgcolor: "#1a4c8b", "&:hover": { bgcolor: "#163d70" }, minWidth: 140 }}
                            >
                                {saving ? "Testing connection…" : status.connected ? "Update Credentials" : "Connect SanMar"}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Collapse>
        </Card>
    );
}
