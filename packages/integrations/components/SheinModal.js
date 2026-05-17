"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Alert, CircularProgress, IconButton, Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import axios from "axios";

export function SheinModal({ open, setOpen, provider, apiConnections, setConnections }) {
    const [displayName, setDisplayName] = useState("");
    const [openKeyId, setOpenKeyId] = useState("");
    const [secretKey, setSecretKey] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const reset = () => { setDisplayName(""); setOpenKeyId(""); setSecretKey(""); setCategoryId(""); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !openKeyId || !secretKey) { setError("Display Name, Open Key ID, and Secret Key are required"); return; }
        setSaving(true);
        setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "shein",
                displayName,
                apiKey: openKeyId,
                apiSecret: secretKey,
                organization: categoryId,
                provider,
            });
            if (res?.data?.error) {
                setError(res.data.msg ?? "Save failed");
            } else {
                setConnections(res.data.integrations);
                handleClose();
            }
        } catch (e) {
            setError(e.response?.data?.error ?? "Save failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                New SHEIN Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
                    <Typography variant="body2" color="text.secondary">
                        Find your credentials in the SHEIN Open Platform portal under API Management.
                    </Typography>
                    <TextField fullWidth size="small" label="Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    <TextField
                        fullWidth size="small" label="Open Key ID"
                        value={openKeyId}
                        onChange={e => setOpenKeyId(e.target.value)}
                        helperText="Your SHEIN openKeyId"
                    />
                    <TextField
                        fullWidth size="small" label="Secret Key"
                        type="password"
                        value={secretKey}
                        onChange={e => setSecretKey(e.target.value)}
                        helperText="Your SHEIN secretKey"
                    />
                    <TextField
                        fullWidth size="small" label="Default Category ID (optional)"
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value)}
                        helperText="SHEIN category ID for product listing"
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={sub}
                    disabled={saving || !displayName || !openKeyId || !secretKey}
                    sx={{ bgcolor: "#000", "&:hover": { bgcolor: "#222" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}
