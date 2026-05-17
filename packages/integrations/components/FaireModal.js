"use client";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack, Alert, CircularProgress, IconButton, Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import axios from "axios";

export function FaireModal({ open, setOpen, provider, apiConnections, setConnections }) {
    const [displayName, setDisplayName] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const reset = () => { setDisplayName(""); setApiKey(""); setError(""); };
    const handleClose = () => { reset(); setOpen(false); };

    const sub = async () => {
        if (!displayName || !apiKey) { setError("All fields are required"); return; }
        setSaving(true);
        setError("");
        try {
            const res = await axios.post("/api/admin/integrations", {
                type: "faire",
                displayName,
                apiKey,
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
                New Faire Connection
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
                    <Typography variant="body2" color="text.secondary">
                        Find your API key in Faire Seller Portal → Settings → API Access.
                    </Typography>
                    <TextField fullWidth size="small" label="Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                    <TextField
                        fullWidth size="small" label="API Key"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        helperText="Your Faire brand access token"
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained" onClick={sub}
                    disabled={saving || !displayName || !apiKey}
                    sx={{ bgcolor: "#10305A", "&:hover": { bgcolor: "#0b2240" } }}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );
}
