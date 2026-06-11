"use client";
import { useState, useEffect, useRef } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Stack, Typography, TextField, Button, Alert, CircularProgress, Divider, Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";

export function SanmarModal({ open, setOpen, onConnected }) {
    const [customerNumber, setCustomerNumber] = useState("");
    const [userName,       setUserName]       = useState("");
    const [password,       setPassword]       = useState("");
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState("");
    const loaded = useRef(false);

    useEffect(() => {
        if (open && !loaded.current) {
            loaded.current = true;
            fetch("/api/admin/integrations/sanmar")
                .then(r => r.json())
                .then(d => {
                    if (d.customerNumber) setCustomerNumber(d.customerNumber);
                    if (d.userName)       setUserName(d.userName);
                });
        }
        if (!open) loaded.current = false;
    }, [open]);

    const save = async () => {
        if (!customerNumber || !userName || !password) {
            setError("All three fields are required.");
            return;
        }
        setSaving(true); setError("");
        try {
            const res  = await fetch("/api/admin/integrations/sanmar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customerNumber, userName, password }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                setError(data.error || "Connection failed — check your credentials.");
            } else {
                onConnected?.({ customerNumber, userName });
                setPassword("");
                setOpen(false);
            }
        } catch {
            setError("Connection failed.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <img src="/sanmar.svg" alt="SanMar" style={{ height: 28, objectFit: "contain", borderRadius: 4 }} />
                    <span>Connect SanMar</span>
                </Stack>
                <IconButton size="small" onClick={() => setOpen(false)} disabled={saving}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Enter your SanMar account credentials. Once connected, inventory orders containing
                    SanMar-linked blanks will be automatically submitted to SanMar as a single purchase order.
                </Typography>

                <Stack spacing={2}>
                    <TextField
                        label="Customer Number"
                        placeholder="Your SanMar account number"
                        fullWidth size="small"
                        value={customerNumber}
                        onChange={e => setCustomerNumber(e.target.value)}
                    />
                    <TextField
                        label="Username"
                        placeholder="Your SanMar.com web username"
                        fullWidth size="small"
                        value={userName}
                        onChange={e => setUserName(e.target.value)}
                    />
                    <TextField
                        label="Password"
                        placeholder="Your SanMar.com web password"
                        type="password"
                        fullWidth size="small"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && save()}
                    />
                </Stack>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ mt: 2.5, p: 1.5, bgcolor: "#f8fafc", borderRadius: 1.5, border: "1px solid #e5e7eb" }}>
                    <Typography variant="caption" color="text.secondary">
                        Need API access? Contact <strong>sanmarintegrations@sanmar.com</strong> or call{" "}
                        <strong>(800) 426-6399 ext 6458</strong>.
                    </Typography>
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={save}
                    disabled={saving || !customerNumber || !userName || !password}
                    startIcon={saving && <CircularProgress size={14} color="inherit" />}
                    sx={{ bgcolor: "#1a4c8b", "&:hover": { bgcolor: "#163d70" }, minWidth: 160 }}
                >
                    {saving ? "Testing connection…" : "Connect SanMar"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
