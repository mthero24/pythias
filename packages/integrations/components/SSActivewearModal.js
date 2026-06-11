"use client";
import { useState, useEffect, useRef } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Stack, Typography, TextField, Button, Alert, CircularProgress, Divider, Box,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export function SSActivewearModal({ open, setOpen, onConnected }) {
    const [accountNumber, setAccountNumber] = useState("");
    const [apiKey,        setApiKey]        = useState("");
    const [saving,  setSaving]  = useState(false);
    const [error,   setError]   = useState("");
    const loaded = useRef(false);

    useEffect(() => {
        if (open && !loaded.current) {
            loaded.current = true;
            fetch("/api/admin/integrations/ssactivewear")
                .then(r => r.json())
                .then(d => { if (d.accountNumber) setAccountNumber(d.accountNumber); });
        }
        if (!open) loaded.current = false;
    }, [open]);

    const save = async () => {
        if (!accountNumber || !apiKey) { setError("Both fields are required."); return; }
        setSaving(true); setError("");
        try {
            const res  = await fetch("/api/admin/integrations/ssactivewear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountNumber, apiKey }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                setError(data.error || "Connection failed — check your credentials.");
            } else {
                onConnected?.({ accountNumber });
                setApiKey("");
                setOpen(false);
            }
        } catch {
            setError("Connection failed.");
        } finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <img src="/ssactivewear.svg" alt="S&S Activewear" style={{ height: 28, objectFit: "contain", borderRadius: 4 }} />
                    <span>Connect S&S Activewear</span>
                </Stack>
                <IconButton size="small" onClick={() => setOpen(false)} disabled={saving}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Enter your S&S Activewear account credentials. Once connected, inventory orders
                    containing S&S-linked blanks will be automatically submitted to S&S as a purchase order.
                </Typography>

                <Stack spacing={2}>
                    <TextField
                        label="Account Number"
                        placeholder="Found in My Account on ssactivewear.com"
                        fullWidth size="small"
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value)}
                    />
                    <TextField
                        label="API Key"
                        placeholder="Found in My Account → API Key"
                        type="password"
                        fullWidth size="small"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && save()}
                    />
                </Stack>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>{error}</Alert>
                )}

                <Box sx={{ mt: 2.5, p: 1.5, bgcolor: "#f8fafc", borderRadius: 1.5, border: "1px solid #e5e7eb" }}>
                    <Typography variant="caption" color="text.secondary">
                        Need an API key? Log in to <strong>ssactivewear.com</strong>, go to My Account,
                        and your API key is shown next to "API Key". If it isn&apos;t visible, email{" "}
                        <strong>support@ssactivewear.com</strong> to request access.
                    </Typography>
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={save}
                    disabled={saving || !accountNumber || !apiKey}
                    startIcon={saving && <CircularProgress size={14} color="inherit" />}
                    sx={{ bgcolor: "#d32f2f", "&:hover": { bgcolor: "#b71c1c" }, minWidth: 180 }}
                >
                    {saving ? "Testing connection…" : "Connect S&S Activewear"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
